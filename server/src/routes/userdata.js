import { query } from '../db.js';
import { badRequest } from '../lib/errors.js';

const KINDS = new Set(['settings', 'customBoons', 'customBanes']);
const MAX_BYTES = 2_000_000;

export default async function userDataRoutes(app) {
  const auth = { preHandler: app.requireAuth };

  app.get('/me/data', auth, async (request) => {
    const rows = await query('SELECT kind, data FROM user_data WHERE user_id = ?', [request.user.id]);
    const out = { settings: {}, customBoons: [], customBanes: [] };
    for (const r of rows) out[r.kind] = typeof r.data === 'string' ? JSON.parse(r.data) : r.data;
    return out;
  });

  app.put('/me/data/:kind', auth, async (request) => {
    const { kind } = request.params;
    if (!KINDS.has(kind)) throw badRequest('Unknown data kind');
    const data = request.body?.data;
    if (data === undefined) throw badRequest('data required');
    const json = JSON.stringify(data);
    if (Buffer.byteLength(json) > MAX_BYTES) throw badRequest('Payload too large');
    await query(
      'INSERT INTO user_data (user_id, kind, data) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE data = VALUES(data)',
      [request.user.id, kind, json],
    );
    return { ok: true };
  });
}
