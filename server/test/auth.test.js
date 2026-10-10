import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import {
  setup, teardown, query, createInvite, registerUser, login, authed, cookieFrom,
  lastMailTo, tokenFromMail, uniq, testOutbox,
} from './helper.js';

let app;
before(async () => { app = await setup(); });
after(() => teardown(app));

const PW = 'correct horse battery';

test('register requires an invite code', async () => {
  const res = await app.inject({
    method: 'POST', url: '/api/auth/register',
    payload: { email: `a-${uniq()}@example.test`, password: PW, displayName: 'No Invite' },
  });
  assert.equal(res.statusCode, 400);
  assert.equal(res.json().code, 'INVITE_REQUIRED');
});

test('register rejects an unknown invite code', async () => {
  const res = await app.inject({
    method: 'POST', url: '/api/auth/register',
    payload: { email: `b-${uniq()}@example.test`, password: PW, displayName: 'Bad Invite', inviteCode: 'NOPE1234' },
  });
  assert.equal(res.statusCode, 400);
  assert.equal(res.json().code, 'INVITE_INVALID');
  assert.equal(await query('SELECT COUNT(*) AS n FROM users').then((r) => r[0].n), 0);
});

test('register with a valid invite creates user, sets cookie, consumes invite, sends mail', async () => {
  const code = await createInvite();
  const email = `C-${uniq()}@Example.test`;
  const res = await app.inject({
    method: 'POST', url: '/api/auth/register',
    payload: { email, password: PW, displayName: 'Fresh User', inviteCode: code.toLowerCase() },
  });
  assert.equal(res.statusCode, 201, res.body);
  const { user } = res.json();
  assert.equal(user.email, email.toLowerCase(), 'email is normalised');
  assert.equal(user.emailVerified, false);
  assert.equal(user.role, 'user');
  assert.equal(user.hasPassword, true);
  assert.ok(cookieFrom(res), 'session cookie set');

  const invite = (await query('SELECT used_by, used_at FROM invites WHERE code = ?', [code]))[0];
  assert.equal(invite.used_by, user.id);
  assert.ok(invite.used_at);

  const mail = lastMailTo(email, /confirm/i);
  assert.ok(mail, 'verification mail in outbox');
  assert.ok(tokenFromMail(mail));

  // The same invite cannot be used again.
  const again = await app.inject({
    method: 'POST', url: '/api/auth/register',
    payload: { email: `d-${uniq()}@example.test`, password: PW, displayName: 'Second', inviteCode: code },
  });
  assert.equal(again.statusCode, 400);
  assert.equal(again.json().code, 'INVITE_INVALID');
});

test('register with an expired invite fails', async () => {
  const code = await createInvite({ expiresAt: new Date(Date.now() - 60_000) });
  const res = await app.inject({
    method: 'POST', url: '/api/auth/register',
    payload: { email: `e-${uniq()}@example.test`, password: PW, displayName: 'Late', inviteCode: code },
  });
  assert.equal(res.statusCode, 400);
  assert.equal(res.json().code, 'INVITE_INVALID');
});

test('register validates email, password and display name', async () => {
  const code = await createInvite();
  const base = { email: `f-${uniq()}@example.test`, password: PW, displayName: 'Valid Name', inviteCode: code };
  let res = await app.inject({ method: 'POST', url: '/api/auth/register', payload: { ...base, email: 'not-an-email' } });
  assert.equal(res.json().code, 'EMAIL_INVALID');
  res = await app.inject({ method: 'POST', url: '/api/auth/register', payload: { ...base, password: 'short' } });
  assert.equal(res.json().code, 'PASSWORD_WEAK');
  res = await app.inject({ method: 'POST', url: '/api/auth/register', payload: { ...base, displayName: 'x' } });
  assert.equal(res.json().code, 'NAME_INVALID');
  // Invite is still unused after failed attempts.
  assert.equal((await query('SELECT used_by FROM invites WHERE code = ?', [code]))[0].used_by, null);
});

test('duplicate email returns 409 EMAIL_TAKEN', async () => {
  const u = await registerUser(app, { verify: false });
  const code = await createInvite();
  const res = await app.inject({
    method: 'POST', url: '/api/auth/register',
    payload: { email: u.email.toUpperCase(), password: PW, displayName: 'Dupe', inviteCode: code },
  });
  assert.equal(res.statusCode, 409);
  assert.equal(res.json().code, 'EMAIL_TAKEN');
});

test('login with wrong password is 401, right password sets a cookie', async () => {
  const u = await registerUser(app);
  const bad = await login(app, u.email, 'definitely-wrong-pw');
  assert.equal(bad.res.statusCode, 401);
  assert.equal(bad.res.json().code, 'BAD_CREDENTIALS');
  assert.equal(bad.cookie, null);

  const unknown = await login(app, `nobody-${uniq()}@example.test`, PW);
  assert.equal(unknown.res.statusCode, 401);

  const good = await login(app, u.email, u.password);
  assert.equal(good.res.statusCode, 200);
  assert.ok(good.cookie);
  const me = await authed(app, good.cookie)('GET', '/api/auth/me');
  assert.equal(me.json().user.id, u.id);
});

test('GET /auth/me without cookie returns user null', async () => {
  const res = await app.inject({ method: 'GET', url: '/api/auth/me' });
  assert.equal(res.statusCode, 200);
  assert.equal(res.json().user, null);
  assert.equal(res.json().features.discord, false);
});

test('unverified user is blocked with 403 EMAIL_UNVERIFIED on protected routes', async () => {
  const u = await registerUser(app, { verify: false });
  const res = await u.api('GET', '/api/characters');
  assert.equal(res.statusCode, 403);
  assert.equal(res.json().code, 'EMAIL_UNVERIFIED');
  // but /auth/me still works and shows emailVerified: false
  const me = await u.api('GET', '/api/auth/me');
  assert.equal(me.statusCode, 200);
  assert.equal(me.json().user.emailVerified, false);
});

test('verify-email flow with token from mail unlocks protected routes', async () => {
  const u = await registerUser(app, { verify: false });
  const mail = lastMailTo(u.email, /confirm/i);
  const token = tokenFromMail(mail);
  assert.ok(token);

  const bad = await app.inject({ method: 'POST', url: '/api/auth/verify-email', payload: { token: 'garbage' } });
  assert.equal(bad.statusCode, 400);
  assert.equal(bad.json().code, 'TOKEN_INVALID');

  const ok = await app.inject({ method: 'POST', url: '/api/auth/verify-email', payload: { token } });
  assert.equal(ok.statusCode, 200);
  assert.deepEqual(ok.json(), { ok: true });

  const me = await u.api('GET', '/api/auth/me');
  assert.equal(me.json().user.emailVerified, true);
  const chars = await u.api('GET', '/api/characters');
  assert.equal(chars.statusCode, 200);

  // token is single-use
  const reuse = await app.inject({ method: 'POST', url: '/api/auth/verify-email', payload: { token } });
  assert.equal(reuse.statusCode, 400);
});

test('resend-verification issues a fresh token', async () => {
  const u = await registerUser(app, { verify: false });
  const first = tokenFromMail(lastMailTo(u.email, /confirm/i));
  const before = testOutbox.length;
  const res = await u.api('POST', '/api/auth/resend-verification');
  assert.equal(res.statusCode, 200);
  assert.equal(testOutbox.length, before + 1);
  const second = tokenFromMail(lastMailTo(u.email, /confirm/i));
  assert.notEqual(first, second);
  // the old token was replaced
  const old = await app.inject({ method: 'POST', url: '/api/auth/verify-email', payload: { token: first } });
  assert.equal(old.statusCode, 400);
  const fresh = await app.inject({ method: 'POST', url: '/api/auth/verify-email', payload: { token: second } });
  assert.equal(fresh.statusCode, 200);
});

test('forgot/reset password flow invalidates old sessions and accepts the new password', async () => {
  const u = await registerUser(app);
  const oldCookie = u.cookie;

  // Unknown emails are not revealed.
  const probe = await app.inject({ method: 'POST', url: '/api/auth/forgot-password', payload: { email: `ghost-${uniq()}@example.test` } });
  assert.equal(probe.statusCode, 200);
  assert.deepEqual(probe.json(), { ok: true });

  const forgot = await app.inject({ method: 'POST', url: '/api/auth/forgot-password', payload: { email: u.email } });
  assert.equal(forgot.statusCode, 200);
  const token = tokenFromMail(lastMailTo(u.email, /reset/i));
  assert.ok(token, 'reset token in mail');

  const weak = await app.inject({ method: 'POST', url: '/api/auth/reset-password', payload: { token, password: 'short' } });
  assert.equal(weak.statusCode, 400);
  assert.equal(weak.json().code, 'PASSWORD_WEAK');

  const newPw = 'brand new password 42';
  const reset = await app.inject({ method: 'POST', url: '/api/auth/reset-password', payload: { token, password: newPw } });
  assert.equal(reset.statusCode, 200, reset.body);
  const newCookie = cookieFrom(reset);
  assert.ok(newCookie);
  assert.notEqual(newCookie, oldCookie);

  // old session is gone
  const meOld = await authed(app, oldCookie)('GET', '/api/auth/me');
  assert.equal(meOld.json().user, null);
  // new session from the reset response works
  const meNew = await authed(app, newCookie)('GET', '/api/auth/me');
  assert.equal(meNew.json().user.id, u.id);

  // old password fails, new password works
  assert.equal((await login(app, u.email, u.password)).res.statusCode, 401);
  const good = await login(app, u.email, newPw);
  assert.equal(good.res.statusCode, 200);

  // reset token is single-use
  const again = await app.inject({ method: 'POST', url: '/api/auth/reset-password', payload: { token, password: newPw } });
  assert.equal(again.statusCode, 400);
  assert.equal(again.json().code, 'TOKEN_INVALID');
});

test('logout destroys the session', async () => {
  const u = await registerUser(app);
  const out = await u.api('POST', '/api/auth/logout');
  assert.equal(out.statusCode, 200);
  const me = await u.api('GET', '/api/auth/me');
  assert.equal(me.json().user, null);
});

test('change-password requires the current password', async () => {
  const u = await registerUser(app);
  const wrong = await u.api('POST', '/api/auth/change-password', { currentPassword: 'nope nope nope', newPassword: 'another long password' });
  assert.equal(wrong.statusCode, 401);
  const ok = await u.api('POST', '/api/auth/change-password', { currentPassword: u.password, newPassword: 'another long password' });
  assert.equal(ok.statusCode, 200);
  assert.equal((await login(app, u.email, 'another long password')).res.statusCode, 200);
});

test('PATCH /auth/profile updates the display name', async () => {
  const u = await registerUser(app);
  const res = await u.api('PATCH', '/api/auth/profile', { displayName: 'Renamed Hero' });
  assert.equal(res.statusCode, 200);
  assert.equal(res.json().user.displayName, 'Renamed Hero');
  const me = await u.api('GET', '/api/auth/me');
  assert.equal(me.json().user.displayName, 'Renamed Hero');
});
