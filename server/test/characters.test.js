import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { setup, teardown, registerUser, makeCharacter, makeAlternateForm, query } from './helper.js';

let app;
let alice;
let bob;
before(async () => {
  app = await setup();
  alice = await registerUser(app, { displayName: 'Alice' });
  bob = await registerUser(app, { displayName: 'Bob' });
});
after(() => teardown(app));

test('GET /characters requires authentication', async () => {
  const res = await app.inject({ method: 'GET', url: '/api/characters' });
  assert.equal(res.statusCode, 401);
  assert.equal(res.json().code, 'UNAUTHENTICATED');
});

test('PUT creates (201) then updates (200) with incrementing version', async () => {
  const ch = makeCharacter();
  const created = await alice.api('PUT', `/api/characters/${ch.id}`, { character: ch });
  assert.equal(created.statusCode, 201, created.body);
  const e1 = created.json().character;
  assert.equal(e1.id, ch.id);
  assert.equal(e1.version, 1);
  assert.equal(e1.ownerId, alice.id);
  assert.equal(e1.ownerName, 'Alice');
  assert.deepEqual(e1.data, ch);

  const updated = await alice.api('PUT', `/api/characters/${ch.id}`, { character: { ...ch, name: 'Renamed', xp: 9 } });
  assert.equal(updated.statusCode, 200);
  const e2 = updated.json().character;
  assert.equal(e2.version, 2);
  assert.equal(e2.data.name, 'Renamed');
  assert.equal(e2.data.xp, 9);

  // bare body (without the `character` wrapper) is accepted too
  const bare = await alice.api('PUT', `/api/characters/${ch.id}`, { ...ch, xp: 12 });
  assert.equal(bare.statusCode, 200);
  assert.equal(bare.json().character.version, 3);

  const row = (await query('SELECT name, kind, version, primary_character_id FROM characters WHERE id = ?', [ch.id]))[0];
  assert.equal(row.kind, 'primary');
  assert.equal(row.version, 3);
  assert.equal(row.primary_character_id, null);
});

test('GET list returns own characters with access owner and an empty gmCharacters', async () => {
  const a = makeCharacter({ name: 'Listed A' });
  const b = makeCharacter({ name: 'Listed B' });
  await alice.api('PUT', `/api/characters/${a.id}`, { character: a });
  await alice.api('PUT', `/api/characters/${b.id}`, { character: b });
  const res = await alice.api('GET', '/api/characters');
  assert.equal(res.statusCode, 200);
  const body = res.json();
  const ids = body.characters.map((c) => c.id);
  assert.ok(ids.includes(a.id) && ids.includes(b.id));
  assert.ok(body.characters.every((c) => c.access === 'owner' && c.ownerId === alice.id));
  assert.deepEqual(body.gmCharacters, []);
});

test('GET /characters/:id returns the entry', async () => {
  const ch = makeCharacter();
  await alice.api('PUT', `/api/characters/${ch.id}`, { character: ch });
  const res = await alice.api('GET', `/api/characters/${ch.id}`);
  assert.equal(res.statusCode, 200);
  assert.equal(res.json().character.access, 'owner');
  assert.deepEqual(res.json().character.data, ch);

  const missing = await alice.api('GET', `/api/characters/does-not-exist`);
  assert.equal(missing.statusCode, 404);
});

test('batch upsert creates and updates in one call', async () => {
  const p = makeCharacter({ name: 'Batch Primary' });
  const f = makeAlternateForm(p.id);
  const res = await alice.api('POST', '/api/characters/batch', { characters: [p, f] });
  assert.equal(res.statusCode, 200, res.body);
  const list = res.json().characters;
  assert.equal(list.length, 2);
  const byId = Object.fromEntries(list.map((c) => [c.id, c]));
  assert.equal(byId[p.id].version, 1);
  assert.equal(byId[f.id].version, 1);
  assert.equal(byId[f.id].data.primaryCharacterId, p.id);

  const again = await alice.api('POST', '/api/characters/batch', { characters: [{ ...p, xp: 3 }, { ...f, xp: 3 }] });
  assert.equal(again.statusCode, 200);
  assert.ok(again.json().characters.every((c) => c.version === 2));

  const row = (await query('SELECT kind, primary_character_id FROM characters WHERE id = ?', [f.id]))[0];
  assert.equal(row.kind, 'alternate_form');
  assert.equal(row.primary_character_id, p.id);

  const empty = await alice.api('POST', '/api/characters/batch', { characters: [] });
  assert.equal(empty.statusCode, 400);
});

test('batch is all-or-nothing', async () => {
  const good = makeCharacter();
  const bad = { id: `bad-${good.id}`, name: '' };
  const res = await alice.api('POST', '/api/characters/batch', { characters: [good, bad] });
  assert.equal(res.statusCode, 400);
  const rows = await query('SELECT id FROM characters WHERE id IN (?)', [[good.id, bad.id]]);
  assert.equal(rows.length, 0);
});

test('PUT with mismatching id is 400 ID_MISMATCH', async () => {
  const ch = makeCharacter();
  const res = await alice.api('PUT', `/api/characters/other-id`, { character: ch });
  assert.equal(res.statusCode, 400);
  assert.equal(res.json().code, 'ID_MISMATCH');
});

test('PUT with invalid body is 400', async () => {
  const id = `inv-${Date.now()}`;
  let res = await alice.api('PUT', `/api/characters/${id}`, { character: { id, name: '' } });
  assert.equal(res.statusCode, 400);
  assert.equal(res.json().code, 'CHARACTER_INVALID');

  res = await alice.api('PUT', `/api/characters/${id}`, { character: { id } });
  assert.equal(res.statusCode, 400);

  res = await alice.api('PUT', `/api/characters/bad id!`, { character: { id: 'bad id!', name: 'x' } });
  assert.equal(res.statusCode, 400);
  assert.equal(res.json().code, 'ID_INVALID');

  // malformed JSON
  res = await app.inject({
    method: 'PUT', url: `/api/characters/${id}`,
    headers: { cookie: alice.cookie, 'content-type': 'application/json' },
    payload: '{"character": {',
  });
  assert.equal(res.statusCode, 400);
});

test('PUT with oversized character data is 400 CHARACTER_TOO_LARGE', async () => {
  const ch = makeCharacter({ notes: 'x'.repeat(1_100_000) });
  const res = await alice.api('PUT', `/api/characters/${ch.id}`, { character: ch });
  assert.equal(res.statusCode, 400);
  assert.equal(res.json().code, 'CHARACTER_TOO_LARGE');
  const rows = await query('SELECT id FROM characters WHERE id = ?', [ch.id]);
  assert.equal(rows.length, 0);
});

test('delete cascades to alternate forms', async () => {
  const p = makeCharacter();
  const f = makeAlternateForm(p.id);
  const f2 = makeAlternateForm(p.id, { name: 'Bear Form' });
  await alice.api('POST', '/api/characters/batch', { characters: [p, f, f2] });
  const other = makeCharacter({ name: 'Unrelated' });
  await alice.api('PUT', `/api/characters/${other.id}`, { character: other });

  const del = await alice.api('DELETE', `/api/characters/${p.id}`);
  assert.equal(del.statusCode, 200, del.body);
  assert.deepEqual(del.json().deleted.sort(), [p.id, f.id, f2.id].sort());

  for (const id of [p.id, f.id, f2.id]) {
    const res = await alice.api('GET', `/api/characters/${id}`);
    assert.equal(res.statusCode, 404, `${id} should be gone`);
  }
  const still = await alice.api('GET', `/api/characters/${other.id}`);
  assert.equal(still.statusCode, 200);

  const gone = await alice.api('DELETE', `/api/characters/${p.id}`);
  assert.equal(gone.statusCode, 404);
});

test('user B cannot read, edit or delete user A\'s character', async () => {
  const ch = makeCharacter({ name: 'Alice Only' });
  await alice.api('PUT', `/api/characters/${ch.id}`, { character: ch });

  const get = await bob.api('GET', `/api/characters/${ch.id}`);
  assert.equal(get.statusCode, 404);

  const put = await bob.api('PUT', `/api/characters/${ch.id}`, { character: { ...ch, name: 'Hijacked' } });
  assert.equal(put.statusCode, 403);

  const batch = await bob.api('POST', '/api/characters/batch', { characters: [{ ...ch, name: 'Hijacked' }] });
  assert.equal(batch.statusCode, 403);

  const del = await bob.api('DELETE', `/api/characters/${ch.id}`);
  assert.equal(del.statusCode, 404);

  // Bob cannot attach a form to Alice's primary either.
  const form = makeAlternateForm(ch.id);
  const attach = await bob.api('PUT', `/api/characters/${form.id}`, { character: form });
  assert.equal(attach.statusCode, 403);

  // Alice's data is untouched and not in Bob's list.
  const mine = await alice.api('GET', `/api/characters/${ch.id}`);
  assert.equal(mine.json().character.data.name, 'Alice Only');
  assert.equal(mine.json().character.version, 1);
  const bobList = await bob.api('GET', '/api/characters');
  assert.ok(!bobList.json().characters.some((c) => c.id === ch.id));
  assert.ok(!bobList.json().gmCharacters.some((c) => c.id === ch.id));
});
