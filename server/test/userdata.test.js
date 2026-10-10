import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { setup, teardown, registerUser } from './helper.js';

let app;
let user;
let other;
before(async () => {
  app = await setup();
  user = await registerUser(app);
  other = await registerUser(app);
});
after(() => teardown(app));

test('GET /me/data returns empty defaults', async () => {
  const res = await user.api('GET', '/api/me/data');
  assert.equal(res.statusCode, 200);
  assert.deepEqual(res.json(), { settings: {}, customBoons: [], customBanes: [] });
});

test('PUT then GET round trip for all kinds, scoped per user', async () => {
  const settings = { theme: 'dark', diceRoller: true, nested: { a: [1, 2, 3] } };
  const customBoons = [{ name: 'Custom Boon', powerLevels: [1, 3], attributes: ['Alteration'] }];
  const customBanes = [{ name: 'Custom Bane', powerLevels: [2], attributes: ['Energy'] }];

  for (const [kind, data] of [['settings', settings], ['customBoons', customBoons], ['customBanes', customBanes]]) {
    const res = await user.api('PUT', `/api/me/data/${kind}`, { data });
    assert.equal(res.statusCode, 200, res.body);
    assert.deepEqual(res.json(), { ok: true });
  }
  const res = await user.api('GET', '/api/me/data');
  assert.deepEqual(res.json(), { settings, customBoons, customBanes });

  // overwrite replaces
  await user.api('PUT', '/api/me/data/settings', { data: { theme: 'light' } });
  assert.deepEqual((await user.api('GET', '/api/me/data')).json().settings, { theme: 'light' });

  // other user is unaffected
  assert.deepEqual((await other.api('GET', '/api/me/data')).json(), { settings: {}, customBoons: [], customBanes: [] });
});

test('PUT rejects unknown kinds, missing data and oversized payloads', async () => {
  assert.equal((await user.api('PUT', '/api/me/data/secrets', { data: {} })).statusCode, 400);
  assert.equal((await user.api('PUT', '/api/me/data/settings', {})).statusCode, 400);
  const big = await user.api('PUT', '/api/me/data/settings', { data: { blob: 'x'.repeat(2_100_000) } });
  assert.equal(big.statusCode, 400);
});

test('user data requires authentication', async () => {
  assert.equal((await app.inject({ method: 'GET', url: '/api/me/data' })).statusCode, 401);
  assert.equal((await app.inject({ method: 'PUT', url: '/api/me/data/settings', payload: { data: {} } })).statusCode, 401);
});
