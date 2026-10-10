/**
 * OLCloud – REST + WebSocket client and outbound sync queue for the
 * Open Legend Character Sheet backend.
 *
 * Loaded before script.js. Exposes window.OLCloud with:
 *   api(method, path, body)     low-level JSON fetch (throws ApiError)
 *   auth / characters / userData / groups / admin   typed helpers
 *   ws                          live connection (connect, on, close)
 *   sync                        debounced outbound queue with status events
 *   escapeHtml(str)             helper for safe innerHTML templates
 */
(function () {
  'use strict';

  const CLIENT_ID = (() => {
    try {
      const existing = sessionStorage.getItem('olClientId');
      if (existing) return existing;
      const id = (crypto.randomUUID ? crypto.randomUUID() : String(Math.random()).slice(2));
      sessionStorage.setItem('olClientId', id);
      return id;
    } catch {
      return String(Math.random()).slice(2);
    }
  })();

  class ApiError extends Error {
    constructor(status, code, message) {
      super(message || `Request failed (${status})`);
      this.status = status;
      this.code = code || 'ERROR';
    }
  }

  async function api(method, path, body) {
    const opts = {
      method,
      credentials: 'same-origin',
      headers: { 'X-Client-Id': CLIENT_ID, Accept: 'application/json' },
    };
    if (body !== undefined) {
      opts.headers['Content-Type'] = 'application/json';
      opts.body = JSON.stringify(body);
    }
    let res;
    try {
      res = await fetch('/api' + path, opts);
    } catch (err) {
      throw new ApiError(0, 'NETWORK', 'Network error: ' + (err?.message || 'offline'));
    }
    let data = null;
    const text = await res.text();
    if (text) {
      try { data = JSON.parse(text); } catch { data = { error: text }; }
    }
    if (!res.ok) {
      throw new ApiError(res.status, data?.code, data?.error || res.statusText);
    }
    return data;
  }

  const auth = {
    me: () => api('GET', '/auth/me'),
    register: (payload) => api('POST', '/auth/register', payload),
    login: (email, password) => api('POST', '/auth/login', { email, password }),
    logout: () => api('POST', '/auth/logout'),
    verifyEmail: (token) => api('POST', '/auth/verify-email', { token }),
    resendVerification: () => api('POST', '/auth/resend-verification'),
    forgotPassword: (email) => api('POST', '/auth/forgot-password', { email }),
    resetPassword: (token, password) => api('POST', '/auth/reset-password', { token, password }),
    changePassword: (currentPassword, newPassword) => api('POST', '/auth/change-password', { currentPassword, newPassword }),
    updateProfile: (displayName) => api('PATCH', '/auth/profile', { displayName }),
    discordLoginUrl: (inviteCode) => '/api/auth/discord' + (inviteCode ? '?invite=' + encodeURIComponent(inviteCode) : ''),
  };

  const characters = {
    list: () => api('GET', '/characters'),
    get: (id) => api('GET', '/characters/' + encodeURIComponent(id)),
    put: (character) => api('PUT', '/characters/' + encodeURIComponent(character.id), { character }),
    batch: (list) => api('POST', '/characters/batch', { characters: list }),
    remove: (id) => api('DELETE', '/characters/' + encodeURIComponent(id)),
  };

  const userData = {
    get: () => api('GET', '/me/data'),
    put: (kind, data) => api('PUT', '/me/data/' + encodeURIComponent(kind), { data }),
  };

  const groups = {
    list: () => api('GET', '/groups'),
    create: (name) => api('POST', '/groups', { name }),
    get: (id) => api('GET', '/groups/' + encodeURIComponent(id)),
    rename: (id, name) => api('PATCH', '/groups/' + encodeURIComponent(id), { name }),
    regenerateCode: (id) => api('POST', '/groups/' + encodeURIComponent(id) + '/regenerate-code'),
    remove: (id) => api('DELETE', '/groups/' + encodeURIComponent(id)),
    join: (inviteCode) => api('POST', '/groups/join', { inviteCode }),
    removeMember: (groupId, userId) => api('DELETE', '/groups/' + encodeURIComponent(groupId) + '/members/' + encodeURIComponent(userId)),
    assignCharacter: (groupId, characterId) => api('POST', '/groups/' + encodeURIComponent(groupId) + '/characters', { characterId }),
    unassignCharacter: (groupId, characterId) => api('DELETE', '/groups/' + encodeURIComponent(groupId) + '/characters/' + encodeURIComponent(characterId)),
  };

  const admin = {
    overview: () => api('GET', '/admin/overview'),
    users: () => api('GET', '/admin/users'),
    updateUser: (id, patch) => api('PATCH', '/admin/users/' + encodeURIComponent(id), patch),
    deleteUser: (id) => api('DELETE', '/admin/users/' + encodeURIComponent(id)),
    resetPassword: (id) => api('POST', '/admin/users/' + encodeURIComponent(id) + '/reset-password'),
    createUser: (email, displayName) => api('POST', '/admin/users', { email, displayName }),
    invites: () => api('GET', '/admin/invites'),
    createInvites: (count, note, expiresInDays) => api('POST', '/admin/invites', { count, note, expiresInDays }),
    deleteInvite: (code) => api('DELETE', '/admin/invites/' + encodeURIComponent(code)),
  };

  // ---- tiny event emitter -------------------------------------------------
  function emitter() {
    const handlers = new Map();
    return {
      on(type, fn) {
        if (!handlers.has(type)) handlers.set(type, new Set());
        handlers.get(type).add(fn);
        return () => handlers.get(type)?.delete(fn);
      },
      emit(type, payload) {
        for (const fn of handlers.get(type) || []) {
          try { fn(payload); } catch (err) { console.error('[OLCloud] handler error', type, err); }
        }
        for (const fn of handlers.get('*') || []) {
          try { fn(type, payload); } catch (err) { console.error('[OLCloud] handler error', type, err); }
        }
      },
    };
  }

  // ---- WebSocket ----------------------------------------------------------
  const ws = (() => {
    const events = emitter();
    let socket = null;
    let wanted = false;
    let attempt = 0;
    let pingTimer = null;
    let reconnectTimer = null;

    function url() {
      const proto = location.protocol === 'https:' ? 'wss:' : 'ws:';
      return `${proto}//${location.host}/api/ws?clientId=${encodeURIComponent(CLIENT_ID)}`;
    }

    function connect() {
      wanted = true;
      if (socket && (socket.readyState === WebSocket.OPEN || socket.readyState === WebSocket.CONNECTING)) return;
      clearTimeout(reconnectTimer);
      try {
        socket = new WebSocket(url());
      } catch (err) {
        console.warn('[OLCloud] ws create failed', err);
        scheduleReconnect();
        return;
      }
      socket.addEventListener('open', () => {
        attempt = 0;
        events.emit('open');
        clearInterval(pingTimer);
        pingTimer = setInterval(() => {
          if (socket?.readyState === WebSocket.OPEN) socket.send(JSON.stringify({ type: 'ping' }));
        }, 25000);
      });
      socket.addEventListener('message', (ev) => {
        let msg;
        try { msg = JSON.parse(ev.data); } catch { return; }
        if (!msg || !msg.type || msg.type === 'pong') return;
        events.emit('message', msg);
        events.emit(msg.type, msg);
      });
      socket.addEventListener('close', (ev) => {
        clearInterval(pingTimer);
        events.emit('close', ev);
        if (ev.code === 4401) { wanted = false; events.emit('unauthenticated'); return; }
        if (wanted) scheduleReconnect();
      });
      socket.addEventListener('error', () => { /* close follows */ });
    }

    function scheduleReconnect() {
      clearTimeout(reconnectTimer);
      const delay = Math.min(30000, 1000 * Math.pow(2, attempt++)) + Math.random() * 500;
      reconnectTimer = setTimeout(connect, delay);
    }

    function close() {
      wanted = false;
      clearTimeout(reconnectTimer);
      clearInterval(pingTimer);
      if (socket) { try { socket.close(1000); } catch { /* ignore */ } }
      socket = null;
    }

    window.addEventListener('online', () => { if (wanted) { attempt = 0; connect(); } });
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible' && wanted && (!socket || socket.readyState !== WebSocket.OPEN)) { attempt = 0; connect(); }
    });

    return { connect, close, on: events.on, get connected() { return socket?.readyState === WebSocket.OPEN; } };
  })();

  // ---- outbound sync queue ------------------------------------------------
  /**
   * Coalesces writes per key and flushes them after a short debounce.
   * Status: 'idle' | 'saving' | 'saved' | 'offline' | 'error'
   */
  const sync = (() => {
    const events = emitter();
    const pending = new Map(); // key -> { kind, payload }
    let timer = null;
    let flushing = false;
    let status = 'idle';
    let retryDelay = 1000;
    let retryTimer = null;
    const DEBOUNCE_MS = 400;

    function setStatus(next, detail) {
      if (status === next && !detail) return;
      status = next;
      events.emit('status', { status, detail });
    }

    function schedule() {
      clearTimeout(timer);
      timer = setTimeout(flush, DEBOUNCE_MS);
    }

    function queueCharacter(character) {
      pending.delete('del:' + character.id);
      pending.set('char:' + character.id, { kind: 'character', payload: character });
      schedule();
    }
    function queueDelete(id) {
      pending.delete('char:' + id);
      pending.set('del:' + id, { kind: 'delete', payload: id });
      schedule();
    }
    function queueUserData(kind, data) {
      pending.set('data:' + kind, { kind: 'userData', payload: { kind, data } });
      schedule();
    }

    async function flush() {
      clearTimeout(timer);
      if (flushing || pending.size === 0) return;
      flushing = true;
      clearTimeout(retryTimer);
      const batch = new Map(pending);
      pending.clear();
      setStatus('saving');
      try {
        const chars = [...batch.values()].filter((e) => e.kind === 'character').map((e) => e.payload);
        if (chars.length === 1) await characters.put(chars[0]);
        else if (chars.length > 1) await characters.batch(chars);
        for (const e of batch.values()) {
          if (e.kind === 'delete') {
            try { await characters.remove(e.payload); } catch (err) { if (err.status !== 404) throw err; }
          }
          if (e.kind === 'userData') await userData.put(e.payload.kind, e.payload.data);
        }
        retryDelay = 1000;
        setStatus(pending.size ? 'saving' : 'saved');
        events.emit('flushed', { count: batch.size });
      } catch (err) {
        // Put everything back unless something newer superseded it.
        for (const [k, v] of batch) if (!pending.has(k)) pending.set(k, v);
        if (err.status === 401) {
          setStatus('error', err);
          events.emit('unauthenticated', err);
        } else if (err.status === 0) {
          setStatus('offline', err);
          retryTimer = setTimeout(flush, retryDelay);
          retryDelay = Math.min(30000, retryDelay * 2);
        } else if (err.status === 403 || err.status === 400 || err.status === 413) {
          // Permanent rejection: drop the offending items so we do not loop.
          for (const k of batch.keys()) pending.delete(k);
          setStatus('error', err);
          events.emit('rejected', err);
        } else {
          setStatus('error', err);
          retryTimer = setTimeout(flush, retryDelay);
          retryDelay = Math.min(30000, retryDelay * 2);
        }
      } finally {
        flushing = false;
        if (pending.size && !retryTimer) schedule();
      }
    }

    window.addEventListener('online', () => { retryDelay = 1000; flush(); });
    window.addEventListener('beforeunload', (ev) => {
      if (pending.size || flushing) {
        // Best effort: fire the remaining writes without waiting.
        flush();
        ev.preventDefault();
        ev.returnValue = '';
      }
    });

    return {
      queueCharacter, queueDelete, queueUserData, flush,
      on: events.on,
      get status() { return status; },
      get pendingCount() { return pending.size; },
    };
  })();

  function escapeHtml(value) {
    return String(value ?? '')
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  function newId() {
    return crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 10);
  }

  window.OLCloud = { clientId: CLIENT_ID, ApiError, api, auth, characters, userData, groups, admin, ws, sync, escapeHtml, newId };
})();
