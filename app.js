const DB_KEY = 'camp-mobile-card.v1';
let card = null;
const $ = selector => document.querySelector(selector);
const esc = value => String(value ?? '').replace(/[&<>"']/g, char => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[char]));

function save() { localStorage.setItem(DB_KEY, JSON.stringify(card)); }
function count(items) { return items.filter(item => item.checked).length; }
function dateText(value) { return value ? String(value).replace(/^(\d{4})-(\d{2})-(\d{2})$/, '$1-$2-$3') : ''; }

function render() {
  const hasCard = !!card;
  $('#empty').classList.toggle('hidden', hasCard); $('#card').classList.toggle('hidden', !hasCard);
  if (!hasCard) return;
  $('#title').textContent = card.name;
  $('#meta').textContent = [dateText(card.date), card.location || '未填地點'].filter(Boolean).join('　');
  const section = (title, key) => {
    const items = card[key] || [];
    return `<section class="section"><div class="section-head"><h2>${title}</h2><span class="count">${count(items)} / ${items.length}</span></div>${items.map(item => `<label class="item ${item.checked ? 'checked' : ''}"><input type="checkbox" data-kind="${key}" data-id="${esc(item.id)}" ${item.checked ? 'checked' : ''}><span>${esc(item.name)}</span></label>`).join('')}</section>`;
  };
  $('#lists').innerHTML = section('打包清單', 'items') + section('採買清單', 'shopping');
  document.querySelectorAll('[data-kind]').forEach(input => input.onchange = () => {
    const item = card[input.dataset.kind].find(entry => entry.id === input.dataset.id);
    if (!item) return; item.checked = input.checked; save(); $('#status').textContent = '已離線儲存勾選。'; render();
  });
}

async function loadCard(file) {
  const payload = JSON.parse(await file.text());
  if (payload?.format !== 'camp-mobile-card.v1' || !payload.card?.tripId || !Array.isArray(payload.card.items) || !Array.isArray(payload.card.shopping)) throw new Error('不是露營助手的手機離線卡。');
  card = structuredClone(payload.card); save(); $('#status').textContent = '行程卡已載入，可離線使用。'; render();
}

function exportCheckin() {
  if (!card) return;
  const checks = {
    pack: Object.fromEntries((card.items || []).map(item => [item.id, !!item.checked])),
    shopping: Object.fromEntries((card.shopping || []).map(item => [item.id, !!item.checked]))
  };
  const payload = { format:'camp-mobile-checkin.v1', exportedAt:new Date().toISOString(), source:{ tripId:card.tripId, code:card.code, revision:card.revision }, checks };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type:'application/json' });
  const link = document.createElement('a'); link.href = URL.createObjectURL(blob); link.download = `${card.code || '行程'}_勾選更新.json`; link.click(); setTimeout(() => URL.revokeObjectURL(link.href), 500);
  $('#status').textContent = '已輸出勾選更新檔；傳回電腦端後選「匯入勾選」。';
}

['card-file', 'replace-file'].forEach(id => $("#" + id).onchange = async event => { const file = event.target.files?.[0]; if (!file) return; try { await loadCard(file); } catch (error) { $('#status').textContent = `匯入失敗：${error.message}`; } });
$('#export').onclick = exportCheckin;
try { const saved = localStorage.getItem(DB_KEY); if (saved) card = JSON.parse(saved); } catch { localStorage.removeItem(DB_KEY); }
if ('serviceWorker' in navigator) navigator.serviceWorker.register('./sw.js').catch(() => {});
render();
