/* Desktop side-panel adapter for sync-engine.js. */
(async function () {
  const waitForState = () => new Promise(resolve => {
    const timer = setInterval(() => { if (typeof state !== 'undefined' && state) { clearInterval(timer); resolve(); } }, 30);
  });
  await waitForState();

  const storage = {
    async get(name) { return (await chrome.storage.local.get(name))[name]; },
    async set(name, value) { await chrome.storage.local.set({ [name]: value }); }
  };
  const sync = new CampSync(storage, 'camp-sync.v1');
  await sync.load();
  await sync.backup(state);
  let applyingRemote = false;
  let committing = Promise.resolve();
  let pendingCommitCount = 0;
  let pendingRemoteState = null;
  let remoteApplyTimer = null;
  let interactionUntil = 0;
  let appliedInitialRemoteState = false;
  let currentStatus = sync.signedIn() ? '正在確認同步狀態' : '離線：尚未登入同步帳號';
  const nativeSave = store.save.bind(store);
  store.save = async function syncedSave() {
    // Every existing UI handler reaches this one transaction boundary.  A
    // serial queue avoids a rapid double click generating interleaved diffs.
    const commit = async () => {
      try {
        const after = structuredClone(state);
        await nativeSave();
        if (!applyingRemote) sync.queue(after);
      } finally { pendingCommitCount--; scheduleRemoteApply(); }
    };
    pendingCommitCount++;
    committing = committing.then(commit, commit);
    return committing;
  };
  globalThis.commitMutation = async function commitMutation(mutator) {
    const run = async () => {
      try { await mutator(); const after = structuredClone(state); await nativeSave(); if (!applyingRemote) sync.queue(after); }
      finally { pendingCommitCount--; scheduleRemoteApply(); }
    };
    pendingCommitCount++;
    committing = committing.then(run, run);
    return committing;
  };

  function postponeInteraction(milliseconds = 180) {
    interactionUntil = Math.max(interactionUntil, Date.now() + milliseconds);
    scheduleRemoteApply(milliseconds + 20);
  }
  function interactionIsOpen() {
    if (pendingCommitCount || document.querySelector('.dialog, details[open]')) return true;
    const active = document.activeElement;
    const editingText = active?.matches?.('textarea, input:not([type="checkbox"]):not([type="radio"]):not([type="button"]):not([type="submit"])');
    return !!editingText || Date.now() < interactionUntil;
  }
  function scheduleRemoteApply(delay = 180) {
    if (remoteApplyTimer) clearTimeout(remoteApplyTimer);
    remoteApplyTimer = setTimeout(() => {
      remoteApplyTimer = null;
      if (!pendingRemoteState || interactionIsOpen()) { if (pendingRemoteState) scheduleRemoteApply(220); return; }
      const next = pendingRemoteState;
      pendingRemoteState = null;
      applyRemoteState(next);
    }, delay);
  }
  function applyRemoteState(next) {
    if (!next || interactionIsOpen()) { pendingRemoteState = next; scheduleRemoteApply(); return; }
    applyingRemote = true;
    try {
      const view = { page: state.page, pendingDeleteTripId: state.pendingDeleteTripId, pendingPurgeId: state.pendingPurgeId };
      const scrollTop = document.scrollingElement?.scrollTop || 0;
      state = { ...next, ...view };
      Promise.resolve(nativeSave()).catch(console.error);
      render();
      requestAnimationFrame(() => { if (document.scrollingElement) document.scrollingElement.scrollTop = scrollTop; });
      appliedInitialRemoteState = true;
    } finally { applyingRemote = false; }
  }
  // A remote sync must never close native selects, open details, or a form.
  document.addEventListener('pointerdown', event => postponeInteraction(event.target?.matches?.('select, input, textarea, button, summary') ? 900 : 240), true);
  document.addEventListener('pointerup', () => postponeInteraction(160), true);
  document.addEventListener('focusin', event => { if (event.target?.matches?.('select, input, textarea')) postponeInteraction(event.target.matches('select') ? 900 : 240); }, true);
  document.addEventListener('focusout', () => postponeInteraction(140), true);
  document.addEventListener('change', event => { if (event.target?.matches?.('select, input')) postponeInteraction(260); }, true);
  document.addEventListener('toggle', event => { if (event.target?.matches?.('details')) postponeInteraction(180); }, true);

  const light = document.createElement('button');
  light.type = 'button'; light.className = 'camp-sync-light';
  light.setAttribute('aria-label', '同步狀態');
  document.body.append(light);
  function placeSyncLight() {
    const tools = document.querySelector('.brand-tools');
    if (tools) tools.append(light);
  }

  function setStatus(text) {
    currentStatus = text;
    const online = text === '已同步';
    const offline = text.startsWith('等待同步') || text.includes('尚未登入') || text.includes('離線');
    light.className = `camp-sync-light ${online ? 'is-online' : offline ? 'is-offline' : 'is-syncing'}`;
    light.title = '長按查看同步狀態';
    light.setAttribute('aria-label', text);
  }
  sync.onStatus = setStatus;
  setStatus(currentStatus);

  function showStatusDetail() {
    document.querySelector('.camp-sync-tooltip')?.remove();
    const tip = document.createElement('div');
    tip.className = 'camp-sync-tooltip';
    tip.textContent = currentStatus;
    document.body.append(tip);
    setTimeout(() => tip.remove(), 2600);
  }
  let holdTimer;
  light.addEventListener('pointerdown', () => { holdTimer = setTimeout(showStatusDetail, 550); });
  ['pointerup', 'pointercancel', 'pointerleave'].forEach(type => light.addEventListener(type, () => clearTimeout(holdTimer)));

  function replaceState(next) {
    if (!next || typeof next !== 'object') return;
    // Keep only the latest remote state while any control is actively used.
    // Applying it later avoids destroying native dropdowns and focused forms.
    pendingRemoteState = next;
    scheduleRemoteApply(0);
  }
  async function runSync(announce = false) {
    if (!sync.signedIn()) { setStatus('離線：尚未登入同步帳號'); return false; }
    // Background polling is intentionally silent: the green lamp represents
    // a healthy connection and must not blink yellow every second.
    if (announce || sync.record.pending.length) setStatus('正在同步');
    return sync.sync(() => state, replaceState);
  }
  sync.onQueue = runSync;

  function syncSettingsMarkup() {
    const email = sync.record.session?.user?.email || '';
    if (sync.signedIn()) return `<section class="field full sync-settings"><label>跨裝置同步</label><p class="tiny">${esc(email || '已登入同步帳號')} · ${esc(currentStatus)}</p><div class="actions"><button type="button" class="secondary" data-sync-now>立即同步</button><button type="button" class="ghost danger" data-sync-logout>登出同步帳號</button></div></section>`;
    return `<section class="field full sync-settings"><label>跨裝置同步</label><p class="tiny">${esc(currentStatus)}。登入後會在開啟工具及重新連線時自動同步。</p><div class="form-grid"><div class="field"><label>Email</label><input type="email" data-sync-email autocomplete="email"></div><div class="field"><label>密碼</label><input type="password" data-sync-password autocomplete="current-password" minlength="8"></div></div><p class="tiny" data-sync-message></p><div class="actions"><button type="button" class="primary" data-sync-login>登入</button><button type="button" class="secondary" data-sync-signup>首次建立帳號</button><button type="button" class="ghost" data-sync-resend>重寄驗證信</button></div></section>`;
  }
  async function authFromSettings(root, kind) {
    const email = root.querySelector('[data-sync-email]')?.value.trim();
    const password = root.querySelector('[data-sync-password]')?.value;
    const message = root.querySelector('[data-sync-message]');
    if (!email || !password) { message.textContent = '請輸入 Email 與密碼。'; return; }
    try {
      message.textContent = '處理中…';
      if (kind === 'signup') await sync.signUp(email, password); else await sync.signIn(email, password);
      await runSync();
      const settings = root.closest('.dialog');
      settings?.remove();
      openSettingsDialog();
    } catch (error) { message.textContent = error.message; setStatus(`等待同步：${error.message}`); }
  }
  function enhanceSettings() {
    const root = document.querySelector('.dialog:last-of-type');
    const form = root?.querySelector('#settings-form');
    if (!root || !form || form.querySelector('.sync-settings')) return;
    const actions = form.querySelector(':scope > .actions');
    actions?.insertAdjacentHTML('beforebegin', syncSettingsMarkup());
    root.querySelector('[data-sync-now]')?.addEventListener('click', () => runSync(true));
    root.querySelector('[data-sync-logout]')?.addEventListener('click', async () => { await sync.signOut(); setStatus('離線：尚未登入同步帳號'); root.remove(); openSettingsDialog(); });
    root.querySelector('[data-sync-login]')?.addEventListener('click', () => authFromSettings(root, 'login'));
    root.querySelector('[data-sync-signup]')?.addEventListener('click', () => authFromSettings(root, 'signup'));
    root.querySelector('[data-sync-resend]')?.addEventListener('click', async () => {
      const email = root.querySelector('[data-sync-email]')?.value.trim();
      const message = root.querySelector('[data-sync-message]');
      if (!email) { message.textContent = '請先輸入 Email。'; return; }
      try { await sync.resendVerification(email); message.textContent = '已重寄驗證信；請只開啟最新的一封。'; }
      catch (error) { message.textContent = error.message; }
    });
  }
  const originalOpenSettings = openSettingsDialog;
  openSettingsDialog = function openSettingsWithSync() { originalOpenSettings(); enhanceSettings(); };
  // The indicator is intentionally passive on a short press.  Sync account
  // controls live in Settings; a long press is reserved for status details.
  light.onclick = event => event.preventDefault();
  const plannerRender = render;
  render = function renderWithSyncLight() { plannerRender(); placeSyncLight(); };
  placeSyncLight();
  if (sync.signedIn()) {
    await runSync();
    setInterval(() => { if (document.visibilityState === 'visible') runSync(); }, 1000);
  }
})();
