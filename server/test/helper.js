/**
 * Shared test harness for the Fastify API.
 *
 * Environment is configured HERE, before src/config.js is imported, so every
 * test file must `import` this module first (ESM evaluates imports in order).
 * Values already present in the environment win so CI can override e.g.
 * DB_PORT=3306.
 */
const env = process.env;
env.NODE_ENV = 'test';
env.DB_HOST = env.DB_HOST || '127.0.0.1';
env.DB_PORT = env.DB_PORT || '3307';
env.DB_USER = env.DB_USER || 'olchar';
env.DB_PASSWORD = env.DB_PASSWORD || 'olchar';
env.DB_NAME = env.DB_NAME || 'olchar_test';
env.SECRET_KEY = env.SECRET_KEY || 'test-secret';
env.APP_URL = env.APP_URL || 'http://localhost:3000';
// Mails must land in the in-memory outbox, Discord must be off.
delete env.RESEND_API_KEY;
delete env.DISCORD_CLIENT_ID;
delete env.DISCORD_CLIENT_SECRET;
delete env.ADMIN_EMAIL;

// Safety net: never truncate a database that does not look like a test DB.
if (!/test/i.test(env.DB_NAME)) {
  throw new Error(`Refusing to run tests against DB_NAME="${env.DB_NAME}" (name must contain "test")`);
}

const { buildApp } = await import('../src/app.js');
const { migrate, query, pool, closeDb } = await import('../src/db.js');
const { testOutbox } = await import('../src/lib/mail.js');
const { config } = await import('../src/config.js');

export { query, testOutbox, config };

export const COOKIE_NAME = config.session.cookieName;

let counter = 0;
/** Unique-ish suffix for emails/ids within one test process. */
export const uniq = () => `${Date.now().toString(36)}${(counter++).toString(36)}`;

/** Drop all rows from every table except schema_migrations. */
export async function truncateAll() {
  const conn = await pool.getConnection();
  try {
    const [rows] = await conn.query('SHOW TABLES');
    const tables = rows.map((r) => Object.values(r)[0]).filter((t) => t !== 'schema_migrations');
    await conn.query('SET FOREIGN_KEY_CHECKS=0');
    for (const t of tables) await conn.query(`TRUNCATE TABLE \`${t}\``);
    await conn.query('SET FOREIGN_KEY_CHECKS=1');
  } finally {
    conn.release();
  }
  testOutbox.length = 0;
}

/**
 * Build the app, migrate and wipe the database. Call once per test file in
 * `before()`; call `teardown(app)` in `after()`.
 */
export async function setup() {
  const app = await buildApp({ logger: false });
  await migrate({ info() {} });
  await truncateAll();
  await app.ready();
  return app;
}

export async function teardown(app) {
  if (app) await app.close();
  await closeDb();
}

// ---- SQL helpers -----------------------------------------------------------

/** Insert an invite row and return its code. */
export async function createInvite({ code, createdBy = null, expiresAt = null, note = null } = {}) {
  code = (code || `INV${uniq()}`).toUpperCase().slice(0, 32);
  await query('INSERT INTO invites (code, created_by, note, expires_at) VALUES (?, ?, ?, ?)', [code, createdBy, note, expiresAt]);
  return code;
}

export async function setRole(userId, role) {
  await query('UPDATE users SET role = ? WHERE id = ?', [role, userId]);
}

// ---- HTTP helpers ----------------------------------------------------------

/** Session cookie header value from an inject() response, or null. */
export function cookieFrom(res) {
  const c = (res.cookies || []).find((x) => x.name === COOKIE_NAME);
  return c && c.value ? `${COOKIE_NAME}=${c.value}` : null;
}

/** Raw session token from a cookie header value. */
export function tokenFromCookie(cookie) {
  return cookie ? cookie.slice(COOKIE_NAME.length + 1) : null;
}

/** Return an inject function bound to a session cookie. */
export function authed(app, cookie) {
  return (method, url, body, headers = {}) =>
    app.inject({
      method,
      url,
      payload: body === undefined ? undefined : body,
      headers: { ...(cookie ? { cookie } : {}), ...headers },
    });
}

export function json(res) {
  return res.json();
}

// ---- Mail helpers ----------------------------------------------------------

export function lastMailTo(email, subjectRe) {
  const to = email.toLowerCase();
  for (let i = testOutbox.length - 1; i >= 0; i--) {
    const m = testOutbox[i];
    if (m.to.toLowerCase() === to && (!subjectRe || subjectRe.test(m.subject))) return m;
  }
  return null;
}

/** Extract the `token=` query value from a mail's text body. */
export function tokenFromMail(mail) {
  if (!mail) return null;
  const m = /token=([^\s&"']+)/.exec(mail.text);
  return m ? decodeURIComponent(m[1]) : null;
}

// ---- User helpers ----------------------------------------------------------

/**
 * Register a user through the API (consuming a fresh invite) and, by
 * default, verify the email via the token from the outbox.
 * Returns { id, email, password, displayName, cookie, user, inviteCode }.
 */
export async function registerUser(app, { email, password = 'correct horse battery', displayName, verify = true, inviteCode } = {}) {
  const tag = uniq();
  email = (email || `user-${tag}@example.test`).toLowerCase();
  displayName = displayName || `User ${tag}`;
  inviteCode = inviteCode || (await createInvite());
  const res = await app.inject({
    method: 'POST',
    url: '/api/auth/register',
    payload: { email, password, displayName, inviteCode },
  });
  if (res.statusCode !== 201) {
    throw new Error(`register failed: ${res.statusCode} ${res.body}`);
  }
  const cookie = cookieFrom(res);
  const user = res.json().user;
  if (verify) {
    const token = tokenFromMail(lastMailTo(email, /confirm/i));
    if (!token) throw new Error('no verification mail found for ' + email);
    const v = await app.inject({ method: 'POST', url: '/api/auth/verify-email', payload: { token } });
    if (v.statusCode !== 200) throw new Error(`verify failed: ${v.statusCode} ${v.body}`);
  }
  return { id: user.id, email, password, displayName, cookie, user, inviteCode, api: authed(app, cookie) };
}

export async function login(app, email, password) {
  const res = await app.inject({ method: 'POST', url: '/api/auth/login', payload: { email, password } });
  return { res, cookie: cookieFrom(res) };
}

// ---- Character fixtures ----------------------------------------------------

export function makeCharacter(overrides = {}) {
  const id = overrides.id || `char-${uniq()}`;
  return {
    id,
    name: `Hero ${id}`,
    attributes: { agility: 2, fortitude: 3, might: 1 },
    xp: 0,
    ...overrides,
  };
}

export function makeAlternateForm(primaryId, overrides = {}) {
  return makeCharacter({
    id: `form-${uniq()}`,
    name: 'Wolf Form',
    isAlternateForm: true,
    primaryCharacterId: primaryId,
    ...overrides,
  });
}
