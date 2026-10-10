import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { setup, teardown, registerUser, setRole, createInvite, login, makeCharacter, query, uniq } from './helper.js';

let app;
let admin;
let user;
before(async () => {
  app = await setup();
  admin = await registerUser(app, { displayName: 'Admin' });
  await setRole(admin.id, 'admin');
  user = await registerUser(app, { displayName: 'Regular' });
});
after(() => teardown(app));

test('non-admin gets 403 on admin routes, anonymous gets 401', async () => {
  for (const [method, url, body] of [
    ['GET', '/api/admin/overview'],
    ['GET', '/api/admin/users'],
    ['GET', '/api/admin/invites'],
    ['POST', '/api/admin/invites', { count: 1 }],
    ['PATCH', `/api/admin/users/${admin.id}`, { disabled: true }],
    ['DELETE', `/api/admin/users/${admin.id}`],
  ]) {
    const res = await user.api(method, url, body);
    assert.equal(res.statusCode, 403, `${method} ${url}`);
    const anon = await app.inject({ method, url, payload: body });
    assert.equal(anon.statusCode, 401, `${method} ${url} anonymous`);
  }
  // nothing changed
  const row = (await query('SELECT disabled_at FROM users WHERE id = ?', [admin.id]))[0];
  assert.equal(row.disabled_at, null);
});

test('admin sees role admin in /auth/me and can read the overview', async () => {
  const me = await admin.api('GET', '/api/auth/me');
  assert.equal(me.json().user.role, 'admin');
  const res = await admin.api('GET', '/api/admin/overview');
  assert.equal(res.statusCode, 200);
  const body = res.json();
  assert.ok(body.users >= 2);
  assert.equal(typeof body.characters, 'number');
  assert.equal(typeof body.openInvites, 'number');
  assert.deepEqual(Object.keys(body.live).sort(), ['sockets', 'users']);
});

test('admin can list users', async () => {
  const ch = makeCharacter();
  await user.api('PUT', `/api/characters/${ch.id}`, { character: ch });
  const res = await admin.api('GET', '/api/admin/users');
  assert.equal(res.statusCode, 200);
  const users = res.json().users;
  const u = users.find((x) => x.id === user.id);
  assert.ok(u);
  assert.equal(u.email, user.email);
  assert.equal(u.displayName, 'Regular');
  assert.equal(u.role, 'user');
  assert.equal(u.emailVerified, true);
  assert.equal(u.disabled, false);
  assert.ok(u.characterCount >= 1);
  assert.ok(users.find((x) => x.id === admin.id).role === 'admin');
});

test('admin can create invites that work for registration', async () => {
  const res = await admin.api('POST', '/api/admin/invites', { count: 3, note: 'friends', expiresInDays: 7 });
  assert.equal(res.statusCode, 200, res.body);
  const { codes, registerUrl } = res.json();
  assert.equal(codes.length, 3);
  assert.ok(codes.every((c) => /^[A-Z2-9]{10}$/.test(c)));
  assert.ok(registerUrl.startsWith('http://localhost:3000/'));

  const list = await admin.api('GET', '/api/admin/invites');
  const mine = list.json().invites.filter((i) => codes.includes(i.code));
  assert.equal(mine.length, 3);
  assert.ok(mine.every((i) => i.note === 'friends' && i.createdBy === 'Admin' && i.usedAt === null && i.expiresAt));

  const newcomer = await registerUser(app, { inviteCode: codes[0], verify: false });
  assert.ok(newcomer.id);
  const after = await admin.api('GET', '/api/admin/invites');
  const used = after.json().invites.find((i) => i.code === codes[0]);
  assert.ok(used.usedAt);
  assert.equal(used.usedBy, newcomer.displayName);

  // count is capped at 20
  const many = await admin.api('POST', '/api/admin/invites', { count: 999 });
  assert.equal(many.json().codes.length, 20);

  // unused invite can be deleted, used one cannot
  assert.equal((await admin.api('DELETE', `/api/admin/invites/${codes[1]}`)).statusCode, 200);
  assert.equal((await query('SELECT COUNT(*) AS n FROM invites WHERE code = ?', [codes[1]]))[0].n, 0);
  await admin.api('DELETE', `/api/admin/invites/${codes[0]}`);
  assert.equal((await query('SELECT COUNT(*) AS n FROM invites WHERE code = ?', [codes[0]]))[0].n, 1);
});

test('admin disables a user: session fails immediately and login is refused', async () => {
  const victim = await registerUser(app, { displayName: 'Victim' });
  assert.equal((await victim.api('GET', '/api/characters')).statusCode, 200);

  const res = await admin.api('PATCH', `/api/admin/users/${victim.id}`, { disabled: true });
  assert.equal(res.statusCode, 200, res.body);

  const me = await victim.api('GET', '/api/auth/me');
  assert.equal(me.json().user, null);
  const chars = await victim.api('GET', '/api/characters');
  assert.equal(chars.statusCode, 401);
  const sessions = await query('SELECT COUNT(*) AS n FROM sessions WHERE user_id = ?', [victim.id]);
  assert.equal(sessions[0].n, 0);

  const attempt = await login(app, victim.email, victim.password);
  assert.equal(attempt.res.statusCode, 403);
  assert.equal(attempt.res.json().code, 'ACCOUNT_DISABLED');

  const listed = (await admin.api('GET', '/api/admin/users')).json().users.find((u) => u.id === victim.id);
  assert.equal(listed.disabled, true);

  // re-enable
  await admin.api('PATCH', `/api/admin/users/${victim.id}`, { disabled: false });
  assert.equal((await login(app, victim.email, victim.password)).res.statusCode, 200);
});

test('admin cannot disable, demote or delete themselves', async () => {
  assert.equal((await admin.api('PATCH', `/api/admin/users/${admin.id}`, { disabled: true })).statusCode, 400);
  assert.equal((await admin.api('PATCH', `/api/admin/users/${admin.id}`, { role: 'user' })).statusCode, 400);
  assert.equal((await admin.api('DELETE', `/api/admin/users/${admin.id}`)).statusCode, 400);
  assert.equal((await admin.api('GET', '/api/admin/overview')).statusCode, 200);
});

test('admin can promote a user, mark email verified, and delete a user (cascading)', async () => {
  const target = await registerUser(app, { displayName: 'Target', verify: false });
  assert.equal((await target.api('GET', '/api/characters')).statusCode, 403);

  const verified = await admin.api('PATCH', `/api/admin/users/${target.id}`, { emailVerified: true });
  assert.equal(verified.statusCode, 200);
  assert.equal((await target.api('GET', '/api/characters')).statusCode, 200);

  const badRole = await admin.api('PATCH', `/api/admin/users/${target.id}`, { role: 'superuser' });
  assert.equal(badRole.statusCode, 400);
  const promoted = await admin.api('PATCH', `/api/admin/users/${target.id}`, { role: 'admin' });
  assert.equal(promoted.statusCode, 200);
  assert.equal((await target.api('GET', '/api/admin/users')).statusCode, 200);

  const ch = makeCharacter();
  await target.api('PUT', `/api/characters/${ch.id}`, { character: ch });
  const del = await admin.api('DELETE', `/api/admin/users/${target.id}`);
  assert.equal(del.statusCode, 200);
  assert.equal((await query('SELECT COUNT(*) AS n FROM users WHERE id = ?', [target.id]))[0].n, 0);
  assert.equal((await query('SELECT COUNT(*) AS n FROM characters WHERE id = ?', [ch.id]))[0].n, 0);
  assert.equal((await target.api('GET', '/api/auth/me')).json().user, null);

  const missing = await admin.api('PATCH', `/api/admin/users/${target.id}`, { disabled: true });
  assert.equal(missing.statusCode, 404);
});

test('admin reset-password returns a working link when mail is not configured', async () => {
  const res = await admin.api('POST', `/api/admin/users/${user.id}/reset-password`);
  assert.equal(res.statusCode, 200);
  assert.equal(res.json().sent, false);
  const token = decodeURIComponent(/token=([^&\s]+)/.exec(res.json().url)[1]);
  const reset = await app.inject({ method: 'POST', url: '/api/auth/reset-password', payload: { token, password: 'reset by admin 123' } });
  assert.equal(reset.statusCode, 200);
  assert.equal((await login(app, user.email, 'reset by admin 123')).res.statusCode, 200);
  user.password = 'reset by admin 123';
});

test('admin creates a pre-verified user directly', async () => {
  const email = `direct-${uniq()}@example.test`;
  const res = await admin.api('POST', '/api/admin/users', { email, displayName: 'Direct' });
  assert.equal(res.statusCode, 200);
  const row = (await query('SELECT email, email_verified_at, password_hash FROM users WHERE id = ?', [res.json().id]))[0];
  assert.equal(row.email, email);
  assert.ok(row.email_verified_at);
  assert.equal(row.password_hash, null);
  const dupe = await admin.api('POST', '/api/admin/users', { email });
  assert.equal(dupe.statusCode, 400);
  // the invite table is untouched by direct creation
  assert.ok((await createInvite()).length);
});
