import { query, one } from '../db.js';

/**
 * Access model:
 *  - owner: full access to own characters
 *  - GM: full access (read + edit) to every character assigned to a group they run,
 *        including that character's alternate forms and companions
 *  - everyone else: none
 */

/** IDs of all characters in the hierarchy below (and including) the given primary ids. */
export async function hierarchyIds(rootIds) {
  if (!rootIds.length) return [];
  const rows = await query(
    `WITH RECURSIVE tree AS (
       SELECT id FROM characters WHERE id IN (?)
       UNION ALL
       SELECT c.id FROM characters c JOIN tree t ON c.primary_character_id = t.id
     )
     SELECT DISTINCT id FROM tree`,
    [rootIds],
  );
  return rows.map((r) => r.id);
}

/** Root (primary) id of a character by walking up primary_character_id. */
export async function rootIdOf(characterId) {
  const row = await one(
    `WITH RECURSIVE up AS (
       SELECT id, primary_character_id, 0 AS depth FROM characters WHERE id = ?
       UNION ALL
       SELECT c.id, c.primary_character_id, up.depth + 1 FROM characters c JOIN up ON c.id = up.primary_character_id WHERE up.depth < 10
     )
     SELECT id FROM up ORDER BY depth DESC LIMIT 1`,
    [characterId],
  );
  return row?.id ?? null;
}

/** Ids of all characters a user may see as GM (full hierarchies of assigned characters). */
export async function gmVisibleCharacterIds(userId) {
  const rows = await query(
    `SELECT gc.character_id FROM group_characters gc JOIN \`groups\` g ON g.id = gc.group_id WHERE g.gm_id = ?`,
    [userId],
  );
  return hierarchyIds(rows.map((r) => r.character_id));
}

/** 'owner' | 'gm' | null */
export async function accessLevel(userId, characterId) {
  const ch = await one('SELECT owner_id FROM characters WHERE id = ?', [characterId]);
  if (!ch) return null;
  if (ch.owner_id === userId) return 'owner';
  const root = await rootIdOf(characterId);
  const gm = await one(
    `SELECT 1 FROM group_characters gc JOIN \`groups\` g ON g.id = gc.group_id
      WHERE g.gm_id = ? AND gc.character_id IN (?, ?) LIMIT 1`,
    [userId, characterId, root || characterId],
  );
  return gm ? 'gm' : null;
}

/** All user ids that must be notified about a change to this character (owner + GMs of its groups). */
export async function interestedUserIds(characterId) {
  const ch = await one('SELECT owner_id FROM characters WHERE id = ?', [characterId]);
  if (!ch) return [];
  const root = await rootIdOf(characterId);
  const gms = await query(
    `SELECT DISTINCT g.gm_id FROM group_characters gc JOIN \`groups\` g ON g.id = gc.group_id
      WHERE gc.character_id IN (?, ?)`,
    [characterId, root || characterId],
  );
  return [...new Set([ch.owner_id, ...gms.map((r) => r.gm_id)])];
}
