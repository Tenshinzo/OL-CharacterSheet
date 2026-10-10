/**
 * OLFeedbackUI – "Bug report / feature request" dialog that files a GitHub
 * issue through the server (POST /api/feedback). Exposes:
 *   OLFeedbackUI.open(presetType)   open the dialog ('bug' | 'feature')
 *   OLFeedbackUI.close()
 *   OLFeedbackUI.isEnabled()        last known server status (null = unknown)
 */
(function () {
  'use strict';

  const state = { enabled: null, repo: '', modal: null, submitting: false };
  const esc = (v) => (window.OLCloud ? window.OLCloud.escapeHtml(v) : String(v ?? ''));
  const app = () => window.app || null;
  const notify = (msg, type) => { const a = app(); if (a && a.showNotification) a.showNotification(msg, type); };

  async function loadStatus() {
    if (!window.OLCloud) return false;
    try {
      const res = await window.OLCloud.api('GET', '/feedback/status');
      state.enabled = !!res.enabled;
      state.repo = res.repo || '';
    } catch {
      state.enabled = null;
    }
    return state.enabled;
  }

  function context() {
    const a = app();
    const ch = a && a.currentCharacter;
    return {
      page: location.hash || '#/',
      character: ch ? `${ch.name} (${ch.id})` : '',
      userAgent: navigator.userAgent,
      viewport: `${window.innerWidth}x${window.innerHeight}`,
    };
  }

  function render(presetType) {
    close();
    const modal = document.createElement('div');
    modal.className = 'modal feedback-modal';
    modal.id = 'feedbackModal';
    modal.style.display = 'block';
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-labelledby', 'feedbackTitle');
    const type = presetType === 'feature' ? 'feature' : 'bug';
    modal.innerHTML =
      '<div class="modal-content feedback-content">' +
        '<span class="close" data-fb-close aria-label="Close">&times;</span>' +
        '<h2 id="feedbackTitle"><i class="fas fa-bug"></i> Bug report / feature request</h2>' +
        '<p class="text-secondary feedback-intro">Your report is filed as a public issue on GitHub' + (state.repo ? ' (' + esc(state.repo) + ')' : '') + '. Please do not include passwords or private data.</p>' +
        '<form id="feedbackForm" novalidate>' +
          '<div class="feedback-type" role="radiogroup" aria-label="Type">' +
            '<label class="feedback-type-option' + (type === 'bug' ? ' is-selected' : '') + '"><input type="radio" name="type" value="bug"' + (type === 'bug' ? ' checked' : '') + '><i class="fas fa-bug"></i> Bug report</label>' +
            '<label class="feedback-type-option' + (type === 'feature' ? ' is-selected' : '') + '"><input type="radio" name="type" value="feature"' + (type === 'feature' ? ' checked' : '') + '><i class="fas fa-lightbulb"></i> Feature request</label>' +
          '</div>' +
          '<div class="form-group">' +
            '<label for="feedbackTitleInput">Title</label>' +
            '<input id="feedbackTitleInput" name="title" type="text" maxlength="150" required placeholder="Short summary">' +
          '</div>' +
          '<div class="form-group">' +
            '<label for="feedbackDescription">Description</label>' +
            '<textarea id="feedbackDescription" name="description" rows="6" maxlength="5000" required placeholder="What happened, what did you expect? For bugs: steps to reproduce."></textarea>' +
          '</div>' +
          '<label class="feedback-context"><input type="checkbox" name="includeContext" checked> Include technical context (current page, open character, browser)</label>' +
          '<div class="feedback-error" data-fb-error hidden></div>' +
          '<div class="modal-actions feedback-actions">' +
            '<button type="button" class="btn btn-secondary" data-fb-close>Cancel</button>' +
            '<button type="submit" class="btn btn-primary" data-fb-submit><i class="fas fa-paper-plane"></i> Submit</button>' +
          '</div>' +
        '</form>' +
        '<div class="feedback-success" data-fb-success hidden></div>' +
      '</div>';
    document.body.appendChild(modal);
    state.modal = modal;

    modal.querySelectorAll('[data-fb-close]').forEach((el) => el.addEventListener('click', close));
    modal.addEventListener('click', (ev) => { if (ev.target === modal) close(); });
    modal.querySelectorAll('input[name="type"]').forEach((r) => r.addEventListener('change', () => {
      modal.querySelectorAll('.feedback-type-option').forEach((l) => l.classList.toggle('is-selected', l.querySelector('input').checked));
    }));
    document.addEventListener('keydown', onKey);
    modal.querySelector('#feedbackForm').addEventListener('submit', onSubmit);
    setTimeout(() => modal.querySelector('#feedbackTitleInput')?.focus(), 50);
  }

  function onKey(ev) {
    if (ev.key === 'Escape') close();
  }

  function showError(msg) {
    const el = state.modal?.querySelector('[data-fb-error]');
    if (!el) return;
    el.textContent = msg || '';
    el.hidden = !msg;
  }

  async function onSubmit(ev) {
    ev.preventDefault();
    if (state.submitting || !state.modal) return;
    const form = state.modal.querySelector('#feedbackForm');
    const type = form.querySelector('input[name="type"]:checked')?.value || 'bug';
    const title = form.title.value.trim();
    const description = form.description.value.trim();
    if (title.length < 5) return showError('Please give the report a title (at least 5 characters).');
    if (description.length < 10) return showError('Please describe the issue in a bit more detail (at least 10 characters).');
    showError('');
    const btn = state.modal.querySelector('[data-fb-submit]');
    state.submitting = true;
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Submitting…';
    try {
      const payload = { type, title, description };
      if (form.includeContext.checked) payload.context = context();
      const res = await window.OLCloud.api('POST', '/feedback', payload);
      form.hidden = true;
      const ok = state.modal.querySelector('[data-fb-success]');
      ok.hidden = false;
      ok.innerHTML =
        '<div class="feedback-success-icon"><i class="fas fa-check-circle"></i></div>' +
        '<h3>Thank you!</h3>' +
        '<p>Your ' + (type === 'bug' ? 'bug report' : 'feature request') + ' was filed as issue #' + esc(res.number) + '.</p>' +
        '<p><a href="' + esc(res.url) + '" target="_blank" rel="noopener" class="btn btn-primary btn-small"><i class="fab fa-github"></i> View on GitHub</a> ' +
        '<button type="button" class="btn btn-secondary btn-small" data-fb-close>Close</button></p>';
      ok.querySelectorAll('[data-fb-close]').forEach((el) => el.addEventListener('click', close));
      notify('Thanks, your report was submitted.', 'success');
    } catch (err) {
      if (err && err.code === 'FEEDBACK_DISABLED') showError('Bug reports are not configured on this server yet.');
      else if (err && err.status === 429) showError('You have submitted a lot of reports recently. Please try again later.');
      else showError((err && err.message) || 'Submitting failed. Please try again.');
    } finally {
      state.submitting = false;
      btn.disabled = false;
      btn.innerHTML = '<i class="fas fa-paper-plane"></i> Submit';
    }
  }

  async function open(presetType) {
    if (!app() || !app().currentUser) { notify('Please sign in first.', 'warning'); return; }
    if (state.enabled === null) await loadStatus();
    if (state.enabled === false) {
      notify('Bug reports are not configured on this server yet.', 'warning');
      return;
    }
    render(presetType);
  }

  function close() {
    document.removeEventListener('keydown', onKey);
    if (state.modal) { state.modal.remove(); state.modal = null; }
    state.submitting = false;
  }

  window.OLFeedbackUI = { open, close, loadStatus, isEnabled: () => state.enabled };
})();
