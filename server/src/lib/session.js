import { query, one } from '../db.js';
import { randomToken, hashToken } from './crypto.js';
import { config } from '../config.js';

const ttlMs = () => config.session.ttlDays * 86400 * 1000;

export async function createSession(userId, userAgent) {
  const token = randomToken(32);
  const expires = new Date(Date.now() + ttlMs());
  await query(
    'INSERT INTO sessions (token_hash, user_id, expires_at, user_agent) VALUES (?, ?, ?, ?)',
    [hashToken(token), userId, expires, (userAgent || '').slice(0, 255)],
  );
  return { token, expires };
}

export async function resolveSession(token) {
  if (!token || typeof token !== 'string' || token.length > 200) return null;
  const row = await one(
    `SELECT s.token_hash, s.expires_at, s.last_seen_at,
            u.id, u.email, u.email_verified_at, u.display_name, u.role, u.discord_id, u.discord_username, u.disabled_at,
            (u.password_hash IS NOT NULL) AS has_password
       FROM sessions s JOIN users u ON u.id = s.user_id
      WHERE s.token_hash = ? AND s.expires_at > NOW()`,
    [hashToken(token)],
  );
  if (!row || row.disabled_at) return null;
  // Touch last_seen at most every 5 minutes to keep writes low.
  if (Date.now() - new Date(row.last_seen_at).getTime() > 5 * 60 * 1000) {
    query('UPDATE sessions SET last_seen_at = NOW() WHERE token_hash = ?', [row.token_hash]).catch(() => {});
  }
  return {
    id: row.id,
    email: row.email,
    emailVerified: !!row.email_verified_at,
    displayName: row.display_name,
    role: row.role,
    discordId: row.discord_id,
    discordUsername: row.discord_username,
    hasPassword: !!row.has_password,
  };
}

export async function destroySession(token) {
  if (!token) return;
  await query('DELETE FROM sessions WHERE token_hash = ?', [hashToken(token)]);
}

export async function destroyAllSessions(userId) {
  await query('DELETE FROM sessions WHERE user_id = ?', [userId]);
}

export function cookieOptions() {
  return {
    path: '/',
    httpOnly: true,
    sameSite: 'lax',
    secure: config.isProd || config.appUrl.startsWith('https://'),
    maxAge: config.session.ttlDays * 86400,
  };
}

export function publicUser(u) {
  return {
    id: u.id,
    email: u.email,
    emailVerified: u.emailVerified,
    displayName: u.displayName,
    role: u.role,
    discordLinked: !!u.discordId,
    discordUsername: u.discordUsername || null,
    hasPassword: u.hasPassword,
  };
}
