/**
 * OLGroupsUI – Groups pages (list + detail) for the Open Legend Character
 * Sheet cloud backend.
 *
 * Plain browser script. Depends on window.OLCloud (api.js) and the app hooks
 * documented in the integrator contract (window.app.showPage, navigate,
 * showNotification, currentUser, characters, openCharacter, refreshFromServer).
 *
 * Exposes window.OLGroupsUI:
 *   mount()                 create #groupsPage inside #cloudPages (idempotent)
 *   show(route, params)     route 'groups' (list) or 'group' with params.id
 *   refresh()               reload the currently shown view
 *   loadGroups()            Promise<Group[]> – fetches and caches the list
 *   getCachedGroups()       Group[] – last loaded list (may be empty)
 *
 * Routes: #/groups and #/group?id=<groupId>
 */
(function () {
  'use strict';

  const PAGE_ID = 'groupsPage';

  // ---- state ----------------------------------------------------------------
  let page = null;              // the page root element
  let mounted = false;
  let wsSubscribed = false;
  let cachedGroups = [];
  let view = null;              // 'list' | 'detail'
  let currentGroupId = null;
  let currentGroup = null;      // detail data
  let renaming = false;
  let busy = false;             // a mutating request is in flight
  let listLoading = false;
  let listError = null;
  let detailError = null;
  let loadSeq = 0;              // guards against stale async renders

  // ---- helpers --------------------------------------------------------------
  function esc(value) {
    if (window.OLCloud && typeof window.OLCloud.escapeHtml === 'function') return window.OLCloud.escapeHtml(value);
    return String(value ?? '')
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  function app() { return window.app || null; }
  function cloud() { return window.OLCloud || null; }
  function groupsApi() { return cloud()?.groups || null; }

  function currentUser() { return app()?.currentUser || null; }

  function notify(message, type) {
    const a = app();
    if (a && typeof a.showNotification === 'function') {
      try { a.showNotification(message, type || 'info'); return; } catch (err) { console.error('[OLGroupsUI] notify failed', err); }
    }
    console[type === 'error' ? 'error' : 'log']('[OLGroupsUI]', message);
  }

  function navigate(hash) {
    const a = app();
    if (a && typeof a.navigate === 'function') {
      try { a.navigate(hash); return; } catch (err) { console.error('[OLGroupsUI] navigate failed', err); }
    }
    location.hash = hash;
  }

  function errorMessage(err) {
    if (!err) return 'Unknown error';
    if (typeof err === 'string') return err;
    return err.message || 'Request failed';
  }

  function isPageVisible() {
    return !!page && page.style.display !== 'none' && !page.hidden;
  }

  function formatDate(value) {
    if (!value) return '';
    const d = new Date(value);
    if (isNaN(d.getTime())) return '';
    try { return d.toLocaleDateString(); } catch { return d.toISOString().slice(0, 10); }
  }

  async function copyText(text) {
    if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
      try { await navigator.clipboard.writeText(text); return true; } catch { /* fall through */ }
    }
    try {
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.setAttribute('readonly', '');
      ta.style.position = 'fixed';
      ta.style.top = '-1000px';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.focus();
      ta.select();
      const ok = document.execCommand && document.execCommand('copy');
      document.body.removeChild(ta);
      return !!ok;
    } catch {
      return false;
    }
  }

  function joinUrl() {
    try { return location.origin + location.pathname + '#/groups'; } catch { return '#/groups'; }
  }

  function joinHint(group) {
    return `Join my Open Legend group "${group.name}": open ${joinUrl()} and enter the invite code ${group.inviteCode}`;
  }

  /** Own characters that can be added to the group: primaries not yet assigned. */
  function assignableCharacters(group) {
    const a = app();
    const own = Array.isArray(a?.characters) ? a.characters : [];
    const me = currentUser();
    const assigned = new Set((group?.characters || []).map((c) => String(c.id)));
    return own.filter((c) => c && c.id != null && !c.isAlternateForm && !c.isCompanion && !assigned.has(String(c.id))
      && (!me || !c.ownerId || c.ownerId === me.id));
  }

  // ---- data -----------------------------------------------------------------
  async function loadGroups() {
    const g = groupsApi();
    if (!g) throw new Error('OLCloud is not available');
    const res = await g.list();
    cachedGroups = Array.isArray(res?.groups) ? res.groups : [];
    return cachedGroups;
  }

  function getCachedGroups() { return cachedGroups; }

  function cacheGroup(group) {
    if (!group || group.id == null) return;
    const idx = cachedGroups.findIndex((g) => g.id === group.id);
    if (idx >= 0) cachedGroups[idx] = group; else cachedGroups.push(group);
  }

  function uncacheGroup(id) {
    cachedGroups = cachedGroups.filter((g) => g.id !== id);
  }

  async function loadGroup(id) {
    const g = groupsApi();
    if (!g) throw new Error('OLCloud is not available');
    const res = await g.get(id);
    const group = res?.group || null;
    if (group) cacheGroup(group);
    return group;
  }

  function refreshApp() {
    const a = app();
    if (a && typeof a.refreshFromServer === 'function') {
      try { const p = a.refreshFromServer(); if (p && typeof p.catch === 'function') p.catch((e) => console.warn('[OLGroupsUI] refreshFromServer failed', e)); }
      catch (err) { console.warn('[OLGroupsUI] refreshFromServer failed', err); }
    }
  }

  // ---- rendering: shared ----------------------------------------------------
  function renderHeader(title, backHash, backLabel, subtitle, extraHtml) {
    return `
      <div class="page-header groups-header">
        <button type="button" class="btn btn-secondary groups-back" data-action="back" data-hash="${esc(backHash)}">
          <i class="fas fa-arrow-left"></i> ${esc(backLabel)}
        </button>
        ${extraHtml || `<h2>${esc(title)}</h2>`}
        ${subtitle ? `<p class="text-secondary">${esc(subtitle)}</p>` : ''}
      </div>`;
  }

  function renderLoading(text) {
    return `<div class="groups-loading"><i class="fas fa-spinner fa-spin"></i> ${esc(text || 'Loading...')}</div>`;
  }

  function renderError(message, retryAction) {
    return `
      <div class="groups-error" role="alert">
        <i class="fas fa-exclamation-triangle"></i>
        <span>${esc(message)}</span>
        ${retryAction ? `<button type="button" class="btn btn-secondary btn-small" data-action="${esc(retryAction)}"><i class="fas fa-rotate-right"></i> Retry</button>` : ''}
      </div>`;
  }

  // ---- rendering: list view -------------------------------------------------
  function renderList() {
    const groups = cachedGroups;
    let listHtml;
    if (listLoading && !groups.length) {
      listHtml = renderLoading('Loading your groups...');
    } else if (listError && !groups.length) {
      listHtml = renderError(listError, 'reload-list');
    } else if (!groups.length) {
      listHtml = `
        <div class="empty-state groups-empty">
          <i class="fas fa-people-group"></i>
          <h3 class="mb-sm">No Groups Yet</h3>
          <p class="text-secondary">Create a group to run a campaign as GM, or join one with an invite code from your GM.</p>
        </div>`;
    } else {
      listHtml = `<div class="groups-grid">${groups.map(renderGroupCard).join('')}</div>`;
    }

    return `
      ${renderHeader('Groups', '#/', 'Back to Overview', 'Share your characters with your GM, or run a campaign for your players')}
      <div class="groups-actions">
        <form class="groups-action-card" data-form="create" novalidate>
          <h3><i class="fas fa-crown"></i> Create a group</h3>
          <p class="text-secondary">You become the GM and can open every character your players assign.</p>
          <div class="form-group">
            <label for="groupsCreateName">Group name</label>
            <input type="text" id="groupsCreateName" name="name" maxlength="100" minlength="2" autocomplete="off" placeholder="e.g. Thursday Night Heroes" required ${busy ? 'disabled' : ''}>
          </div>
          <button type="submit" class="btn btn-primary" ${busy ? 'disabled' : ''}><i class="fas fa-plus"></i> Create group</button>
        </form>
        <form class="groups-action-card" data-form="join" novalidate>
          <h3><i class="fas fa-right-to-bracket"></i> Join a group</h3>
          <p class="text-secondary">Enter the 8-character invite code your GM shared with you.</p>
          <div class="form-group">
            <label for="groupsJoinCode">Invite code</label>
            <input type="text" id="groupsJoinCode" name="code" class="groups-code-input" maxlength="8" autocomplete="off" autocapitalize="characters" spellcheck="false" placeholder="ABCD1234" required ${busy ? 'disabled' : ''}>
          </div>
          <button type="submit" class="btn btn-primary" ${busy ? 'disabled' : ''}><i class="fas fa-user-plus"></i> Join group</button>
        </form>
      </div>
      <div class="groups-list-section">
        <h3 class="groups-section-title"><i class="fas fa-layer-group"></i> Your groups ${listLoading && groups.length ? '<i class="fas fa-spinner fa-spin groups-inline-spinner"></i>' : ''}</h3>
        ${listError && groups.length ? renderError(listError, 'reload-list') : ''}
        ${listHtml}
      </div>`;
  }

  function renderGroupCard(g) {
    const isGm = g.role === 'gm';
    const members = Array.isArray(g.members) ? g.members.length : 0;
    const chars = Array.isArray(g.characters) ? g.characters.length : 0;
    return `
      <a class="groups-card" href="#/group?id=${encodeURIComponent(g.id)}" data-action="open-group" data-id="${esc(g.id)}">
        <div class="groups-card-top">
          <h3 class="groups-card-name">${esc(g.name)}</h3>
          <span class="groups-badge ${isGm ? 'groups-badge-gm' : 'groups-badge-player'}">${isGm ? 'GM' : 'Player'}</span>
        </div>
        <div class="groups-card-meta">
          <span title="Game Master"><i class="fas fa-crown"></i> ${esc(g.gmName || 'Unknown GM')}</span>
          <span title="Members"><i class="fas fa-users"></i> ${members} ${members === 1 ? 'member' : 'members'}</span>
          <span title="Characters"><i class="fas fa-scroll"></i> ${chars} ${chars === 1 ? 'character' : 'characters'}</span>
        </div>
      </a>`;
  }

  // ---- rendering: detail view -----------------------------------------------
  function renderDetail() {
    const g = currentGroup;
    if (!g) {
      if (detailError) {
        return renderHeader('Group', '#/groups', 'Back to Groups') + renderError(detailError, 'reload-detail');
      }
      return renderHeader('Group', '#/groups', 'Back to Groups') + renderLoading('Loading group...');
    }
    const me = currentUser();
    const isGm = g.role === 'gm';

    const titleHtml = renaming && isGm
      ? `<form class="groups-rename" data-form="rename" novalidate>
           <input type="text" name="name" value="${esc(g.name)}" maxlength="100" minlength="2" required aria-label="Group name" ${busy ? 'disabled' : ''}>
           <button type="submit" class="btn btn-primary btn-small" ${busy ? 'disabled' : ''}><i class="fas fa-check"></i> Save</button>
           <button type="button" class="btn btn-secondary btn-small" data-action="rename-cancel" ${busy ? 'disabled' : ''}>Cancel</button>
         </form>`
      : `<h2 class="groups-title">
           <span>${esc(g.name)}</span>
           <span class="groups-badge ${isGm ? 'groups-badge-gm' : 'groups-badge-player'}">${isGm ? 'GM' : 'Player'}</span>
           ${isGm ? `<button type="button" class="groups-icon-btn" data-action="rename-start" title="Rename group" aria-label="Rename group"><i class="fas fa-pen"></i></button>` : ''}
         </h2>`;

    const subtitle = `GM: ${g.gmName || 'Unknown'}${g.createdAt ? ' · created ' + formatDate(g.createdAt) : ''}`;

    return `
      ${renderHeader(g.name, '#/groups', 'Back to Groups', subtitle, titleHtml)}
      ${detailError ? renderError(detailError, 'reload-detail') : ''}
      ${isGm ? renderInviteSection(g) : ''}
      ${renderMembersSection(g, me, isGm)}
      ${renderCharactersSection(g, me, isGm)}
      ${isGm ? `
        <div class="groups-section groups-danger-zone">
          <h3 class="groups-section-title"><i class="fas fa-triangle-exclamation"></i> Danger zone</h3>
          <p class="text-secondary">Deleting the group removes all members and character assignments. Characters themselves are not deleted.</p>
          <button type="button" class="btn btn-danger" data-action="delete-group" ${busy ? 'disabled' : ''}><i class="fas fa-trash"></i> Delete group</button>
        </div>` : ''}`;
  }

  function renderInviteSection(g) {
    const code = g.inviteCode || '';
    return `
      <div class="groups-section groups-invite">
        <h3 class="groups-section-title"><i class="fas fa-ticket"></i> Invite code</h3>
        <p class="text-secondary">Players enter this code under "Join a group" to become members.</p>
        <div class="groups-invite-row">
          <code class="groups-invite-code" aria-label="Invite code">${esc(code || '--------')}</code>
          <div class="groups-invite-buttons">
            <button type="button" class="btn btn-primary btn-small" data-action="copy-code" ${code ? '' : 'disabled'}><i class="fas fa-copy"></i> Copy</button>
            <button type="button" class="btn btn-secondary btn-small" data-action="regenerate-code" ${busy ? 'disabled' : ''}><i class="fas fa-rotate"></i> New code</button>
          </div>
        </div>
        <div class="groups-join-hint">
          <textarea readonly rows="2" class="groups-join-hint-text" aria-label="Join hint">${esc(joinHint(g))}</textarea>
          <button type="button" class="btn btn-secondary btn-small" data-action="copy-hint"><i class="fas fa-copy"></i> Copy hint</button>
        </div>
      </div>`;
  }

  function renderMembersSection(g, me, isGm) {
    const members = Array.isArray(g.members) ? g.members : [];
    const rows = [];
    rows.push(`
      <li class="groups-member groups-member-gm">
        <span class="groups-member-name"><i class="fas fa-crown"></i> ${esc(g.gmName || 'Unknown')}${me && me.id === g.gmId ? ' <span class="groups-you">(you)</span>' : ''}</span>
        <span class="groups-badge groups-badge-gm">GM</span>
      </li>`);
    for (const m of members) {
      const isMe = me && me.id === m.id;
      let actions = '';
      if (isGm) {
        actions = `<button type="button" class="btn btn-danger btn-small" data-action="remove-member" data-user-id="${esc(m.id)}" data-user-name="${esc(m.displayName || '')}" ${busy ? 'disabled' : ''}><i class="fas fa-user-minus"></i> Remove</button>`;
      } else if (isMe) {
        actions = `<button type="button" class="btn btn-danger btn-small" data-action="leave-group" ${busy ? 'disabled' : ''}><i class="fas fa-right-from-bracket"></i> Leave group</button>`;
      }
      rows.push(`
        <li class="groups-member">
          <span class="groups-member-name"><i class="fas fa-user"></i> ${esc(m.displayName || 'Unnamed player')}${isMe ? ' <span class="groups-you">(you)</span>' : ''}
            ${m.joinedAt ? `<small class="groups-member-joined">joined ${esc(formatDate(m.joinedAt))}</small>` : ''}</span>
          <span class="groups-member-actions">${actions}</span>
        </li>`);
    }
    return `
      <div class="groups-section">
        <h3 class="groups-section-title"><i class="fas fa-users"></i> Members <span class="groups-count">${members.length + 1}</span></h3>
        ${members.length ? '' : '<p class="text-secondary">No players have joined yet.' + (isGm ? ' Share the invite code above.' : '') + '</p>'}
        <ul class="groups-member-list">${rows.join('')}</ul>
      </div>`;
  }

  function renderCharactersSection(g, me, isGm) {
    const chars = Array.isArray(g.characters) ? g.characters : [];
    // Group by owner, preserving first-seen order.
    const byOwner = new Map();
    for (const c of chars) {
      const key = String(c.ownerId);
      if (!byOwner.has(key)) byOwner.set(key, { ownerId: c.ownerId, ownerName: c.ownerName, items: [] });
      byOwner.get(key).items.push(c);
    }

    let listHtml;
    if (!chars.length) {
      listHtml = `<p class="text-secondary groups-chars-empty">No characters have been added yet.</p>`;
    } else {
      listHtml = [...byOwner.values()].map((owner) => {
        const isMine = me && me.id === owner.ownerId;
        const ownerIsGm = owner.ownerId === g.gmId;
        return `
          <div class="groups-owner-block">
            <h4 class="groups-owner-name">
              <i class="fas ${ownerIsGm ? 'fa-crown' : 'fa-user'}"></i> ${esc(owner.ownerName || 'Unknown')}${isMine ? ' <span class="groups-you">(you)</span>' : ''}
            </h4>
            <ul class="groups-char-list">
              ${owner.items.map((c) => renderCharacterRow(c, isMine, isGm)).join('')}
            </ul>
          </div>`;
      }).join('');
    }

    const options = assignableCharacters(g);
    const addHtml = `
      <form class="groups-add-char" data-form="assign" novalidate>
        <label for="groupsAssignSelect"><i class="fas fa-plus"></i> Add one of your characters</label>
        <div class="groups-add-char-row">
          <select id="groupsAssignSelect" name="characterId" ${options.length && !busy ? '' : 'disabled'}>
            ${options.length
              ? options.map((c) => `<option value="${esc(c.id)}">${esc(c.name || 'Unnamed character')}</option>`).join('')
              : '<option value="">No characters available</option>'}
          </select>
          <button type="submit" class="btn btn-primary" ${options.length && !busy ? '' : 'disabled'}><i class="fas fa-plus"></i> Add</button>
        </div>
        <small class="text-secondary">Only primary characters can be added; their alternate forms and companions follow automatically.</small>
      </form>`;

    return `
      <div class="groups-section">
        <h3 class="groups-section-title"><i class="fas fa-scroll"></i> Characters <span class="groups-count">${chars.length}</span></h3>
        ${listHtml}
        ${addHtml}
      </div>`;
  }

  function renderCharacterRow(c, isMine, isGm) {
    const buttons = [];
    if (isGm) {
      buttons.push(`<button type="button" class="btn btn-secondary btn-small" data-action="open-char" data-id="${esc(c.id)}" data-mode="view"><i class="fas fa-eye"></i> Open</button>`);
      buttons.push(`<button type="button" class="btn btn-primary btn-small" data-action="open-char" data-id="${esc(c.id)}" data-mode="edit"><i class="fas fa-pen-to-square"></i> Edit</button>`);
    } else if (isMine) {
      buttons.push(`<button type="button" class="btn btn-secondary btn-small" data-action="open-char" data-id="${esc(c.id)}" data-mode="view"><i class="fas fa-eye"></i> Open</button>`);
    }
    if (isGm || isMine) {
      buttons.push(`<button type="button" class="btn btn-danger btn-small" data-action="unassign-char" data-id="${esc(c.id)}" data-name="${esc(c.name || '')}" ${busy ? 'disabled' : ''}><i class="fas fa-xmark"></i> Remove from group</button>`);
    }
    const kind = c.kind && c.kind !== 'primary' ? `<span class="groups-kind">${esc(c.kind)}</span>` : '';
    return `
      <li class="groups-char">
        <span class="groups-char-name"><i class="fas fa-user-shield"></i> ${esc(c.name || 'Unnamed character')} ${kind}
          <small class="groups-char-owner">${esc(c.ownerName || '')}</small></span>
        <span class="groups-char-actions">${buttons.join('')}</span>
      </li>`;
  }

  // ---- render dispatcher ----------------------------------------------------
  function render() {
    if (!page) return;
    try {
      page.innerHTML = view === 'detail' ? renderDetail() : renderList();
    } catch (err) {
      console.error('[OLGroupsUI] render failed', err);
      page.innerHTML = renderHeader('Groups', '#/', 'Back to Overview') + renderError('Could not render this page: ' + errorMessage(err));
    }
  }

  function setBusy(value) {
    busy = !!value;
    if (!page) return;
    page.querySelectorAll('button, select').forEach((el) => {
      if (el.dataset.action === 'back' || el.dataset.action === 'open-group' || el.dataset.action === 'open-char' || el.dataset.action === 'copy-code' || el.dataset.action === 'copy-hint') return;
      if (busy) { if (!el.disabled) { el.disabled = true; el.dataset.busyDisabled = '1'; } }
      else if (el.dataset.busyDisabled) { el.disabled = false; delete el.dataset.busyDisabled; }
    });
  }

  // ---- loaders --------------------------------------------------------------
  async function showList() {
    view = 'list';
    currentGroupId = null;
    currentGroup = null;
    renaming = false;
    const seq = ++loadSeq;
    listLoading = true;
    listError = null;
    render();
    try {
      await loadGroups();
      if (seq !== loadSeq) return;
      listError = null;
    } catch (err) {
      if (seq !== loadSeq) return;
      listError = errorMessage(err);
      if (err?.status === 401) notify('Please log in to see your groups', 'warning');
    } finally {
      if (seq === loadSeq) { listLoading = false; render(); }
    }
  }

  async function showDetail(id) {
    view = 'detail';
    const changed = currentGroupId !== id;
    currentGroupId = id;
    if (changed) { renaming = false; currentGroup = cachedGroups.find((g) => g.id === id) || null; }
    detailError = null;
    const seq = ++loadSeq;
    render();
    try {
      const group = await loadGroup(id);
      if (seq !== loadSeq) return;
      currentGroup = group;
      if (!group) detailError = 'Group not found';
    } catch (err) {
      if (seq !== loadSeq) return;
      if (err?.status === 404) {
        uncacheGroup(id);
        notify('This group no longer exists or you are not a member', 'warning');
        navigate('#/groups');
        return;
      }
      detailError = errorMessage(err);
    }
    if (seq === loadSeq) render();
  }

  async function refresh() {
    if (!mounted) return;
    if (view === 'detail' && currentGroupId) return showDetail(currentGroupId);
    return showList();
  }

  // ---- actions --------------------------------------------------------------
  async function runMutation(fn, successMessage, opts) {
    if (busy) return;
    setBusy(true);
    try {
      const result = await fn();
      if (successMessage) notify(successMessage, 'success');
      return result;
    } catch (err) {
      console.error('[OLGroupsUI] request failed', err);
      notify(errorMessage(err), 'error');
      if (opts?.onError) opts.onError(err);
      return undefined;
    } finally {
      setBusy(false);
    }
  }

  async function handleCreate(form) {
    const input = form.querySelector('input[name="name"]');
    const name = (input?.value || '').trim();
    if (name.length < 2 || name.length > 100) {
      notify('Group name must be 2-100 characters', 'warning');
      input?.focus();
      return;
    }
    const res = await runMutation(() => groupsApi().create(name), `Group "${name}" created`);
    if (!res) return;
    const group = res.group;
    if (group) cacheGroup(group);
    refreshApp();
    if (group?.id != null) navigate('#/group?id=' + encodeURIComponent(group.id));
    else await showList();
  }

  async function handleJoin(form) {
    const input = form.querySelector('input[name="code"]');
    const code = (input?.value || '').trim().toUpperCase();
    if (!code) { notify('Please enter an invite code', 'warning'); input?.focus(); return; }
    if (code.length !== 8) { notify('Invite codes are 8 characters long', 'warning'); input?.focus(); return; }
    const res = await runMutation(() => groupsApi().join(code), null, {
      onError: () => { input?.classList.add('error'); input?.focus(); },
    });
    if (!res) return;
    const group = res.group;
    if (group) cacheGroup(group);
    notify(`Joined "${group?.name || 'group'}"`, 'success');
    refreshApp();
    if (group?.id != null) navigate('#/group?id=' + encodeURIComponent(group.id));
    else await showList();
  }

  async function handleRename(form) {
    const g = currentGroup;
    if (!g) return;
    const input = form.querySelector('input[name="name"]');
    const name = (input?.value || '').trim();
    if (name.length < 2 || name.length > 100) { notify('Group name must be 2-100 characters', 'warning'); input?.focus(); return; }
    if (name === g.name) { renaming = false; render(); return; }
    const res = await runMutation(() => groupsApi().rename(g.id, name), 'Group renamed');
    if (!res) return;
    renaming = false;
    if (res.group) { currentGroup = res.group; cacheGroup(res.group); }
    else { currentGroup = { ...g, name }; cacheGroup(currentGroup); }
    render();
  }

  async function handleRegenerateCode() {
    const g = currentGroup;
    if (!g) return;
    if (!window.confirm('Generate a new invite code? The old code stops working immediately.')) return;
    const res = await runMutation(() => groupsApi().regenerateCode(g.id), 'New invite code generated');
    if (!res) return;
    currentGroup = { ...g, inviteCode: res.inviteCode || g.inviteCode };
    cacheGroup(currentGroup);
    render();
  }

  async function handleDeleteGroup() {
    const g = currentGroup;
    if (!g) return;
    if (!window.confirm(`Delete the group "${g.name}"? Members lose access and all character assignments are removed. This cannot be undone.`)) return;
    const res = await runMutation(() => groupsApi().remove(g.id), `Group "${g.name}" deleted`);
    if (!res) return;
    uncacheGroup(g.id);
    currentGroup = null;
    refreshApp();
    navigate('#/groups');
  }

  async function handleRemoveMember(userId, userName) {
    const g = currentGroup;
    if (!g || !userId) return;
    if (!window.confirm(`Remove ${userName || 'this player'} from "${g.name}"? Their characters are removed from the group as well.`)) return;
    const res = await runMutation(() => groupsApi().removeMember(g.id, userId), `${userName || 'Player'} removed`);
    if (!res) return;
    refreshApp();
    await showDetail(g.id);
  }

  async function handleLeaveGroup() {
    const g = currentGroup;
    const me = currentUser();
    if (!g || !me) { notify('You must be logged in', 'warning'); return; }
    if (!window.confirm(`Leave the group "${g.name}"? Your characters are removed from the group.`)) return;
    const res = await runMutation(() => groupsApi().removeMember(g.id, me.id), `You left "${g.name}"`);
    if (!res) return;
    uncacheGroup(g.id);
    currentGroup = null;
    refreshApp();
    navigate('#/groups');
  }

  async function handleAssign(form) {
    const g = currentGroup;
    if (!g) return;
    const select = form.querySelector('select[name="characterId"]');
    const characterId = select?.value;
    if (!characterId) { notify('Choose a character to add', 'warning'); return; }
    const res = await runMutation(() => groupsApi().assignCharacter(g.id, characterId), 'Character added to the group');
    if (!res) return;
    if (res.group) { currentGroup = res.group; cacheGroup(res.group); render(); }
    else await showDetail(g.id);
    refreshApp();
  }

  async function handleUnassign(characterId, name) {
    const g = currentGroup;
    if (!g || !characterId) return;
    if (!window.confirm(`Remove "${name || 'this character'}" from "${g.name}"?`)) return;
    const res = await runMutation(() => groupsApi().unassignCharacter(g.id, characterId), 'Character removed from the group');
    if (!res) return;
    if (res.group) { currentGroup = res.group; cacheGroup(res.group); render(); }
    else await showDetail(g.id);
    refreshApp();
  }

  function handleOpenChar(id, mode) {
    const a = app();
    if (a && typeof a.openCharacter === 'function') {
      try { a.openCharacter(id, mode === 'edit' ? 'edit' : 'view'); } catch (err) { console.error('[OLGroupsUI] openCharacter failed', err); notify('Could not open the character', 'error'); }
    } else {
      notify('Opening characters is not available', 'warning');
    }
  }

  async function handleCopy(text, what) {
    if (!text) return;
    const ok = await copyText(text);
    notify(ok ? `${what} copied to clipboard` : `Could not copy; please select the ${what.toLowerCase()} and copy it manually`, ok ? 'success' : 'warning');
  }

  // ---- event wiring ---------------------------------------------------------
  function onClick(ev) {
    const target = ev.target instanceof Element ? ev.target.closest('[data-action]') : null;
    if (!target || !page || !page.contains(target)) return;
    const action = target.dataset.action;
    switch (action) {
      case 'back':
        ev.preventDefault();
        navigate(target.dataset.hash || '#/');
        break;
      case 'open-group':
        ev.preventDefault();
        navigate('#/group?id=' + encodeURIComponent(target.dataset.id || ''));
        break;
      case 'reload-list':
        showList();
        break;
      case 'reload-detail':
        if (currentGroupId) showDetail(currentGroupId);
        break;
      case 'rename-start':
        renaming = true;
        render();
        page.querySelector('.groups-rename input')?.select();
        break;
      case 'rename-cancel':
        renaming = false;
        render();
        break;
      case 'copy-code':
        handleCopy(currentGroup?.inviteCode || '', 'Invite code');
        break;
      case 'copy-hint':
        if (currentGroup) handleCopy(joinHint(currentGroup), 'Join hint');
        break;
      case 'regenerate-code':
        handleRegenerateCode();
        break;
      case 'delete-group':
        handleDeleteGroup();
        break;
      case 'remove-member':
        handleRemoveMember(target.dataset.userId, target.dataset.userName);
        break;
      case 'leave-group':
        handleLeaveGroup();
        break;
      case 'open-char':
        handleOpenChar(target.dataset.id, target.dataset.mode);
        break;
      case 'unassign-char':
        handleUnassign(target.dataset.id, target.dataset.name);
        break;
      default:
        break;
    }
  }

  function onSubmit(ev) {
    const form = ev.target instanceof Element ? ev.target.closest('form[data-form]') : null;
    if (!form || !page || !page.contains(form)) return;
    ev.preventDefault();
    switch (form.dataset.form) {
      case 'create': handleCreate(form); break;
      case 'join': handleJoin(form); break;
      case 'rename': handleRename(form); break;
      case 'assign': handleAssign(form); break;
      default: break;
    }
  }

  function onInput(ev) {
    const el = ev.target;
    if (!(el instanceof HTMLInputElement) || !page || !page.contains(el)) return;
    if (el.classList.contains('groups-code-input')) {
      const pos = el.selectionStart;
      const cleaned = el.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 8);
      if (cleaned !== el.value) {
        el.value = cleaned;
        try { if (pos != null) el.setSelectionRange(Math.min(pos, cleaned.length), Math.min(pos, cleaned.length)); } catch { /* ignore */ }
      }
      el.classList.remove('error');
    }
  }

  function onKeydown(ev) {
    if (ev.key === 'Escape' && renaming && page && page.contains(ev.target)) {
      renaming = false;
      render();
    }
  }

  function subscribeWs() {
    if (wsSubscribed) return;
    const ws = cloud()?.ws;
    if (!ws || typeof ws.on !== 'function') return;
    wsSubscribed = true;
    ws.on('group.updated', (msg) => {
      const id = msg?.groupId;
      if (!mounted) return;
      if (view === 'detail' && currentGroupId && id === currentGroupId) {
        if (isPageVisible()) { if (!busy) showDetail(id); }
        else loadGroup(id).catch(() => {});
        return;
      }
      // List view or another group: keep the cache fresh; rerender only when visible.
      loadGroups().then(() => { if (isPageVisible() && view === 'list') render(); }).catch(() => {});
    });
    ws.on('group.deleted', (msg) => {
      const id = msg?.groupId;
      if (!mounted || id == null) return;
      uncacheGroup(id);
      if (view === 'detail' && currentGroupId === id) {
        const name = currentGroup?.name;
        currentGroup = null;
        notify(name ? `The group "${name}" was deleted by its GM` : 'This group was deleted by its GM', 'warning');
        if (isPageVisible()) navigate('#/groups');
        else view = 'list';
        return;
      }
      if (isPageVisible() && view === 'list') render();
    });
  }

  // ---- public API -----------------------------------------------------------
  function mount() {
    if (mounted && page && document.body.contains(page)) return page;
    const container = document.getElementById('cloudPages') || document.body;
    page = document.getElementById(PAGE_ID);
    if (!page) {
      page = document.createElement('div');
      page.id = PAGE_ID;
      page.className = 'cloud-page groups-page';
      page.style.display = 'none';
      container.appendChild(page);
    }
    if (!page.dataset.wired) {
      page.addEventListener('click', onClick);
      page.addEventListener('submit', onSubmit);
      page.addEventListener('input', onInput);
      page.addEventListener('keydown', onKeydown);
      page.dataset.wired = '1';
    }
    mounted = true;
    subscribeWs();
    return page;
  }

  function show(route, params) {
    mount();
    subscribeWs(); // in case OLCloud loaded after mount()
    params = params || {};
    const a = app();
    if (a && typeof a.showPage === 'function') {
      try { a.showPage(PAGE_ID); } catch (err) { console.error('[OLGroupsUI] showPage failed', err); }
    } else if (page) {
      page.style.display = '';
    }
    if (route === 'group' && params.id) {
      showDetail(String(params.id));
    } else {
      if (route === 'group') notify('No group selected', 'warning');
      showList();
    }
  }

  window.OLGroupsUI = { mount, show, refresh, loadGroups, getCachedGroups, PAGE_ID };
})();
