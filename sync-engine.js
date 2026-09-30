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
    // Page is per-device navigation, while activeTripId is the shared current
    // itinerary used by the checklist and must stay aligned across devices.
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
  const collectionKeys = ['gear', 'recipes', 'trips', 'logs', 'discardedTrips', 'tripTombstones'];
  const recordId = (item, index) => String(item?.id ?? item?.code ?? `index:${index}`);
  const changedFrom = (value, base) => !same(value, base);
  const shoppingId = (item, index) => String(item?.shoppingKey ?? item?.id ?? `${item?.recipeId || ''}:${item?.name || ''}:${index}`);
  function mergeTrip(remote = {}, local = {}, base = {}) {
    const merged = clone(remote);
    const keys = new Set([...Object.keys(remote), ...Object.keys(local)]);
    keys.forEach(key => {
      const remoteValue = remote[key], localValue = local[key], baseValue = base?.[key];
      const localChanged = changedFrom(localValue, baseValue);
      const remoteChanged = changedFrom(remoteValue, baseValue);
      if (!localChanged || remoteChanged && !localChanged) return;
      if (!remoteChanged) { merged[key] = clone(localValue); return; }
      // A checklist is not a single field: independently checked packing and
      // shopping rows must survive concurrent edits on two devices.
      if (key === 'items') {
        merged.items = mergeCollection(remoteValue, localValue, baseValue, entry => String(entry?.gearId ?? entry?.id));
        return;
      }
      if (key === 'shopping') {
        merged.shopping = mergeCollection(remoteValue, localValue, baseValue, shoppingId);
        return;
      }
      if (key === 'recipeIds') {
        merged.recipeIds = [...new Set([...(remoteValue || []), ...(localValue || [])])];
        return;
      }
      // Both devices changed the same non-checklist field. Keep the most
      // recently edited trip; ties favour the device currently syncing.
      const localTime = Date.parse(local.updatedAt || local.createdAt || 0) || 0;
      const remoteTime = Date.parse(remote.updatedAt || remote.createdAt || 0) || 0;
      if (localTime >= remoteTime) merged[key] = clone(localValue);
    });
    return merged;
  }
  function mergeCollection(remote = [], local = [], base = [], getId = recordId, collectionKey = '') {
    const remoteById = new Map(remote.map((item, index) => [getId(item, index), item]));
    const localById = new Map(local.map((item, index) => [getId(item, index), item]));
    const baseById = new Map(base.map((item, index) => [getId(item, index), item]));
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
      if (collectionKey === 'trips') return mergeTrip(remoteItem, localItem, baseItem);
      // If both changed the same record, prefer the later timestamp; a local
      // pending edit wins ties because it is the edit being saved now.
      const localTime = Date.parse(localItem.updatedAt || localItem.createdAt || 0) || 0;
      const remoteTime = Date.parse(remoteItem.updatedAt || remoteItem.createdAt || 0) || 0;
      return localTime >= remoteTime ? localItem : remoteItem;
    });
  }
  function mergeDocuments(remote = {}, local = {}, base = {}) {
    const merged = structuredClone(remote || {});
    collectionKeys.forEach(key => { merged[key] = mergeCollection(remote?.[key], local?.[key], base?.[key], recordId, key); });
    merged.locations = [...new Set([...(remote?.locations || []), ...(local?.locations || [])])];
    Object.keys(local || {}).filter(key => !collectionKeys.includes(key) && key !== 'locations').forEach(key => {
      if (!changedFrom(local[key], base?.[key]) || changedFrom(remote?.[key], base?.[key])) return;
      merged[key] = local[key];
    });
    // A cancelled trip used to be removed from `trips` and placed in a
    // separate collection. A stale device could therefore re-add the old
    // active record. Reconcile both collections as one lifecycle per trip ID.
    const choices = new Map();
    const choose = candidate => {
      if (!candidate.tripId) return;
      const prior = choices.get(candidate.tripId);
      const rank = { active: 1, cancelled: 2, purged: 3 };
      if (!prior || candidate.at > prior.at || candidate.at === prior.at && rank[candidate.status] >= rank[prior.status]) choices.set(candidate.tripId, candidate);
    };
    [remote, local].forEach(source => {
      (source?.trips || []).forEach(entry => choose({
        tripId: entry.id, status: entry.status === 'cancelled' ? 'cancelled' : 'active', trip: entry,
        // `updatedAt` is deliberately not used here: editing a stale trip is
        // not an explicit restore. Lifecycle changes use statusUpdatedAt.
        at: Date.parse(entry.statusUpdatedAt || entry.createdAt || 0) || 0
      }));
      (source?.discardedTrips || []).forEach(entry => choose({
        tripId: entry.tripId || entry.trip?.id, status: 'cancelled', trip: entry.trip,
        at: Date.parse(entry.statusUpdatedAt || entry.deletedAt || entry.trip?.statusUpdatedAt || 0) || 0
      }));
      (source?.tripTombstones || []).forEach(entry => choose({
        tripId: entry.tripId || entry.id, status: 'purged',
        at: Date.parse(entry.statusUpdatedAt || entry.purgedAt || 0) || 0
      }));
    });
    merged.trips = [];
    merged.discardedTrips = [];
    merged.tripTombstones = [];
    choices.forEach(choice => {
      if (choice.status === 'purged') {
        merged.tripTombstones.push({ tripId: choice.tripId, status: 'purged', statusUpdatedAt: new Date(choice.at).toISOString() });
      } else if (choice.status === 'cancelled' && choice.trip) {
        const cancelledAt = new Date(choice.at).toISOString();
        const trip = { ...clone(choice.trip), status: 'cancelled', statusUpdatedAt: cancelledAt };
        merged.discardedTrips.push({ id: choice.tripId, tripId: choice.tripId, trip, status: 'cancelled', statusUpdatedAt: cancelledAt, deletedAt: cancelledAt });
      } else if (choice.trip) {
        merged.trips.push({ ...clone(choice.trip), status: choice.trip.status === 'archived' ? 'archived' : 'active', statusUpdatedAt: new Date(choice.at).toISOString() });
      }
    });
    return merged;
  }

  class CampSync {
    constructor(storage, key = 'camp-sync.v1') {
      this.storage = storage;
      this.key = key;
      this.deviceId = id();
      this.record = { session: null, baseline: null, pending: [], remoteVersion: 0, mergeVersion: 2, lifecycleVersion: 2 };
      this.onStatus = () => {};
      this.onQueue = () => {};
      this.timer = null;
      this.running = false;
    }
    async load() {
      const stored = await this.storage.get(this.key) || {};
      this.record = { ...this.record, ...stored };
      if (!Object.prototype.hasOwnProperty.call(stored, 'mergeVersion')) this.record.mergeVersion = 1;
      if (!Object.prototype.hasOwnProperty.call(stored, 'lifecycleVersion')) this.record.lifecycleVersion = 1;
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
    stampChanges(before, after) {
      // Most planner actions call the same save function. Stamp changed
      // records here so additions, edits, favourites and logs all carry a
      // comparable write time even when their individual UI handler did not
      // need to know about synchronisation.
      const changedAt = new Date().toISOString();
      ['gear', 'recipes', 'trips', 'logs'].forEach(key => {
        const prior = new Map((before?.[key] || []).map((entry, index) => [recordId(entry, index), entry]));
        (after?.[key] || []).forEach((entry, index) => {
          const earlier = prior.get(recordId(entry, index));
          if (!same(entry, earlier) && (!entry.updatedAt || Date.parse(entry.updatedAt) <= (Date.parse(earlier?.updatedAt || 0) || 0))) entry.updatedAt = changedAt;
        });
      });
    }
    queue(before, after) {
      const changes = diff(syncable(before), syncable(after));
      if (!changes.length) return;
      this.record.pending.push({ id: id(), deviceId: this.deviceId, at: new Date().toISOString(), changes });
      // The baseline is the last server-confirmed document.  Do not move it
      // forward for an offline edit, or that edit appears unchanged when we
      // later merge against the server's older document.
      if (this.record.baseline == null) this.record.baseline = syncable(before);
      this.persist();
      this.onStatus('已離線儲存，等待同步');
      // The UI adapter supplies the state-aware sync callback. Calling this
      // engine's sync() directly would omit getState/replaceState and leave
      // edits waiting for the slow polling fallback.
      clearTimeout(this.timer); this.timer = setTimeout(() => Promise.resolve(this.onQueue()).catch(() => {}), 120);
    }
    async pull() {
      // A successful poll is useless if a browser hands us a cached GET
      // response.  Checklist changes need the current server version.
      const rows = await this.request('/rest/v1/camp_documents?select=version,data,updated_at&limit=1', { cache: 'no-store' });
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
        // Older app versions advanced baseline on every local save. Pending
        // edits created by those versions would otherwise be mistaken for
        // server data. Rebase that one queued batch onto the latest server
        // document, while keeping the current local state as the pending edit.
        if (remote && this.record.pending.length && this.record.mergeVersion !== 2) {
          this.record.baseline = clone(remote.data);
        }
        if (remote && this.record.baseline == null) {
          const merged = mergeDocuments(remote.data, localState, {});
          replaceState(clone(merged));
          this.record.baseline = clone(remote.data); this.record.remoteVersion = remote.version;
          if (!same(merged, remote.data)) this.record.pending.push({ id: id(), deviceId: this.deviceId, at: new Date().toISOString(), changes: [{ path: [], value: merged }] });
        }
        // One-time migration: turn legacy separate cancelled-trip records
        // into lifecycle records before normal background reconciliation.
        if (remote && this.record.lifecycleVersion !== 2) {
          const migrated = mergeDocuments(remote.data, localState, this.record.baseline || {});
          replaceState(clone(migrated));
          if (!same(migrated, remote.data)) this.record.pending.push({ id: id(), deviceId: this.deviceId, at: new Date().toISOString(), changes: [{ path: [], value: migrated }] });
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
        this.record.mergeVersion = 2;
        this.record.lifecycleVersion = 2;
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
