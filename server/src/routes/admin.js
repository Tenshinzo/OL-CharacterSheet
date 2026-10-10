import { query, one } from '../db.js';
import { shortCode, randomToken, hashToken } from '../lib/crypto.js';
import { checkId, normEmail } from '../lib/validate.js';
import { badRequest, notFound } from '../lib/errors.js';
import { destroyAllSessions } from '../lib/session.js';
import { hub } from '../lib/hub.js';
import { sendMail, resetPasswordTemplate } from '../lib/mail.js';
import { config } from '../config.js';

export default async function adminRoutes(app) {
  const admin = { preHandler: app.requireAdmin };

  app.get('/admin/overview', admin, async () => {
    const [users] = await query('SELECT COUNT(*) AS n FROM users');
    const [chars] = await query('SELECT COUNT(*) AS n FROM characters');
    const [groups] = await query('SELECT COUNT(*) AS n FROM `groups`');
    const [invites] = await query('SELECT COUNT(*) AS n FROM invites WHERE used_by IS NULL AND (expires_at IS NULL OR expires_at > NOW())');
    return { users: users.n, characters: chars.n, groups: groups.n, openInvites: invites.n, live: hub.stats() };
  });

  app.get('/admin/users', admin, async () => {
    const rows = await query(
      `SELECT u.id, u.email, u.display_name, u.role, u.email_verified_at, u.disabled_at, u.discord_username, u.created_at,
              (SELECT COUNT(*) FROM characters c WHERE c.owner_id = u.id) AS character_count,
              (SELECT MAX(last_seen_at) FROM sessions s WHERE s.user_id = u.id) AS last_seen_at
         FROM users u ORDER BY u.created_at`,
    );
    return {
      users: rows.map((r) => ({
        id: r.id, email: r.email, displayName: r.display_name, role: r.role,
        emailVerified: !!r.email_verified_at, disabled: !!r.disabled_at, discordUsername: r.discord_username,
        createdAt: r.created_at, characterCount: r.character_count, lastSeenAt: r.last_seen_at,
      })),
    };
  });

  app.patch('/admin/users/:id', admin, async (request) => {
    const id = checkId(request.params.id);
    const u = await one('SELECT id, role FROM users WHERE id = ?', [id]);
    if (!u) throw notFound('User not found');
    const body = request.body || {};
    if (body.disabled !== undefined) {
      if (id === request.user.id) throw badRequest('You cannot disable yourself');
      await query('UPDATE users SET disabled_at = ? WHERE id = ?', [body.disabled ? new Date() : null, id]);
      if (body.disabled) { await destroyAllSessions(id); hub.closeUser(id); }
    }
    if (body.role !== undefined) {
      if (!['user', 'admin'].includes(body.role)) throw badRequest('Invalid role');
      if (id === request.user.id && body.role !== 'admin') throw badRequest('You cannot demote yourself');
      await query('UPDATE users SET role = ? WHERE id = ?', [body.role, id]);
    }
    if (body.emailVerified === true) {
      await query('UPDATE users SET email_verified_at = COALESCE(email_verified_at, NOW()) WHERE id = ?', [id]);
    }
    return { ok: true };
  });

  app.delete('/admin/users/:id', admin, async (request) => {
    const id = checkId(request.params.id);
    if (id === request.user.id) throw badRequest('You cannot delete yourself');
    const u = await one('SELECT id FROM users WHERE id = ?', [id]);
    if (!u) throw notFound('User not found');
    hub.closeUser(id);
    await query('DELETE FROM users WHERE id = ?', [id]); // cascades to sessions, characters, groups, data
    return { ok: true };
  });

  /** Send a password reset mail to a user (or return the link when mail is not configured). */
  app.post('/admin/users/:id/reset-password', admin, async (request) => {
    const id = checkId(request.params.id);
    const u = await one('SELECT id, email FROM users WHERE id = ?', [id]);
    if (!u) throw notFound('User not found');
    const token = randomToken(32);
    await query('DELETE FROM email_tokens WHERE user_id = ? AND purpose = ?', [id, 'reset']);
    await query('INSERT INTO email_tokens (token_hash, user_id, purpose, expires_at) VALUES (?, ?, ?, ?)',
      [hashToken(token), id, 'reset', new Date(Date.now() + 24 * 3600 * 1000)]);
    const url = `${config.appUrl}/#/reset-password?token=${encodeURIComponent(token)}`;
    if (config.mail.resendApiKey) {
      await sendMail({ to: u.email, ...resetPasswordTemplate(url) }, app.log);
      return { sent: true };
    }
    return { sent: false, url };
  });

  app.get('/admin/invites', admin, async () => {
    const rows = await query(
      `SELECT i.code, i.note, i.created_at, i.expires_at, i.used_at, cu.display_name AS created_by, uu.display_name AS used_by
         FROM invites i LEFT JOIN users cu ON cu.id = i.created_by LEFT JOIN users uu ON uu.id = i.used_by
        ORDER BY i.created_at DESC LIMIT 200`,
    );
    return { invites: rows.map((r) => ({ code: r.code, note: r.note, createdAt: r.created_at, expiresAt: r.expires_at, usedAt: r.used_at, createdBy: r.created_by, usedBy: r.used_by })) };
  });

  app.post('/admin/invites', admin, async (request) => {
    const count = Math.min(Math.max(Number(request.body?.count || 1), 1), 20);
    const note = String(request.body?.note || '').slice(0, 255) || null;
    const days = Number(request.body?.expiresInDays || 0);
    const expires = days > 0 ? new Date(Date.now() + days * 86400 * 1000) : null;
    const codes = [];
    for (let i = 0; i < count; i++) {
      const code = shortCode(10);
      await query('INSERT INTO invites (code, created_by, note, expires_at) VALUES (?, ?, ?, ?)', [code, request.user.id, note, expires]);
      codes.push(code);
    }
    return { codes, registerUrl: `${config.appUrl}/#/register?invite=` };
  });

  app.delete('/admin/invites/:code', admin, async (request) => {
    const code = String(request.params.code || '').toUpperCase().slice(0, 32);
    await query('DELETE FROM invites WHERE code = ? AND used_by IS NULL', [code]);
    return { ok: true };
  });

  /** Create a user directly (pre-verified) and send them a reset link to set a password. */
  app.post('/admin/users', admin, async (request) => {
    const email = normEmail(request.body?.email);
    const displayName = String(request.body?.displayName || email.split('@')[0]).trim().slice(0, 100);
    if (await one('SELECT id FROM users WHERE email = ?', [email])) throw badRequest('Email already registered');
    const { uuid } = await import('../lib/crypto.js');
    const id = uuid();
    await query('INSERT INTO users (id, email, email_verified_at, display_name) VALUES (?, ?, NOW(), ?)', [id, email, displayName]);
    return { id };
  });
}
