import { query, one, transaction } from '../db.js';
import { checkCharacter, checkId, characterKind, characterPrimaryId } from '../lib/validate.js';
import { notFound, forbidden, badRequest } from '../lib/errors.js';
import { accessLevel, gmVisibleCharacterIds, interestedUserIds, hierarchyIds } from '../lib/permissions.js';
import { hub } from '../lib/hub.js';

function rowToEntry(row) {
  return {
    id: row.id,
    ownerId: row.owner_id,
    ownerName: row.owner_name,
    version: row.version,
    updatedAt: row.updated_at,
    data: typeof row.data === 'string' ? JSON.parse(row.data) : row.data,
  };
}

const SELECT = `SELECT c.id, c.owner_id, u.display_name AS owner_name, c.version, c.updated_at, c.data
                  FROM characters c JOIN users u ON u.id = c.owner_id`;

async function upsertCharacter(tx, userId, data, { allowCreate }) {
  checkCharacter(data);
  const existing = await tx.one('SELECT id, owner_id, version FROM characters WHERE id = ? FOR UPDATE', [data.id]);
  const kind = characterKind(data);
  const primaryId = characterPrimaryId(data);
  if (existing) {
    const level = existing.owner_id === userId ? 'owner' : await accessLevel(userId, data.id);
    if (!level) throw forbidden('You cannot edit this character');
    await tx.query(
      `UPDATE characters SET name = ?, kind = ?, primary_character_id = ?, data = ?, version = version + 1, updated_by = ? WHERE id = ?`,
      [data.name.slice(0, 200), kind, primaryId, JSON.stringify(data), userId, data.id],
    );
    return { id: data.id, ownerId: existing.owner_id, version: existing.version + 1, created: false };
  }
  if (!allowCreate) throw notFound('Character not found');
  // New character: the creator owns it, unless it is a form/companion of a
  // character the creator may edit as GM, in which case the player owns it.
  let ownerId = userId;
  if (primaryId) {
    const parent = await tx.one('SELECT owner_id FROM characters WHERE id = ?', [primaryId]);
    if (parent && parent.owner_id !== userId) {
      const level = await accessLevel(userId, primaryId);
      if (!level) throw forbidden('You cannot add to this character');
      ownerId = parent.owner_id;
    }
  }
  await tx.query(
    `INSERT INTO characters (id, owner_id, name, kind, primary_character_id, data, version, updated_by) VALUES (?, ?, ?, ?, ?, ?, 1, ?)`,
    [data.id, ownerId, data.name.slice(0, 200), kind, primaryId, JSON.stringify(data), userId],
  );
  return { id: data.id, ownerId, version: 1, created: true };
}

async function broadcastChange(type, id, extra, exceptClientId) {
  const users = await interestedUserIds(id);
  if (!users.length) return;
  hub.sendToUsers(users, { type, id, ...extra }, { exceptClientId });
}

export default async function characterRoutes(app) {
  const auth = { preHandler: app.requireAuth };

  /** All characters the user can see: own + (as GM) assigned hierarchies. */
  app.get('/characters', auth, async (request) => {
    const own = await query(`${SELECT} WHERE c.owner_id = ? ORDER BY c.created_at`, [request.user.id]);
    const gmIds = await gmVisibleCharacterIds(request.user.id);
    const foreign = gmIds.length
      ? await query(`${SELECT} WHERE c.id IN (?) AND c.owner_id <> ? ORDER BY c.created_at`, [gmIds, request.user.id])
      : [];
    return {
      characters: own.map((r) => ({ ...rowToEntry(r), access: 'owner' })),
      gmCharacters: foreign.map((r) => ({ ...rowToEntry(r), access: 'gm' })),
    };
  });

  app.get('/characters/:id', auth, async (request) => {
    const id = checkId(request.params.id);
    const level = await accessLevel(request.user.id, id);
    if (!level) throw notFound('Character not found');
    const row = await one(`${SELECT} WHERE c.id = ?`, [id]);
    return { character: { ...rowToEntry(row), access: level } };
  });

  /** Create or replace one character (idempotent on id). */
  app.put('/characters/:id', auth, async (request, reply) => {
    const id = checkId(request.params.id);
    const data = request.body?.character ?? request.body;
    if (!data || data.id !== id) throw badRequest('Body id must match URL id', 'ID_MISMATCH');
    const clientId = request.headers['x-client-id'] || null;
    const result = await transaction((tx) => upsertCharacter(tx, request.user.id, data, { allowCreate: true }));
    const row = await one(`${SELECT} WHERE c.id = ?`, [id]);
    const entry = rowToEntry(row);
    await broadcastChange(result.created ? 'character.created' : 'character.updated', id, { character: entry, by: request.user.id }, clientId);
    reply.code(result.created ? 201 : 200);
    return { character: entry };
  });

  /** Batch upsert (hierarchy syncs, imports). All-or-nothing. */
  app.post('/characters/batch', auth, async (request) => {
    const list = request.body?.characters;
    if (!Array.isArray(list) || !list.length) throw badRequest('characters[] required');
    if (list.length > 200) throw badRequest('Too many characters in one batch');
    const clientId = request.headers['x-client-id'] || null;
    const results = await transaction(async (tx) => {
      const out = [];
      for (const data of list) out.push(await upsertCharacter(tx, request.user.id, data, { allowCreate: true }));
      return out;
    });
    const rows = await query(`${SELECT} WHERE c.id IN (?)`, [results.map((r) => r.id)]);
    const entries = rows.map(rowToEntry);
    const byId = new Map(entries.map((e) => [e.id, e]));
    for (const r of results) {
      await broadcastChange(r.created ? 'character.created' : 'character.updated', r.id, { character: byId.get(r.id), by: request.user.id }, clientId);
    }
    return { characters: entries };
  });

  /** Delete a character. Owner only; cascades to forms/companions. */
  app.delete('/characters/:id', auth, async (request) => {
    const id = checkId(request.params.id);
    const level = await accessLevel(request.user.id, id);
    if (!level) throw notFound('Character not found');
    if (level !== 'owner') throw forbidden('Only the owner can delete a character');
    const ids = await hierarchyIds([id]);
    const users = await interestedUserIds(id);
    const clientId = request.headers['x-client-id'] || null;
    await query('DELETE FROM characters WHERE id IN (?)', [ids]);
    hub.sendToUsers(users, { type: 'character.deleted', ids, by: request.user.id }, { exceptClientId: clientId });
    return { deleted: ids };
  });
}
