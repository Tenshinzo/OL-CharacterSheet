import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { setup, teardown, registerUser, makeCharacter, makeAlternateForm, query } from './helper.js';

let app;
let gm;
let player;
let outsider;
before(async () => {
  app = await setup();
  gm = await registerUser(app, { displayName: 'Game Master' });
  player = await registerUser(app, { displayName: 'Player One' });
  outsider = await registerUser(app, { displayName: 'Outsider' });
});
after(() => teardown(app));

async function createGroup(user, name = 'The Fellowship') {
  const res = await user.api('POST', '/api/groups', { name });
  assert.equal(res.statusCode, 200, res.body);
  return res.json().group;
}

test('GM creates a group and receives an invite code', async () => {
  const group = await createGroup(gm);
  assert.ok(group.id);
  assert.equal(group.name, 'The Fellowship');
  assert.equal(group.gmId, gm.id);
  assert.equal(group.gmName, 'Game Master');
  assert.equal(group.role, 'gm');
  assert.match(group.inviteCode, /^[A-Z2-9]{8}$/);
  assert.deepEqual(group.members, []);
  assert.deepEqual(group.characters, []);

  const bad = await gm.api('POST', '/api/groups', { name: 'x' });
  assert.equal(bad.statusCode, 400);
});

test('join by code; member view has no inviteCode; GM cannot join own group', async () => {
  const group = await createGroup(gm);

  const self = await gm.api('POST', '/api/groups/join', { inviteCode: group.inviteCode });
  assert.equal(self.statusCode, 400);
  assert.equal(self.json().code, 'ALREADY_GM');

  const wrong = await player.api('POST', '/api/groups/join', { inviteCode: 'ZZZZZZZZ' });
  assert.equal(wrong.statusCode, 404);
  assert.equal(wrong.json().code, 'GROUP_CODE_INVALID');

  const join = await player.api('POST', '/api/groups/join', { inviteCode: group.inviteCode.toLowerCase() });
  assert.equal(join.statusCode, 200, join.body);
  const view = join.json().group;
  assert.equal(view.id, group.id);
  assert.equal(view.role, 'member');
  assert.equal('inviteCode' in view, false, 'member view must not expose the invite code');
  assert.ok(view.members.some((m) => m.id === player.id));

  // listing/get as member also hides the code; as GM shows it
  const list = await player.api('GET', '/api/groups');
  const mine = list.json().groups.find((g) => g.id === group.id);
  assert.ok(mine);
  assert.equal('inviteCode' in mine, false);
  const got = await player.api('GET', `/api/groups/${group.id}`);
  assert.equal(got.statusCode, 200);
  assert.equal('inviteCode' in got.json().group, false);
  const gmGot = await gm.api('GET', `/api/groups/${group.id}`);
  assert.equal(gmGot.json().group.inviteCode, group.inviteCode);

  // non-member cannot see it
  const nope = await outsider.api('GET', `/api/groups/${group.id}`);
  assert.equal(nope.statusCode, 404);
});

test('full group lifecycle: assign character, GM visibility and edit rights, leave', async () => {
  const group = await createGroup(gm, 'Campaign');
  await player.api('POST', '/api/groups/join', { inviteCode: group.inviteCode });

  const primary = makeCharacter({ name: 'Aragorn' });
  const form = makeAlternateForm(primary.id, { name: 'Ranger Form' });
  const unassigned = makeCharacter({ name: 'Private Char' });
  await player.api('POST', '/api/characters/batch', { characters: [primary, form, unassigned] });

  // Before assignment the GM sees nothing foreign.
  let gmList = await gm.api('GET', '/api/characters');
  assert.deepEqual(gmList.json().gmCharacters, []);
  assert.equal((await gm.api('GET', `/api/characters/${primary.id}`)).statusCode, 404);

  // Only primaries may be assigned, only own ones, only by members.
  const formAssign = await player.api('POST', `/api/groups/${group.id}/characters`, { characterId: form.id });
  assert.equal(formAssign.statusCode, 400);
  const outsiderChar = makeCharacter({ name: 'Outsider Char' });
  await outsider.api('PUT', `/api/characters/${outsiderChar.id}`, { character: outsiderChar });
  const outsiderAssign = await outsider.api('POST', `/api/groups/${group.id}/characters`, { characterId: outsiderChar.id });
  assert.equal(outsiderAssign.statusCode, 404);
  const notMine = await player.api('POST', `/api/groups/${group.id}/characters`, { characterId: outsiderChar.id });
  assert.equal(notMine.statusCode, 404);

  const assign = await player.api('POST', `/api/groups/${group.id}/characters`, { characterId: primary.id });
  assert.equal(assign.statusCode, 200, assign.body);
  assert.equal(assign.json().group.role, 'member');
  assert.deepEqual(
    assign.json().group.characters.map((c) => ({ id: c.id, ownerId: c.ownerId, kind: c.kind })),
    [{ id: primary.id, ownerId: player.id, kind: 'primary' }],
  );

  // GM now sees the primary AND its alternate form, but not the unassigned one.
  gmList = await gm.api('GET', '/api/characters');
  const gmIds = gmList.json().gmCharacters.map((c) => c.id).sort();
  assert.deepEqual(gmIds, [primary.id, form.id].sort());
  assert.ok(gmList.json().gmCharacters.every((c) => c.access === 'gm' && c.ownerId === player.id && c.ownerName === 'Player One'));
  assert.ok(!gmList.json().characters.some((c) => c.id === primary.id), 'not listed as own');

  const gmGet = await gm.api('GET', `/api/characters/${form.id}`);
  assert.equal(gmGet.statusCode, 200);
  assert.equal(gmGet.json().character.access, 'gm');
  assert.equal((await gm.api('GET', `/api/characters/${unassigned.id}`)).statusCode, 404);

  // GM can edit the character (and its form), ownership stays with the player.
  const gmPut = await gm.api('PUT', `/api/characters/${primary.id}`, { character: { ...primary, xp: 6 } });
  assert.equal(gmPut.statusCode, 200, gmPut.body);
  assert.equal(gmPut.json().character.version, 2);
  assert.equal(gmPut.json().character.ownerId, player.id);
  const gmPutForm = await gm.api('PUT', `/api/characters/${form.id}`, { character: { ...form, xp: 6 } });
  assert.equal(gmPutForm.statusCode, 200);
  const playerView = await player.api('GET', `/api/characters/${primary.id}`);
  assert.equal(playerView.json().character.data.xp, 6);
  assert.equal(playerView.json().character.access, 'owner');

  // GM may add a new form to the assigned character; the player owns it.
  const gmForm = makeAlternateForm(primary.id, { name: 'GM-added Form' });
  const gmCreate = await gm.api('PUT', `/api/characters/${gmForm.id}`, { character: gmForm });
  assert.equal(gmCreate.statusCode, 201, gmCreate.body);
  assert.equal(gmCreate.json().character.ownerId, player.id);

  // GM cannot delete.
  const gmDel = await gm.api('DELETE', `/api/characters/${primary.id}`);
  assert.equal(gmDel.statusCode, 403);
  const gmDelForm = await gm.api('DELETE', `/api/characters/${form.id}`);
  assert.equal(gmDelForm.statusCode, 403);
  assert.equal((await player.api('GET', `/api/characters/${primary.id}`)).statusCode, 200);

  // Non-member sees nothing.
  assert.equal((await outsider.api('GET', `/api/characters/${primary.id}`)).statusCode, 404);
  assert.equal((await outsider.api('GET', `/api/characters/${form.id}`)).statusCode, 404);
  const outsiderPut = await outsider.api('PUT', `/api/characters/${primary.id}`, { character: primary });
  assert.equal(outsiderPut.statusCode, 403);
  const outsiderList = await outsider.api('GET', '/api/characters');
  assert.deepEqual(outsiderList.json().gmCharacters, []);

  // Member cannot remove someone else, GM cannot be removed via member route.
  const kick = await player.api('DELETE', `/api/groups/${group.id}/members/${gm.id}`);
  assert.equal(kick.statusCode, 403);
  const stranger = await outsider.api('DELETE', `/api/groups/${group.id}/members/${player.id}`);
  assert.equal(stranger.statusCode, 404);

  // Member leaves -> GM no longer sees the characters.
  const leave = await player.api('DELETE', `/api/groups/${group.id}/members/${player.id}`);
  assert.equal(leave.statusCode, 200, leave.body);
  gmList = await gm.api('GET', '/api/characters');
  assert.deepEqual(gmList.json().gmCharacters, []);
  assert.equal((await gm.api('GET', `/api/characters/${primary.id}`)).statusCode, 404);
  const gmPutAfter = await gm.api('PUT', `/api/characters/${primary.id}`, { character: { ...primary, xp: 7 } });
  assert.equal(gmPutAfter.statusCode, 403);
  const groupAfter = await gm.api('GET', `/api/groups/${group.id}`);
  assert.deepEqual(groupAfter.json().group.members, []);
  assert.deepEqual(groupAfter.json().group.characters, []);
  assert.equal((await player.api('GET', `/api/groups/${group.id}`)).statusCode, 404);

  // The player's characters themselves survive.
  const rows = await query('SELECT id FROM characters WHERE owner_id = ?', [player.id]);
  assert.ok(rows.map((r) => r.id).includes(primary.id));
});

test('unassigning a character and GM removing a member', async () => {
  const group = await createGroup(gm, 'Short Lived');
  await player.api('POST', '/api/groups/join', { inviteCode: group.inviteCode });
  const ch = makeCharacter({ name: 'Boromir' });
  await player.api('PUT', `/api/characters/${ch.id}`, { character: ch });
  await player.api('POST', `/api/groups/${group.id}/characters`, { characterId: ch.id });
  assert.equal((await gm.api('GET', `/api/characters/${ch.id}`)).statusCode, 200);

  const un = await player.api('DELETE', `/api/groups/${group.id}/characters/${ch.id}`);
  assert.equal(un.statusCode, 200);
  assert.deepEqual(un.json().group.characters, []);
  assert.equal((await gm.api('GET', `/api/characters/${ch.id}`)).statusCode, 404);

  await player.api('POST', `/api/groups/${group.id}/characters`, { characterId: ch.id });
  const removed = await gm.api('DELETE', `/api/groups/${group.id}/members/${player.id}`);
  assert.equal(removed.statusCode, 200);
  assert.equal((await gm.api('GET', `/api/characters/${ch.id}`)).statusCode, 404);
  assert.equal((await player.api('GET', `/api/groups/${group.id}`)).statusCode, 404);
});

test('GM-only operations: rename, regenerate code, delete group', async () => {
  const group = await createGroup(gm, 'Renamable');
  await player.api('POST', '/api/groups/join', { inviteCode: group.inviteCode });

  assert.equal((await player.api('PATCH', `/api/groups/${group.id}`, { name: 'Nope' })).statusCode, 403);
  const renamed = await gm.api('PATCH', `/api/groups/${group.id}`, { name: 'Renamed Group' });
  assert.equal(renamed.statusCode, 200);
  assert.equal(renamed.json().group.name, 'Renamed Group');

  assert.equal((await player.api('POST', `/api/groups/${group.id}/regenerate-code`)).statusCode, 403);
  const regen = await gm.api('POST', `/api/groups/${group.id}/regenerate-code`);
  assert.equal(regen.statusCode, 200);
  assert.notEqual(regen.json().inviteCode, group.inviteCode);
  const oldCode = await outsider.api('POST', '/api/groups/join', { inviteCode: group.inviteCode });
  assert.equal(oldCode.statusCode, 404);
  const newCode = await outsider.api('POST', '/api/groups/join', { inviteCode: regen.json().inviteCode });
  assert.equal(newCode.statusCode, 200);

  assert.equal((await player.api('DELETE', `/api/groups/${group.id}`)).statusCode, 403);
  const del = await gm.api('DELETE', `/api/groups/${group.id}`);
  assert.equal(del.statusCode, 200);
  assert.equal((await gm.api('GET', `/api/groups/${group.id}`)).statusCode, 404);
  const members = await query('SELECT COUNT(*) AS n FROM group_members WHERE group_id = ?', [group.id]);
  assert.equal(members[0].n, 0);
});
