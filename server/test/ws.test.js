import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { setup, teardown, registerUser, makeCharacter, makeAlternateForm, setRole } from './helper.js';

// `ws` is a transitive dependency of @fastify/websocket; skip gracefully if
// it is ever hoisted away. (Node's global WebSocket cannot send a cookie.)
let WebSocketImpl = null;
try { WebSocketImpl = (await import('ws')).default; } catch { /* not installed */ }

let app;
let baseUrl;
let gm;
let player;
let outsider;
before(async () => {
  app = await setup();
  gm = await registerUser(app, { displayName: 'GM' });
  player = await registerUser(app, { displayName: 'Player' });
  outsider = await registerUser(app, { displayName: 'Outsider' });
  await app.listen({ port: 0, host: '127.0.0.1' });
  const addr = app.server.address();
  baseUrl = `ws://127.0.0.1:${addr.port}`;
});
after(() => teardown(app));

const skip = WebSocketImpl ? false : 'ws package not available';

function connect(cookie, clientId) {
  const url = `${baseUrl}/api/ws${clientId ? `?clientId=${encodeURIComponent(clientId)}` : ''}`;
  const socket = new WebSocketImpl(url, { headers: cookie ? { cookie } : {} });
  const queue = [];
  const waiters = [];
  socket.on('message', (raw) => {
    const msg = JSON.parse(raw.toString());
    const w = waiters.shift();
    if (w) w.resolve(msg); else queue.push(msg);
  });
  const closed = new Promise((resolve) => socket.on('close', (code, reason) => resolve({ code, reason: reason.toString() })));
  const opened = new Promise((resolve, reject) => { socket.once('open', resolve); socket.once('error', reject); });
  return {
    socket,
    closed,
    opened,
    next(timeoutMs = 2000) {
      if (queue.length) return Promise.resolve(queue.shift());
      return new Promise((resolve, reject) => {
        const t = setTimeout(() => {
          const i = waiters.indexOf(w);
          if (i >= 0) waiters.splice(i, 1);
          reject(new Error('timed out waiting for ws message'));
        }, timeoutMs);
        const w = { resolve: (m) => { clearTimeout(t); resolve(m); } };
        waiters.push(w);
      });
    },
    async expectSilence(ms = 300) {
      await new Promise((r) => setTimeout(r, ms));
      assert.deepEqual(queue, [], 'expected no ws messages');
    },
    send(obj) { socket.send(JSON.stringify(obj)); },
    close() { socket.close(1000); return closed; },
  };
}

test('unauthenticated socket is closed with 4401', { skip }, async () => {
  const c = connect(null);
  const { code, reason } = await c.closed;
  assert.equal(code, 4401);
  assert.equal(reason, 'unauthenticated');
});

test('authenticated socket gets hello and answers ping with pong', { skip }, async () => {
  const c = connect(player.cookie, 'tab-1');
  await c.opened;
  const hello = await c.next();
  assert.deepEqual(hello, { type: 'hello', userId: player.id });
  c.send({ type: 'ping' });
  assert.deepEqual(await c.next(), { type: 'pong' });
  c.send('not json');
  c.send({ type: 'unknown' });
  await c.expectSilence();
  await c.close();
});

test('character changes are pushed to the owner except the originating client', { skip }, async () => {
  const same = connect(player.cookie, 'tab-same');
  const otherTab = connect(player.cookie, 'tab-other');
  const stranger = connect(outsider.cookie, 'tab-stranger');
  await Promise.all([same.opened, otherTab.opened, stranger.opened]);
  await Promise.all([same.next(), otherTab.next(), stranger.next()]); // hellos

  const ch = makeCharacter({ name: 'Live Hero' });
  const res = await player.api('PUT', `/api/characters/${ch.id}`, { character: ch }, { 'x-client-id': 'tab-same' });
  assert.equal(res.statusCode, 201);

  const msg = await otherTab.next();
  assert.equal(msg.type, 'character.created');
  assert.equal(msg.id, ch.id);
  assert.equal(msg.by, player.id);
  assert.equal(msg.character.data.name, 'Live Hero');
  assert.equal(msg.character.version, 1);
  await same.expectSilence();
  await stranger.expectSilence();

  const upd = await player.api('PUT', `/api/characters/${ch.id}`, { character: { ...ch, xp: 3 } }, { 'x-client-id': 'tab-same' });
  assert.equal(upd.statusCode, 200);
  const updated = await otherTab.next();
  assert.equal(updated.type, 'character.updated');
  assert.equal(updated.character.version, 2);
  await same.expectSilence();

  // Without x-client-id every socket of the owner gets it.
  await player.api('PUT', `/api/characters/${ch.id}`, { character: { ...ch, xp: 4 } });
  assert.equal((await same.next()).type, 'character.updated');
  assert.equal((await otherTab.next()).type, 'character.updated');

  const del = await player.api('DELETE', `/api/characters/${ch.id}`, undefined, { 'x-client-id': 'tab-same' });
  assert.equal(del.statusCode, 200);
  const deleted = await otherTab.next();
  assert.equal(deleted.type, 'character.deleted');
  assert.deepEqual(deleted.ids, [ch.id]);
  await same.expectSilence();
  await stranger.expectSilence();

  await Promise.all([same.close(), otherTab.close(), stranger.close()]);
});

test('GM receives group events and live updates for assigned characters', { skip }, async () => {
  const gmSock = connect(gm.cookie, 'gm-tab');
  const playerSock = connect(player.cookie, 'player-tab');
  await Promise.all([gmSock.opened, playerSock.opened]);
  await Promise.all([gmSock.next(), playerSock.next()]);

  const group = (await gm.api('POST', '/api/groups', { name: 'Live Group' })).json().group;
  const join = await player.api('POST', '/api/groups/join', { inviteCode: group.inviteCode });
  assert.equal(join.statusCode, 200);
  assert.deepEqual(await gmSock.next(), { type: 'group.updated', groupId: group.id });
  assert.deepEqual(await playerSock.next(), { type: 'group.updated', groupId: group.id });

  const primary = makeCharacter({ name: 'Legolas' });
  const form = makeAlternateForm(primary.id);
  await player.api('POST', '/api/characters/batch', { characters: [primary, form] }, { 'x-client-id': 'player-tab' });
  await gmSock.expectSilence(); // not yet assigned

  const assign = await player.api('POST', `/api/groups/${group.id}/characters`, { characterId: primary.id });
  assert.equal(assign.statusCode, 200);
  const gmMsgs = [await gmSock.next(), await gmSock.next()].map((m) => m.type).sort();
  assert.deepEqual(gmMsgs, ['characters.refresh', 'group.updated']);
  assert.equal((await playerSock.next()).type, 'group.updated');

  // Player edits the form -> GM is notified, player tab that sent it is not.
  const upd = await player.api('PUT', `/api/characters/${form.id}`, { character: { ...form, xp: 2 } }, { 'x-client-id': 'player-tab' });
  assert.equal(upd.statusCode, 200);
  const toGm = await gmSock.next();
  assert.equal(toGm.type, 'character.updated');
  assert.equal(toGm.id, form.id);
  assert.equal(toGm.by, player.id);
  await playerSock.expectSilence();

  // GM edits the primary -> player is notified.
  const gmEdit = await gm.api('PUT', `/api/characters/${primary.id}`, { character: { ...primary, xp: 5 } }, { 'x-client-id': 'gm-tab' });
  assert.equal(gmEdit.statusCode, 200);
  const toPlayer = await playerSock.next();
  assert.equal(toPlayer.type, 'character.updated');
  assert.equal(toPlayer.by, gm.id);
  assert.equal(toPlayer.character.data.xp, 5);
  await gmSock.expectSilence();

  // Player leaves -> both informed, GM gets a refresh.
  await player.api('DELETE', `/api/groups/${group.id}/members/${player.id}`);
  const afterLeave = [await gmSock.next(), await gmSock.next()].map((m) => m.type).sort();
  assert.deepEqual(afterLeave, ['characters.refresh', 'group.updated']);
  assert.equal((await playerSock.next()).type, 'group.updated');

  await Promise.all([gmSock.close(), playerSock.close()]);
});

test('hello with clientId re-tags the socket; disabled user socket is closed', { skip }, async () => {
  const victim = await registerUser(app, { displayName: 'Victim' });
  const sock = connect(victim.cookie);
  await sock.opened;
  await sock.next();
  sock.send({ type: 'hello', clientId: 'retagged' });
  const ch = makeCharacter();
  await victim.api('PUT', `/api/characters/${ch.id}`, { character: ch }, { 'x-client-id': 'retagged' });
  await sock.expectSilence();
  await victim.api('PUT', `/api/characters/${ch.id}`, { character: { ...ch, xp: 1 } }, { 'x-client-id': 'someone-else' });
  assert.equal((await sock.next()).type, 'character.updated');

  await setRole(gm.id, 'admin');
  const res = await gm.api('PATCH', `/api/admin/users/${victim.id}`, { disabled: true });
  assert.equal(res.statusCode, 200);
  const { code } = await sock.closed;
  assert.equal(code, 4001);

  const retry = connect(victim.cookie);
  assert.equal((await retry.closed).code, 4401);
});
