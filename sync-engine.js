/* Sync v5 — HLC-ordered, operation-based offline-first synchronisation. */
(function () {
  const config = globalThis.CAMP_SYNC_CONFIG;
  const hasConfig = !!(config?.url && config?.publishableKey);
  const clone = value => value == null ? value : structuredClone(value);
  const same = (left, right) => JSON.stringify(left) === JSON.stringify(right);
  const uid = () => crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`;
  const collections = ['gear', 'recipes', 'trips', 'logs', 'discardedTrips', 'tripTombstones'];
  const entityId = (value, index) => String(value?.id ?? value?.tripId ?? value?.code ?? `index:${index}`);
  const rowId = (field, value, index) => field === 'items'
    ? String(value?.gearId ?? value?.id ?? `index:${index}`)
    : String(value?.shoppingKey ?? value?.id ?? `${value?.recipeId || ''}:${value?.name || ''}:${index}`);
  const syncable = value => {
    const next = clone(value || {});
    ['page', 'pendingDeleteTripId', 'pendingPurgeId'].forEach(key => delete next[key]);
    return next;
  };
  const cmp = (left, right) => {
    if (!right) return 1;
    if (!left) return -1;
    for (const key of ['ms', 'counter']) {
      const delta = Number(left[key] || 0) - Number(right[key] || 0);
      if (delta) return delta;
    }
    return String(left.deviceId || '').localeCompare(String(right.deviceId || ''));
  };
  // Once both operations have reached Supabase, its receipt sequence is the
  // shared clock. A phone and a PC cannot agree on wall clocks, so a skewed
  // device must never let an old change defeat a later click. Before receipt,
  // HLC still orders offline work and protects the local intent.
  const compareOperations = (left, right) => {
    const leftSeq = Number(left?.serverSeq || 0), rightSeq = Number(right?.serverSeq || 0);
    // A sequenced operation is newer-format server-confirmed data. It must
    // also win over pre-sequence legacy rows, whose device clock may be far in
    // the future. That closes the last migration path which could undo a tick.
    if (leftSeq || rightSeq) return leftSeq - rightSeq
      || String(left?.operationId || '').localeCompare(String(right?.operationId || ''));
    return cmp(left?.clock, right?.clock)
      || String(left?.operationId || '').localeCompare(String(right?.operationId || ''));
  };
  const clockKey = (target, path) => `${target}/${path.map(encodeURIComponent).join('/')}`;
  const legacyApply = (base, batches) => {
    let result = clone(base || {});
    for (const batch of batches || []) for (const change of batch.changes || []) {
      const path = change.path || [];
      if (!path.length) { if (!change.deleted) result = clone(change.value); continue; }
      let at = result;
      path.slice(0, -1).forEach(key => at = at[key] ?? {});
      if (change.deleted) delete at[path[path.length - 1]];
      else at[path[path.length - 1]] = clone(change.value);
    }
    return result;
  };
  const newer = (left, right) => String(left?.updatedAt || left?.createdAt || '') >= String(right?.updatedAt || right?.createdAt || '') ? left : right;
  const mergeLegacy = (remote, local) => {
    const result = { ...(clone(remote || {})), ...(clone(local || {})) };
    for (const collection of collections) {
      const all = new Map();
      for (const source of [remote?.[collection] || [], local?.[collection] || []]) for (const value of source) {
        const id = entityId(value, 0); const previous = all.get(id);
        all.set(id, previous ? clone(newer(value, previous)) : clone(value));
      }
      result[collection] = [...all.values()];
    }
    return result;
  };

  class CampSync {
    constructor(storage, key = 'camp-sync.v1') {
      this.storage = storage; this.key = key; this.deviceId = uid(); this.timer = null; this.running = false;
      this.record = { session: null, deviceId: this.deviceId, clock: { ms: 0, counter: 0 }, serverTimeMs: 0, pending: [], known: [], snapshot: null, syncVersion: 5, backups: [], intents: {} };
      this.onStatus = () => {}; this.onQueue = () => {};
    }
    async load() {
      const old = await this.storage.get(this.key) || {};
      this.record = { ...this.record, ...old, syncVersion: 5 };
      const legacy = (this.record.pending || []).filter(op => !(op?.operationId && op?.target));
      if (legacy.length) this.record.legacyPendingBackup ??= legacy;
      this.record.pending = (this.record.pending || []).filter(op => op?.operationId && op?.target);
      this.record.known = (this.record.known || []).filter(op => op?.operationId && op?.target);
      this.record.backups ??= [];
      this.record.intents ??= {};
      this.deviceId = this.record.deviceId || this.deviceId; this.record.deviceId = this.deviceId;
      // A persisted operation history is also a remote history after a browser
      // restart.  Advance the HLC before the first new local mutation.
      this.observeRemoteClock(this.record.known);
      await this.persist(); return this.record;
    }
    async persist() { await this.storage.set(this.key, this.record); }
    async backup(state) {
      if (this.record.migratedToV4) return;
      this.record.backups.push({ createdAt: new Date().toISOString(), state: syncable(state) });
      this.record.backups = this.record.backups.slice(-3);
      this.record.migratedToV4 = true;
      await this.persist();
    }
    signedIn() { return !!this.record.session?.access_token; }
    headers(extra = {}) { const token = this.record.session?.access_token; return { apikey: config.publishableKey, Authorization: `Bearer ${token || config.publishableKey}`, 'Content-Type': 'application/json', ...extra }; }
    async request(path, options = {}) {
      const response = await fetch(`${config.url}${path}`, { ...options, cache: 'no-store', headers: this.headers(options.headers) });
      if (!response.ok) { const detail = await response.json().catch(() => ({})); throw new Error(detail.message || detail.error_description || detail.error || `同步服務錯誤 (${response.status})`); }
      return response.status === 204 ? null : response.json();
    }
    async authRequest(path, options = {}) {
      const response = await fetch(`${config.url}${path}`, { ...options, headers: { apikey: config.publishableKey, 'Content-Type': 'application/json', ...(options.headers || {}) } });
      if (!response.ok) { const detail = await response.json().catch(() => ({})); throw new Error(detail.message || detail.error_description || detail.error || `帳號服務錯誤 (${response.status})`); }
      return response.status === 204 ? null : response.json();
    }
    async signUp(email, password) { const data = await this.authRequest('/auth/v1/signup', { method: 'POST', body: JSON.stringify({ email, password }) }); if (!data.session) throw new Error('帳號已建立；請完成 Email 驗證後再登入。'); this.record.session = data.session; await this.persist(); return data; }
    async signIn(email, password) { this.record.session = await this.authRequest('/auth/v1/token?grant_type=password', { method: 'POST', body: JSON.stringify({ email, password }) }); await this.persist(); return this.record.session; }
    async resendVerification(email) { await this.authRequest('/auth/v1/resend', { method: 'POST', body: JSON.stringify({ type: 'signup', email }) }); }
    async signOut() { await this.request('/auth/v1/logout', { method: 'POST' }).catch(() => {}); this.record.session = null; await this.persist(); }
    async refresh() { try { const token = this.record.session?.refresh_token; if (!token) return false; this.record.session = await this.authRequest('/auth/v1/token?grant_type=refresh_token', { method: 'POST', body: JSON.stringify({ refresh_token: token }) }); await this.persist(); return true; } catch { return false; } }
    needsRefresh() { return Number(this.record.session?.expires_at || 0) <= Math.floor(Date.now() / 1000) + 60; }
    observeRemoteClock(operations) {
      const remote = (operations || []).map(operation => operation?.clock).filter(Boolean)
        .reduce((latest, clock) => !latest || cmp(clock, latest) > 0 ? clock : latest, null);
      const local = this.record.clock || { ms: 0, counter: 0 };
      const serverTimeMs = Math.max(Number(this.record.serverTimeMs || 0), ...(operations || []).map(operation => Date.parse(operation?.serverReceivedAt || '') || 0));
      this.record.serverTimeMs = serverTimeMs;
      if (!remote) return local;
      const localMs = Number(local.ms || 0), localCounter = Number(local.counter || 0);
      const remoteMs = Number(remote.ms || 0), remoteCounter = Number(remote.counter || 0);
      const ms = Math.max(Date.now(), serverTimeMs, localMs, remoteMs);
      const counter = ms === localMs && ms === remoteMs ? Math.max(localCounter, remoteCounter) + 1
        : ms === localMs ? localCounter + 1
          : ms === remoteMs ? remoteCounter + 1 : 0;
      return this.record.clock = { ms, counter };
    }
    nextClock() {
      const old = this.record.clock || {}; const now = Date.now();
      const oldMs = Number(old.ms || 0), ms = Math.max(now, Number(this.record.serverTimeMs || 0), oldMs);
      const counter = ms === oldMs ? Number(old.counter || 0) + 1 : 0;
      return this.record.clock = { ms, counter };
    }
    op(target, path, value, deleted = false) { const clock = this.nextClock(); return { operationId: uid(), deviceId: this.deviceId, clock: { ...clock, deviceId: this.deviceId }, occurredAt: new Date(clock.ms).toISOString(), target, path, value: clone(value), deleted }; }
    walk(before, after, target, path, output) {
      if (same(before, after)) return;
      const object = value => value && typeof value === 'object' && !Array.isArray(value);
      if (object(before) && object(after)) new Set([...Object.keys(before), ...Object.keys(after)]).forEach(key => this.walk(before[key], after[key], target, [...path, key], output));
      else output.push(this.op(target, path, after, after === undefined));
    }
    entity(before, after, collection, id, output) {
      const target = `entity:${collection}:${id}`;
      if (after === undefined) { output.push(this.op(target, [], null, true)); return; }
      const old = before || {};
      if (collection === 'trips') {
        for (const field of ['items', 'shopping']) {
          const oldRows = new Map((old[field] || []).map((value, index) => [rowId(field, value, index), value]));
          const newRows = new Map((after[field] || []).map((value, index) => [rowId(field, value, index), value]));
          new Set([...oldRows.keys(), ...newRows.keys()]).forEach(row => this.walk(oldRows.get(row), newRows.get(row), `row:trips:${id}:${field}:${row}`, [], output));
        }
        const oldOverrides = old.overrides || { added: [], removed: [] };
        const newOverrides = after.overrides || { added: [], removed: [] };
        const oldAdded = new Map((oldOverrides.added || []).map(entry => [String(entry.gearId), entry]));
        const newAdded = new Map((newOverrides.added || []).map(entry => [String(entry.gearId), entry]));
        new Set([...oldAdded.keys(), ...newAdded.keys()]).forEach(gearId => this.walk(oldAdded.get(gearId), newAdded.get(gearId), `override:trips:${id}:added:${gearId}`, [], output));
        const oldRemoved = new Set(oldOverrides.removed || []), newRemoved = new Set(newOverrides.removed || []);
        new Set([...oldRemoved, ...newRemoved]).forEach(gearId => {
          if (oldRemoved.has(gearId) !== newRemoved.has(gearId)) output.push(this.op(`override:trips:${id}:removed:${gearId}`, [], true, !newRemoved.has(gearId)));
        });
        const oldEntity = { ...old }, newEntity = { ...after };
        delete oldEntity.items; delete oldEntity.shopping; delete oldEntity.overrides;
        delete newEntity.items; delete newEntity.shopping; delete newEntity.overrides;
        this.walk(oldEntity, newEntity, target, [], output); return;
      }
      this.walk(old, after, target, [], output);
    }
    build(before, after) {
      if (before == null) return [this.op('snapshot', [], after)];
      const output = [];
      for (const collection of collections) {
        const oldItems = new Map((before[collection] || []).map((value, index) => [entityId(value, index), value]));
        const newItems = new Map((after[collection] || []).map((value, index) => [entityId(value, index), value]));
        new Set([...oldItems.keys(), ...newItems.keys()]).forEach(id => this.entity(oldItems.get(id), newItems.get(id), collection, id, output));
      }
      const oldState = clone(before), newState = clone(after);
      collections.forEach(key => { delete oldState[key]; delete newState[key]; });
      this.walk(oldState, newState, 'state', [], output); return output;
    }
    apply(bundle, operation) {
      const meta = bundle.meta ||= { clocks: {}, tombstones: {} }; const data = bundle.data ||= {};
      const target = operation.target; const path = operation.path || []; const tombstone = meta.tombstones[target];
      // Store the full operation, not just its clock.  That preserves the
      // server-sequence fallback when two malformed/legacy operations happen
      // to have an identical HLC and device ID.
      if (operation.deleted && (!tombstone || compareOperations(operation, tombstone) > 0)) meta.tombstones[target] = operation;
      if (!operation.deleted && tombstone && compareOperations(operation, tombstone) > 0) delete meta.tombstones[target];
      if (!operation.deleted && meta.tombstones[target] && compareOperations(operation, meta.tombstones[target]) <= 0) return;
      const key = clockKey(target, path);
      if (compareOperations(operation, meta.clocks[key]) <= 0) return;
      meta.clocks[key] = operation;
      if (target === 'snapshot') { if (!bundle.seed || compareOperations(operation, bundle.seed) > 0) { bundle.data = clone(operation.value || {}); bundle.seed = operation; } return; }
      if (target === 'state') { this.applyAt(data, path, operation); return; }
      const parts = target.split(':'); const kind = parts[0]; const collection = parts[1]; const parent = parts[2];
      data[collection] ??= [];
      let entity = data[collection].find((value, index) => entityId(value, index) === parent);
      if (kind === 'override') {
        const field = parts[3], row = parts.slice(4).join(':');
        if (!entity) { if (operation.deleted) return; entity = { id: parent }; data[collection].push(entity); }
        entity.overrides ??= { added: [], removed: [] }; entity.overrides.added ??= []; entity.overrides.removed ??= [];
        if (field === 'removed') {
          entity.overrides.removed = entity.overrides.removed.filter(value => value !== row);
          if (!operation.deleted) entity.overrides.removed.push(row);
          return;
        }
        let value = entity.overrides.added.find(entry => String(entry.gearId) === row);
        if (operation.deleted && !path.length) { if (value) entity.overrides.added.splice(entity.overrides.added.indexOf(value), 1); return; }
        if (!value) { value = { gearId: row }; entity.overrides.added.push(value); }
        this.applyAt(value, path, operation); return;
      }
      if (kind === 'entity') {
        if (operation.deleted && !path.length) { if (entity) data[collection].splice(data[collection].indexOf(entity), 1); return; }
        if (!entity) { entity = { id: parent }; data[collection].push(entity); }
        this.applyAt(entity, path, operation); return;
      }
      const field = parts[3]; const row = parts.slice(4).join(':');
      if (!entity) { if (operation.deleted) return; entity = { id: parent }; data[collection].push(entity); }
      entity[field] ??= [];
      let value = entity[field].find((entry, index) => rowId(field, entry, index) === row);
      if (operation.deleted && !path.length) { if (value) entity[field].splice(entity[field].indexOf(value), 1); return; }
      if (!value) { value = field === 'items' ? { gearId: row } : { shoppingKey: row }; entity[field].push(value); }
      this.applyAt(value, path, operation);
    }
    applyAt(root, path, operation) {
      if (!path.length) { if (!operation.deleted && operation.value && typeof operation.value === 'object') Object.assign(root, clone(operation.value)); return; }
      let at = root; path.slice(0, -1).forEach(key => at = at[key] ?? {});
      if (operation.deleted) delete at[path[path.length - 1]]; else at[path[path.length - 1]] = clone(operation.value);
    }
    materialize(operations) {
      const bundle = { data: {}, meta: { clocks: {}, tombstones: {} } };
      const ordered = [...operations].sort(compareOperations);
      // A snapshot is a migration/bootstrap base, never a competing user
      // change. Applying a high-clock legacy snapshot after row operations
      // used to erase a freshly checked box wholesale. Select the newest
      // base once, then layer every granular operation over it.
      const snapshots = ordered.filter(operation => operation.target === 'snapshot');
      const base = snapshots[snapshots.length - 1];
      if (base) this.apply(bundle, base);
      ordered.filter(operation => operation.target !== 'snapshot').forEach(operation => this.apply(bundle, operation));
      return syncable(bundle.data);
    }
    compactPending() {
      const latest = new Map();
      for (const operation of this.record.pending) {
        const key = `${operation.target}/${(operation.path || []).join('/')}`;
        if (operation.deleted && !(operation.path || []).length) for (const prior of [...latest.keys()]) if (prior.startsWith(`${operation.target}/`)) latest.delete(prior);
        latest.set(key, operation);
      }
      this.record.pending = [...latest.values()].sort(compareOperations);
    }
    queue(after) {
      const next = syncable(after); const prior = this.record.snapshot;
      const operations = this.build(prior, next); if (!operations.length) return false;
      this.record.pending.push(...operations);
      for (const operation of operations) this.record.intents[clockKey(operation.target, operation.path || [])] = {
        operationId: operation.operationId, clock: operation.clock, createdAt: Date.now(), rebasedAgainst: null
      };
      this.compactPending(); this.record.snapshot = next; this.persist();
      this.onStatus('已離線儲存，等待同步'); clearTimeout(this.timer);
      this.timer = setTimeout(() => Promise.resolve(this.onQueue()).catch(() => {}), 100); return true;
    }
    rebaseRecentIntents(remote) {
      // A user can act before the first pull completes.  In that short window
      // their device has not yet observed a faster device's HLC, so the first
      // local clock can legitimately sort behind an older *real-world* edit.
      // Reissue only a fresh, still-pending user intent after observing that
      // remote clock.  This preserves the last button/checkbox action without
      // reviving old offline edits hours later.
      const graceMs = 30000;
      const pendingById = new Map(this.record.pending.map(operation => [operation.operationId, operation]));
      const rebased = [];
      for (const [key, intent] of Object.entries(this.record.intents || {})) {
        if (!intent?.operationId || Date.now() - Number(intent.createdAt || 0) > graceMs) continue;
        const local = pendingById.get(intent.operationId);
        if (!local) continue;
        const newerRemote = (remote || []).filter(operation => operation.operationId !== local.operationId
          && clockKey(operation.target, operation.path || []) === key
          && compareOperations(operation, local) > 0)
          .sort(compareOperations).pop();
        if (!newerRemote || intent.rebasedAgainst === newerRemote.operationId) continue;
        const replacement = this.op(local.target, local.path || [], local.value, local.deleted);
        this.record.pending.push(replacement);
        this.record.intents[key] = { operationId: replacement.operationId, clock: replacement.clock, createdAt: intent.createdAt, rebasedAgainst: newerRemote.operationId };
        rebased.push(replacement);
      }
      if (rebased.length) this.compactPending();
      return rebased;
    }
    async exchange(operations, initialDocument = null) { const rows = await this.request('/rest/v1/rpc/sync_camp_operations', { method: 'POST', body: JSON.stringify({ p_operations: operations, p_materialized: initialDocument }) }); return Array.isArray(rows) ? rows[0] : rows; }
    async sync(getState, replaceState) {
      if (!hasConfig || !this.signedIn() || this.running || !navigator.onLine) return false;
      this.running = true;
      try {
        if (this.needsRefresh() && !(await this.refresh())) throw new Error('登入已過期，請在設定重新登入');
        const sent = [...this.record.pending]; const sentIds = new Set(sent.map(operation => operation.operationId));
        let reply = await this.exchange(sent); let remote = reply?.operations || [];
        // Always observe the full response before creating any follow-up local
        // operation (including the first-device seed snapshot).
        this.observeRemoteClock(remote);
        this.rebaseRecentIntents(remote);
        if (!remote.length) {
          const current = syncable(getState());
          const local = this.record.legacyPendingBackup?.length ? legacyApply(current, this.record.legacyPendingBackup) : current;
          const seedState = mergeLegacy(reply?.data, local);
          const seed = this.op('snapshot', [], seedState);
          reply = await this.exchange([seed, ...sent], seedState); remote = reply?.operations || []; this.observeRemoteClock(remote); this.rebaseRecentIntents(remote); sentIds.add(seed.operationId);
        }
        const unsent = this.record.pending.filter(operation => !sentIds.has(operation.operationId));
        const all = new Map([...this.record.known, ...remote, ...unsent].map(operation => [operation.operationId, operation]));
        const result = this.materialize([...all.values()]); result.syncFormat = 5;
        this.record.known = [...new Map([...this.record.known, ...remote].map(operation => [operation.operationId, operation])).values()];
        this.record.pending = unsent;
        const acknowledged = new Set(remote.map(operation => operation.operationId));
        for (const [key, intent] of Object.entries(this.record.intents)) if (acknowledged.has(intent.operationId)) delete this.record.intents[key];
        this.record.snapshot = result; this.record.legacyPendingBackup = null;
        // Persist acknowledgement state before handing a materialized state to
        // the UI adapter.  The adapter can therefore distinguish an
        // acknowledged merge from an old response racing a fresh local edit.
        await this.persist();
        replaceState(result);
        // `unsent` is a snapshot made before the storage await above.  A user
        // can make another change during that await, so use the live queue for
        // both status and the follow-up upload decision.
        const waiting = this.record.pending.length;
        this.onStatus(waiting ? '已儲存，等待下一次同步' : '已同步');
        if (waiting) { clearTimeout(this.timer); this.timer = setTimeout(() => Promise.resolve(this.onQueue()).catch(() => {}), 0); }
        return true;
      } catch (error) {
        if (/(401|jwt expired|expired|invalid jwt)/i.test(error.message) && await this.refresh()) { this.running = false; return this.sync(getState, replaceState); }
        this.onStatus(`等待同步：${error.message}`); return false;
      } finally { this.running = false; }
    }
  }
  globalThis.CampSync = CampSync;
})();
