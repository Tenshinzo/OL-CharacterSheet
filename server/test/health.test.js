import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { setup, teardown } from './helper.js';

let app;
before(async () => { app = await setup(); });
after(() => teardown(app));

test('GET /api/health reports ok in test env', async () => {
  const res = await app.inject({ method: 'GET', url: '/api/health' });
  assert.equal(res.statusCode, 200);
  assert.deepEqual(res.json(), { ok: true, env: 'test' });
  assert.equal(res.headers['x-content-type-options'], 'nosniff');
  assert.equal(res.headers['x-frame-options'], 'DENY');
});

test('unknown /api route returns JSON 404', async () => {
  const res = await app.inject({ method: 'GET', url: '/api/does-not-exist' });
  assert.equal(res.statusCode, 404);
  assert.equal(res.json().code, 'NOT_FOUND');
});
