/**
 * OLAuthUI – authentication, account and user-menu UI for the Open Legend
 * Character Sheet cloud backend.
 *
 * Plain browser script (no modules). Depends on window.OLCloud (api.js) and
 * the app hooks documented in the integration contract:
 *   window.app.showPage(id), window.app.navigate(hash), window.app.showNotification(msg, type),
 *   window.app.currentUser, window.app.onAuthenticated(user), window.app.logout()
 *
 * Exposes window.OLAuthUI with:
 *   mount()                       create #loginPage / #accountPage inside #cloudPages (idempotent)
 *   show(route, params)           render a route and make its page visible
 *   renderUserMenu(user)          fill div#userMenu (null clears it)
 *   showVerifyNotice(user)        "Confirm your email" panel on the login page
 *   setSyncStatus(status, detail) push a sync status into the user menu
 *   features                      cached { discord, email } from GET /auth/me
 *
 * Routes: login, register, forgot-password, reset-password, verify-email, account
 */
(function () {
  'use strict';

  const LOGIN_PAGE_ID = 'loginPage';
  const ACCOUNT_PAGE_ID = 'accountPage';

  const DISCORD_ERRORS = {
    discord_denied: 'Discord sign-in was cancelled or denied.',
    discord_state: 'The Discord sign-in could not be verified. Please try again.',
    discord_token: 'Discord did not accept the sign-in request. Please try again.',
    discord_profile: 'Your Discord profile could not be read. Please try again.',
    discord_taken: 'This Discord account is already linked to another user.',
    invite_required: 'You need an invite code to create an account. Enter it under "Create account" and use Discord from there.',
    invite_invalid: 'That account invite code is invalid or has already been used. Note: a group code from the Groups page cannot be used to register.',
    discord_no_email: 'Your Discord account has no verified email address, so no account could be created.',
    account_disabled: 'This account has been disabled.',
  };

  const state = {
    mounted: false,
    view: 'login',          // login | register | forgot | reset | verify | notice
    params: {},
    featuresLoaded: false,
    featuresPromise: null,
    syncStatus: 'idle',
    syncDetail: null,
    pushedStatus: null,     // set via setSyncStatus(); overrides sync events until next event
    wsOpen: false,
    wsSeen: false,
    menuOpen: false,
    menuUser: null,
    subscribed: false,
    verifyRunFor: null,
  };

  // ---- helpers --------------------------------------------------------------

  function esc(value) {
    if (window.OLCloud && typeof window.OLCloud.escapeHtml === 'function') return window.OLCloud.escapeHtml(value);
    return String(value ?? '')
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  function app() { return window.app || null; }

  function notify(message, type) {
    const a = app();
    if (a && typeof a.showNotification === 'function') {
      try { a.showNotification(message, type || 'info'); return; } catch (err) { console.warn('[OLAuthUI] showNotification failed', err); }
    }
    console.log('[OLAuthUI]', type || 'info', message);
  }

  function navigate(hash) {
    const a = app();
    if (a && typeof a.navigate === 'function') { a.navigate(hash); return; }
    location.hash = hash;
  }

  function showPage(id) {
    const a = app();
    if (a && typeof a.showPage === 'function') {
      try { a.showPage(id); return; } catch (err) { console.warn('[OLAuthUI] showPage failed', err); }
    }
    // Fallback: toggle visibility ourselves.
    document.querySelectorAll('.cloud-page').forEach((el) => { el.style.display = el.id === id ? '' : 'none'; });
  }

  function currentUser() {
    const a = app();
    return a && a.currentUser ? a.currentUser : null;
  }

  function errMessage(err) {
    if (!err) return 'Something went wrong';
    if (err.status === 0) return 'You appear to be offline. Please check your connection.';
    if (err.status === 429) return 'Too many attempts, please wait a moment and try again.';
    return err.message || 'Something went wrong';
  }

  function $(root, selector) { return root ? root.querySelector(selector) : null; }

  function setBusy(form, busy) {
    if (!form) return;
    form.querySelectorAll('button, input, select').forEach((el) => {
      if (busy) {
        if (el.disabled) el.dataset.olWasDisabled = '1';
        el.disabled = true;
      } else if (!el.dataset.olWasDisabled) {
        el.disabled = false;
      } else {
        delete el.dataset.olWasDisabled;
      }
    });
    const submit = form.querySelector('button[type="submit"]');
    if (submit) {
      if (busy) {
        submit.dataset.olLabel = submit.innerHTML;
        submit.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Please wait…';
      } else if (submit.dataset.olLabel) {
        submit.innerHTML = submit.dataset.olLabel;
        delete submit.dataset.olLabel;
      }
    }
  }

  function setInlineError(form, message) {
    const box = form ? form.querySelector('.auth-error') : null;
    if (!box) return;
    if (message) {
      box.innerHTML = '<i class="fas fa-exclamation-circle"></i> ' + esc(message);
      box.style.display = '';
    } else {
      box.innerHTML = '';
      box.style.display = 'none';
    }
  }

  function initials(name) {
    const parts = String(name || '').trim().split(/\s+/).filter(Boolean);
    if (!parts.length) return '?';
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }

  function pageContainer() {
    return document.getElementById('cloudPages') || document.body;
  }

  // ---- features (discord/email) --------------------------------------------

  const features = { discord: false, email: true };

  function loadFeatures() {
    if (state.featuresLoaded) return Promise.resolve(features);
    if (state.featuresPromise) return state.featuresPromise;
    if (!window.OLCloud || !window.OLCloud.auth) return Promise.resolve(features);
    state.featuresPromise = window.OLCloud.auth.me()
      .then((res) => {
        if (res && res.features) {
          features.discord = !!res.features.discord;
          features.email = res.features.email !== false;
        }
        state.featuresLoaded = true;
        return features;
      })
      .catch(() => features)
      .finally(() => { state.featuresPromise = null; });
    return state.featuresPromise;
  }

  // ---- mount ----------------------------------------------------------------

  function mount() {
    if (state.mounted && document.getElementById(LOGIN_PAGE_ID) && document.getElementById(ACCOUNT_PAGE_ID)) return;
    const container = pageContainer();

    if (!document.getElementById(LOGIN_PAGE_ID)) {
      const login = document.createElement('div');
      login.id = LOGIN_PAGE_ID;
      login.className = 'cloud-page auth-page';
      login.style.display = 'none';
      container.appendChild(login);
      login.addEventListener('click', onLoginPageClick);
    }
    if (!document.getElementById(ACCOUNT_PAGE_ID)) {
      const account = document.createElement('div');
      account.id = ACCOUNT_PAGE_ID;
      account.className = 'cloud-page account-page main-page';
      account.style.display = 'none';
      container.appendChild(account);
    }
    subscribeSync();
    state.mounted = true;
  }

  function onLoginPageClick(ev) {
    const link = ev.target.closest('[data-auth-view]');
    if (!link) return;
    ev.preventDefault();
    const view = link.getAttribute('data-auth-view');
    const route = { login: 'login', register: 'register', forgot: 'forgot-password' }[view];
    if (route) navigate('#/' + route);
    else { state.view = view; renderLoginPage(); }
  }

  // ---- routing --------------------------------------------------------------

  function show(route, params) {
    mount();
    state.params = params || {};
    switch (route) {
      case 'login':
        state.view = 'login';
        renderLoginPage();
        showPage(LOGIN_PAGE_ID);
        if (state.params.error) {
          const msg = DISCORD_ERRORS[state.params.error] || 'Sign-in failed (' + state.params.error + ').';
          const form = $(document.getElementById(LOGIN_PAGE_ID), 'form[data-auth-form="login"]');
          setInlineError(form, msg);
          notify(msg, 'error');
        }
        break;
      case 'register':
        state.view = 'register';
        renderLoginPage();
        showPage(LOGIN_PAGE_ID);
        break;
      case 'forgot-password':
        state.view = 'forgot';
        renderLoginPage();
        showPage(LOGIN_PAGE_ID);
        break;
      case 'reset-password':
        state.view = 'reset';
        renderLoginPage();
        showPage(LOGIN_PAGE_ID);
        break;
      case 'verify-email':
        state.view = 'verify';
        renderLoginPage();
        showPage(LOGIN_PAGE_ID);
        runVerifyEmail(state.params.token);
        break;
      case 'account':
        renderAccountPage();
        showPage(ACCOUNT_PAGE_ID);
        if (state.params.linked === 'discord') notify('Discord account linked successfully.', 'success');
        refreshAccountFromServer();
        break;
      default:
        console.warn('[OLAuthUI] unknown route', route);
        state.view = 'login';
        renderLoginPage();
        showPage(LOGIN_PAGE_ID);
    }
  }

  // ---- login page -----------------------------------------------------------

  function brandHtml(subtitle) {
    return '<div class="auth-brand">' +
      '<div class="auth-brand-icon"><i class="fas fa-dice-d20"></i></div>' +
      '<h2>Open Legend Character Sheet</h2>' +
      (subtitle ? '<p>' + esc(subtitle) + '</p>' : '') +
      '</div>';
  }

  function tabsHtml(active) {
    const tab = (view, label) =>
      '<a href="#/' + (view === 'login' ? 'login' : view === 'register' ? 'register' : 'forgot-password') + '" ' +
      'class="auth-tab' + (active === view ? ' active' : '') + '" data-auth-view="' + view + '" role="tab" ' +
      'aria-selected="' + (active === view ? 'true' : 'false') + '">' + label + '</a>';
    return '<div class="auth-tabs" role="tablist">' + tab('login', 'Sign in') + tab('register', 'Create account') + '</div>';
  }

  function discordButtonHtml(label, extraClass) {
    return '<button type="button" class="btn btn-discord ' + (extraClass || '') + '" data-auth-discord>' +
      '<i class="fab fa-discord"></i> ' + esc(label) + '</button>';
  }

  function discordSectionHtml(label) {
    if (!state.featuresLoaded) {
      return '<div class="auth-discord" data-auth-discord-slot data-label="' + esc(label) + '"></div>';
    }
    if (!features.discord) return '';
    return '<div class="auth-discord" data-auth-discord-slot data-label="' + esc(label) + '">' +
      '<div class="auth-divider"><span>or</span></div>' +
      discordButtonHtml(label) +
      '</div>';
  }

  function fillDiscordSlots(page) {
    page.querySelectorAll('[data-auth-discord-slot]').forEach((slot) => {
      const label = slot.getAttribute('data-label') || 'Continue with Discord';
      if (!features.discord) { slot.innerHTML = ''; return; }
      if (slot.querySelector('[data-auth-discord]')) return;
      slot.innerHTML = '<div class="auth-divider"><span>or</span></div>' + discordButtonHtml(label);
    });
    wireDiscordButtons(page);
  }

  function wireDiscordButtons(page) {
    page.querySelectorAll('[data-auth-discord]').forEach((btn) => {
      if (btn.dataset.olWired) return;
      btn.dataset.olWired = '1';
      btn.addEventListener('click', () => {
        if (!window.OLCloud || !window.OLCloud.auth) return;
        let invite = state.params.invite || '';
        const form = btn.closest('form');
        if (form && form.getAttribute('data-auth-form') === 'register') {
          const inp = form.querySelector('input[name="inviteCode"]');
          invite = (inp && inp.value || '').trim().toUpperCase();
          if (!invite) {
            setInlineError(form, 'Please enter your invite code first, then continue with Discord.');
            if (inp) inp.focus();
            return;
          }
        }
        btn.disabled = true;
        location.href = window.OLCloud.auth.discordLoginUrl(invite || undefined);
      });
    });
  }

  function loginViewHtml() {
    return brandHtml('Sign in to sync your characters across devices') +
      tabsHtml('login') +
      '<form class="auth-form" data-auth-form="login" novalidate>' +
        '<div class="auth-error" role="alert" style="display:none"></div>' +
        '<div class="form-group">' +
          '<label for="authLoginEmail">Email</label>' +
          '<input id="authLoginEmail" name="email" type="email" autocomplete="username" required placeholder="you@example.com">' +
        '</div>' +
        '<div class="form-group">' +
          '<label for="authLoginPassword">Password</label>' +
          '<input id="authLoginPassword" name="password" type="password" autocomplete="current-password" required placeholder="Your password">' +
        '</div>' +
        '<button type="submit" class="btn btn-primary btn-block"><i class="fas fa-sign-in-alt"></i> Sign in</button>' +
        '<div class="auth-links"><a href="#/forgot-password" data-auth-view="forgot">Forgot password?</a></div>' +
        discordSectionHtml('Continue with Discord') +
      '</form>';
  }

  function registerViewHtml() {
    const invite = String(state.params.invite || '').toUpperCase();
    return brandHtml('Create your account with an invite code') +
      tabsHtml('register') +
      '<form class="auth-form" data-auth-form="register" novalidate>' +
        '<div class="auth-error" role="alert" style="display:none"></div>' +
        '<div class="form-group">' +
          '<label for="authRegName">Display name</label>' +
          '<input id="authRegName" name="displayName" type="text" autocomplete="nickname" required minlength="2" maxlength="100" placeholder="How others will see you">' +
        '</div>' +
        '<div class="form-group">' +
          '<label for="authRegEmail">Email</label>' +
          '<input id="authRegEmail" name="email" type="email" autocomplete="email" required placeholder="you@example.com">' +
        '</div>' +
        '<div class="form-group">' +
          '<label for="authRegPassword">Password</label>' +
          '<input id="authRegPassword" name="password" type="password" autocomplete="new-password" required minlength="8" placeholder="At least 8 characters">' +
          '<small>Minimum 8 characters.</small>' +
        '</div>' +
        '<div class="form-group">' +
          '<label for="authRegInvite">Account invite code</label>' +
          '<input id="authRegInvite" name="inviteCode" type="text" autocomplete="off" autocapitalize="characters" spellcheck="false" required class="auth-invite" value="' + esc(invite) + '" placeholder="XXXXXXXX">' +
          '<small>Registration is invite-only. An administrator creates account invite codes (10 characters). Group codes from the Groups page are something else: they join an existing account to a party.</small>' +
        '</div>' +
        '<button type="submit" class="btn btn-primary btn-block"><i class="fas fa-user-plus"></i> Create account</button>' +
        discordSectionHtml('Sign up with Discord') +
      '</form>';
  }

  function forgotViewHtml() {
    return brandHtml('Reset your password') +
      '<form class="auth-form" data-auth-form="forgot" novalidate>' +
        '<h3 class="auth-heading">Forgot password</h3>' +
        '<p class="auth-text">Enter your email address and we will send you a link to set a new password.</p>' +
        '<div class="auth-error" role="alert" style="display:none"></div>' +
        '<div class="form-group">' +
          '<label for="authForgotEmail">Email</label>' +
          '<input id="authForgotEmail" name="email" type="email" autocomplete="email" required placeholder="you@example.com">' +
        '</div>' +
        '<button type="submit" class="btn btn-primary btn-block"><i class="fas fa-paper-plane"></i> Send reset link</button>' +
        '<div class="auth-links"><a href="#/login" data-auth-view="login"><i class="fas fa-arrow-left"></i> Back to sign in</a></div>' +
      '</form>';
  }

  function forgotDoneHtml() {
    return brandHtml('Reset your password') +
      '<div class="auth-result">' +
        '<div class="auth-result-icon success"><i class="fas fa-envelope-open-text"></i></div>' +
        '<h3 class="auth-heading">Check your inbox</h3>' +
        '<p class="auth-text">If an account exists for that address, we sent a link to reset your password. The link is valid for one hour.</p>' +
        '<div class="auth-links"><a href="#/login" data-auth-view="login"><i class="fas fa-arrow-left"></i> Back to sign in</a></div>' +
      '</div>';
  }

  function resetViewHtml() {
    const hasToken = !!state.params.token;
    return brandHtml('Set a new password') +
      '<form class="auth-form" data-auth-form="reset" novalidate>' +
        '<h3 class="auth-heading">Set new password</h3>' +
        (hasToken ? '' : '<div class="auth-error" role="alert"><i class="fas fa-exclamation-circle"></i> This link is missing its token. Please use the link from your email or request a new one.</div>') +
        (hasToken ? '<div class="auth-error" role="alert" style="display:none"></div>' : '') +
        '<div class="form-group">' +
          '<label for="authResetPassword">New password</label>' +
          '<input id="authResetPassword" name="password" type="password" autocomplete="new-password" required minlength="8" placeholder="At least 8 characters"' + (hasToken ? '' : ' disabled') + '>' +
        '</div>' +
        '<div class="form-group">' +
          '<label for="authResetConfirm">Confirm new password</label>' +
          '<input id="authResetConfirm" name="confirm" type="password" autocomplete="new-password" required minlength="8" placeholder="Repeat the password"' + (hasToken ? '' : ' disabled') + '>' +
        '</div>' +
        '<button type="submit" class="btn btn-primary btn-block"' + (hasToken ? '' : ' disabled') + '><i class="fas fa-key"></i> Save password</button>' +
        '<div class="auth-links"><a href="#/forgot-password" data-auth-view="forgot">Request a new link</a> · <a href="#/login" data-auth-view="login">Sign in</a></div>' +
      '</form>';
  }

  function verifyViewHtml(stage, message) {
    let icon = '<div class="auth-result-icon"><i class="fas fa-spinner fa-spin"></i></div>';
    let heading = 'Verifying your email…';
    let text = 'One moment please.';
    let links = '';
    if (stage === 'success') {
      icon = '<div class="auth-result-icon success"><i class="fas fa-check"></i></div>';
      heading = 'Email confirmed';
      text = message || 'Thank you! Your email address has been verified.';
      links = '<div class="auth-links"><a href="#/" class="btn btn-primary btn-block" data-auth-continue><i class="fas fa-arrow-right"></i> Continue</a></div>';
    } else if (stage === 'error') {
      icon = '<div class="auth-result-icon error"><i class="fas fa-times"></i></div>';
      heading = 'Verification failed';
      text = message || 'This link is invalid or has expired.';
      links = '<div class="auth-links">' +
        (currentUser() ? '<button type="button" class="btn btn-secondary" data-auth-resend><i class="fas fa-redo"></i> Resend email</button> ' : '') +
        '<a href="#/login" data-auth-view="login">Go to sign in</a></div>';
    }
    return brandHtml('Email verification') +
      '<div class="auth-result">' + icon +
        '<h3 class="auth-heading">' + esc(heading) + '</h3>' +
        '<p class="auth-text">' + esc(text) + '</p>' + links +
      '</div>';
  }

  function noticeViewHtml(user) {
    return brandHtml('One more step') +
      '<div class="auth-result" data-auth-notice>' +
        '<div class="auth-result-icon warning"><i class="fas fa-envelope"></i></div>' +
        '<h3 class="auth-heading">Confirm your email</h3>' +
        '<p class="auth-text">We sent a confirmation link to <strong>' + esc(user && user.email) + '</strong>. ' +
          'Please open it to activate your account. Check your spam folder if it does not arrive within a few minutes.</p>' +
        '<div class="auth-error" role="alert" style="display:none"></div>' +
        '<div class="auth-actions">' +
          '<button type="button" class="btn btn-primary" data-auth-resend><i class="fas fa-redo"></i> Resend email</button>' +
          '<button type="button" class="btn btn-secondary" data-auth-signout><i class="fas fa-sign-out-alt"></i> Sign out</button>' +
        '</div>' +
      '</div>';
  }

  function renderLoginPage() {
    const page = document.getElementById(LOGIN_PAGE_ID);
    if (!page) return;
    let body;
    switch (state.view) {
      case 'register': body = registerViewHtml(); break;
      case 'forgot': body = forgotViewHtml(); break;
      case 'forgot-done': body = forgotDoneHtml(); break;
      case 'reset': body = resetViewHtml(); break;
      case 'verify': body = verifyViewHtml('pending'); break;
      case 'notice': body = noticeViewHtml(state.noticeUser || currentUser()); break;
      default: body = loginViewHtml();
    }
    page.innerHTML = '<div class="auth-panel">' + body + '</div>';
    wireLoginPage(page);

    if ((state.view === 'login' || state.view === 'register') && !state.featuresLoaded) {
      const view = state.view;
      loadFeatures().then(() => {
        if (state.view === view && page.isConnected) fillDiscordSlots(page);
      });
    } else {
      fillDiscordSlots(page);
    }

    const first = page.querySelector('input:not([disabled])');
    if (first && window.matchMedia && !window.matchMedia('(max-width: 768px)').matches) {
      try { first.focus({ preventScroll: true }); } catch { /* ignore */ }
    }
  }

  function wireLoginPage(page) {
    const loginForm = $(page, 'form[data-auth-form="login"]');
    if (loginForm) loginForm.addEventListener('submit', onLoginSubmit);
    const regForm = $(page, 'form[data-auth-form="register"]');
    if (regForm) {
      regForm.addEventListener('submit', onRegisterSubmit);
      const invite = regForm.querySelector('input[name="inviteCode"]');
      if (invite) invite.addEventListener('input', () => { invite.value = invite.value.toUpperCase().replace(/\s+/g, ''); });
    }
    const forgotForm = $(page, 'form[data-auth-form="forgot"]');
    if (forgotForm) forgotForm.addEventListener('submit', onForgotSubmit);
    const resetForm = $(page, 'form[data-auth-form="reset"]');
    if (resetForm) resetForm.addEventListener('submit', onResetSubmit);
    page.querySelectorAll('[data-auth-resend]').forEach((btn) => btn.addEventListener('click', onResendVerification));
    page.querySelectorAll('[data-auth-signout]').forEach((btn) => btn.addEventListener('click', () => {
      const a = app();
      if (a && typeof a.logout === 'function') a.logout();
    }));
    const cont = $(page, '[data-auth-continue]');
    if (cont) cont.addEventListener('click', (ev) => { ev.preventDefault(); finishVerifiedLogin(); });
    wireDiscordButtons(page);
  }

  function readForm(form) {
    const out = {};
    new FormData(form).forEach((v, k) => { out[k] = typeof v === 'string' ? v : ''; });
    return out;
  }

  async function onLoginSubmit(ev) {
    ev.preventDefault();
    const form = ev.currentTarget;
    const data = readForm(form);
    const email = (data.email || '').trim();
    if (!email || !data.password) { setInlineError(form, 'Please enter your email and password.'); return; }
    setInlineError(form, null);
    setBusy(form, true);
    try {
      const res = await window.OLCloud.auth.login(email, data.password);
      afterAuth(res && res.user);
    } catch (err) {
      setBusy(form, false);
      setInlineError(form, errMessage(err));
      notify(errMessage(err), 'error');
    }
  }

  async function onRegisterSubmit(ev) {
    ev.preventDefault();
    const form = ev.currentTarget;
    const data = readForm(form);
    const displayName = (data.displayName || '').trim();
    const email = (data.email || '').trim();
    const password = data.password || '';
    const inviteCode = (data.inviteCode || '').trim().toUpperCase();
    if (displayName.length < 2) { setInlineError(form, 'Display name must be at least 2 characters.'); return; }
    if (!email) { setInlineError(form, 'Please enter your email address.'); return; }
    if (password.length < 8) { setInlineError(form, 'Password must be at least 8 characters.'); return; }
    if (!inviteCode) { setInlineError(form, 'An invite code is required.'); return; }
    setInlineError(form, null);
    setBusy(form, true);
    try {
      const res = await window.OLCloud.auth.register({ displayName, email, password, inviteCode });
      notify('Account created. Please confirm your email address.', 'success');
      afterAuth(res && res.user);
    } catch (err) {
      setBusy(form, false);
      setInlineError(form, errMessage(err));
      notify(errMessage(err), 'error');
    }
  }

  async function onForgotSubmit(ev) {
    ev.preventDefault();
    const form = ev.currentTarget;
    const email = (readForm(form).email || '').trim();
    if (!email) { setInlineError(form, 'Please enter your email address.'); return; }
    setInlineError(form, null);
    setBusy(form, true);
    try {
      await window.OLCloud.auth.forgotPassword(email);
    } catch (err) {
      // Deliberately swallow 4xx/5xx so the endpoint cannot be probed; only surface network errors.
      if (err && err.status === 0) {
        setBusy(form, false);
        setInlineError(form, errMessage(err));
        return;
      }
    }
    state.view = 'forgot-done';
    renderLoginPage();
  }

  async function onResetSubmit(ev) {
    ev.preventDefault();
    const form = ev.currentTarget;
    const data = readForm(form);
    const token = state.params.token;
    if (!token) { setInlineError(form, 'This link is missing its token.'); return; }
    if ((data.password || '').length < 8) { setInlineError(form, 'Password must be at least 8 characters.'); return; }
    if (data.password !== data.confirm) { setInlineError(form, 'The passwords do not match.'); return; }
    setInlineError(form, null);
    setBusy(form, true);
    try {
      const res = await window.OLCloud.auth.resetPassword(token, data.password);
      notify('Your password has been updated.', 'success');
      afterAuth(res && res.user);
    } catch (err) {
      setBusy(form, false);
      setInlineError(form, errMessage(err));
      notify(errMessage(err), 'error');
    }
  }

  async function onResendVerification(ev) {
    const btn = ev.currentTarget;
    const page = document.getElementById(LOGIN_PAGE_ID);
    const errBox = page ? page.querySelector('[data-auth-notice]') : null;
    btn.disabled = true;
    const label = btn.innerHTML;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sending…';
    try {
      await window.OLCloud.auth.resendVerification();
      notify('Confirmation email sent.', 'success');
      setInlineError(errBox, null);
      btn.innerHTML = '<i class="fas fa-check"></i> Sent';
      setTimeout(() => { btn.innerHTML = label; btn.disabled = false; }, 30000);
    } catch (err) {
      notify(errMessage(err), 'error');
      setInlineError(errBox, errMessage(err));
      btn.innerHTML = label;
      btn.disabled = false;
    }
  }

  function afterAuth(user) {
    const a = app();
    if (user && a) a.currentUser = user;
    if (a && typeof a.onAuthenticated === 'function') {
      try { a.onAuthenticated(user); return; } catch (err) { console.error('[OLAuthUI] onAuthenticated failed', err); }
    }
    navigate('#/');
  }

  async function runVerifyEmail(token) {
    const page = document.getElementById(LOGIN_PAGE_ID);
    if (!page) return;
    const render = (stage, msg) => {
      if (state.view !== 'verify') return;
      page.innerHTML = '<div class="auth-panel">' + verifyViewHtml(stage, msg) + '</div>';
      wireLoginPage(page);
    };
    if (!token) { render('error', 'This link is missing its token. Please use the link from your email.'); return; }
    if (state.verifyRunFor === token) return; // avoid double-consuming the token on re-render
    state.verifyRunFor = token;
    try {
      await window.OLCloud.auth.verifyEmail(token);
    } catch (err) {
      state.verifyRunFor = null;
      render('error', errMessage(err));
      return;
    }
    // Refresh the session so emailVerified is current.
    let user = null;
    try {
      const me = await window.OLCloud.auth.me();
      if (me && me.features) { features.discord = !!me.features.discord; features.email = me.features.email !== false; state.featuresLoaded = true; }
      user = me && me.user ? me.user : null;
    } catch { /* ignore, fall through */ }
    const a = app();
    if (a) a.currentUser = user;
    if (user) {
      render('success', 'Thank you! Your email address has been verified. Taking you to your characters…');
      notify('Email address confirmed.', 'success');
      setTimeout(finishVerifiedLogin, 1200);
    } else {
      render('success', 'Thank you! Your email address has been verified. You can now sign in.');
      const cont = page.querySelector('[data-auth-continue]');
      if (cont) { cont.setAttribute('href', '#/login'); cont.innerHTML = '<i class="fas fa-sign-in-alt"></i> Sign in'; }
    }
  }

  function finishVerifiedLogin() {
    const user = currentUser();
    if (user) afterAuth(user);
    else navigate('#/login');
  }

  function showVerifyNotice(user) {
    mount();
    state.view = 'notice';
    state.noticeUser = user || currentUser();
    renderLoginPage();
    showPage(LOGIN_PAGE_ID);
  }

  // ---- account page ---------------------------------------------------------

  function renderAccountPage() {
    const page = document.getElementById(ACCOUNT_PAGE_ID);
    if (!page) return;
    const user = currentUser();
    if (!user) {
      page.innerHTML =
        '<div class="page-header">' +
          '<button type="button" class="btn btn-secondary" data-account-back><i class="fas fa-arrow-left"></i> Back to Overview</button>' +
          '<h2>My account</h2>' +
        '</div>' +
        '<div class="empty-state"><i class="fas fa-user-lock"></i><h3 class="mb-sm">You are not signed in</h3>' +
        '<p class="text-secondary mb-lg">Sign in to manage your account.</p>' +
        '<a href="#/login" class="btn btn-primary">Sign in</a></div>';
      wireAccountPage(page);
      return;
    }

    const verifiedBadge = user.emailVerified
      ? '<span class="account-badge verified"><i class="fas fa-check-circle"></i> Verified</span>'
      : '<span class="account-badge unverified"><i class="fas fa-exclamation-circle"></i> Not verified</span>';

    const discordBlock = user.discordLinked
      ? '<div class="account-row">' +
          '<div class="account-row-main"><span class="account-discord-icon"><i class="fab fa-discord"></i></span>' +
          '<div><div class="account-row-label">Linked as</div><div class="account-row-value">' + esc(user.discordUsername || 'Discord user') + '</div></div></div>' +
          '<span class="account-badge verified"><i class="fas fa-link"></i> Linked</span>' +
        '</div>'
      : '<div class="account-row">' +
          '<div class="account-row-main"><span class="account-discord-icon muted"><i class="fab fa-discord"></i></span>' +
          '<div><div class="account-row-label">Discord</div><div class="account-row-value text-secondary">Not linked</div></div></div>' +
          (features.discord || !state.featuresLoaded
            ? '<button type="button" class="btn btn-discord btn-small" data-account-link-discord><i class="fab fa-discord"></i> Link Discord</button>'
            : '<span class="text-secondary">Not available</span>') +
        '</div>';

    page.innerHTML =
      '<div class="page-header">' +
        '<button type="button" class="btn btn-secondary" data-account-back><i class="fas fa-arrow-left"></i> Back to Overview</button>' +
        '<h2>My account</h2>' +
        '<p class="text-secondary">Manage your profile, email, Discord link and password</p>' +
      '</div>' +
      '<div class="account-grid">' +

        '<section class="account-card">' +
          '<div class="account-card-header"><div class="account-avatar large">' + esc(initials(user.displayName || user.email)) + '</div>' +
            '<div><h3>' + esc(user.displayName || 'Unnamed') + '</h3>' +
            '<div class="account-role">' + (user.role === 'admin' ? '<i class="fas fa-shield-alt"></i> Administrator' : '<i class="fas fa-user"></i> Player') + '</div></div>' +
          '</div>' +
          '<form class="account-form" data-account-form="profile" novalidate>' +
            '<div class="auth-error" role="alert" style="display:none"></div>' +
            '<div class="form-group">' +
              '<label for="accountDisplayName">Display name</label>' +
              '<input id="accountDisplayName" name="displayName" type="text" minlength="2" maxlength="100" required value="' + esc(user.displayName || '') + '">' +
              '<small>Shown to other members of your groups. 2-100 characters.</small>' +
            '</div>' +
            '<div class="account-actions"><button type="submit" class="btn btn-primary"><i class="fas fa-save"></i> Save name</button></div>' +
          '</form>' +
        '</section>' +

        '<section class="account-card">' +
          '<h3><i class="fas fa-envelope"></i> Email</h3>' +
          '<div class="account-row">' +
            '<div class="account-row-main"><div><div class="account-row-label">Address</div><div class="account-row-value account-email">' + esc(user.email) + '</div></div></div>' +
            verifiedBadge +
          '</div>' +
          (user.emailVerified ? '' :
            '<p class="account-hint">Your email address is not confirmed yet. Check your inbox for the confirmation link.</p>' +
            '<div class="account-actions"><button type="button" class="btn btn-secondary btn-small" data-account-resend><i class="fas fa-redo"></i> Resend confirmation email</button></div>') +
        '</section>' +

        '<section class="account-card">' +
          '<h3><i class="fab fa-discord"></i> Discord</h3>' +
          discordBlock +
          (user.discordLinked ? '' : '<p class="account-hint">Link your Discord account to sign in with one click.</p>') +
        '</section>' +

        '<section class="account-card">' +
          '<h3><i class="fas fa-key"></i> ' + (user.hasPassword ? 'Change password' : 'Set a password') + '</h3>' +
          (user.hasPassword ? '' : '<p class="account-hint">You signed up with Discord. Set a password to also sign in with your email address.</p>') +
          '<form class="account-form" data-account-form="password" novalidate>' +
            '<div class="auth-error" role="alert" style="display:none"></div>' +
            (user.hasPassword ?
              '<div class="form-group">' +
                '<label for="accountCurrentPassword">Current password</label>' +
                '<input id="accountCurrentPassword" name="currentPassword" type="password" autocomplete="current-password" required>' +
              '</div>' : '') +
            '<div class="form-group">' +
              '<label for="accountNewPassword">New password</label>' +
              '<input id="accountNewPassword" name="newPassword" type="password" autocomplete="new-password" required minlength="8" placeholder="At least 8 characters">' +
            '</div>' +
            '<div class="form-group">' +
              '<label for="accountConfirmPassword">Confirm new password</label>' +
              '<input id="accountConfirmPassword" name="confirm" type="password" autocomplete="new-password" required minlength="8">' +
            '</div>' +
            '<div class="account-actions"><button type="submit" class="btn btn-primary"><i class="fas fa-key"></i> ' + (user.hasPassword ? 'Change password' : 'Set password') + '</button></div>' +
          '</form>' +
        '</section>' +

        '<section class="account-card account-card-danger">' +
          '<h3><i class="fas fa-sign-out-alt"></i> Session</h3>' +
          '<p class="account-hint">Sign out of this device. Your characters stay safely stored on the server.</p>' +
          '<div class="account-actions"><button type="button" class="btn btn-danger" data-account-signout><i class="fas fa-sign-out-alt"></i> Sign out</button></div>' +
        '</section>' +

      '</div>';

    wireAccountPage(page);
  }

  function wireAccountPage(page) {
    const back = $(page, '[data-account-back]');
    if (back) back.addEventListener('click', () => navigate('#/'));
    const profile = $(page, 'form[data-account-form="profile"]');
    if (profile) profile.addEventListener('submit', onProfileSubmit);
    const pw = $(page, 'form[data-account-form="password"]');
    if (pw) pw.addEventListener('submit', onChangePasswordSubmit);
    const link = $(page, '[data-account-link-discord]');
    if (link) link.addEventListener('click', () => {
      if (!window.OLCloud || !window.OLCloud.auth) return;
      link.disabled = true;
      location.href = window.OLCloud.auth.discordLoginUrl();
    });
    const resend = $(page, '[data-account-resend]');
    if (resend) resend.addEventListener('click', onResendVerification);
    const out = $(page, '[data-account-signout]');
    if (out) out.addEventListener('click', () => {
      const a = app();
      if (a && typeof a.logout === 'function') a.logout();
    });
  }

  async function refreshAccountFromServer() {
    if (!window.OLCloud || !window.OLCloud.auth) return;
    try {
      const me = await window.OLCloud.auth.me();
      if (me && me.features) { features.discord = !!me.features.discord; features.email = me.features.email !== false; state.featuresLoaded = true; }
      const a = app();
      const before = JSON.stringify(currentUser());
      if (a) a.currentUser = me && me.user ? me.user : null;
      const page = document.getElementById(ACCOUNT_PAGE_ID);
      if (page && page.style.display !== 'none' && JSON.stringify(currentUser()) !== before) {
        renderAccountPage();
        renderUserMenu(currentUser());
      } else if (page && page.style.display !== 'none' && !page.querySelector('[data-account-link-discord]') && !state.featuresLoaded) {
        renderAccountPage();
      }
    } catch (err) {
      if (err && err.status === 401) { const a = app(); if (a) a.currentUser = null; renderAccountPage(); }
    }
  }

  async function onProfileSubmit(ev) {
    ev.preventDefault();
    const form = ev.currentTarget;
    const displayName = (readForm(form).displayName || '').trim();
    if (displayName.length < 2 || displayName.length > 100) { setInlineError(form, 'Display name must be 2-100 characters.'); return; }
    setInlineError(form, null);
    setBusy(form, true);
    try {
      const res = await window.OLCloud.auth.updateProfile(displayName);
      const a = app();
      const user = (res && res.user) || Object.assign({}, currentUser(), { displayName });
      if (a) a.currentUser = user;
      notify('Display name updated.', 'success');
      renderAccountPage();
      renderUserMenu(user);
    } catch (err) {
      setBusy(form, false);
      setInlineError(form, errMessage(err));
      notify(errMessage(err), 'error');
    }
  }

  async function onChangePasswordSubmit(ev) {
    ev.preventDefault();
    const form = ev.currentTarget;
    const data = readForm(form);
    const user = currentUser() || {};
    if (user.hasPassword && !data.currentPassword) { setInlineError(form, 'Please enter your current password.'); return; }
    if ((data.newPassword || '').length < 8) { setInlineError(form, 'The new password must be at least 8 characters.'); return; }
    if (data.newPassword !== data.confirm) { setInlineError(form, 'The passwords do not match.'); return; }
    setInlineError(form, null);
    setBusy(form, true);
    try {
      await window.OLCloud.auth.changePassword(data.currentPassword || '', data.newPassword);
      notify(user.hasPassword ? 'Password changed.' : 'Password set. You can now sign in with your email address.', 'success');
      const a = app();
      if (a && a.currentUser) a.currentUser.hasPassword = true;
      renderAccountPage();
    } catch (err) {
      setBusy(form, false);
      setInlineError(form, errMessage(err));
      notify(errMessage(err), 'error');
    }
  }

  // ---- user menu ------------------------------------------------------------

  function subscribeSync() {
    if (state.subscribed || !window.OLCloud) return;
    state.subscribed = true;
    try {
      if (window.OLCloud.sync && typeof window.OLCloud.sync.on === 'function') {
        state.syncStatus = window.OLCloud.sync.status || 'idle';
        window.OLCloud.sync.on('status', (ev) => {
          state.pushedStatus = null;
          state.syncStatus = (ev && ev.status) || 'idle';
          state.syncDetail = ev ? ev.detail : null;
          updateSyncStatusLine();
        });
      }
      if (window.OLCloud.ws && typeof window.OLCloud.ws.on === 'function') {
        state.wsOpen = !!window.OLCloud.ws.connected;
        window.OLCloud.ws.on('open', () => { state.wsOpen = true; state.wsSeen = true; updateSyncStatusLine(); });
        window.OLCloud.ws.on('close', () => { state.wsOpen = false; updateSyncStatusLine(); });
      }
    } catch (err) {
      console.warn('[OLAuthUI] sync subscription failed', err);
    }
    window.addEventListener('online', updateSyncStatusLine);
    window.addEventListener('offline', updateSyncStatusLine);
  }

  function computeSyncStatus() {
    if (state.pushedStatus) return state.pushedStatus;
    const s = state.syncStatus;
    const detail = state.syncDetail;
    const offline = typeof navigator !== 'undefined' && navigator.onLine === false;
    if (s === 'saving') return { key: 'saving', label: 'Saving…', title: 'Sending changes to the server' };
    if (s === 'offline' || offline) return { key: 'offline', label: 'Offline – changes queued', title: 'Changes will be sent when you are back online' };
    if (s === 'error') {
      const msg = detail && detail.message ? detail.message : 'Could not save changes';
      return { key: 'error', label: 'Error', title: msg, detail: msg };
    }
    if (state.wsSeen && !state.wsOpen) return { key: 'reconnecting', label: 'Reconnecting…', title: 'Live connection lost, retrying' };
    return { key: 'saved', label: 'Saved', title: 'All changes are saved' };
  }

  function syncStatusHtml() {
    const st = computeSyncStatus();
    return '<span class="sync-dot sync-' + esc(st.key) + '"></span><span class="sync-label">' + esc(st.label) + '</span>' +
      (st.detail ? '<span class="sync-detail">' + esc(st.detail) + '</span>' : '');
  }

  function updateSyncStatusLine() {
    const line = document.querySelector('#userMenu .user-menu-sync');
    if (!line) return;
    const st = computeSyncStatus();
    line.innerHTML = syncStatusHtml();
    line.title = st.title || '';
    const avatar = document.querySelector('#userMenu .user-menu-avatar');
    if (avatar) avatar.setAttribute('data-sync', st.key);
  }

  function setSyncStatus(status, detail) {
    const map = {
      idle: { key: 'saved', label: 'Saved' },
      saved: { key: 'saved', label: 'Saved' },
      saving: { key: 'saving', label: 'Saving…' },
      offline: { key: 'offline', label: 'Offline – changes queued' },
      error: { key: 'error', label: 'Error' },
      reconnecting: { key: 'reconnecting', label: 'Reconnecting…' },
    };
    if (!status) { state.pushedStatus = null; updateSyncStatusLine(); return; }
    const base = map[status] || { key: 'saved', label: String(status) };
    const d = detail && typeof detail === 'object' ? detail.message : detail;
    state.pushedStatus = Object.assign({ title: d || base.label, detail: status === 'error' && d ? String(d) : null }, base);
    updateSyncStatusLine();
  }

  function renderUserMenu(user) {
    const host = document.getElementById('userMenu');
    if (!host) return;
    state.menuUser = user || null;
    closeMenu();
    if (!user) { host.innerHTML = ''; host.classList.remove('has-user'); return; }
    host.classList.add('has-user');
    subscribeSync();
    const name = user.displayName || user.email || 'Account';
    host.innerHTML =
      '<div class="user-menu">' +
        '<button type="button" class="user-menu-toggle" aria-haspopup="true" aria-expanded="false" title="' + esc(name) + '">' +
          '<span class="user-menu-avatar" data-sync="saved">' + esc(initials(name)) + '</span>' +
          '<span class="user-menu-name">' + esc(name) + '</span>' +
          '<i class="fas fa-chevron-down user-menu-caret"></i>' +
        '</button>' +
        '<div class="user-menu-dropdown" role="menu" hidden>' +
          '<div class="user-menu-header">' +
            '<div class="user-menu-header-name">' + esc(name) + '</div>' +
            '<div class="user-menu-header-email">' + esc(user.email || '') + '</div>' +
          '</div>' +
          '<a href="#/account" class="user-menu-item" role="menuitem"><i class="fas fa-user-circle"></i> My account</a>' +
          '<a href="#/groups" class="user-menu-item" role="menuitem"><i class="fas fa-users"></i> Groups</a>' +
          (user.role === 'admin' ? '<a href="#/admin" class="user-menu-item" role="menuitem"><i class="fas fa-shield-alt"></i> Admin</a>' : '') +
          '<button type="button" class="user-menu-item" role="menuitem" data-menu-feedback><i class="fas fa-bug"></i> Bug report / feature request</button>' +
          '<div class="user-menu-sync" aria-live="polite">' + syncStatusHtml() + '</div>' +
          '<button type="button" class="user-menu-item user-menu-signout" role="menuitem" data-menu-signout><i class="fas fa-sign-out-alt"></i> Sign out</button>' +
        '</div>' +
      '</div>';

    const toggle = host.querySelector('.user-menu-toggle');
    if (toggle) toggle.addEventListener('click', (ev) => { ev.stopPropagation(); state.menuOpen ? closeMenu() : openMenu(); });
    host.querySelectorAll('.user-menu-item[href]').forEach((a) => a.addEventListener('click', () => closeMenu()));
    const feedback = host.querySelector('[data-menu-feedback]');
    if (feedback) feedback.addEventListener('click', () => {
      closeMenu();
      if (window.OLFeedbackUI) window.OLFeedbackUI.open('bug');
    });
    const signout = host.querySelector('[data-menu-signout]');
    if (signout) signout.addEventListener('click', () => {
      closeMenu();
      const a = app();
      if (a && typeof a.logout === 'function') a.logout();
    });
    updateSyncStatusLine();
  }

  function openMenu() {
    const host = document.getElementById('userMenu');
    const dd = host ? host.querySelector('.user-menu-dropdown') : null;
    const toggle = host ? host.querySelector('.user-menu-toggle') : null;
    if (!dd) return;
    dd.hidden = false;
    if (toggle) toggle.setAttribute('aria-expanded', 'true');
    state.menuOpen = true;
    positionMenu();
    updateSyncStatusLine();
    setTimeout(() => {
      document.addEventListener('click', onDocClick);
      document.addEventListener('keydown', onDocKey);
      window.addEventListener('scroll', onViewportChange, { passive: true });
      window.addEventListener('resize', onViewportChange);
    }, 0);
  }

  // The header / app container may clip overflow (styles.css does so on
  // mobile), so the dropdown is positioned fixed relative to the toggle.
  function positionMenu() {
    const host = document.getElementById('userMenu');
    const dd = host ? host.querySelector('.user-menu-dropdown') : null;
    const toggle = host ? host.querySelector('.user-menu-toggle') : null;
    if (!dd || !toggle) return;
    const rect = toggle.getBoundingClientRect();
    const margin = 8;
    const vw = window.innerWidth || document.documentElement.clientWidth;
    const vh = window.innerHeight || document.documentElement.clientHeight;
    dd.style.position = 'fixed';
    dd.style.top = Math.round(rect.bottom + 6) + 'px';
    dd.style.right = Math.max(margin, Math.round(vw - rect.right)) + 'px';
    dd.style.left = 'auto';
    dd.style.maxWidth = Math.max(200, vw - 2 * margin) + 'px';
    dd.style.maxHeight = Math.max(120, vh - rect.bottom - 6 - margin) + 'px';
    dd.style.overflowY = 'auto';
  }

  function onViewportChange() {
    if (state.menuOpen) closeMenu();
  }

  function closeMenu() {
    const host = document.getElementById('userMenu');
    const dd = host ? host.querySelector('.user-menu-dropdown') : null;
    const toggle = host ? host.querySelector('.user-menu-toggle') : null;
    if (dd) dd.hidden = true;
    if (toggle) toggle.setAttribute('aria-expanded', 'false');
    state.menuOpen = false;
    document.removeEventListener('click', onDocClick);
    document.removeEventListener('keydown', onDocKey);
    window.removeEventListener('scroll', onViewportChange);
    window.removeEventListener('resize', onViewportChange);
  }

  function onDocClick(ev) {
    const host = document.getElementById('userMenu');
    if (host && host.contains(ev.target)) return;
    closeMenu();
  }

  function onDocKey(ev) {
    if (ev.key === 'Escape') {
      closeMenu();
      const toggle = document.querySelector('#userMenu .user-menu-toggle');
      if (toggle) toggle.focus();
    }
  }

  // ---- export ---------------------------------------------------------------

  window.OLAuthUI = {
    mount,
    show,
    renderUserMenu,
    showVerifyNotice,
    setSyncStatus,
    loadFeatures,
    pageIds: { login: LOGIN_PAGE_ID, account: ACCOUNT_PAGE_ID },
  };

  // OLAuthUI.features: readable cache of { discord, email }; assigning an object
  // (e.g. from the integrator's own auth.me() call) updates the cache in place.
  Object.defineProperty(window.OLAuthUI, 'features', {
    enumerable: true,
    get() { return features; },
    set(value) {
      if (value && typeof value === 'object') {
        features.discord = !!value.discord;
        features.email = value.email !== false;
        state.featuresLoaded = true;
      }
    },
  });

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => { try { mount(); } catch (err) { console.error('[OLAuthUI] mount failed', err); } });
  } else {
    try { mount(); } catch (err) { console.error('[OLAuthUI] mount failed', err); }
  }
})();
