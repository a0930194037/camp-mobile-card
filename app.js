const $ = selector => document.querySelector(selector);
const esc = value => String(value ?? '').replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
const storage = { async get(key) { try { return JSON.parse(localStorage.getItem(key)); } catch { return null; } }, async set(key,value) { localStorage.setItem(key,JSON.stringify(value)); } };
const sync = new CampSync(storage);
let state = null;
let tab = 'trips';
const activeTrip = () => state?.trips?.find(trip => trip.id === state.activeTripId) || state?.trips?.[0];
const done = list => (list || []).filter(item => item.checked).length;

function status(text) { $('#status').textContent = text; }
function save(before) { sync.queue(before, state); render(); }
function tripList() {
  const trips = state?.trips || [];
  if (!trips.length) return '<p class="empty">電腦端新增行程後會自動出現在這裡。</p>';
  return `<section class="section"><div class="section-head"><h2>我的行程</h2></div>${trips.map(trip => `<button class="trip ${trip.id===activeTrip()?.id?'current':''}" data-trip="${esc(trip.id)}"><strong>${esc(trip.name)}</strong><span>${esc(trip.date || '')}　${esc(trip.location || '未填地點')}</span><small>打包 ${done(trip.items)}/${trip.items?.length||0} · 採買 ${done(trip.shopping)}/${trip.shopping?.length||0}</small></button>`).join('')}</section>`;
}
function listPage() {
  const trip = activeTrip(); if (!trip) return '<p class="empty">尚無可同步的行程。</p>';
  const section = (title,key) => `<section class="section"><div class="section-head"><h2>${title}</h2><span class="count">${done(trip[key])}/${trip[key]?.length||0}</span></div>${(trip[key]||[]).map((item,index) => `<label class="item ${item.checked?'checked':''}"><input type="checkbox" data-check="${key}" data-index="${index}" ${item.checked?'checked':''}><span>${esc(item.name)}</span></label>`).join('')}</section>`;
  return `<div class="trip-summary"><h2>${esc(trip.name)}</h2><p>${esc(trip.date || '')}　${esc(trip.location || '')}</p></div>${section('打包清單','items')}${section('採買清單','shopping')}`;
}
function catalog(title, values, sub) { return `<section class="section"><div class="section-head"><h2>${title}</h2><span class="count">${values.length}</span></div>${values.map(value=>`<div class="item"><span>${esc(value.name)}</span>${sub?`<small>${esc(value[sub]||'')}</small>`:''}</div>`).join('')}</section>`; }
function render() {
  $('#auth').classList.toggle('hidden', sync.signedIn()); $('#app').classList.toggle('hidden', !sync.signedIn());
  if (!sync.signedIn()) return;
  $('#tabs').innerHTML = [['trips','行程'],['lists','清單'],['gear','裝備'],['recipes','料理']].map(([id,name])=>`<button data-tab="${id}" class="${tab===id?'active':''}">${name}</button>`).join('');
  $('#content').innerHTML = tab==='trips'?tripList():tab==='lists'?listPage():tab==='gear'?catalog('我的裝備',state?.gear||[],'category'):catalog('我的料理',state?.recipes||[],'meal');
  document.querySelectorAll('[data-tab]').forEach(button=>button.onclick=()=>{tab=button.dataset.tab;render();});
  document.querySelectorAll('[data-trip]').forEach(button=>button.onclick=()=>{const before=structuredClone(state);state.activeTripId=button.dataset.trip;save(before);});
  document.querySelectorAll('[data-check]').forEach(input=>input.onchange=()=>{const before=structuredClone(state), item=activeTrip()?.[input.dataset.check]?.[Number(input.dataset.index)]; if(!item)return; item.checked=input.checked; save(before);});
}
async function replaceState(next) { if (!next || typeof next !== 'object') return; state=next; await storage.set('camp-mobile-state.v1',state); render(); }
async function doSync() { if (!sync.signedIn()) return; await sync.sync(()=>state,replaceState); }
async function authenticate(kind) { const email=$('#email').value.trim(),password=$('#password').value; if(!email||!password){status('請輸入 Email 與密碼');return;} try{status('處理中…');if(kind==='signup')await sync.signUp(email,password);else await sync.signIn(email,password);await doSync();status('已登入並同步');render();}catch(error){status(error.message);} }
$('#login').onclick=()=>authenticate('login'); $('#signup').onclick=()=>authenticate('signup'); $('#sync-now').onclick=doSync; $('#logout').onclick=async()=>{await sync.signOut();state=null;render();status('已登出');};
$('#resend').onclick=async()=>{const email=$('#email').value.trim();if(!email){status('請先輸入 Email');return;}try{await sync.resendVerification(email);status('已重寄驗證信；請只開啟最新的一封。');}catch(error){status(error.message);}};
sync.onStatus=status;
(async()=>{await sync.load();state=await storage.get('camp-mobile-state.v1');render();if(sync.signedIn()){await doSync();setInterval(doSync,15000);}})();
