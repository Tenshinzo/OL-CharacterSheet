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

test('index.html is served uncached with content-hashed asset URLs', async () => {
  for (const url of ['/', '/index.html', '/some/deep/link']) {
    const res = await app.inject({ method: 'GET', url });
    assert.equal(res.statusCode, 200, url);
    assert.equal(res.headers['cache-control'], 'no-cache', url);
    assert.match(res.headers['content-type'], /^text\/html/, url);
    const versions = [...res.body.matchAll(/(?:href|src)="([^"]+\.(?:css|js))\?v=([0-9a-f]{12})"/g)];
    assert.ok(versions.length >= 8, `${url}: expected versioned local assets, got ${versions.length}`);
    assert.equal(new Set(versions.map((m) => m[2])).size, 1, 'one version for all assets');
    assert.ok(!/(?:href|src)="(?:styles\.css|script\.js)"/.test(res.body), 'unversioned local asset left');
    assert.ok(/src="https:\/\/cdnjs[^"]+\.js"/.test(res.body), 'CDN URLs untouched');
  }
});

test('versioned assets are still served from disk', async () => {
  const index = await app.inject({ method: 'GET', url: '/' });
  const [, href] = index.body.match(/href="(styles\.css\?v=[0-9a-f]+)"/);
  const res = await app.inject({ method: 'GET', url: `/${href}` });
  assert.equal(res.statusCode, 200);
  assert.match(res.headers['content-type'], /^text\/css/);
  assert.ok(res.headers.etag);
});
