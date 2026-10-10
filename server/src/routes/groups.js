import { query, one, transaction } from '../db.js';
import { uuid, shortCode } from '../lib/crypto.js';
import { checkId } from '../lib/validate.js';
import { badRequest, notFound, forbidden } from '../lib/errors.js';
import { hub } from '../lib/hub.js';
import { hierarchyIds } from '../lib/permissions.js';

async function loadGroup(groupId) {
  const g = await one(
    `SELECT g.id, g.name, g.gm_id, g.invite_code, g.created_at, u.display_name AS gm_name
       FROM \`groups\` g JOIN users u ON u.id = g.gm_id WHERE g.id = ?`,
    [groupId],
  );
  if (!g) return null;
  const members = await query(
    `SELECT u.id, u.display_name, gm.joined_at FROM group_members gm JOIN users u ON u.id = gm.user_id
      WHERE gm.group_id = ? ORDER BY gm.joined_at`,
    [groupId],
  );
  const characters = await query(
    `SELECT c.id, c.name, c.owner_id, u.display_name AS owner_name, c.kind
       FROM group_characters gc JOIN characters c ON c.id = gc.character_id JOIN users u ON u.id = c.owner_id
      WHERE gc.group_id = ? ORDER BY gc.added_at`,
    [groupId],
  );
  return {
    id: g.id,
    name: g.name,
    gmId: g.gm_id,
    gmName: g.gm_name,
    inviteCode: g.invite_code,
    createdAt: g.created_at,
    members: members.map((m) => ({ id: m.id, displayName: m.display_name, joinedAt: m.joined_at })),
    characters: characters.map((c) => ({ id: c.id, name: c.name, ownerId: c.owner_id, ownerName: c.owner_name, kind: c.kind })),
  };
}

async function membership(groupId, userId) {
  const g = await one('SELECT gm_id FROM `groups` WHERE id = ?', [groupId]);
  if (!g) return null;
  if (g.gm_id === userId) return 'gm';
  const m = await one('SELECT 1 FROM group_members WHERE group_id = ? AND user_id = ?', [groupId, userId]);
  return m ? 'member' : null;
}

/** Strip the invite code for non-GMs. */
function viewFor(group, role) {
  if (role === 'gm') return { ...group, role };
  const rest = { ...group };
  delete rest.inviteCode;
  return { ...rest, role };
}

async function notifyGroup(groupId, message, exceptClientId) {
  const g = await one('SELECT gm_id FROM `groups` WHERE id = ?', [groupId]);
  if (!g) return;
  const members = await query('SELECT user_id FROM group_members WHERE group_id = ?', [groupId]);
  hub.sendToUsers([g.gm_id, ...members.map((m) => m.user_id)], message, { exceptClientId });
}

export default async function groupRoutes(app) {
  const auth = { preHandler: app.requireAuth };

  app.get('/groups', auth, async (request) => {
    const rows = await query(
      `SELECT g.id FROM \`groups\` g
        WHERE g.gm_id = ? OR EXISTS (SELECT 1 FROM group_members gm WHERE gm.group_id = g.id AND gm.user_id = ?)
        ORDER BY g.created_at`,
      [request.user.id, request.user.id],
    );
    const groups = [];
    for (const r of rows) {
      const g = await loadGroup(r.id);
      groups.push(viewFor(g, g.gmId === request.user.id ? 'gm' : 'member'));
    }
    return { groups };
  });

  app.post('/groups', auth, async (request) => {
    const name = String(request.body?.name || '').trim();
    if (name.length < 2 || name.length > 100) throw badRequest('Group name must be 2-100 characters');
    const id = uuid();
    let code;
    for (let i = 0; i < 5; i++) {
      code = shortCode(8);
      if (!(await one('SELECT 1 FROM `groups` WHERE invite_code = ?', [code]))) break;
    }
    await query('INSERT INTO `groups` (id, name, gm_id, invite_code) VALUES (?, ?, ?, ?)', [id, name, request.user.id, code]);
    return { group: viewFor(await loadGroup(id), 'gm') };
  });

  app.get('/groups/:id', auth, async (request) => {
    const id = checkId(request.params.id);
    const role = await membership(id, request.user.id);
    if (!role) throw notFound('Group not found');
    return { group: viewFor(await loadGroup(id), role) };
  });

  app.patch('/groups/:id', auth, async (request) => {
    const id = checkId(request.params.id);
    if ((await membership(id, request.user.id)) !== 'gm') throw forbidden('Only the GM can edit the group');
    const name = String(request.body?.name || '').trim();
    if (name.length < 2 || name.length > 100) throw badRequest('Group name must be 2-100 characters');
    await query('UPDATE `groups` SET name = ? WHERE id = ?', [name, id]);
    const group = await loadGroup(id);
    await notifyGroup(id, { type: 'group.updated', groupId: id });
    return { group: viewFor(group, 'gm') };
  });

  app.post('/groups/:id/regenerate-code', auth, async (request) => {
    const id = checkId(request.params.id);
    if ((await membership(id, request.user.id)) !== 'gm') throw forbidden('Only the GM can do this');
    const code = shortCode(8);
    await query('UPDATE `groups` SET invite_code = ? WHERE id = ?', [code, id]);
    return { inviteCode: code };
  });

  app.delete('/groups/:id', auth, async (request) => {
    const id = checkId(request.params.id);
    if ((await membership(id, request.user.id)) !== 'gm') throw forbidden('Only the GM can delete the group');
    await notifyGroup(id, { type: 'group.deleted', groupId: id });
    await query('DELETE FROM `groups` WHERE id = ?', [id]);
    return { ok: true };
  });

  /** Join a group with its invite code. */
  app.post('/groups/join', { ...auth, config: { rateLimit: { max: 20, timeWindow: '15 minutes' } } }, async (request) => {
    const code = String(request.body?.inviteCode || '').trim().toUpperCase();
    if (!code) throw badRequest('Invite code required');
    const g = await one('SELECT id, gm_id FROM `groups` WHERE invite_code = ?', [code]);
    if (!g) throw notFound('No group with this invite code', 'GROUP_CODE_INVALID');
    if (g.gm_id === request.user.id) throw badRequest('You are the GM of this group', 'ALREADY_GM');
    await query('INSERT IGNORE INTO group_members (group_id, user_id) VALUES (?, ?)', [g.id, request.user.id]);
    await notifyGroup(g.id, { type: 'group.updated', groupId: g.id });
    return { group: viewFor(await loadGroup(g.id), 'member') };
  });

  /** Leave a group (member) or remove a member (GM). */
  app.delete('/groups/:id/members/:userId', auth, async (request) => {
    const id = checkId(request.params.id);
    const target = checkId(request.params.userId);
    const role = await membership(id, request.user.id);
    if (!role) throw notFound('Group not found');
    if (role !== 'gm' && target !== request.user.id) throw forbidden('You can only remove yourself');
    await transaction(async (tx) => {
      await tx.query('DELETE FROM group_members WHERE group_id = ? AND user_id = ?', [id, target]);
      await tx.query(
        'DELETE gc FROM group_characters gc JOIN characters c ON c.id = gc.character_id WHERE gc.group_id = ? AND c.owner_id = ?',
        [id, target],
      );
    });
    const g = await one('SELECT gm_id FROM `groups` WHERE id = ?', [id]);
    hub.sendToUsers([g.gm_id, target], { type: 'group.updated', groupId: id });
    hub.sendToUsers([g.gm_id], { type: 'characters.refresh' });
    return { ok: true };
  });

  /** Assign one of your own primary characters to the group. */
  app.post('/groups/:id/characters', auth, async (request) => {
    const id = checkId(request.params.id);
    const characterId = checkId(request.body?.characterId, 'characterId');
    const role = await membership(id, request.user.id);
    if (!role) throw notFound('Group not found');
    const ch = await one('SELECT owner_id, kind FROM characters WHERE id = ?', [characterId]);
    if (!ch || ch.owner_id !== request.user.id) throw notFound('Character not found');
    if (ch.kind !== 'primary') throw badRequest('Assign the primary character; its forms and companions follow automatically');
    await query('INSERT IGNORE INTO group_characters (group_id, character_id) VALUES (?, ?)', [id, characterId]);
    const g = await one('SELECT gm_id FROM `groups` WHERE id = ?', [id]);
    await notifyGroup(id, { type: 'group.updated', groupId: id });
    hub.sendToUsers([g.gm_id], { type: 'characters.refresh' });
    return { group: viewFor(await loadGroup(id), role) };
  });

  app.delete('/groups/:id/characters/:characterId', auth, async (request) => {
    const id = checkId(request.params.id);
    const characterId = checkId(request.params.characterId);
    const role = await membership(id, request.user.id);
    if (!role) throw notFound('Group not found');
    const ch = await one('SELECT owner_id FROM characters WHERE id = ?', [characterId]);
    if (!ch) throw notFound('Character not found');
    if (role !== 'gm' && ch.owner_id !== request.user.id) throw forbidden('Not your character');
    await query('DELETE FROM group_characters WHERE group_id = ? AND character_id = ?', [id, characterId]);
    const g = await one('SELECT gm_id FROM `groups` WHERE id = ?', [id]);
    await notifyGroup(id, { type: 'group.updated', groupId: id });
    hub.sendToUsers([g.gm_id], { type: 'characters.refresh', removed: await hierarchyIds([characterId]) });
    return { group: viewFor(await loadGroup(id), role) };
  });
}
