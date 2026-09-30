/* Shared offline-first synchronisation engine. */
(function () {
  const config = globalThis.CAMP_SYNC_CONFIG;
  const clone = value => value == null ? value : structuredClone(value);
  const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
  const id = () => crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`;
  function diff(before, after, path = [], changes = []) {
    if (same(before, after)) return changes;
    const object = value => value && typeof value === 'object' && !Array.isArray(value);
    if (Array.isArray(before) && Array.isArray(after) && before.length === after.length) { before.forEach((value, index) => diff(value, after[index], [...path, String(index)], changes)); return changes; }
    if (object(before) && object(after)) { new Set([...Object.keys(before), ...Object.keys(after)]).forEach(key => { if (!(key in after)) changes.push({ path:[...path,key], deleted:true }); else if (!(key in before)) changes.push({ path:[...path,key], value:after[key] }); else diff(before[key], after[key], [...path,key], changes); }); return changes; }
    changes.push({ path, value:after }); return changes;
  }
  class CampSync {
    constructor(storage,key='camp-sync.v1'){this.storage=storage;this.key=key;this.deviceId=id();this.record={session:null,baseline:null,pending:[],remoteVersion:0};this.onStatus=()=>{};this.running=false;}
    async load(){this.record={...this.record,...(await this.storage.get(this.key)||{})};this.deviceId=this.record.deviceId||this.deviceId;this.record.deviceId=this.deviceId;await this.persist();}
    async persist(){await this.storage.set(this.key,this.record)} signedIn(){return !!this.record.session?.access_token}
    headers(extra={}){const token=this.record.session?.access_token;return {apikey:config.publishableKey,Authorization:`Bearer ${token||config.publishableKey}`,'Content-Type':'application/json',...extra}}
    async request(path,options={}){const response=await fetch(`${config.url}${path}`,{...options,headers:this.headers(options.headers)});if(!response.ok)throw new Error((await response.json().catch(()=>({}))).message||`同步服務錯誤 (${response.status})`;return response.status===204?null:response.json()}
    async signUp(email,password){const data=await this.request('/auth/v1/signup',{method:'POST',body:JSON.stringify({email,password})});if(!data.session)throw new Error('帳號已建立；請先到信箱完成驗證，再登入。');this.record.session=data.session;await this.persist()}
    async signIn(email,password){const data=await this.request('/auth/v1/token?grant_type=password',{method:'POST',body:JSON.stringify({email,password})});this.record.session=data;await this.persist()}
    async signOut(){await this.request('/auth/v1/logout',{method:'POST'}).catch(()=>{});this.record.session=null;await this.persist()}
    queue(before,after){const changes=diff(before,after);if(!changes.length)return;this.record.pending.push({id:id(),deviceId:this.deviceId,at:new Date().toISOString(),changes});this.record.baseline=clone(after);this.persist();this.onStatus('已離線儲存，等待同步');clearTimeout(this.timer);this.timer=setTimeout(()=>this.sync().catch(()=>{}),450)}
    async pull(){const rows=await this.request('/rest/v1/camp_documents?select=version,data,updated_at&limit=1');return rows?.[0]||null}
    async sync(getState,replaceState){if(!this.signedIn()||this.running||!navigator.onLine)return false;this.running=true;try{let remote=await this.pull();if(remote&&this.record.baseline==null){replaceState(clone(remote.data));this.record.baseline=clone(remote.data);this.record.remoteVersion=remote.version}if(!remote&&this.record.baseline==null){this.record.baseline={};this.record.pending.push({id:id(),deviceId:this.deviceId,at:new Date().toISOString(),changes:[{path:[],value:clone(getState())}]})}if(this.record.pending.length){const updated=await this.request('/rest/v1/rpc/apply_camp_changes',{method:'POST',body:JSON.stringify({changes:this.record.pending.flatMap(entry=>entry.changes)})});const row=Array.isArray(updated)?updated[0]:updated;this.record.pending=[];if(row?.data){replaceState(clone(row.data));this.record.baseline=clone(row.data);this.record.remoteVersion=row.version}}else if(remote&&remote.version>(this.record.remoteVersion||0)){replaceState(clone(remote.data));this.record.baseline=clone(remote.data);this.record.remoteVersion=remote.version}await this.persist();this.onStatus('已同步');return true}catch(error){this.onStatus(`等待同步：${error.message}`);return false}finally{this.running=false}}
  }
  globalThis.CampSync=CampSync;
})();
