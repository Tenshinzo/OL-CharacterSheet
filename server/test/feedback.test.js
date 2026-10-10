import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { registerUser, json, config, truncateAll, teardown } from './helper.js';
import { migrate } from '../src/db.js';
import { buildApp } from '../src/app.js';

let app;
const created = [];

before(async () => {
  config.github.token = 'test-token';
  config.github.repo = 'example/repo';
  app = await buildApp({
    logger: false,
    routeOpts: { feedback: { createIssue: async (issue) => { created.push(issue); return { number: 42, url: 'https://github.com/example/repo/issues/42' }; } } },
  });
  await migrate({ info() {} });
  await truncateAll();
  await app.ready();
});
after(async () => { await teardown(app); });

test('feedback status reports enabled', async () => {
  const res = await app.inject({ method: 'GET', url: '/api/feedback/status' });
  assert.equal(res.statusCode, 200);
  assert.deepEqual(json(res), { enabled: true, repo: 'example/repo' });
});

test('feedback requires auth', async () => {
  const res = await app.inject({ method: 'POST', url: '/api/feedback', payload: { type: 'bug', title: 'Something broke', description: 'Steps to reproduce here' } });
  assert.equal(res.statusCode, 401);
});

test('feedback validates input and creates a labelled issue', async () => {
  const u = await registerUser(app, { displayName: 'Reporter' });
  let res = await u.api('POST', '/api/feedback', { type: 'nope', title: 'Something broke', description: 'Steps to reproduce here' });
  assert.equal(res.statusCode, 400);
  res = await u.api('POST', '/api/feedback', { type: 'bug', title: 'x', description: 'Steps to reproduce here' });
  assert.equal(json(res).code, 'FEEDBACK_TITLE');
  res = await u.api('POST', '/api/feedback', { type: 'feature', title: 'Dark mode please', description: 'A dark theme would be nice.', context: { page: '#/', userAgent: 'TestBrowser/1.0' } });
  assert.equal(res.statusCode, 200, res.body);
  assert.equal(json(res).number, 42);
  const issue = created.at(-1);
  assert.equal(issue.title, '[Feature] Dark mode please');
  assert.deepEqual(issue.labels, ['enhancement', 'from-app']);
  assert.match(issue.body, /A dark theme would be nice\./);
  assert.match(issue.body, /Reported by:\*\* Reporter/);
  assert.match(issue.body, /TestBrowser\/1\.0/);
});

test('feedback returns 503 when not configured', async () => {
  config.github.token = '';
  const u = await registerUser(app);
  const res = await u.api('POST', '/api/feedback', { type: 'bug', title: 'Something broke', description: 'Steps to reproduce here' });
  assert.equal(res.statusCode, 503);
  config.github.token = 'test-token';
});
