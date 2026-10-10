/**
 * OLAdminUI – administration page (overview, invites, users) for the
 * Open Legend Character Sheet cloud backend.
 *
 * Plain browser script, loaded after api.js and script.js. Exposes
 * window.OLAdminUI with:
 *   mount()                create #adminPage inside #cloudPages (idempotent)
 *   show(route, params)    render the page and make it visible
 *   refresh()              reload the data of the active tab
 *   relativeTime(date)     '3 days ago' style helper (also used by tests)
 *
 * All server calls go through window.OLCloud.admin. Every user-provided
 * string is escaped with OLCloud.escapeHtml before being put in innerHTML.
 */
(function () {
  'use strict';

  const PAGE_ID = 'adminPage';
  const ROUTE = 'admin';
  const TABS = [
    { id: 'overview', label: 'Overview', icon: 'fa-gauge' },
    { id: 'invites', label: 'Invites', icon: 'fa-ticket' },
    { id: 'users', label: 'Users', icon: 'fa-users' },
  ];

  const state = {
    tab: 'overview',
    overview: null,
    invites: null,
    users: null,
    showUsed: false,
    search: '',
    newCodes: null,       // { codes: [], registerUrl }
    resetLink: null,      // { userId, url }
    busy: new Set(),      // keys of in-flight actions
    loading: {},          // tab -> bool
    error: {},            // tab -> message
  };

  // ---- helpers ------------------------------------------------------------

  function esc(value) {
    return window.OLCloud && typeof OLCloud.escapeHtml === 'function'
      ? OLCloud.escapeHtml(value)
      : String(value ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  }

  function notify(message, type) {
    if (window.app && typeof window.app.showNotification === 'function') {
      window.app.showNotification(message, type || 'info');
    } else if (type === 'error') {
      console.error('[OLAdminUI]', message);
    } else {
      console.log('[OLAdminUI]', message);
    }
  }

  function navigate(hash) {
    if (window.app && typeof window.app.navigate === 'function') window.app.navigate(hash);
    else location.hash = hash;
  }

  function currentUser() {
    return (window.app && window.app.currentUser) || null;
  }

  function isAdmin() {
    return currentUser()?.role === 'admin';
  }

  function toDate(value) {
    if (!value) return null;
    const d = value instanceof Date ? value : new Date(value);
    return Number.isNaN(d.getTime()) ? null : d;
  }

  function fullDate(value) {
    const d = toDate(value);
    if (!d) return '';
    try {
      return d.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
    } catch {
      return d.toISOString();
    }
  }

  /** '3 days ago', 'in 2 hours', 'just now'. */
  function relativeTime(value, now) {
    const d = toDate(value);
    if (!d) return '';
    const diff = (d.getTime() - (now ?? Date.now())) / 1000;
    const abs = Math.abs(diff);
    const future = diff > 0;
    const units = [
      ['year', 31536000], ['month', 2592000], ['week', 604800],
      ['day', 86400], ['hour', 3600], ['minute', 60],
    ];
    if (abs < 45) return future ? 'in a moment' : 'just now';
    for (const [name, secs] of units) {
      if (abs >= secs) {
        const n = Math.round(abs / secs);
        const label = n + ' ' + name + (n === 1 ? '' : 's');
        return future ? 'in ' + label : label + ' ago';
      }
    }
    return future ? 'in a moment' : 'just now';
  }

  /** <time> element with relative text and full date in the title. */
  function timeHtml(value, emptyText) {
    const d = toDate(value);
    if (!d) return '<span class="adm-muted">' + esc(emptyText || '—') + '</span>';
    return '<time datetime="' + esc(d.toISOString()) + '" title="' + esc(fullDate(d)) + '">' + esc(relativeTime(d)) + '</time>';
  }

  async function copyText(text) {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(text);
        return true;
      }
    } catch { /* fall through to legacy path */ }
    try {
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.setAttribute('readonly', '');
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      const ok = document.execCommand && document.execCommand('copy');
      document.body.removeChild(ta);
      return !!ok;
    } catch {
      return false;
    }
  }

  function errorMessage(err) {
    if (!err) return 'Unknown error';
    if (err.status === 401) return 'Your session has expired. Please log in again.';
    if (err.status === 403) return 'Admins only.';
    return err.message || String(err);
  }

  function busyKey(action, id) {
    return action + ':' + (id || '');
  }

  // ---- DOM access ---------------------------------------------------------

  function pageEl() {
    return document.getElementById(PAGE_ID);
  }

  function bodyEl() {
    return pageEl()?.querySelector('.adm-body') || null;
  }

  // ---- mount / show -------------------------------------------------------

  function mount() {
    if (pageEl()) return pageEl();
    const container = document.getElementById('cloudPages');
    if (!container) {
      console.warn('[OLAdminUI] #cloudPages not found; cannot mount');
      return null;
    }
    const page = document.createElement('div');
    page.id = PAGE_ID;
    page.className = 'cloud-page admin-page';
    page.style.display = 'none';
    page.innerHTML =
      '<div class="page-header adm-header">' +
        '<button type="button" class="btn btn-secondary adm-back" data-action="back">' +
          '<i class="fas fa-arrow-left"></i> Back to Overview' +
        '</button>' +
        '<h2><i class="fas fa-shield-halved"></i> Administration</h2>' +
        '<p class="text-secondary">Manage invites, users and see what is going on</p>' +
      '</div>' +
      '<div class="adm-body"></div>';
    container.appendChild(page);
    page.addEventListener('click', onClick);
    page.addEventListener('submit', onSubmit);
    page.addEventListener('input', onInput);
    page.addEventListener('change', onChange);
    return page;
  }

  function show(route, params) {
    const page = mount();
    if (!page) return;
    params = params || {};
    if (params.tab && TABS.some((t) => t.id === params.tab)) state.tab = params.tab;
    render();
    if (window.app && typeof window.app.showPage === 'function') window.app.showPage(PAGE_ID);
    else page.style.display = '';
    if (isAdmin()) loadTab(state.tab);
  }

  function refresh() {
    if (isAdmin()) loadTab(state.tab, true);
  }

  // ---- data loading -------------------------------------------------------

  async function loadTab(tab, force) {
    if (!window.OLCloud || !OLCloud.admin) {
      state.error[tab] = 'Cloud API not available';
      render();
      return;
    }
    const cached = tab === 'overview' ? state.overview : tab === 'invites' ? state.invites : state.users;
    if (cached && !force) {
      // Still refresh in the background so numbers are fresh, but do not flash the UI.
      fetchTab(tab).catch(() => { /* already shown via state.error */ });
      return;
    }
    state.loading[tab] = true;
    state.error[tab] = null;
    render();
    try {
      await fetchTab(tab);
    } finally {
      state.loading[tab] = false;
      render();
    }
  }

  async function fetchTab(tab) {
    try {
      if (tab === 'overview') {
        state.overview = await OLCloud.admin.overview();
      } else if (tab === 'invites') {
        const res = await OLCloud.admin.invites();
        state.invites = Array.isArray(res?.invites) ? res.invites : [];
      } else if (tab === 'users') {
        const res = await OLCloud.admin.users();
        state.users = Array.isArray(res?.users) ? res.users : [];
      }
      state.error[tab] = null;
    } catch (err) {
      state.error[tab] = errorMessage(err);
      throw err;
    } finally {
      if (state.tab === tab) render();
    }
  }

  // ---- rendering ----------------------------------------------------------

  function render() {
    const body = bodyEl();
    if (!body) return;
    if (!isAdmin()) {
      body.innerHTML =
        '<div class="empty-state adm-denied">' +
          '<i class="fas fa-lock"></i>' +
          '<h3 class="mb-sm">Admins only</h3>' +
          '<p class="text-secondary mb-lg">This area is restricted to administrators.</p>' +
          '<a href="#/" class="btn btn-primary"><i class="fas fa-arrow-left"></i> Back to Overview</a>' +
        '</div>';
      return;
    }
    let html = renderTabs();
    html += '<div class="adm-panel" role="tabpanel">';
    if (state.tab === 'overview') html += renderOverview();
    else if (state.tab === 'invites') html += renderInvites();
    else html += renderUsers();
    html += '</div>';

    // Preserve focus/caret in the search box across re-renders.
    const active = document.activeElement;
    const keepSearch = active && active.id === 'admUserSearch' ? { start: active.selectionStart, end: active.selectionEnd } : null;
    body.innerHTML = html;
    if (keepSearch) {
      const input = document.getElementById('admUserSearch');
      if (input) {
        input.focus();
        try { input.setSelectionRange(keepSearch.start, keepSearch.end); } catch { /* ignore */ }
      }
    }
  }

  function renderTabs() {
    return '<div class="adm-tabs" role="tablist">' +
      TABS.map((t) =>
        '<button type="button" role="tab" class="adm-tab' + (state.tab === t.id ? ' active' : '') + '" ' +
          'aria-selected="' + (state.tab === t.id) + '" data-action="tab" data-tab="' + t.id + '">' +
          '<i class="fas ' + t.icon + '"></i> <span>' + t.label + '</span>' +
        '</button>').join('') +
      '<button type="button" class="adm-tab adm-tab-refresh" data-action="refresh" title="Reload"' +
        (state.loading[state.tab] ? ' disabled' : '') + '>' +
        '<i class="fas fa-rotate' + (state.loading[state.tab] ? ' fa-spin' : '') + '"></i>' +
      '</button>' +
    '</div>';
  }

  function renderStatus(tab) {
    if (state.error[tab]) {
      return '<div class="adm-alert adm-alert-error"><i class="fas fa-triangle-exclamation"></i> ' + esc(state.error[tab]) +
        ' <button type="button" class="btn btn-small btn-secondary" data-action="refresh">Retry</button></div>';
    }
    if (state.loading[tab]) {
      return '<div class="adm-loading"><i class="fas fa-spinner fa-spin"></i> Loading…</div>';
    }
    return '';
  }

  // Overview -----------------------------------------------------------------

  function renderOverview() {
    const o = state.overview;
    let html = renderStatus('overview');
    if (!o && !state.loading.overview) return html || '<div class="empty-state"><i class="fas fa-gauge"></i><p>No data</p></div>';
    const tiles = [
      { label: 'Users', value: o?.users, icon: 'fa-users', tab: 'users' },
      { label: 'Characters', value: o?.characters, icon: 'fa-scroll' },
      { label: 'Groups', value: o?.groups, icon: 'fa-people-group' },
      { label: 'Open invites', value: o?.openInvites, icon: 'fa-ticket', tab: 'invites' },
      { label: 'Live connections', value: o?.live?.sockets, sub: o?.live?.users != null ? o.live.users + ' user' + (o.live.users === 1 ? '' : 's') + ' online' : null, icon: 'fa-tower-broadcast', live: true },
    ];
    html += '<div class="adm-tiles">' + tiles.map((t) => {
      const tag = t.tab ? 'button' : 'div';
      const attrs = t.tab ? ' type="button" data-action="tab" data-tab="' + t.tab + '"' : '';
      return '<' + tag + ' class="adm-tile' + (t.tab ? ' adm-tile-link' : '') + (t.live ? ' adm-tile-live' : '') + '"' + attrs + '>' +
        '<i class="fas ' + t.icon + '"></i>' +
        '<div class="adm-tile-value">' + (t.value == null ? '<span class="adm-muted">–</span>' : esc(t.value)) + '</div>' +
        '<div class="adm-tile-label">' + esc(t.label) + '</div>' +
        (t.sub ? '<div class="adm-tile-sub">' + esc(t.sub) + '</div>' : '') +
      '</' + tag + '>';
    }).join('') + '</div>';
    return html;
  }

  // Invites ------------------------------------------------------------------

  function renderInvites() {
    let html = renderStatus('invites');
    const busy = state.busy.has(busyKey('createInvites'));
    html +=
      '<form class="adm-card adm-form" id="admInviteForm" autocomplete="off">' +
        '<h3><i class="fas fa-plus"></i> Generate invite codes</h3>' +
        '<div class="adm-form-row">' +
          '<div class="form-group adm-field-sm"><label for="admInviteCount">Count</label>' +
            '<input type="number" id="admInviteCount" name="count" min="1" max="20" value="1" required></div>' +
          '<div class="form-group"><label for="admInviteNote">Note <span class="adm-muted">(optional)</span></label>' +
            '<input type="text" id="admInviteNote" name="note" maxlength="255" placeholder="e.g. Tuesday group"></div>' +
          '<div class="form-group adm-field-sm"><label for="admInviteDays">Expires in days</label>' +
            '<input type="number" id="admInviteDays" name="expiresInDays" min="0" max="3650" value="14" required>' +
            '<small>0 = never</small></div>' +
        '</div>' +
        '<div class="adm-form-actions">' +
          '<button type="submit" class="btn btn-primary"' + (busy ? ' disabled' : '') + '>' +
            '<i class="fas ' + (busy ? 'fa-spinner fa-spin' : 'fa-wand-magic-sparkles') + '"></i> Generate</button>' +
        '</div>' +
      '</form>';

    if (state.newCodes && state.newCodes.codes.length) {
      const base = state.newCodes.registerUrl || '';
      html +=
        '<div class="adm-card adm-newcodes">' +
          '<div class="adm-card-head">' +
            '<h3><i class="fas fa-check-circle"></i> New invite links</h3>' +
            '<div class="adm-inline-actions">' +
              '<button type="button" class="btn btn-small btn-secondary" data-action="copy-all"><i class="fas fa-copy"></i> Copy all</button>' +
              '<button type="button" class="btn btn-small btn-secondary" data-action="dismiss-codes" title="Hide"><i class="fas fa-xmark"></i></button>' +
            '</div>' +
          '</div>' +
          '<p class="text-secondary">Share one link per person. Codes stay listed below until used.</p>' +
          '<ul class="adm-codelist">' +
          state.newCodes.codes.map((code) => {
            const link = base + encodeURIComponent(code);
            return '<li>' +
              '<code class="adm-code">' + esc(code) + '</code>' +
              '<input type="text" class="adm-link" readonly value="' + esc(link) + '" aria-label="Invite link">' +
              '<button type="button" class="btn btn-small btn-primary" data-action="copy" data-text="' + esc(link) + '"><i class="fas fa-link"></i> Copy link</button>' +
            '</li>';
          }).join('') +
          '</ul>' +
        '</div>';
    }

    const invites = state.invites || [];
    const openCount = invites.filter((i) => !i.usedAt).length;
    const shown = state.showUsed ? invites : invites.filter((i) => !i.usedAt);
    html +=
      '<div class="adm-card">' +
        '<div class="adm-card-head">' +
          '<h3><i class="fas fa-ticket"></i> Invites <span class="adm-count">' + esc(openCount) + ' open</span></h3>' +
          '<label class="adm-toggle"><input type="checkbox" id="admShowUsed"' + (state.showUsed ? ' checked' : '') + '> Show used</label>' +
        '</div>';
    if (!state.invites && state.loading.invites) {
      html += '';
    } else if (!shown.length) {
      html += '<div class="empty-state"><i class="fas fa-ticket"></i><p>' +
        (invites.length ? 'No open invites. Enable "Show used" to see redeemed ones.' : 'No invites yet. Generate some above.') + '</p></div>';
    } else {
      html += '<div class="adm-table adm-table-invites" role="table">' +
        '<div class="adm-tr adm-thead" role="row">' +
          '<div class="adm-th">Code</div><div class="adm-th">Note</div><div class="adm-th">Created by</div>' +
          '<div class="adm-th">Created</div><div class="adm-th">Expires</div><div class="adm-th">Status</div><div class="adm-th"></div>' +
        '</div>' +
        shown.map(renderInviteRow).join('') +
      '</div>';
    }
    html += '</div>';
    return html;
  }

  function inviteStatus(inv) {
    if (inv.usedAt) {
      return { cls: 'used', html: 'Used by <strong>' + esc(inv.usedBy || 'unknown') + '</strong> ' + timeHtml(inv.usedAt) };
    }
    const exp = toDate(inv.expiresAt);
    if (exp && exp.getTime() < Date.now()) return { cls: 'expired', html: 'Expired' };
    return { cls: 'open', html: 'Open' };
  }

  function renderInviteRow(inv) {
    const status = inviteStatus(inv);
    const link = (state.newCodes?.registerUrl || defaultRegisterUrl()) + encodeURIComponent(inv.code);
    const deleting = state.busy.has(busyKey('deleteInvite', inv.code));
    return '<div class="adm-tr adm-status-' + status.cls + '" role="row">' +
      '<div class="adm-td" data-label="Code"><code class="adm-code">' + esc(inv.code) + '</code></div>' +
      '<div class="adm-td" data-label="Note">' + (inv.note ? esc(inv.note) : '<span class="adm-muted">—</span>') + '</div>' +
      '<div class="adm-td" data-label="Created by">' + esc(inv.createdBy || '—') + '</div>' +
      '<div class="adm-td" data-label="Created">' + timeHtml(inv.createdAt) + '</div>' +
      '<div class="adm-td" data-label="Expires">' + timeHtml(inv.expiresAt, 'never') + '</div>' +
      '<div class="adm-td" data-label="Status"><span class="adm-badge adm-badge-' + status.cls + '">' + status.html + '</span></div>' +
      '<div class="adm-td adm-td-actions">' +
        (!inv.usedAt
          ? '<button type="button" class="btn btn-small btn-secondary" data-action="copy" data-text="' + esc(link) + '" title="Copy invite link"><i class="fas fa-link"></i></button>' +
            '<button type="button" class="btn btn-small btn-danger" data-action="delete-invite" data-code="' + esc(inv.code) + '" title="Delete invite"' + (deleting ? ' disabled' : '') + '>' +
              '<i class="fas ' + (deleting ? 'fa-spinner fa-spin' : 'fa-trash') + '"></i></button>'
          : '') +
      '</div>' +
    '</div>';
  }

  function defaultRegisterUrl() {
    return location.origin + location.pathname.replace(/[^/]*$/, '') + '#/register?invite=';
  }

  // Users --------------------------------------------------------------------

  function renderUsers() {
    let html = renderStatus('users');
    const me = currentUser();
    const users = state.users || [];
    const q = state.search.trim().toLowerCase();
    const shown = q
      ? users.filter((u) => (u.email || '').toLowerCase().includes(q) || (u.displayName || '').toLowerCase().includes(q) || (u.discordUsername || '').toLowerCase().includes(q))
      : users;

    const creating = state.busy.has(busyKey('createUser'));
    html +=
      '<form class="adm-card adm-form" id="admCreateUserForm" autocomplete="off">' +
        '<h3><i class="fas fa-user-plus"></i> Create user</h3>' +
        '<div class="adm-form-row">' +
          '<div class="form-group"><label for="admNewEmail">Email</label>' +
            '<input type="email" id="admNewEmail" name="email" required maxlength="255" placeholder="player@example.com"></div>' +
          '<div class="form-group"><label for="admNewName">Display name</label>' +
            '<input type="text" id="admNewName" name="displayName" maxlength="100" placeholder="defaults to the email name"></div>' +
        '</div>' +
        '<p class="adm-hint"><i class="fas fa-circle-info"></i> The account is created pre-verified without a password. ' +
          'The user sets one via <strong>Forgot password</strong> on the login page, or you click <em>Send password reset</em> below.</p>' +
        '<div class="adm-form-actions">' +
          '<button type="submit" class="btn btn-primary"' + (creating ? ' disabled' : '') + '>' +
            '<i class="fas ' + (creating ? 'fa-spinner fa-spin' : 'fa-user-plus') + '"></i> Create user</button>' +
        '</div>' +
      '</form>';

    if (state.resetLink) {
      const u = users.find((x) => x.id === state.resetLink.userId);
      html +=
        '<div class="adm-card adm-newcodes">' +
          '<div class="adm-card-head">' +
            '<h3><i class="fas fa-key"></i> Password reset link' + (u ? ' for ' + esc(u.email) : '') + '</h3>' +
            '<button type="button" class="btn btn-small btn-secondary" data-action="dismiss-reset" title="Hide"><i class="fas fa-xmark"></i></button>' +
          '</div>' +
          '<p class="text-secondary">Mail is not configured on the server, so the link was not sent. Pass it on manually; it is valid for 24 hours.</p>' +
          '<div class="adm-codelist"><div class="adm-codelist-row">' +
            '<input type="text" class="adm-link" readonly value="' + esc(state.resetLink.url) + '" aria-label="Reset link">' +
            '<button type="button" class="btn btn-small btn-primary" data-action="copy" data-text="' + esc(state.resetLink.url) + '"><i class="fas fa-link"></i> Copy link</button>' +
          '</div></div>' +
        '</div>';
    }

    html +=
      '<div class="adm-card">' +
        '<div class="adm-card-head">' +
          '<h3><i class="fas fa-users"></i> Users <span class="adm-count">' + esc(shown.length) + (q ? ' / ' + esc(users.length) : '') + '</span></h3>' +
          '<div class="adm-search">' +
            '<i class="fas fa-magnifying-glass"></i>' +
            '<input type="search" id="admUserSearch" placeholder="Search email or name" value="' + esc(state.search) + '" aria-label="Search users">' +
          '</div>' +
        '</div>';
    if (!state.users && state.loading.users) {
      html += '';
    } else if (!shown.length) {
      html += '<div class="empty-state"><i class="fas fa-user-slash"></i><p>' + (q ? 'No users match your search.' : 'No users yet.') + '</p></div>';
    } else {
      html += '<div class="adm-table adm-table-users" role="table">' +
        '<div class="adm-tr adm-thead" role="row">' +
          '<div class="adm-th">User</div><div class="adm-th">Role</div><div class="adm-th">Discord</div>' +
          '<div class="adm-th adm-num">Chars</div><div class="adm-th">Created</div><div class="adm-th">Last seen</div>' +
          '<div class="adm-th">Status</div><div class="adm-th">Actions</div>' +
        '</div>' +
        shown.map((u) => renderUserRow(u, me)).join('') +
      '</div>';
    }
    html += '</div>';
    return html;
  }

  function renderUserRow(u, me) {
    const self = me && u.id === me.id;
    const b = (action) => state.busy.has(busyKey(action, u.id));
    const anyBusy = ['updateUser', 'deleteUser', 'resetPassword'].some(b);
    const dis = (cond) => (cond ? ' disabled' : '');
    const spin = (action, icon) => '<i class="fas ' + (b(action) ? 'fa-spinner fa-spin' : icon) + '"></i>';

    return '<div class="adm-tr adm-user' + (u.disabled ? ' adm-user-disabled' : '') + (self ? ' adm-user-self' : '') + '" role="row" data-user-id="' + esc(u.id) + '">' +
      '<div class="adm-td adm-td-user" data-label="User">' +
        '<div class="adm-user-name">' + esc(u.displayName || '(no name)') + (self ? ' <span class="adm-badge adm-badge-self">you</span>' : '') + '</div>' +
        '<div class="adm-user-email">' + esc(u.email) + ' ' +
          (u.emailVerified
            ? '<span class="adm-badge adm-badge-ok" title="Email verified"><i class="fas fa-circle-check"></i> verified</span>'
            : '<span class="adm-badge adm-badge-warn" title="Email not verified">unverified</span> ' +
              '<button type="button" class="btn btn-small btn-secondary adm-btn-inline" data-action="verify-user" data-id="' + esc(u.id) + '"' + dis(anyBusy) + '>' +
                spin('updateUser', 'fa-check') + ' Mark verified</button>') +
        '</div>' +
      '</div>' +
      '<div class="adm-td" data-label="Role">' +
        (self
          ? '<span class="adm-badge adm-badge-role-' + esc(u.role) + '">' + esc(u.role) + '</span>'
          : '<select class="adm-role-select" data-action="role" data-id="' + esc(u.id) + '" aria-label="Role"' + dis(anyBusy) + '>' +
              '<option value="user"' + (u.role === 'user' ? ' selected' : '') + '>user</option>' +
              '<option value="admin"' + (u.role === 'admin' ? ' selected' : '') + '>admin</option>' +
            '</select>') +
      '</div>' +
      '<div class="adm-td" data-label="Discord">' + (u.discordUsername ? '<i class="fab fa-discord"></i> ' + esc(u.discordUsername) : '<span class="adm-muted">—</span>') + '</div>' +
      '<div class="adm-td adm-num" data-label="Characters">' + esc(u.characterCount ?? 0) + '</div>' +
      '<div class="adm-td" data-label="Created">' + timeHtml(u.createdAt) + '</div>' +
      '<div class="adm-td" data-label="Last seen">' + timeHtml(u.lastSeenAt, 'never') + '</div>' +
      '<div class="adm-td" data-label="Status"><span class="adm-badge ' + (u.disabled ? 'adm-badge-expired' : 'adm-badge-open') + '">' + (u.disabled ? 'disabled' : 'active') + '</span></div>' +
      '<div class="adm-td adm-td-actions" data-label="Actions">' +
        (!self
          ? '<button type="button" class="btn btn-small ' + (u.disabled ? 'btn-success' : 'btn-warning') + '" data-action="toggle-disabled" data-id="' + esc(u.id) + '" data-disabled="' + (u.disabled ? '1' : '0') + '" title="' + (u.disabled ? 'Enable account' : 'Disable account and end all sessions') + '"' + dis(anyBusy) + '>' +
              spin('updateUser', u.disabled ? 'fa-user-check' : 'fa-user-slash') + ' ' + (u.disabled ? 'Enable' : 'Disable') + '</button>'
          : '') +
        '<button type="button" class="btn btn-small btn-secondary" data-action="reset-password" data-id="' + esc(u.id) + '" title="Send password reset"' + dis(anyBusy) + '>' +
          spin('resetPassword', 'fa-key') + ' <span class="adm-btn-text">Send password reset</span></button>' +
        (!self
          ? '<button type="button" class="btn btn-small btn-danger" data-action="delete-user" data-id="' + esc(u.id) + '" title="Delete user and all their data"' + dis(anyBusy) + '>' +
              spin('deleteUser', 'fa-trash') + ' <span class="adm-btn-text">Delete</span></button>'
          : '') +
      '</div>' +
    '</div>';
  }

  // ---- event handling -----------------------------------------------------

  function onClick(ev) {
    const target = ev.target instanceof Element ? ev.target.closest('[data-action]') : null;
    if (!target || target.tagName === 'SELECT') return;
    const action = target.getAttribute('data-action');
    switch (action) {
      case 'back':
        ev.preventDefault();
        navigate('#/');
        break;
      case 'tab':
        ev.preventDefault();
        switchTab(target.getAttribute('data-tab'));
        break;
      case 'refresh':
        ev.preventDefault();
        refresh();
        break;
      case 'copy':
        ev.preventDefault();
        copyText(target.getAttribute('data-text') || '').then((ok) =>
          notify(ok ? 'Link copied to clipboard' : 'Could not copy – please select and copy manually', ok ? 'success' : 'warning'));
        break;
      case 'copy-all':
        ev.preventDefault();
        if (state.newCodes) {
          const text = state.newCodes.codes.map((c) => state.newCodes.registerUrl + encodeURIComponent(c)).join('\n');
          copyText(text).then((ok) => notify(ok ? 'All links copied' : 'Could not copy – please copy manually', ok ? 'success' : 'warning'));
        }
        break;
      case 'dismiss-codes':
        state.newCodes = null;
        render();
        break;
      case 'dismiss-reset':
        state.resetLink = null;
        render();
        break;
      case 'delete-invite':
        ev.preventDefault();
        deleteInvite(target.getAttribute('data-code'));
        break;
      case 'verify-user':
        ev.preventDefault();
        updateUser(target.getAttribute('data-id'), { emailVerified: true }, 'Email marked as verified');
        break;
      case 'toggle-disabled': {
        ev.preventDefault();
        const id = target.getAttribute('data-id');
        const nowDisabled = target.getAttribute('data-disabled') === '1';
        const u = findUser(id);
        if (!nowDisabled && !window.confirm('Disable ' + (u?.email || 'this user') + '?\n\nThey will be logged out everywhere and cannot log in until re-enabled.')) return;
        updateUser(id, { disabled: !nowDisabled }, nowDisabled ? 'Account enabled' : 'Account disabled');
        break;
      }
      case 'reset-password':
        ev.preventDefault();
        resetPassword(target.getAttribute('data-id'));
        break;
      case 'delete-user':
        ev.preventDefault();
        deleteUser(target.getAttribute('data-id'));
        break;
      default:
        break;
    }
  }

  function onSubmit(ev) {
    const form = ev.target;
    if (!(form instanceof HTMLFormElement)) return;
    if (form.id === 'admInviteForm') {
      ev.preventDefault();
      createInvites(form);
    } else if (form.id === 'admCreateUserForm') {
      ev.preventDefault();
      createUser(form);
    }
  }

  function onInput(ev) {
    const t = ev.target;
    if (t && t.id === 'admUserSearch') {
      state.search = t.value || '';
      render();
    }
  }

  function onChange(ev) {
    const t = ev.target;
    if (!t) return;
    if (t.id === 'admShowUsed') {
      state.showUsed = !!t.checked;
      render();
    } else if (t.getAttribute && t.getAttribute('data-action') === 'role') {
      const id = t.getAttribute('data-id');
      const role = t.value;
      const u = findUser(id);
      if (!u || u.role === role) return;
      if (role === 'admin' && !window.confirm('Make ' + (u.email || 'this user') + ' an administrator?\n\nAdmins can manage every user, invite and character.')) {
        t.value = u.role;
        return;
      }
      updateUser(id, { role }, 'Role changed to ' + role).then((ok) => { if (!ok) render(); });
    }
  }

  function switchTab(tab) {
    if (!TABS.some((t) => t.id === tab)) return;
    state.tab = tab;
    render();
    // Keep the URL shareable without triggering a full re-route.
    try {
      const hash = '#/' + ROUTE + (tab === 'overview' ? '' : '?tab=' + tab);
      if (location.hash !== hash) history.replaceState(null, '', hash);
    } catch { /* ignore */ }
    loadTab(tab);
  }

  function findUser(id) {
    return (state.users || []).find((u) => u.id === id) || null;
  }

  // ---- actions ------------------------------------------------------------

  async function withBusy(key, fn) {
    if (state.busy.has(key)) return undefined;
    state.busy.add(key);
    render();
    try {
      return await fn();
    } finally {
      state.busy.delete(key);
      render();
    }
  }

  async function createInvites(form) {
    const count = Math.min(20, Math.max(1, parseInt(form.elements.count?.value, 10) || 1));
    const note = (form.elements.note?.value || '').trim();
    const days = Math.max(0, parseInt(form.elements.expiresInDays?.value, 10) || 0);
    await withBusy(busyKey('createInvites'), async () => {
      try {
        const res = await OLCloud.admin.createInvites(count, note, days);
        state.newCodes = { codes: Array.isArray(res?.codes) ? res.codes : [], registerUrl: res?.registerUrl || defaultRegisterUrl() };
        notify(state.newCodes.codes.length + ' invite code' + (state.newCodes.codes.length === 1 ? '' : 's') + ' generated', 'success');
        await fetchTab('invites').catch(() => {});
        if (state.overview) fetchTab('overview').catch(() => {});
      } catch (err) {
        notify(errorMessage(err), 'error');
      }
    });
  }

  async function deleteInvite(code) {
    if (!code) return;
    if (!window.confirm('Delete invite ' + code + '? The link will stop working.')) return;
    await withBusy(busyKey('deleteInvite', code), async () => {
      try {
        await OLCloud.admin.deleteInvite(code);
        if (state.newCodes) {
          state.newCodes.codes = state.newCodes.codes.filter((c) => c !== code);
          if (!state.newCodes.codes.length) state.newCodes = null;
        }
        notify('Invite deleted', 'success');
        await fetchTab('invites').catch(() => {});
        if (state.overview) fetchTab('overview').catch(() => {});
      } catch (err) {
        notify(errorMessage(err), 'error');
      }
    });
  }

  async function createUser(form) {
    const email = (form.elements.email?.value || '').trim();
    const displayName = (form.elements.displayName?.value || '').trim();
    if (!email) return;
    await withBusy(busyKey('createUser'), async () => {
      try {
        await OLCloud.admin.createUser(email, displayName || undefined);
        notify('User ' + email + ' created. They can set a password via "Forgot password".', 'success');
        form.reset();
        state.search = '';
        await fetchTab('users').catch(() => {});
        if (state.overview) fetchTab('overview').catch(() => {});
      } catch (err) {
        notify(errorMessage(err), 'error');
      }
    });
  }

  /** Resolves to true on success, false on failure (error already shown). */
  function updateUser(id, patch, successMessage) {
    if (!id) return Promise.resolve(false);
    return withBusy(busyKey('updateUser', id), async () => {
      try {
        await OLCloud.admin.updateUser(id, patch);
        const u = findUser(id);
        if (u) {
          if (patch.disabled !== undefined) u.disabled = !!patch.disabled;
          if (patch.role !== undefined) u.role = patch.role;
          if (patch.emailVerified === true) u.emailVerified = true;
        }
        notify(successMessage || 'User updated', 'success');
        fetchTab('users').catch(() => {});
        return true;
      } catch (err) {
        notify(errorMessage(err), 'error');
        return false;
      }
    });
  }

  async function resetPassword(id) {
    const u = findUser(id);
    if (!id) return;
    if (!window.confirm('Send a password reset to ' + (u?.email || 'this user') + '?')) return;
    await withBusy(busyKey('resetPassword', id), async () => {
      try {
        const res = await OLCloud.admin.resetPassword(id);
        if (res?.sent) {
          state.resetLink = null;
          notify('Password reset email sent to ' + (u?.email || 'the user'), 'success');
        } else if (res?.url) {
          state.resetLink = { userId: id, url: res.url };
          notify('Mail is not configured – copy the reset link shown above the user list', 'warning');
        } else {
          notify('Reset requested', 'info');
        }
      } catch (err) {
        notify(errorMessage(err), 'error');
      }
    });
  }

  async function deleteUser(id) {
    const u = findUser(id);
    if (!id || !u) return;
    const me = currentUser();
    if (me && me.id === id) { notify('You cannot delete yourself', 'error'); return; }
    if (!window.confirm('Delete ' + u.email + '?\n\nThis permanently removes the account, all ' + (u.characterCount ?? 0) + ' character(s), their groups and data. This cannot be undone.')) return;
    const typed = window.prompt('To confirm, type the user\'s email address:\n' + u.email);
    if (typed === null) return;
    if (typed.trim().toLowerCase() !== String(u.email).trim().toLowerCase()) {
      notify('Email did not match – nothing was deleted', 'warning');
      return;
    }
    await withBusy(busyKey('deleteUser', id), async () => {
      try {
        await OLCloud.admin.deleteUser(id);
        state.users = (state.users || []).filter((x) => x.id !== id);
        if (state.resetLink?.userId === id) state.resetLink = null;
        notify('User ' + u.email + ' deleted', 'success');
        fetchTab('users').catch(() => {});
        if (state.overview) fetchTab('overview').catch(() => {});
      } catch (err) {
        notify(errorMessage(err), 'error');
      }
    });
  }

  // ---- export -------------------------------------------------------------

  window.OLAdminUI = {
    pageId: PAGE_ID,
    routes: [ROUTE],
    mount,
    show,
    refresh,
    relativeTime,
    formatDate: fullDate,
  };
})();
