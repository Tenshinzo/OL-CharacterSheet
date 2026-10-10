import { resolveSession } from '../lib/session.js';
import { hub } from '../lib/hub.js';
import { config } from '../config.js';

/**
 * WebSocket endpoint. Authenticates with the session cookie, then only pushes
 * server events (character.*, group.*, characters.refresh). Clients send
 * {type:'ping'} keepalives and {type:'hello', clientId}.
 */
export default async function wsRoutes(app) {
  app.get('/ws', { websocket: true }, async (socket, request) => {
    const token = request.cookies?.[config.session.cookieName];
    const user = await resolveSession(token);
    if (!user) { socket.close(4401, 'unauthenticated'); return; }
    let clientId = String(request.query?.clientId || '').slice(0, 64) || null;
    hub.add(socket, user.id, clientId);
    socket.send(JSON.stringify({ type: 'hello', userId: user.id }));

    socket.on('message', (raw) => {
      let msg;
      try { msg = JSON.parse(raw.toString()); } catch { return; }
      if (msg?.type === 'ping') socket.send(JSON.stringify({ type: 'pong' }));
      if (msg?.type === 'hello' && typeof msg.clientId === 'string') {
        clientId = msg.clientId.slice(0, 64);
        hub.remove(socket); hub.add(socket, user.id, clientId);
      }
    });
    socket.on('close', () => hub.remove(socket));
    socket.on('error', () => hub.remove(socket));
  });
}
