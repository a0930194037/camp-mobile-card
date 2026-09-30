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
  let applyingRemote = false;
  let appliedInitialRemoteState = false;
  let currentStatus = sync.signedIn() ? '正在確認同步狀態' : '離線：尚未登入同步帳號';
  const nativeSave = store.save.bind(store);
  store.save = async function syncedSave() {
    const before = structuredClone(sync.record.baseline ?? state);
    await nativeSave();
    if (!applyingRemote) sync.queue(before, state);
  };

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
    light.title = '長按查看同步狀態；點一下開啟設定';
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

  async function replaceState(next) {
    if (!next || typeof next !== 'object') return;
    applyingRemote = true;
    try {
      // Sync data, not navigation. Retain the current screen and selection so
      // a completed background sync never interrupts a checklist or editor.
      const view = {
        page: state.page,
        activeTripId: state.activeTripId,
        pendingDeleteTripId: state.pendingDeleteTripId,
        pendingPurgeId: state.pendingPurgeId
      };
      state = { ...next, ...view };
      await nativeSave();
      if (!appliedInitialRemoteState) { appliedInitialRemoteState = true; render(); }
    }
    finally { applyingRemote = false; }
  }
  async function runSync() {
    if (!sync.signedIn()) { setStatus('離線：尚未登入同步帳號'); return false; }
    setStatus('正在確認同步狀態');
    return sync.sync(() => state, replaceState);
  }

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
    root.querySelector('[data-sync-now]')?.addEventListener('click', runSync);
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
  if (sync.signedIn()) { await runSync(); setInterval(runSync, 15000); }
})();
