/* Staged v8 entry. No legacy writer is loaded. Activation requires completed migration. */
(async()=>{
  if(!globalThis.chrome?.runtime?.id&&'serviceWorker' in navigator)navigator.serviceWorker.register('./service-worker.js').catch(()=>{});
  const {officialClient,openDatabase,SupabaseTransport,CampRepository,installLegacyAdapter,newId,backup,dataOnlyLegacyRecord}=CampV8;
  const chromeStorage=globalThis.chrome?.storage?.local;
  const storage=chromeStorage?{
    get:async key=>(await chromeStorage.get(key))[key],set:async(key,value)=>chromeStorage.set({[key]:value}),remove:async key=>chromeStorage.remove(key)
  }:{get:async key=>{const raw=localStorage.getItem(key);try{return JSON.parse(raw);}catch{return raw;}},set:async(key,value)=>localStorage.setItem(key,JSON.stringify(value)),remove:async key=>localStorage.removeItem(key)};
  let installation=await storage.get('camp-v8-installation');
  if(!installation){installation=newId();await storage.set('camp-v8-installation',installation);}
  const client=officialClient({...CAMP_SYNC_CONFIG,storage});
  let activeOwner=null,repository=null,adapter=null,transport=null,db=null;
  let accountTail=Promise.resolve();
  const message=text=>{document.getElementById('v8-boot-message')?.remove();const el=document.createElement('p');el.id='v8-boot-message';el.className='notice';el.textContent=text;document.querySelector('#app').prepend(el);};
  // Auth callbacks, browser storage and Realtime all run outside a click
  // handler. Some SDKs reject with plain objects, which Chrome otherwise
  // reports only as "Uncaught (in promise) [object Object]". Normalize every
  // boundary into one visible diagnostic and keep the queue usable.
  const errorText=error=>{
    if(error instanceof Error)return error.message||'同步啟動失敗。';
    if(typeof error==='string')return error;
    if(error&&typeof error==='object')return String(error.message||error.error_description||error.error||error.details||error.hint||error.code||'同步啟動失敗。');
    return '同步啟動失敗。';
  };
  const reportError=error=>{console.error('[Camp v8]',error);message(errorText(error));};
  function previewLegacy(source){
    // Before activation the server's v7 document is still the authority. Show
    // it read-only instead of replacing it with an empty v8 projection. This
    // makes migration observable and prevents users from thinking their trips
    // were deleted while the safety checks are running.
    const recovered=CampV8.recoverLegacy(source||{});
    const preview={...CampLegacy.defaults(),...recovered.state,page:'home'};
    CampLegacy.state=preview;CampLegacy.render();
    CampLegacy.setAction(()=>message('舊資料預覽中；請先完成遷移檢查，期間不會寫入或刪除資料。'));
    return recovered;
  }
  function login(){
    CampLegacy.dialog('<h2>登入同步帳號</h2><form id="v8-login"><div class="field"><label>Email</label><input name="email" type="email" required autocomplete="username"></div><div class="field"><label>密碼</label><input name="password" type="password" required autocomplete="current-password"></div><p role="status"></p><button class="primary">登入</button><button type="button" id="v8-login-close" class="secondary">取消</button></form>');
    const form=document.querySelector('#v8-login');document.querySelector('#v8-login-close').onclick=()=>CampLegacy.closeDialog();
    form.onsubmit=async event=>{
      event.preventDefault();const button=event.submitter;if(button.disabled)return;button.disabled=true;
      try{const data=new FormData(form);const {error}=await client.auth.signInWithPassword({email:String(data.get('email')),password:String(data.get('password'))});if(error)throw error;CampLegacy.closeDialog();}
      catch(e){form.querySelector('[role="status"]').textContent=e.message;}finally{button.disabled=false;}
    };
  }
  async function switchAccount(session){
    const owner=session?.user.id||null,offlineOnly=!!session?.offlineOnly;if(owner===activeOwner&&repository)return;
    adapter?.close();await transport?.close();if(repository)await repository.close();else if(db)await db.close();
    adapter=null;transport=null;repository=null;db=null;activeOwner=owner;
    document.querySelectorAll('.dialog').forEach(el=>el.remove());
    CampLegacy.state={gear:[],recipes:[],trips:[],logs:[],discardedTrips:[],recycleBin:[],locations:[],page:'home',activeTripId:null};
    CampLegacy.render();
    CampLegacy.forbidSave(()=>{throw new Error('帳號尚未完成初始化，已阻擋舊寫入。');});
    if(!owner){message('尚未登入。新版資料與操作依帳號隔離保存。');CampLegacy.setAction(name=>{if(name==='open-settings')login();else message('請先在設定登入；尚未遷移的舊資料並未清除。');});return;}
    db=await openDatabase({ownerId:owner,installationId:installation});
    let oldState=await storage.get('camp-assistant-state-v1'),oldRecord=await storage.get('camp-sync.v1');
    if(oldRecord?.session?.user?.id&&oldRecord.session.user.id!==owner){oldState=null;oldRecord={};}
    if(!await db.metadata.findOne('legacy-backup').exec()){
      const saved=await backup(db,{state:oldState||null,queue:dataOnlyLegacyRecord(oldRecord||{})});
      await db.metadata.insert({id:'legacy-backup',payload:JSON.stringify({backupId:saved.id})});
    }
    transport=new SupabaseTransport(client,owner);
    const priorActivation=await db.metadata.findOne('migration-active').exec();
    // An existing v8 account remains usable offline. It may read its durable
    // local snapshot and append commands, but an unverified v7 account must
    // never activate/migrate from an invented or stale session.
    if(offlineOnly&&!priorActivation){message('目前離線，已保留舊資料與本機備份；連線並驗證登入後才能安全啟用新版同步。');await db.close();db=null;return;}
    const {data:prepared,error}=priorActivation?{data:{status:'active'},error:null}:await client.rpc('camp_v8_prepare',{p_backup_id:newId()});
    if(error){message('尚未完成 v8 伺服器部署；本機備份已保存，正式資料未改動。');await db.close();db=null;return;}
    if(prepared?.status!=='active'){
      const preview=previewLegacy(prepared.source);
      const assessment=await CampV8.prepareMigration({db,rpc:(name,args)=>transport.rpc(name,args),localState:oldState||{},legacyRecord:oldRecord||{},prepared});
      message(assessment.status==='ready'
        ?`已載入 ${preview.state.trips?.length||0} 個舊行程預覽；本機與雲端備份已校驗。確認後才會匯入新版。`
        :`舊資料目前以唯讀方式顯示；保留了 ${assessment.recovery.length} 筆待核對內容，為避免資料退回，目前禁止切換寫入。`);
      const controls=document.createElement('div');controls.className='actions';
      const report=document.createElement('button');report.className='secondary';report.textContent='下載遷移檢查報告';
      report.onclick=()=>CampLegacy.download(new Blob([JSON.stringify(assessment,null,2)],{type:'application/json'}),'露營助手遷移檢查.json');controls.append(report);
      if(assessment.status==='ready'){
        const activate=document.createElement('button');activate.className='primary';activate.textContent='確認備份並啟用新版';
        activate.onclick=async()=>{activate.disabled=true;try{await CampV8.activateMigration({db,rpc:(name,args)=>transport.rpc(name,args),assessment});await db.close();db=null;schedule(session);}catch(e){message(e.message);activate.disabled=false;}};controls.append(activate);
      }
      document.getElementById('v8-boot-message').after(controls);return;
    }
    if(!priorActivation)await db.metadata.incrementalUpsert({id:'migration-active',payload:JSON.stringify({verifiedAt:new Date().toISOString()})});
    repository=new CampRepository({db,deviceId:installation,transport});
    adapter=installLegacyAdapter({repository,legacy:CampLegacy,onSettings:({root,status})=>{
      const form=root.querySelector('#settings-form');
      const section=root.createElement('section');section.className='sync-settings';
      const info=root.createElement('p');info.textContent=`待送 ${status.pending} 筆；衝突 ${status.conflicts} 筆。${status.error||''}`;section.append(info);
      for(const [label,handler] of [['立即同步',()=>repository.resync()],['已刪除項目',()=>adapter.recycle()],['待恢復操作',()=>adapter.recovery()],['登出同步帳號',()=>client.auth.signOut({scope:'local'})]]){
        const button=root.createElement('button');button.type='button';button.className='secondary';button.textContent=label;button.onclick=()=>Promise.resolve(handler()).catch(reportError);section.append(button);
      }
      form.append(section);
    }});
    await repository.start();await adapter.start();await transport.watch(()=>Promise.resolve(repository.resync()).catch(reportError));
    if(offlineOnly)message('離線模式：本機操作已保存，恢復網路並完成登入驗證後會自動同步。');
    globalThis.campV8={repository,adapter};
  }
  function schedule(session){accountTail=accountTail.then(()=>switchAccount(session)).catch(reportError);}
  // No await inside Auth event callbacks (avoids SDK lock deadlocks).
  async function availableLocalSession(session){
    if(session)return session;
    const stored=await storage.get('camp-auth-v8');
    let cached;try{cached=typeof stored==='string'?JSON.parse(stored):stored;}catch{return null;}
    // This selects an existing account's local database only. It never invents an authenticated network session.
    return cached?.user?.id?{user:{id:cached.user.id},offlineOnly:true}:null;
  }
  client.auth.onAuthStateChange((event,session)=>{setTimeout(()=>{
    Promise.resolve(availableLocalSession(session))
      .then(resolved=>schedule(event==='SIGNED_OUT'?null:resolved))
      .catch(reportError);
  },0);});
  const {data:{session}}=await client.auth.getSession();schedule(await availableLocalSession(session));
})().catch(error=>{
  console.error('[Camp v8] boot failed',error);
  const app=document.querySelector('#app');if(!app)return;
  const notice=document.createElement('p');notice.id='v8-boot-message';notice.className='notice';
  notice.textContent=error&&typeof error==='object'?(error.message||error.error_description||error.error||error.details||error.code||'同步啟動失敗。'):(String(error||'同步啟動失敗。'));
  app.prepend(notice);
});
