/* Offline-first Supabase synchronisation without an external SDK.
   Every local save is reduced to small JSON paths. Queued paths survive
   restarts, and the server applies them atomically to the signed-in user's
   document. Concurrent edits only conflict when both devices edit the exact
   same field; the most recently synchronised edit then wins. */
(function () {
  const config = globalThis.CAMP_SYNC_CONFIG;
  const hasConfig = !!(config?.url && config?.publishableKey);
  const encoder = new TextEncoder();

  const clone = value => value == null ? value : structuredClone(value);
  const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
  const id = () => crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`;
  // These values only describe what a particular screen happens to show. They
  // must never be allowed to switch another device to a stale page, while all
  // actual planner data remains in the synced document.
  const syncable = value => {
    if (value == null) return null;
    const document = clone(value);
    ['page', 'pendingDeleteTripId', 'pendingPurgeId'].forEach(key => delete document[key]);
    return document;
  };

  function diff(before, after, path = [], changes = []) {
    if (same(before, after)) return changes;
    const objects = value => value && typeof value === 'object' && !Array.isArray(value);
    if (Array.isArray(before) && Array.isArray(after) && before.length === after.length) {
      before.forEach((value, index) => diff(value, after[index], [...path, String(index)], changes));
      return changes;
    }
    if (objects(before) && objects(after)) {
      const keys = new Set([...Object.keys(before), ...Object.keys(after)]);
      keys.forEach(key => {
        if (!(key in after)) changes.push({ path: [...path, key], deleted: true });
        else if (!(key in before)) changes.push({ path: [...path, key], value: after[key] });
        else diff(before[key], after[key], [...path, key], changes);
      });
      return changes;
    }
    changes.push({ path, value: after });
    return changes;
  }

  // Arrays in the planner are libraries, not positional lists.  Treating a
  // newly added trip as a replacement for the whole array lets a stale device
  // erase it.  Merge collections by stable ID before any queued write.
  const collectionKeys = ['gear', 'recipes', 'trips', 'logs', 'discardedTrips'];
  const recordId = (item, index) => String(item?.id ?? item?.code ?? `index:${index}`);
  const changedFrom = (value, base) => !same(value, base);
  function mergeCollection(remote = [], local = [], base = []) {
    const remoteById = new Map(remote.map((item, index) => [recordId(item, index), item]));
    const localById = new Map(local.map((item, index) => [recordId(item, index), item]));
    const baseById = new Map(base.map((item, index) => [recordId(item, index), item]));
    const ids = [...remoteById.keys(), ...localById.keys()];
    return [...new Set(ids)].map(key => {
      const remoteItem = remoteById.get(key), localItem = localById.get(key), baseItem = baseById.get(key);
      if (!remoteItem) return localItem;
      if (!localItem) return remoteItem;
      // A first sync has no baseline. Keep the server's existing record on an
      // ID collision, while still retaining any local-only newly created ID.
      if (!baseItem) return remoteItem;
      const localChanged = changedFrom(localItem, baseItem);
      const remoteChanged = changedFrom(remoteItem, baseItem);
      if (localChanged && !remoteChanged) return localItem;
      if (!localChanged && remoteChanged) return remoteItem;
      // If both changed the same record, prefer the later timestamp; a local
      // pending edit wins ties because it is the edit being saved now.
      const localTime = Date.parse(localItem.updatedAt || localItem.createdAt || 0) || 0;
      const remoteTime = Date.parse(remoteItem.updatedAt || remoteItem.createdAt || 0) || 0;
      return localTime >= remoteTime ? localItem : remoteItem;
    });
  }
  function mergeDocuments(remote = {}, local = {}, base = {}) {
    const merged = structuredClone(remote || {});
    collectionKeys.forEach(key => { merged[key] = mergeCollection(remote?.[key], local?.[key], base?.[key]); });
    merged.locations = [...new Set([...(remote?.locations || []), ...(local?.locations || [])])];
    Object.keys(local || {}).filter(key => !collectionKeys.includes(key) && key !== 'locations').forEach(key => {
      if (!changedFrom(local[key], base?.[key]) || changedFrom(remote?.[key], base?.[key])) return;
      merged[key] = local[key];
    });
    return merged;
  }

  class CampSync {
    constructor(storage, key = 'camp-sync.v1') {
      this.storage = storage;
      this.key = key;
      this.deviceId = id();
      this.record = { session: null, baseline: null, pending: [], remoteVersion: 0 };
      this.onStatus = () => {};
      this.timer = null;
      this.running = false;
    }
    async load() {
      this.record = { ...this.record, ...(await this.storage.get(this.key) || {}) };
      this.deviceId = this.record.deviceId || this.deviceId;
      this.record.deviceId = this.deviceId;
      await this.persist();
      return this.record;
    }
    async persist() { await this.storage.set(this.key, this.record); }
    signedIn() { return !!this.record.session?.access_token; }
    headers(extra = {}) {
      const token = this.record.session?.access_token;
      return { apikey: config.publishableKey, Authorization: `Bearer ${token || config.publishableKey}`, 'Content-Type': 'application/json', ...extra };
    }
    async request(path, options = {}) {
      const response = await fetch(`${config.url}${path}`, { ...options, headers: this.headers(options.headers) });
      if (!response.ok) { const detail = await response.json().catch(() => ({})); throw new Error(detail.message || detail.msg || detail.error_description || detail.error || `同步服務錯誤 (${response.status})`); }
      return response.status === 204 ? null : response.json();
    }
    async authRequest(path, options = {}) {
      // Refreshing a Supabase session must not send the already-expired access
      // token. The publishable key is sufficient for all Auth endpoints.
      const response = await fetch(`${config.url}${path}`, {
        ...options,
        headers: { apikey: config.publishableKey, 'Content-Type': 'application/json', ...(options.headers || {}) }
      });
      if (!response.ok) { const detail = await response.json().catch(() => ({})); throw new Error(detail.message || detail.msg || detail.error_description || detail.error || `登入服務錯誤 (${response.status})`); }
      return response.status === 204 ? null : response.json();
    }
    async signUp(email, password) {
      const data = await this.authRequest('/auth/v1/signup', { method: 'POST', body: JSON.stringify({ email, password }) });
      if (!data.session) throw new Error('帳號已建立；請到電子郵件完成驗證後再登入。');
      this.record.session = data.session; await this.persist(); return data;
    }
    async signIn(email, password) {
      const data = await this.authRequest('/auth/v1/token?grant_type=password', { method: 'POST', body: JSON.stringify({ email, password }) });
      this.record.session = data; await this.persist(); return data;
    }
    async resendVerification(email) {
      await this.authRequest('/auth/v1/resend', { method: 'POST', body: JSON.stringify({ type: 'signup', email }) });
    }
    async signOut() { await this.request('/auth/v1/logout', { method: 'POST' }).catch(() => {}); this.record.session = null; await this.persist(); }
    async refresh() {
      const refreshToken = this.record.session?.refresh_token;
      if (!refreshToken) return false;
      try {
        const data = await this.authRequest('/auth/v1/token?grant_type=refresh_token', { method: 'POST', body: JSON.stringify({ refresh_token: refreshToken }) });
        this.record.session = data; await this.persist(); return true;
      } catch { return false; }
    }
    needsRefresh() {
      const expiresAt = Number(this.record.session?.expires_at || 0);
      // Supabase stores this value in Unix seconds. Renew a minute early so a
      // normal edit never has to wait for an expired-token retry.
      return !!expiresAt && expiresAt <= Math.floor(Date.now() / 1000) + 60;
    }
    queue(before, after) {
      const changes = diff(syncable(before), syncable(after));
      if (!changes.length) return;
      this.record.pending.push({ id: id(), deviceId: this.deviceId, at: new Date().toISOString(), changes });
      this.record.baseline = syncable(after);
      this.persist();
      this.onStatus('已離線儲存，等待同步');
      clearTimeout(this.timer); this.timer = setTimeout(() => this.sync().catch(() => {}), 450);
    }
    async pull() {
      const rows = await this.request('/rest/v1/camp_documents?select=version,data,updated_at&limit=1');
      return rows?.[0] || null;
    }
    async sync(getState, replaceState) {
      if (!hasConfig || !this.signedIn() || this.running || !navigator.onLine) return false;
      this.running = true;
      try {
        if (this.needsRefresh() && !(await this.refresh())) {
          this.record.session = null; await this.persist(); this.onStatus('登入已過期，請在設定重新登入'); return false;
        }
        let remote = await this.pull();
        if (remote?.data) remote = { ...remote, data: syncable(remote.data) };
        const localState = syncable(getState());
        if (remote && this.record.baseline == null) {
          const merged = mergeDocuments(remote.data, localState, {});
          replaceState(clone(merged));
          this.record.baseline = clone(remote.data); this.record.remoteVersion = remote.version;
          if (!same(merged, remote.data)) this.record.pending.push({ id: id(), deviceId: this.deviceId, at: new Date().toISOString(), changes: [{ path: [], value: merged }] });
        }
        if (!remote && this.record.baseline == null && localState) {
          this.record.baseline = {};
          this.record.pending.push({ id: id(), deviceId: this.deviceId, at: new Date().toISOString(), changes: [{ path: [], value: localState }] });
        }
        if (!remote && !localState) { this.onStatus('等待電腦端首次同步'); return false; }
        if (this.record.pending.length) {
          // Reconcile against the latest server document before writing. This
          // prevents a desktop's old queued array from replacing a trip just
          // created on the phone (and works in the opposite direction too).
          const merged = remote ? mergeDocuments(remote.data, localState, this.record.baseline) : localState;
          const batch = [{ path: [], value: merged }];
          const updated = await this.request('/rest/v1/rpc/apply_camp_changes', { method: 'POST', body: JSON.stringify({ changes: batch }) });
          const row = Array.isArray(updated) ? updated[0] : updated;
          this.record.pending = [];
          if (row?.data) { const data = syncable(row.data); replaceState(data); this.record.baseline = data; this.record.remoteVersion = row.version; }
        } else if (remote && remote.version > (this.record.remoteVersion || 0)) {
          replaceState(clone(remote.data)); this.record.baseline = clone(remote.data); this.record.remoteVersion = remote.version;
        }
        await this.persist(); this.onStatus('已同步'); return true;
      } catch (error) {
        if (/(401|jwt expired|expired|invalid jwt)/i.test(error.message) && await this.refresh()) { this.running = false; return this.sync(getState, replaceState); }
        if (/(401|jwt expired|expired|invalid jwt)/i.test(error.message)) { this.record.session = null; await this.persist(); this.onStatus('登入已過期，請在設定重新登入'); return false; }
        this.onStatus(`等待同步：${error.message}`); return false;
      } finally { this.running = false; }
    }
  }

  globalThis.CampSync = CampSync;
})();
