/**
 * In-memory WebSocket hub. One process, so a Map is enough. Each socket is
 * tagged with its user id and a client-chosen clientId so the originating
 * tab can ignore its own echoes.
 */
export class Hub {
  constructor() {
    this.sockets = new Map(); // socket -> { userId, clientId }
    this.byUser = new Map();  // userId -> Set<socket>
  }

  add(socket, userId, clientId) {
    this.sockets.set(socket, { userId, clientId });
    if (!this.byUser.has(userId)) this.byUser.set(userId, new Set());
    this.byUser.get(userId).add(socket);
  }

  remove(socket) {
    const meta = this.sockets.get(socket);
    if (!meta) return;
    this.sockets.delete(socket);
    const set = this.byUser.get(meta.userId);
    if (set) { set.delete(socket); if (!set.size) this.byUser.delete(meta.userId); }
  }

  /** Send a message to every socket of the given users, except the origin client. */
  sendToUsers(userIds, message, { exceptClientId } = {}) {
    const payload = JSON.stringify(message);
    for (const uid of userIds) {
      for (const socket of this.byUser.get(uid) || []) {
        const meta = this.sockets.get(socket);
        if (exceptClientId && meta?.clientId === exceptClientId) continue;
        if (socket.readyState === 1) socket.send(payload);
      }
    }
  }

  closeUser(userId) {
    for (const socket of this.byUser.get(userId) || []) {
      try { socket.close(4001, 'session ended'); } catch { /* ignore */ }
    }
  }

  stats() {
    return { sockets: this.sockets.size, users: this.byUser.size };
  }
}

export const hub = new Hub();
