const DB_KEY = 'camp-mobile-card.v1';
let card = null;
let sourceSnapshot = null;
const $ = selector => document.querySelector(selector);
const esc = value => String(value ?? '').replace(/[&<>"']/g, char => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[char]));

function save() { localStorage.setItem(DB_KEY, JSON.stringify({ card, sourceSnapshot })); }
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

function mobileCardFromTrip(trip) {
  return {
    tripId: trip.id, code: trip.code, revision: trip.revision, name: trip.name,
    date: trip.date, endDate: trip.endDate || '', location: trip.location || '',
    duration: trip.duration, level: trip.level,
    items: (trip.items || []).map(entry => ({ id: entry.gearId, name: entry.name, checked: !!entry.checked })),
    shopping: (trip.shopping || []).map((entry, index) => ({
      id: entry.shoppingKey || `legacy:${entry.recipeId || ''}:${entry.name}:${index}`,
      name: entry.name, checked: !!entry.checked
    }))
  };
}

function pngChunk(bytes, expectedType) {
  const signature = '137,80,78,71,13,10,26,10';
  if (bytes.slice(0, 8).join(',') !== signature) throw new Error('不是有效的 PNG 行程卡。');
  const decoder = new TextDecoder();
  for (let offset = 8; offset + 12 <= bytes.length;) {
    const length = (((bytes[offset] << 24) >>> 0) | (bytes[offset + 1] << 16) | (bytes[offset + 2] << 8) | bytes[offset + 3]) >>> 0;
    const end = offset + 12 + length;
    if (end > bytes.length) throw new Error('PNG 行程卡資料不完整。');
    if (decoder.decode(bytes.slice(offset + 4, offset + 8)) === expectedType) return bytes.slice(offset + 8, offset + 8 + length);
    offset = end;
  }
  return null;
}

async function sha256(text) {
  const hash = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return [...new Uint8Array(hash)].map(byte => byte.toString(16).padStart(2, '0')).join('');
}

async function readPngCard(file) {
  const bytes = new Uint8Array(await file.arrayBuffer());
  const chunk = pngChunk(bytes, 'caMp');
  if (!chunk) throw new Error('這張 PNG 沒有可還原資料；請選擇電腦端原始匯出的行程卡，不要選通訊軟體轉傳後的圖片。');
  const metadata = JSON.parse(new TextDecoder().decode(chunk));
  if (metadata.format !== 'camp-card.v1' || metadata.compression !== 'gzip' || !metadata.payload) throw new Error('不支援這張行程卡的資料格式。');
  if (!('DecompressionStream' in window)) throw new Error('此瀏覽器不支援讀取壓縮行程卡；請改用最新版本 Chrome。');
  const compressed = Uint8Array.from(atob(metadata.payload), char => char.charCodeAt(0));
  const stream = new Blob([compressed]).stream().pipeThrough(new DecompressionStream('gzip'));
  const json = await new Response(stream).text();
  if (metadata.sha256 && await sha256(json) !== metadata.sha256) throw new Error('行程卡完整性檢查失敗。');
  const snapshot = JSON.parse(json);
  if (snapshot.format !== 'camp-card.v1' || !snapshot.trip?.id) throw new Error('行程卡內容不完整。');
  return { card: mobileCardFromTrip(snapshot.trip), snapshot };
}

async function loadCard(file) {
  const isPng = file.type === 'image/png' || /\.png$/i.test(file.name);
  if (!isPng) throw new Error('請選擇電腦端原始匯出的 PNG 行程卡。');
  const loaded = await readPngCard(file);
  card = loaded.card; sourceSnapshot = loaded.snapshot;
  save(); $('#status').textContent = '已從原始 PNG 行程卡載入，可離線使用。'; render();
}

function u32(value) { return new Uint8Array([(value >>> 24) & 255, (value >>> 16) & 255, (value >>> 8) & 255, value & 255]); }
function crc32(bytes) { let crc = 0xffffffff; for (const byte of bytes) { crc ^= byte; for (let bit = 0; bit < 8; bit++) crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1)); } return (crc ^ 0xffffffff) >>> 0; }
function addPngChunk(png, type, text) {
  const encoder = new TextEncoder(), typeBytes = encoder.encode(type), data = encoder.encode(text), raw = new Uint8Array(typeBytes.length + data.length);
  raw.set(typeBytes); raw.set(data, typeBytes.length);
  const chunk = new Uint8Array(12 + data.length); chunk.set(u32(data.length)); chunk.set(typeBytes, 4); chunk.set(data, 8); chunk.set(u32(crc32(raw)), 8 + data.length);
  for (let offset = 8; offset + 12 <= png.length;) {
    const length = (((png[offset] << 24) >>> 0) | (png[offset + 1] << 16) | (png[offset + 2] << 8) | png[offset + 3]) >>> 0;
    if (new TextDecoder().decode(png.slice(offset + 4, offset + 8)) === 'IEND') { const out = new Uint8Array(png.length + chunk.length); out.set(png.slice(0, offset)); out.set(chunk, offset); out.set(png.slice(offset), offset + chunk.length); return out; }
    offset += 12 + length;
  }
  throw new Error('無法建立 PNG 行程卡。');
}
async function gzip(text) {
  if (!('CompressionStream' in window)) throw new Error('此瀏覽器不支援建立壓縮行程卡；請改用最新版本 Chrome。');
  const stream = new Blob([text]).stream().pipeThrough(new CompressionStream('gzip'));
  return new Uint8Array(await new Response(stream).arrayBuffer());
}
function base64(bytes) { let text = ''; const block = 0x8000; for (let offset = 0; offset < bytes.length; offset += block) text += String.fromCharCode(...bytes.subarray(offset, offset + block)); return btoa(text); }
function wrap(ctx, text, x, y, width, lineHeight) { let line = '', currentY = y; for (const char of [...text]) { if (ctx.measureText(line + char).width > width && line) { ctx.fillText(line, x, currentY); line = char; currentY += lineHeight; } else line += char; } if (line) ctx.fillText(line, x, currentY); return currentY; }
async function drawUpdatedCard() {
  const pack = card.items || [], shopping = card.shopping || [], rows = Math.max(pack.length, shopping.length), width = 1080, height = Math.max(1280, 670 + rows * 42);
  const canvas = document.createElement('canvas'); canvas.width = width; canvas.height = height; const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#fffefa'; ctx.fillRect(0, 0, width, height); ctx.fillStyle = '#1f4937'; ctx.fillRect(0, 0, width, 24);
  ctx.fillStyle = '#18352a'; ctx.font = '700 42px sans-serif'; ctx.fillText('露營助手 ／ 離線行程卡', 64, 88); ctx.font = '700 58px sans-serif'; wrap(ctx, card.name, 64, 174, 920, 70);
  ctx.fillStyle = '#68746d'; ctx.font = '27px sans-serif'; ctx.fillText(`${card.date || ''}　${card.location || '未填地點'}`, 64, 274);
  ctx.strokeStyle = '#dbe1d9'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(64, 312); ctx.lineTo(1016, 312); ctx.stroke();
  const column = (title, items, x) => { ctx.fillStyle = '#18352a'; ctx.font = '700 30px sans-serif'; ctx.fillText(`${title}　${count(items)} / ${items.length}`, x, 370); ctx.font = '25px sans-serif'; let y = 420; items.forEach(item => { ctx.fillStyle = item.checked ? '#68746d' : '#18352a'; ctx.fillText(`${item.checked ? '☑' : '☐'}  ${item.name}`, x, y); y += 42; }); };
  column('打包清單', pack, 64); column('採買清單', shopping, 570);
  ctx.fillStyle = '#68746d'; ctx.font = '19px sans-serif'; ctx.fillText('此 PNG 可匯回露營助手同步勾選狀態。', 64, height - 48);
  const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
  if (!blob) throw new Error('無法產生 PNG 行程卡。'); return new Uint8Array(await blob.arrayBuffer());
}
function snapshotWithChecks() {
  if (!sourceSnapshot?.trip) throw new Error('找不到原始行程卡資料，請重新匯入 PNG。');
  const snapshot = structuredClone(sourceSnapshot), pack = new Map((card.items || []).map(item => [item.id, !!item.checked])), shop = new Map((card.shopping || []).map(item => [item.id, !!item.checked]));
  (snapshot.trip.items || []).forEach(entry => { if (pack.has(entry.gearId)) entry.checked = pack.get(entry.gearId); });
  (snapshot.trip.shopping || []).forEach((entry, index) => { const id = entry.shoppingKey || `legacy:${entry.recipeId || ''}:${entry.name}:${index}`; if (shop.has(id)) entry.checked = shop.get(id); });
  snapshot.exportedAt = new Date().toISOString(); return snapshot;
}
async function exportCheckin() {
  if (!card) return;
  const snapshot = snapshotWithChecks(), json = JSON.stringify(snapshot), metadata = JSON.stringify({ format:'camp-card.v1', compression:'gzip', sha256:await sha256(json), payload:base64(await gzip(json)) });
  const tagged = addPngChunk(await drawUpdatedCard(), 'caMp', metadata), blob = new Blob([tagged], { type:'image/png' });
  const link = document.createElement('a'); link.href = URL.createObjectURL(blob); link.download = `${card.code || '行程'}_已勾選.png`; link.click(); setTimeout(() => URL.revokeObjectURL(link.href), 500);
  $('#status').textContent = '已輸出更新行程卡 PNG；傳回電腦端後選「匯入勾選卡」。';
}

['card-file', 'replace-file'].forEach(id => $("#" + id).onchange = async event => { const file = event.target.files?.[0]; if (!file) return; try { await loadCard(file); } catch (error) { $('#status').textContent = `匯入失敗：${error.message}`; } });
$('#export').onclick = exportCheckin;
try { const saved = JSON.parse(localStorage.getItem(DB_KEY)); if (saved?.card && saved?.sourceSnapshot) { card = saved.card; sourceSnapshot = saved.sourceSnapshot; } else localStorage.removeItem(DB_KEY); } catch { localStorage.removeItem(DB_KEY); }
if ('serviceWorker' in navigator) navigator.serviceWorker.register('./sw.js', { updateViaCache: 'none' }).catch(() => {});
render();
