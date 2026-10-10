import { query, one, transaction } from '../db.js';
import { uuid, randomToken, hashToken, hashPassword, verifyPassword, hmac } from '../lib/crypto.js';
import { createSession, destroySession, destroyAllSessions, cookieOptions, publicUser, resolveSession } from '../lib/session.js';
import { sendMail, verifyEmailTemplate, resetPasswordTemplate } from '../lib/mail.js';
import { normEmail, checkPassword, checkDisplayName } from '../lib/validate.js';
import { badRequest, unauthorized, forbidden, conflict, notFound } from '../lib/errors.js';
import { config } from '../config.js';

const VERIFY_TTL_MS = 24 * 3600 * 1000;
const RESET_TTL_MS = 3600 * 1000;

async function issueEmailToken(userId, purpose, ttlMs) {
  const token = randomToken(32);
  await query('DELETE FROM email_tokens WHERE user_id = ? AND purpose = ?', [userId, purpose]);
  await query(
    'INSERT INTO email_tokens (token_hash, user_id, purpose, expires_at) VALUES (?, ?, ?, ?)',
    [hashToken(token), userId, purpose, new Date(Date.now() + ttlMs)],
  );
  return token;
}

async function consumeEmailToken(token, purpose) {
  if (typeof token !== 'string' || !token) throw badRequest('Token missing', 'TOKEN_INVALID');
  const row = await one(
    'SELECT token_hash, user_id FROM email_tokens WHERE token_hash = ? AND purpose = ? AND used_at IS NULL AND expires_at > NOW()',
    [hashToken(token), purpose],
  );
  if (!row) throw badRequest('This link is invalid or has expired', 'TOKEN_INVALID');
  await query('UPDATE email_tokens SET used_at = NOW() WHERE token_hash = ?', [row.token_hash]);
  return row.user_id;
}

export async function sendVerificationMail(app, user) {
  const token = await issueEmailToken(user.id, 'verify', VERIFY_TTL_MS);
  const url = `${config.appUrl}/#/verify-email?token=${encodeURIComponent(token)}`;
  await sendMail({ to: user.email, ...verifyEmailTemplate(url) }, app.log);
}

async function redeemInvite(tx, code, userId) {
  const invite = await tx.one(
    'SELECT code FROM invites WHERE code = ? AND used_by IS NULL AND (expires_at IS NULL OR expires_at > NOW()) FOR UPDATE',
    [code],
  );
  if (!invite) throw badRequest('Account invite code is invalid or already used (group codes cannot be used to register)', 'INVITE_INVALID');
  await tx.query('UPDATE invites SET used_by = ?, used_at = NOW() WHERE code = ?', [userId, code]);
}

function setSessionCookie(reply, token) {
  reply.setCookie(config.session.cookieName, token, cookieOptions());
}

export default async function authRoutes(app) {
  const strict = { config: { rateLimit: { max: 10, timeWindow: '15 minutes' } } };

  app.get('/auth/me', async (request) => {
    return {
      user: request.user ? publicUser(request.user) : null,
      features: { discord: !!config.discord.clientId, email: !!config.mail.resendApiKey || !config.isProd },
    };
  });

  app.post('/auth/register', strict, async (request, reply) => {
    const body = request.body || {};
    const email = normEmail(body.email);
    const password = checkPassword(body.password);
    const displayName = checkDisplayName(body.displayName);
    const inviteCode = String(body.inviteCode || '').trim().toUpperCase();
    if (!inviteCode) throw badRequest('Invite code is required', 'INVITE_REQUIRED');

    if (await one('SELECT id FROM users WHERE email = ?', [email])) {
      throw conflict('An account with this email already exists', 'EMAIL_TAKEN');
    }
    const id = uuid();
    const passwordHash = await hashPassword(password);
    await transaction(async (tx) => {
      await tx.query(
        'INSERT INTO users (id, email, password_hash, display_name) VALUES (?, ?, ?, ?)',
        [id, email, passwordHash, displayName],
      );
      await redeemInvite(tx, inviteCode, id);
    });
    const user = { id, email };
    await sendVerificationMail(app, user);
    const { token } = await createSession(id, request.headers['user-agent']);
    setSessionCookie(reply, token);
    reply.code(201);
    return { user: publicUser(await resolveSession(token)) };
  });

  app.post('/auth/login', strict, async (request, reply) => {
    const body = request.body || {};
    const email = normEmail(body.email);
    const password = typeof body.password === 'string' ? body.password : '';
    const row = await one('SELECT id, password_hash, disabled_at FROM users WHERE email = ?', [email]);
    const ok = row && row.password_hash && (await verifyPassword(password, row.password_hash));
    if (!ok) throw unauthorized('Email or password is incorrect', 'BAD_CREDENTIALS');
    if (row.disabled_at) throw forbidden('This account has been disabled', 'ACCOUNT_DISABLED');
    const { token } = await createSession(row.id, request.headers['user-agent']);
    setSessionCookie(reply, token);
    return { user: publicUser(await resolveSession(token)) };
  });

  app.post('/auth/logout', async (request, reply) => {
    await destroySession(request.sessionToken);
    reply.clearCookie(config.session.cookieName, { path: '/' });
    return { ok: true };
  });

  app.post('/auth/verify-email', strict, async (request) => {
    const userId = await consumeEmailToken(request.body?.token, 'verify');
    await query('UPDATE users SET email_verified_at = NOW() WHERE id = ? AND email_verified_at IS NULL', [userId]);
    return { ok: true };
  });

  app.post('/auth/resend-verification', strict, async (request) => {
    if (!request.user) throw unauthorized();
    if (request.user.emailVerified) return { ok: true };
    await sendVerificationMail(app, request.user);
    return { ok: true };
  });

  app.post('/auth/forgot-password', strict, async (request) => {
    const email = normEmail(request.body?.email);
    const row = await one('SELECT id, email FROM users WHERE email = ? AND disabled_at IS NULL', [email]);
    if (row) {
      const token = await issueEmailToken(row.id, 'reset', RESET_TTL_MS);
      const url = `${config.appUrl}/#/reset-password?token=${encodeURIComponent(token)}`;
      await sendMail({ to: row.email, ...resetPasswordTemplate(url) }, app.log);
    }
    // Always succeed so the endpoint cannot be used to probe for accounts.
    return { ok: true };
  });

  app.post('/auth/reset-password', strict, async (request, reply) => {
    const password = checkPassword(request.body?.password);
    const userId = await consumeEmailToken(request.body?.token, 'reset');
    await query('UPDATE users SET password_hash = ?, email_verified_at = COALESCE(email_verified_at, NOW()) WHERE id = ?', [await hashPassword(password), userId]);
    await destroyAllSessions(userId);
    const { token } = await createSession(userId, request.headers['user-agent']);
    setSessionCookie(reply, token);
    return { user: publicUser(await resolveSession(token)) };
  });

  app.post('/auth/change-password', { preHandler: app.requireAuth }, async (request) => {
    const body = request.body || {};
    const next = checkPassword(body.newPassword);
    const row = await one('SELECT password_hash FROM users WHERE id = ?', [request.user.id]);
    if (row.password_hash) {
      const ok = await verifyPassword(String(body.currentPassword || ''), row.password_hash);
      if (!ok) throw unauthorized('Current password is incorrect', 'BAD_CREDENTIALS');
    }
    await query('UPDATE users SET password_hash = ? WHERE id = ?', [await hashPassword(next), request.user.id]);
    return { ok: true };
  });

  app.patch('/auth/profile', { preHandler: app.requireAuth }, async (request) => {
    const displayName = checkDisplayName(request.body?.displayName);
    await query('UPDATE users SET display_name = ? WHERE id = ?', [displayName, request.user.id]);
    return { user: publicUser({ ...request.user, displayName }) };
  });

  // ---- Discord OAuth -------------------------------------------------------
  // Flow: GET /auth/discord?invite=CODE  -> redirect to Discord
  //       GET /auth/discord/callback      -> exchange code, find/create user, set cookie, redirect to /
  const discordEnabled = () => !!(config.discord.clientId && config.discord.clientSecret);
  const redirectUri = () => `${config.appUrl}/api/auth/discord/callback`;

  app.get('/auth/discord', async (request, reply) => {
    if (!discordEnabled()) throw notFound('Discord login is not configured');
    const invite = String(request.query?.invite || '').trim().toUpperCase().slice(0, 32);
    const mode = request.user ? 'link' : 'login';
    const nonce = randomToken(16);
    const payload = Buffer.from(JSON.stringify({ n: nonce, i: invite, m: mode, u: request.user?.id || null })).toString('base64url');
    const state = `${payload}.${hmac(payload)}`;
    reply.setCookie('discord_oauth_nonce', nonce, { path: '/api/auth/discord', httpOnly: true, sameSite: 'lax', secure: cookieOptions().secure, maxAge: 600 });
    const params = new URLSearchParams({
      client_id: config.discord.clientId,
      redirect_uri: redirectUri(),
      response_type: 'code',
      scope: 'identify email',
      state,
      prompt: 'none',
    });
    return reply.redirect(`https://discord.com/oauth2/authorize?${params}`);
  });

  app.get('/auth/discord/callback', async (request, reply) => {
    if (!discordEnabled()) throw notFound('Discord login is not configured');
    const fail = (code) => reply.redirect(`/#/login?error=${encodeURIComponent(code)}`);
    const { code, state, error } = request.query || {};
    if (error || !code || !state) return fail('discord_denied');
    const [payload, sig] = String(state).split('.');
    if (!payload || sig !== hmac(payload)) return fail('discord_state');
    let st;
    try { st = JSON.parse(Buffer.from(payload, 'base64url').toString()); } catch { return fail('discord_state'); }
    if (st.n !== request.cookies?.discord_oauth_nonce) return fail('discord_state');
    reply.clearCookie('discord_oauth_nonce', { path: '/api/auth/discord' });

    const tokenRes = await fetch('https://discord.com/api/oauth2/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: config.discord.clientId,
        client_secret: config.discord.clientSecret,
        grant_type: 'authorization_code',
        code: String(code),
        redirect_uri: redirectUri(),
      }),
    });
    if (!tokenRes.ok) { app.log.warn({ status: tokenRes.status }, 'discord token exchange failed'); return fail('discord_token'); }
    const tokens = await tokenRes.json();
    const meRes = await fetch('https://discord.com/api/users/@me', { headers: { Authorization: `Bearer ${tokens.access_token}` } });
    if (!meRes.ok) return fail('discord_profile');
    const profile = await meRes.json();
    const discordId = String(profile.id);
    const discordName = profile.global_name || profile.username || 'Discord user';
    const discordEmail = profile.verified && profile.email ? profile.email.toLowerCase() : null;

    if (st.m === 'link') {
      if (!request.user || request.user.id !== st.u) return fail('discord_state');
      const taken = await one('SELECT id FROM users WHERE discord_id = ? AND id <> ?', [discordId, request.user.id]);
      if (taken) return fail('discord_taken');
      await query('UPDATE users SET discord_id = ?, discord_username = ? WHERE id = ?', [discordId, discordName, request.user.id]);
      return reply.redirect('/#/account?linked=discord');
    }

    let user = await one('SELECT id, disabled_at FROM users WHERE discord_id = ?', [discordId]);
    if (!user && discordEmail) {
      // Same verified email as an existing account: link automatically.
      const byEmail = await one('SELECT id, disabled_at FROM users WHERE email = ?', [discordEmail]);
      if (byEmail) {
        await query('UPDATE users SET discord_id = ?, discord_username = ?, email_verified_at = COALESCE(email_verified_at, NOW()) WHERE id = ?', [discordId, discordName, byEmail.id]);
        user = byEmail;
      }
    }
    if (!user) {
      if (!st.i) return fail('invite_required');
      if (!discordEmail) return fail('discord_no_email');
      const id = uuid();
      try {
        await transaction(async (tx) => {
          await tx.query(
            'INSERT INTO users (id, email, email_verified_at, display_name, discord_id, discord_username) VALUES (?, ?, NOW(), ?, ?, ?)',
            [id, discordEmail, discordName.slice(0, 100), discordId, discordName],
          );
          await redeemInvite(tx, st.i, id);
        });
      } catch (err) {
        if (err.code === 'INVITE_INVALID') return fail('invite_invalid');
        throw err;
      }
      user = { id, disabled_at: null };
    }
    if (user.disabled_at) return fail('account_disabled');
    const { token } = await createSession(user.id, request.headers['user-agent']);
    setSessionCookie(reply, token);
    return reply.redirect('/');
  });
}
