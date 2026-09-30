/* Small presentation refinements loaded after the core side-panel app. */
const originalTripDialog = tripDialog;
const originalCreateTrip = createTrip;
const originalRender = render;
const originalAction = action;
const originalDialog = dialog;
const originalBuildTripItems = buildTripItems;
// Always open the side panel on the active 行程 tab.  The overview remains a
// deliberate destination through「所有行程」instead of a restored page state.
let homeOpened = true;

function dateCode(date) {
  return String(date || '').replace(/[^0-9]/g, '').slice(0, 8) || '00000000';
}

function nextDate(date) {
  const value = new Date(`${date}T00:00:00`);
  value.setDate(value.getDate() + 1);
  const month = String(value.getMonth() + 1).padStart(2, '0');
  const day = String(value.getDate()).padStart(2, '0');
  return `${value.getFullYear()}-${month}-${day}`;
}

function nextTripCode(date, excludeId) {
  const prefix = `C-${dateCode(date)}-`;
  const used = (state?.trips || [])
    .filter(trip => trip.id !== excludeId && String(trip.code || '').startsWith(prefix))
    .map(trip => Number(String(trip.code).slice(prefix.length)))
    .filter(Number.isFinite);
  return `${prefix}${String((used.length ? Math.max(...used) : 0) + 1).padStart(2, '0')}`;
}

createTrip = function (data = {}) {
  const trip = originalCreateTrip(data);
  trip.code = nextTripCode(trip.date);
  trip.endDate = data.duration === 'overnight' ? nextDate(trip.date) : (data.endDate || '');
  trip.siteAmenities = data.siteAmenities || [];
  return trip;
};

buildTripItems = function (trip) {
  const needsOvernightKit = ['overnight', 'multi-day'].includes(trip.duration);
  return originalBuildTripItems({ ...trip, duration: needsOvernightKit ? 'overnight' : trip.duration });
};

function durationName(trip) {
  return ({ day: '日歸', overnight: '2 日 1 夜', 'multi-day': '多日露營' })[trip.duration] || '日歸';
}

function dateRange(trip) {
  if (trip.duration === 'overnight') return `${trip.date} ～ ${trip.endDate || nextDate(trip.date)}`;
  return trip.duration === 'multi-day' && trip.endDate ? `${trip.date} ～ ${trip.endDate}` : trip.date;
}

function renderRecipePicker(trip) {
  const meals = ['早餐', '午餐', '晚餐', '宵夜'];
  const selected = new Set(trip?.recipeIds || []);
  const grouped = (state.recipes || []).reduce((all, recipe) => {
    const meal = recipe.meal || '晚餐';
    (all[meal] ||= []).push(recipe);
    return all;
  }, {});
  const active = meals.find(meal => (grouped[meal] || []).some(recipe => selected.has(recipe.id))) || '早餐';
  const row = recipe => `<div class="recipe-row"><label><input type="checkbox" name="recipe" value="${esc(recipe.id)}" ${selected.has(recipe.id) ? 'checked' : ''}><span>${esc(recipe.name)}</span></label><button type="button" class="favorite ${recipe.favorite ? 'is-favorite' : ''}" data-favorite-recipe="${esc(recipe.id)}" aria-label="標記最愛 ${esc(recipe.name)}">${recipe.favorite ? '★' : '☆'}</button></div>`;
  const section = meal => {
    const recipes = [...(grouped[meal] || [])].sort((a, b) => Number(!!b.favorite) - Number(!!a.favorite) || a.name.localeCompare(b.name, 'zh-Hant'));
    return recipes.length ? recipes.map(row).join('') : '<p class="tiny">尚無可選料理</p>';
  };
  return `<div class="recipe-picker"><div class="meal-tabs">${meals.map(meal => `<button type="button" data-meal-tab="${meal}" class="${meal === active ? 'active' : ''}">${meal}</button>`).join('')}</div><div class="recipe-groups">${meals.map(meal => `<section data-meal-panel="${meal}" ${meal === active ? '' : 'hidden'}>${section(meal)}</section>`).join('')}</div></div>`;
}

// The original file accumulated several declarations while iterating on the UI.
// Make this one renderer the sole runtime source of the menu UI.
recipePicker = renderRecipePicker;

function decorateTripDates() {
  document.querySelectorAll('button.card[data-action="open-trip"]').forEach(card => {
    const current = state.trips.find(trip => trip.id === card.dataset.id);
    const meta = card.querySelector('.meta');
    if (current && meta) meta.textContent = `${dateRange(current)}　·　${current.location || '未填地點'}　·　${durationName(current)} · ${levelText[current.level]}`;
  });
  if (!['trips', 'lists'].includes(state.page)) return;
  const active = trip();
  if (!active) return;
  const sub = document.querySelector('.page .sub');
  if (sub) sub.innerHTML = `${dateRange(active)}　${esc(active.location || '未填地點')}<br>${durationName(active)} · ${levelText[active.level]}`;
  const context = document.querySelector('.trip-context');
  if (context) context.innerHTML = `${dateRange(active)}　${esc(active.location || '未填地點')}<br>${durationName(active)} · ${levelText[active.level]}　｜　目的：${esc(cardPurpose(active))}`;
}

function normalizeTripCodes() {
  const groups = new Map();
  (state?.trips || []).forEach(trip => {
    if (trip.duration === 'night-rush') trip.duration = 'overnight';
    const key = dateCode(trip.date);
    groups.set(key, [...(groups.get(key) || []), trip]);
  });
  let changed = false;
  groups.forEach((trips, day) => {
    trips.sort((a, b) => String(a.createdAt || '').localeCompare(String(b.createdAt || '')));
    trips.forEach((trip, index) => {
      const code = `C-${day}-${String(index + 1).padStart(2, '0')}`;
      if (trip.code !== code) { trip.code = code; changed = true; }
    });
  });
  // Rendering may normalize legacy display fields, but must never create a
  // background sync operation that can overwrite a real user action.
}

function promoteTripActions() {
  document.querySelectorAll('[data-action="new-trip"], [data-action="show-trip-list"]').forEach(button => {
    button.classList.remove('ghost', 'secondary', 'trip-list-link');
    button.classList.add('primary');
  });
}

function refineTripCardActions() {
  const cardPage = document.querySelector('.page:has([data-action="edit-trip"])');
  if (!cardPage) return;

  cardPage.querySelector('[data-action="new-trip"]')?.remove();
  const archive = cardPage.querySelector('[data-action="archive-trip"]');
  if (!archive || cardPage.querySelector('[data-action="delete-trip"]')) return;

  const remove = document.createElement('button');
  remove.type = 'button';
  remove.className = 'ghost danger';
  remove.dataset.action = 'delete-trip';
  remove.textContent = state.pendingDeleteTripId === state.activeTripId ? '再按一次刪除' : '刪除行程';
  remove.onclick = () => action('delete-trip');
  archive.parentElement.append(remove);
}

function discardTrip(current) {
  state.discardedTrips ??= [];
  const changedAt = now();
  const cancelled = { ...structuredClone(current), status: 'cancelled', statusUpdatedAt: changedAt, updatedAt: changedAt };
  // Keep the original trip ID as the cancellation record ID. The sync layer
  // can then compare active/cancelled/purged states for exactly one trip.
  state.discardedTrips.unshift({ id: current.id, tripId: current.id, trip: cancelled, status: 'cancelled', statusUpdatedAt: changedAt, deletedAt: changedAt });
  state.discardedTrips = state.discardedTrips.slice(0, 10);
  state.trips = state.trips.filter(item => item.id !== current.id);
  state.activeTripId = null;
  state.pendingDeleteTripId = null;
}

function refineHomeRows() {
  const page = document.querySelector('.page');
  if (!page) return;
  const heading = page.querySelector('.row.between');
  if (heading && (state.discardedTrips || []).length && !heading.querySelector('[data-action="show-cancelled-trips"]')) {
    const button = document.createElement('button');
    button.type = 'button'; button.className = 'secondary';
    button.dataset.action = 'show-cancelled-trips';
    button.textContent = `取消的行程 (${(state.discardedTrips || []).length})`;
    button.onclick = () => action('show-cancelled-trips');
    const newTrip = heading.querySelector('[data-action="new-trip"]');
    const actions = document.createElement('div');
    actions.className = 'home-header-actions';
    newTrip.before(actions); actions.append(button, newTrip);
  }
  page.querySelectorAll('button.card[data-action="open-trip"]').forEach(card => {
    if (card.parentElement.classList.contains('home-trip-row')) return;
    const row = document.createElement('div'); row.className = 'home-trip-row';
    card.before(row); row.append(card); card.style.width = 'auto';
    const remove = document.createElement('button');
    remove.type = 'button'; remove.className = 'ghost danger';
    remove.dataset.action = 'trash-trip'; remove.dataset.id = card.dataset.id;
    remove.textContent = '×';
    remove.setAttribute('aria-label', '取消行程');
    remove.title = '取消行程';
    remove.onclick = () => action('trash-trip', { id: card.dataset.id });
    row.append(remove);
    const progress = card.querySelector('.progress');
    if (progress && !card.querySelector('.home-progress-label')) {
      progress.insertAdjacentHTML('beforebegin', `<p class="home-progress-label">裝備清單 · 已打包 ${done(state.trips.find(entry => entry.id === card.dataset.id)?.items || [])} / ${(state.trips.find(entry => entry.id === card.dataset.id)?.items || []).length}</p>`);
    }
  });
}

function renderCancelledTrips() {
  const entries = state.discardedTrips || [];
  const page = `<section class="page"><div class="page-heading cancelled-page-heading"><div><h2 class="title">取消的行程</h2></div></div>${entries.length ? entries.map(entry => `<div class="cancelled-trip"><h3>${esc(entry.trip.name)}</h3><p class="meta">${entry.trip.date}　${esc(entry.trip.location || '未填地點')}<br>取消於 ${new Date(entry.deletedAt).toLocaleDateString('zh-TW')}</p><div class="actions"><button class="ghost" data-action="restore-trip" data-id="${entry.id}">復原行程</button><button class="ghost danger" data-action="purge-trip" data-id="${entry.id}">${state.pendingPurgeId === entry.id ? '再按一次永久清空' : '永久清空'}</button></div></div>`).join('') : '<p class="sub">目前沒有取消的行程。</p>'}</section>`;
  document.querySelector('#app').innerHTML = header() + page + nav();
  bind();
  const home = document.querySelector('.nav button[data-page="trips"]');
  if (home) { home.dataset.page = 'home'; home.textContent = '行程'; }
}

render = function () {
  // Navigation is a transient UI choice. Every fresh launch uses the current
  // "我的行程" overview (the tent layout), never an old restored sub-page.
  if (!window.__campInitialViewSet) {
    state.page = 'home';
    window.__campInitialViewSet = true;
  }
  normalizeTripCodes();
  state.discardedTrips ??= [];
  // The checklist is a view of a trip.  If the previously selected trip is no
  // longer available, restore the most recently opened active trip instead of
  // showing an empty-state call to action while usable lists already exist.
  if (state.page === 'lists' && !trip()) {
    const recentTrip = (state.trips || [])
      .filter(candidate => candidate.status !== 'archived')
      .sort((left, right) => String(right.lastOpenedAt || right.updatedAt || right.createdAt || '')
        .localeCompare(String(left.lastOpenedAt || left.updatedAt || left.createdAt || '')))[0];
    if (recentTrip) {
      state.activeTripId = recentTrip.id;
    }
  }
  if (!homeOpened && state.page === 'trips') {
    state.page = 'home';
    homeOpened = true;
  }

  if (state.page === 'cancelled') return renderCancelledTrips();
  if (state.page !== 'home') {
    const result = originalRender();
    promoteTripActions();
    refineTripCardActions();
    decorateTripDates();
    return result;
  }

  const selectedTrip = state.activeTripId;
  state.page = 'trips';
  state.activeTripId = null;
  originalRender();
  state.page = 'home';
  state.activeTripId = selectedTrip;

  const app = document.querySelector('#app');
  const overview = app?.querySelector('.page');
  const eyebrow = overview?.querySelector('.eyebrow');
  const title = overview?.querySelector('.title');
  eyebrow?.remove();
  if (title) title.textContent = '我的行程';

  // Home is rendered from the trip-list template, but the compact navigation
  // already names that destination "home".  Update either form before binding.
  const homeButton = app?.querySelector('.nav button[data-page="home"], .nav button[data-page="trips"]');
  if (homeButton) {
    homeButton.dataset.page = 'home';
    homeButton.textContent = '行程';
    app.querySelectorAll('.nav button').forEach(button => button.classList.remove('active'));
    homeButton.classList.add('active');
  }
  promoteTripActions();
  refineHomeRows();
  decorateTripDates();
};

action = async function (name, data = {}) {
  if (name === 'open-trip') {
    const opened = state.trips.find(candidate => candidate.id === data.id);
    if (opened) opened.lastOpenedAt = now();
    return originalAction(name, data);
  }
  if (name === 'show-trip-list') {
    state.page = 'home';
    return render();
  }
  if (name === 'delete-trip') {
    const current = trip();
    if (!current) return;
    discardTrip(current);
    state.page = 'home';
    await store.save();
    return render();
  }
  if (name === 'trash-trip') {
    const current = state.trips.find(item => item.id === data.id);
    if (!current) return;
    discardTrip(current); state.page = 'home'; await store.save(); return render();
  }
  if (name === 'show-cancelled-trips') { state.page = 'cancelled'; return render(); }
  if (name === 'back-home') { state.page = 'home'; state.pendingPurgeId = null; return render(); }
  if (name === 'restore-trip') {
    const entry = (state.discardedTrips || []).find(item => item.id === data.id);
    if (!entry) return;
    const changedAt = now();
    state.trips.unshift({ ...entry.trip, status: 'active', statusUpdatedAt: changedAt, updatedAt: changedAt });
    state.discardedTrips = state.discardedTrips.filter(item => item.id !== entry.id);
    state.pendingPurgeId = null; state.page = 'home'; await store.save(); return render();
  }
  if (name === 'purge-trip') {
    if (state.pendingPurgeId !== data.id) { state.pendingPurgeId = data.id; return render(); }
    const entry = (state.discardedTrips || []).find(item => item.id === data.id);
    const changedAt = now();
    state.tripTombstones ??= [];
    state.tripTombstones = state.tripTombstones.filter(item => (item.tripId || item.id) !== (entry?.tripId || entry?.trip?.id || data.id));
    state.tripTombstones.push({ tripId: entry?.tripId || entry?.trip?.id || data.id, status: 'purged', statusUpdatedAt: changedAt, purgedAt: changedAt });
    state.discardedTrips = (state.discardedTrips || []).filter(item => item.id !== data.id);
    state.pendingPurgeId = null; await store.save(); return render();
  }
  state.pendingDeleteTripId = null;
  return originalAction(name, data);
};

dialog = function (html) {
  const dialogRoot = originalDialog(html);
  const box = dialogRoot.querySelector('.dialog-box');
  const topbar = document.createElement('div');
  topbar.className = 'dialog-topbar';
  topbar.innerHTML = '<button type="button" class="ghost" aria-label="返回" data-dialog-close>返回</button>';
  topbar.querySelector('[data-dialog-close]').onclick = closeDialog;
  box.prepend(topbar);

  const footer = box.querySelector('form > .actions:last-child');
  if (footer) {
    footer.classList.add('dialog-footer');
  } else {
    const cancel = document.createElement('div');
    cancel.className = 'actions dialog-footer';
    cancel.innerHTML = '<button type="button" class="secondary" data-dialog-close>取消</button>';
    cancel.querySelector('[data-dialog-close]').onclick = closeDialog;
    box.append(cancel);
  }
  return dialogRoot;
};

tripDialog = function (existing) {
  originalTripDialog(existing);

  const dialogRoot = document.querySelector('.dialog:last-of-type');
  const tripForm = dialogRoot?.querySelector('#trip-form');
  const duration = dialogRoot?.querySelector('select[name="duration"]');
  const dateInput = dialogRoot?.querySelector('input[name="date"]');
  const dateField = dateInput?.closest('.field');
  if (tripForm && duration && dateField && !duration.querySelector('option[value="multi-day"]')) {
    duration.insertAdjacentHTML('beforeend', '<option value="multi-day">多日露營</option>');
    duration.value = existing?.duration === 'night-rush' ? 'overnight' : (existing?.duration || duration.value);
    const endField = document.createElement('div');
    endField.className = 'field';
    endField.innerHTML = `<label>結束日期</label><input type="date" name="endDate" value="${esc(existing?.endDate || '')}">`;
    dateField.after(endField);
    const endInput = endField.querySelector('input');
    const toggleEndDate = () => {
      const multiDay = duration.value === 'multi-day';
      const overnight = duration.value === 'overnight';
      endField.hidden = !(multiDay || overnight);
      endInput.required = multiDay;
      endInput.disabled = overnight;
      endInput.min = dateInput.value;
      if (overnight) endInput.value = nextDate(dateInput.value);
      else if (multiDay && !endInput.value) endInput.value = dateInput.value;
    };
    duration.onchange = toggleEndDate;
    dateInput.onchange = toggleEndDate;
    toggleEndDate();

    tripForm.onsubmit = async event => {
      event.preventDefault();
      const data = new FormData(tripForm);
      const selectedDuration = data.get('duration');
      const siteAmenities = data.getAll('amenity');
      const values = { name:data.get('name'), date:data.get('date'), endDate:selectedDuration === 'overnight' ? nextDate(data.get('date')) : (data.get('endDate') || ''), location:data.get('location'), duration:selectedDuration, level:data.get('level'), campType:data.get('campType'), power:siteAmenities.includes('power'), siteAmenities, goals:data.getAll('goal'), prep:data.get('prep') === 'on', recipeIds:data.getAll('recipe') };
      if (existing) { Object.assign(existing, values); recalc(existing); }
      else { const fresh = createTrip(values); state.trips.unshift(fresh); state.activeTripId = fresh.id; }
      await store.save(); closeDialog(); state.page = 'trips'; render();
    };
  }

  const environment = dialogRoot?.querySelector('select[name="campType"]');
  if (!environment) return;

  const selected = environment.value;
  const choices = [
    ['grass', '草地營位'],
    ['pallet', '棧板營位'],
    ['forest', '林地'],
    ['riverside', '溪邊／河畔'],
    ['beach', '海邊'],
    ['mountain', '山區'],
    ['campground', '一般營區'],
    ['wild', '野營地']
  ];

  environment.innerHTML = choices
    .map(([value, label]) => `<option value="${value}" ${selected === value ? 'selected' : ''}>${label}</option>`)
    .join('');

  const environmentField = environment.closest('.field');
  const powerField = dialogRoot.querySelector('input[name="power"]')?.closest('.field');
  if (!environmentField || !powerField) return;

  const environmentTitle = environmentField.querySelector(':scope > label');
  if (!environmentTitle) return;

  environmentTitle.textContent = '營地環境';
  const labelRow = document.createElement('div');
  labelRow.className = 'environment-label-row';
  labelRow.append(environmentTitle);
  environmentField.prepend(labelRow);
  powerField.remove();

  if (!dialogRoot.querySelector('[data-amenities]')) {
    const amenities = [
      ['shower', '淋浴間'], ['toilet', '廁所'], ['drinking-water', '飲用水'], ['power', '電源插座'],
      ['shared-freezer', '共用冰櫃'], ['shared-tables', '公用桌椅'], ['washing-station', '洗滌台'], ['trash', '垃圾集中處'],
      ['parking', '停車位'], ['signal', '網路／訊號'], ['fire-zone', '營火區'], ['shop', '販售部']
    ];
    const selected = new Set(existing?.siteAmenities || []);
    const amenityField = document.createElement('div');
    amenityField.className = 'field full'; amenityField.dataset.amenities = 'true';
    amenityField.innerHTML = `<label>現場設施</label><div class="compact-options">${amenities.map(([value, label]) => `<label><input type="checkbox" name="amenity" value="${value}" ${selected.has(value) ? 'checked' : ''}> ${label}</label>`).join('')}</div>`;
    environmentField.after(amenityField);
  }

  const locationInput = dialogRoot.querySelector('input[name="location"]');
  const locationField = locationInput?.closest('.field');
  if (locationInput && locationField && !locationField.querySelector('[data-map-search]')) {
    const locationSearch = document.createElement('div');
    locationSearch.className = 'location-search';
    locationInput.before(locationSearch);
    locationSearch.append(locationInput);
    const mapButton = document.createElement('button');
    mapButton.type = 'button';
    mapButton.className = 'secondary';
    mapButton.dataset.mapSearch = 'true';
    mapButton.textContent = 'Google 地圖';
    mapButton.onclick = () => {
      const query = locationInput.value.trim();
      if (!query) { locationInput.focus(); return; }
      window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`, '_blank', 'noopener');
    };
    locationSearch.append(mapButton);
  }


  dialogRoot.addEventListener('click', async (event) => {
    const favoriteButton = event.target.closest('[data-favorite-recipe]');
    if (favoriteButton) {
      event.preventDefault();
      event.stopImmediatePropagation();
      const recipe = state.recipes.find(item => item.id === favoriteButton.dataset.favoriteRecipe);
      if (!recipe) return;
      recipe.favorite = !recipe.favorite;
      await store.save();

      const recipeField = dialogRoot.querySelector('input[name="recipe"]')?.closest('.field.full');
      const picker = recipeField?.querySelector('.recipe-picker');
      if (!picker) return;
      const selectedIds = [...dialogRoot.querySelectorAll('input[name="recipe"]:checked')].map(input => input.value);
      picker.outerHTML = recipePicker({ recipeIds: selectedIds });
      return;
    }

    const mealTab = event.target.closest('[data-meal-tab]');
    if (!mealTab) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    const meal = mealTab.dataset.mealTab;
    dialogRoot.querySelectorAll('[data-meal-tab]').forEach(button => button.classList.toggle('active', button === mealTab));
    dialogRoot.querySelectorAll('[data-meal-panel]').forEach(panel => { panel.hidden = panel.dataset.mealPanel !== meal; });
  }, true);
};

// Authoritative trip editor. This replaces the duplicated legacy dialog declarations.
function openTripEditor(existing) {
  const t = existing || { name:'未命名露營', date:new Date().toISOString().slice(0, 10), endDate:'', location:'', duration:'day', level:'L1', campType:'grass', goals:[], prep:false, recipeIds:[], siteAmenities:[] };
  const environment = [['grass','草地營位'],['pallet','棧板營位'],['forest','林地'],['riverside','溪邊／河畔'],['beach','海邊'],['mountain','山區'],['campground','一般營區'],['wild','野營地']];
  const amenities = [['shower','淋浴間'],['toilet','廁所'],['drinking-water','飲用水'],['power','電源插座'],['shared-freezer','共用冰櫃'],['shared-tables','公用桌椅'],['washing-station','洗滌台'],['trash','垃圾集中處'],['parking','停車位'],['signal','網路／訊號'],['fire-zone','營火區'],['shop','販售部']];
  const selectedAmenities = new Set(t.siteAmenities || []);
  const d = dialog(`<h2>${existing ? '編輯行程' : '新增行程'}</h2><form id="trip-form"><div class="form-grid"><div class="field full"><label>行程名稱</label><input name="name" required value="${esc(t.name)}"></div><div class="field"><label>日期</label><input type="date" name="date" value="${t.date}"></div><div class="field" id="end-date-field"><label>結束日期</label><input type="date" name="endDate" value="${esc(t.endDate || '')}"></div><div class="field"><label>地點</label><div class="location-search"><input name="location" value="${esc(t.location)}"><button type="button" class="secondary" data-map-search>Google 地圖</button></div></div><div class="field"><label>行程</label><select name="duration"><option value="day" ${t.duration==='day'?'selected':''}>日歸</option><option value="overnight" ${t.duration==='overnight'?'selected':''}>2 日 1 夜</option><option value="multi-day" ${t.duration==='multi-day'?'selected':''}>多日露營</option></select></div><div class="field"><label>量級</label><select name="level">${Object.entries(levelText).map(([value,label])=>`<option value="${value}" ${t.level===value?'selected':''}>${label}</option>`).join('')}</select></div><div class="field"><label>營地環境</label><select name="campType">${environment.map(([value,label])=>`<option value="${value}" ${t.campType===value?'selected':''}>${label}</option>`).join('')}</select></div><div class="field full"><label>現場設施</label><div class="compact-options">${amenities.map(([value,label])=>`<label><input type="checkbox" name="amenity" value="${value}" ${selectedAmenities.has(value)?'checked':''}> ${label}</label>`).join('')}</div></div><div class="field full"><label>這次想做什麼</label><div class="compact-options">${Object.entries(goalText).map(([value,label])=>`<label><input type="checkbox" name="goal" value="${value}" ${(t.goals||[]).includes(value)?'checked':''}> ${label}</label>`).join('')}</div></div><div class="field full"><label>這天的菜單</label>${recipePicker(t)}</div><div class="field full"><label class="inline-label"><input type="checkbox" name="prep" ${t.prep?'checked':''}> 在家先備料</label></div></div><div class="actions"><button class="primary">${existing?'儲存變更':'建立行程卡片'}</button><button type="button" class="secondary" id="cancel">取消</button></div></form>`);
  const form = $('#trip-form', d), duration = $('select[name="duration"]', d), date = $('input[name="date"]', d), endField = $('#end-date-field', d), endDate = $('input[name="endDate"]', d);
  const updateDates = () => { const overnight = duration.value === 'overnight', multi = duration.value === 'multi-day'; endField.hidden = !(overnight || multi); endDate.disabled = overnight; endDate.required = multi; endDate.min = date.value; if (overnight) endDate.value = nextDate(date.value); if (multi && !endDate.value) endDate.value = date.value; };
  updateDates(); duration.onchange = updateDates; date.onchange = updateDates;
  $('#cancel', d).onclick = closeDialog;
  $('[data-map-search]', d).onclick = () => { const query = $('input[name="location"]', d).value.trim(); if (query) window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`, '_blank', 'noopener'); else $('input[name="location"]', d).focus(); };
  d.addEventListener('click', async event => { const tab=event.target.closest('[data-meal-tab]'), favorite=event.target.closest('[data-favorite-recipe]'); if(tab){$$('[data-meal-tab]',d).forEach(x=>x.classList.toggle('active',x===tab));$$('[data-meal-panel]',d).forEach(x=>x.hidden=x.dataset.mealPanel!==tab.dataset.mealTab);return;} if(favorite){const recipe=state.recipes.find(x=>x.id===favorite.dataset.favoriteRecipe);recipe.favorite=!recipe.favorite;await store.save();const selected=$$('input[name="recipe"]:checked',d).map(x=>x.value);const picker=$('.recipe-picker',d);picker.outerHTML=recipePicker({recipeIds:selected});} });
  form.onsubmit = async event => { event.preventDefault(); const data = new FormData(form), kind=data.get('duration'), siteAmenities=data.getAll('amenity'); const values={name:data.get('name'),date:data.get('date'),endDate:kind==='overnight'?nextDate(data.get('date')):(data.get('endDate')||''),location:data.get('location'),duration:kind,level:data.get('level'),campType:data.get('campType'),power:siteAmenities.includes('power'),siteAmenities,goals:data.getAll('goal'),prep:data.get('prep')==='on',recipeIds:data.getAll('recipe')}; if(existing){Object.assign(existing,values);recalc(existing);}else{const fresh=createTrip(values);state.trips.unshift(fresh);state.activeTripId=fresh.id;}await store.save();closeDialog();state.page='trips';render(); };
}

tripDialog = openTripEditor;

/*
 * Authoritative trip planning layer.
 * The earlier prototype accumulated several UI-only patches.  This layer owns
 * the trip editor and the packing rules so a selected condition always has a
 * traceable effect on the result.
 */
(() => {
  const coreCreateTrip = createTrip;
  const coreRender = render;

  const environmentOptions = [
    ['grass', '草地營位'], ['pallet', '棧板營位'], ['forest', '林地'],
    ['riverside', '溪邊'], ['beach', '海邊'], ['mountain', '山區'],
    ['campground', '一般營區'], ['wild', '野外營地']
  ];
  const amenityOptions = [
    ['shower', '淋浴間'], ['toilet', '廁所'], ['drinking-water', '飲用水'],
    ['power', '電源插座'], ['shared-freezer', '共用冰櫃'], ['shared-tables', '公用桌椅'],
    ['washing-station', '洗滌台'], ['trash', '垃圾集中處'], ['parking', '停車位'],
    ['signal', '網路／訊號'], ['fire-zone', '營火區'], ['shop', '販售部']
  ];
  const courseOrder = ['主食', '副食', '輕食', '點心／飲品'];
  const mealOrder = ['全部', '早餐', '午餐', '晚餐', '宵夜', '不限'];

  function isOvernight(tripData) {
    return ['overnight', 'multi-day'].includes(tripData.duration);
  }

  function tripDurationName(tripData) {
    if (tripData.duration === 'overnight') return '2 日 1 夜';
    if (tripData.duration === 'multi-day') return '多日露營';
    return '日歸';
  }

  function tripDateRange(tripData) {
    if (tripData.duration === 'day') return tripData.date;
    const endDate = tripData.endDate || nextDate(tripData.date);
    const shortEndDate = endDate.slice(0, 4) === tripData.date.slice(0, 4) ? endDate.slice(5) : endDate;
    return `${tripData.date} ～ ${shortEndDate}`;
  }

  function recipeCourse(recipe) {
    const name = recipe.name;
    if (/咖啡|紅茶|綠茶|奶茶|薑茶|可可|濃湯|味噌湯|雞湯|蛋花湯|蘑菇湯/.test(name)) return '點心／飲品';
    if (/吐司|三明治|沙拉|優格|燕麥|麥片|飯糰|玉米|地瓜|燒賣|燒餅|蛋餅|鬆餅/.test(name)) return '輕食';
    if (/牛排|雞腿|鮭魚|香腸|玉子燒|荷包蛋|蒜香蝦|燒肉|炭烤|蒸蛋/.test(name)) return '副食';
    return '主食';
  }

  function plannerRecipePicker(tripData) {
    const selected = new Set(tripData.recipeIds || []);
    const typeOrder = ['all', ...recipeTypeOptions.map(([value]) => value)];
    const active = '全部';
    const row = recipe => `<div class="recipe-row"><label><input type="checkbox" name="recipe" value="${esc(recipe.id)}" ${selected.has(recipe.id) ? 'checked' : ''}><span>${esc(recipe.name)}</span></label><button type="button" class="favorite ${recipe.favorite ? 'is-favorite' : ''}" data-favorite-recipe="${esc(recipe.id)}" aria-label="${recipe.favorite ? '取消最愛' : '標記最愛'} ${esc(recipe.name)}">${recipe.favorite ? '★' : '☆'}</button></div>`;
    const panel = type => {
      const source = type === 'all' ? (state.recipes || []) : (state.recipes || []).filter(recipe => recipeTypeOf(recipe) === type);
      const all = [...source].sort((a, b) => a.name.localeCompare(b.name, 'zh-Hant'));
      const favorites = all.filter(recipe => recipe.favorite);
      const normal = all.filter(recipe => !recipe.favorite);
      const group = (title, recipes, favorite = false) => recipes.length ? `<section class="recipe-course ${favorite ? 'favorites' : ''}"><h3>${title}</h3><div class="recipe-course-grid">${recipes.map(row).join('')}</div></section>` : '';
      return group('★ 我的最愛', favorites, true) + recipeEffortOptions.map(([value, label]) => group(label, normal.filter(recipe => recipeEffortOf(recipe) === value))).join('') || '<p class="tiny">這個分類尚無料理。</p>';
    };
    return `<div class="recipe-picker"><div class="meal-tabs">${typeOrder.map(type => `<button type="button" data-meal-tab="${type}" class="${type === 'all' ? 'active' : ''}">${type === 'all' ? '全部' : recipeTypeLabel(type)}</button>`).join('')}</div><div class="recipe-groups">${typeOrder.map(type => `<div data-meal-panel="${type}" ${type === 'all' ? '' : 'hidden'}>${panel(type)}</div>`).join('')}</div></div>`;
  }

  function buildGuidance(tripData) {
    const amenities = new Set(tripData.siteAmenities || []);
    const guidance = [];
    if (amenities.has('shower')) guidance.push('有淋浴間：盥洗用品可改放個人包，不需額外準備清潔用水。');
    if (amenities.has('toilet')) guidance.push('有廁所：可不必另備行動如廁用品。');
    if (amenities.has('drinking-water')) guidance.push('有飲用水：冷水瓶可在營地補水，仍保留料理用水。');
    if (amenities.has('shared-freezer')) guidance.push('有共用冰櫃：保冷袋用於運送食材，到場後可轉入冷凍保存。');
    if (amenities.has('shared-tables')) guidance.push('有公用桌椅：非料理行程可省略主桌，保留矮桌作個人備料區。');
    if (amenities.has('washing-station')) guidance.push('有洗滌台：已省略過夜水袋；需遠離洗滌台時可手動加入。');
    if (amenities.has('trash')) guidance.push('有垃圾集中處：折疊垃圾桶仍用於營位暫存，離場前集中丟棄。');
    if (amenities.has('parking')) guidance.push('有停車位：可依量級帶較大型桌椅與保冷袋。');
    if (amenities.has('signal')) guidance.push('有網路／訊號：可直接使用地圖連結與營地聯絡資訊。');
    if (amenities.has('fire-zone')) guidance.push('有營火區：選擇焚火烤肉時，系統會加入焚火台與生火配件。');
    if (amenities.has('shop')) guidance.push('有販售部：仍依菜單採買；只把冰塊、飲料等臨時品留待現場補充。');
    return guidance;
  }

  buildTripItems = function buildPlannerItems(tripData) {
    const results = new Map();
    const amenities = new Set(tripData.siteAmenities || []);
    const goals = new Set(tripData.goals || []);
    const add = (id, reason) => {
      const gear = gearById(id);
      if (!gear) return;
      const existing = results.get(id);
      if (existing) {
        if (!existing.reason.includes(reason)) existing.reason += `／${reason}`;
        return;
      }
      results.set(id, { gearId: id, name: gear.name, category: gear.category, reason, checked: false, manual: false });
    };
    const remove = id => results.delete(id);
    const overnight = isOvernight(tripData);
    const cooking = goals.has('cook');
    const hasOnsiteRecipe = (tripData.recipeIds || []).some(id => state.recipes.find(recipe => recipe.id === id)?.onsite);

    // Each transport level starts from a user-editable equipment preset.
    const levelPreset = new Set(levelDefaultGear(tripData.level));
    levelPreset.forEach(id => add(id, `${levelText[tripData.level]}預設裝備`));

    if (overnight) {
      ['S07', 'S08', 'L03', 'X02'].forEach(id => add(id, '過夜需要'));
      if (goals.has('bush')) ['S03', 'S04', 'S05', 'R01', 'R03', 'R04'].forEach(id => add(id, '輕量野營過夜'));
      else ['S01', 'S06', 'R03'].forEach(id => add(id, '帳篷過夜'));
      if (tripData.level === 'L4') ['L01', 'L02', 'L04'].forEach(id => add(id, '全配過夜'));
    }

    // Environment rules.
    if (tripData.campType === 'pallet') add('R05', '棧板營位');
    if (tripData.campType === 'forest') ['S05', 'L03'].forEach(id => add(id, '林地防蚊與照明'));
    if (tripData.campType === 'riverside') ['S05', 'L03', 'X02'].forEach(id => add(id, '溪邊防蚊、照明與清潔'));
    if (tripData.campType === 'beach') ['S03', 'R01', 'R03', 'R04'].forEach(id => add(id, '海邊遮陽與防風固定'));
    if (tripData.campType === 'mountain') ['L03', 'X02', 'L06'].forEach(id => add(id, '山區照明、備水與背負'));
    if (tripData.campType === 'wild') ['S03', 'R01', 'R03', 'R04', 'L03', 'X02'].forEach(id => add(id, '野外自給搭設'));

    // Goal rules.
    if (cooking) ['C10', 'C11', 'T03'].forEach(id => add(id, '料理規劃'));
    if (goals.has('fire')) ['F02', 'C02', 'C05', 'C06', 'C12', 'C13'].forEach(id => add(id, '焚火烤肉'));
    if (goals.has('bush') && !overnight) ['S03', 'R01', 'R03', 'R04'].forEach(id => add(id, '輕量野營搭設'));
    if (goals.has('mood')) ['F05', 'L01', 'L02', 'L07', 'T07'].forEach(id => add(id, '拍照佈置'));
    if (goals.has('shelter')) ['S03', 'R01', 'R03', 'R04'].forEach(id => add(id, '遮陽避雨'));
    if (goals.has('rest')) add('F02', '放空休息');
    if (goals.has('picnic')) ['F03', 'F04', 'T07'].forEach(id => add(id, '野餐聊天'));
    if (goals.has('coffee')) ['C01', 'T02', 'T05'].forEach(id => add(id, '咖啡茶飲'));
    if (goals.has('friends')) ['F03', 'F01', 'T01'].forEach(id => add(id, '親友同樂'));
    if (goals.has('light')) ['C04', 'T02', 'T05', 'L06'].forEach(id => add(id, '輕量挑戰'));
    if (goals.has('hike')) ['C04', 'T02', 'T05', 'L03', 'L06'].forEach(id => add(id, '登山健行'));
    if (goals.has('rain')) ['S03', 'R01', 'R03', 'R04', 'L03'].forEach(id => add(id, '雨天備案'));

    // Recipe rules are the source of truth for cookware, tools and food.
    for (const recipeId of tripData.recipeIds || []) {
      const recipe = state.recipes.find(item => item.id === recipeId);
      if (!recipe) continue;
      recipe.gear.forEach(id => add(id, `料理：${recipe.name}`));
      if (recipe.onsite) ['C08', 'C09'].forEach(id => add(id, `料理仍需現場切配：${recipe.name}`));
    }
    if (!tripData.prep && (cooking || hasOnsiteRecipe)) ['C08', 'C09'].forEach(id => add(id, '現場備料'));

    // Facilities have explicit, conservative effects.  They never silently
    // discard an essential item unless that facility replaces its exact job.
    if (amenities.has('power')) add('L04', '營地電源');
    if (amenities.has('drinking-water')) add('C07', '營地可補飲用水');
    if (amenities.has('shared-freezer')) add('L05', '食材運送至共用冰櫃');
    if (amenities.has('shared-tables') && !cooking && !hasOnsiteRecipe && tripData.level !== 'L1') remove('F03');
    if (amenities.has('washing-station') && overnight && tripData.campType !== 'wild') remove('X02');
    if (amenities.has('fire-zone') && goals.has('fire')) ['C02', 'C05', 'C06', 'C12', 'C13'].forEach(id => add(id, '營火區焚火烤肉'));

    // Gear a user marked for the chosen goal remains additive.
    state.gear
      .filter(gear => gear.owned && gear.levels?.includes(tripData.level) && gear.contexts?.some(context => goals.has(context)))
      .forEach(gear => {
        const matchedContexts = gear.contexts.filter(context => goals.has(context)).map(context => goalText[context]).filter(Boolean);
        add(gear.id, `適用情境：${matchedContexts.join('、')}`);
      });

    // L1 remains one stove / one cookware by default.  Recipe-specified gear is
    // allowed, but the user sees an explicit constraint instead of hidden removal.
    if (tripData.level === 'L1' && !(tripData.recipeIds || []).length) add('K01', 'L1 一爐一鍋');
    if (tripData.level === 'L1') ['F03', 'F05', 'S01', 'S02', 'S04', 'C02', 'L01', 'L02'].forEach(id => { if (!levelPreset.has(id)) remove(id); });
    if (tripData.level === 'L2' && !levelPreset.has('F05')) remove('F05');

    tripData.guidance = buildGuidance(tripData);
    return [...results.values()];
  };

  function parseMapShare(raw) {
    const text = String(raw || '').trim();
    const url = text.match(/https?:\/\/[^\s]+/i)?.[0] || '';
    let name = '';
    let latitude = '';
    let longitude = '';
    let placeId = '';
    try {
      const parsed = new URL(url);
      const place = parsed.pathname.match(/\/place\/([^/@]+)/i)?.[1];
      if (place) name = decodeURIComponent(place).replace(/\+/g, ' ');
      const coordinate = `${parsed.pathname}${parsed.search}`.match(/@(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/);
      if (coordinate) [, latitude, longitude] = coordinate;
      const placeIds = [...`${parsed.pathname}${parsed.search}`.matchAll(/!1s([^!&]+)/g)];
      placeId = placeIds.at(-1)?.[1] || '';
    } catch (_) { /* A pasted sharing card can omit a valid URL. */ }
    const lines = text.split(/\r?\n/).map(line => line.trim()).filter(Boolean).filter(line => !/^https?:\/\//i.test(line));
    if (!name && lines.length) name = lines[0];
    const phone = text.match(/(?:\+?886[-\s]?)?0\d{1,2}[-\s]?\d{3,4}[-\s]?\d{3,4}/)?.[0] || '';
    const address = lines.find(line => /(?:\d{3,5}.*(?:市|縣|區|鄉|鎮|村|里|路|街|巷|弄|號)|(?:市|縣).*(?:區|鄉|鎮|路|街|號))/.test(line)) || '';
    return { mapUrl: url, mapShare: text, mapName: name, address, contact: phone, latitude, longitude, placeId };
  }

  function mapDetails(tripData) {
    const lines = [];
    if (tripData.address) lines.push(`地址：${tripData.address}`);
    if (tripData.contact) lines.push(`聯絡：${tripData.contact}`);
    return lines.join('<br>');
  }

  function plannerTripEditor(existing) {
    const today = new Date().toISOString().slice(0, 10);
  const preferences = state.preferences || { defaultLevel: 'L1', defaultCampType: 'grass', defaultPrep: false, illustrations: true, autoTrimSuggestions: true };
  const tripData = existing || { name: '未命名露營', date: today, endDate: '', location: '', duration: 'day', level: preferences.defaultLevel, campType: preferences.defaultCampType, goals: [], prep: preferences.defaultPrep, recipeIds: [], siteAmenities: [], mapShare: '', mapUrl: '', address: '', contact: '' };
    const chosenAmenities = new Set(tripData.siteAmenities || []);
    const dialogRoot = dialog(`<h2>${existing ? '編輯行程' : '新增行程'}</h2><form id="trip-form"><div class="form-grid"><div class="field full"><label>行程名稱</label><input name="name" required value="${esc(tripData.name)}"></div><div class="field"><label>出發日期</label><input type="date" name="date" value="${esc(tripData.date)}"></div><div class="field" id="end-date-field"><label>結束日期</label><input type="date" name="endDate" value="${esc(tripData.endDate || '')}"></div><div class="field full"><label>營地名稱</label><div class="location-search"><input name="location" value="${esc(tripData.location)}" placeholder="例如：鴛鴦谷烤肉區"><button type="button" class="secondary" data-map-search>開啟地圖</button></div></div><div class="field full"><label>Google Maps 分享資訊</label><textarea name="mapShare" rows="3" placeholder="貼上完整 Google Maps 網址，或貼上分享卡中的名稱、地址、電話與網址">${esc(tripData.mapShare || tripData.mapUrl || '')}</textarea><div class="map-actions"><button type="button" class="ghost" data-read-map>讀取分享資訊</button><span class="tiny">完整網址可讀取名稱與座標；短網址只能保存連結。</span></div></div><div class="field"><label>地址</label><input name="address" value="${esc(tripData.address || '')}" placeholder="可從分享卡貼上"></div><div class="field"><label>聯絡資訊</label><input name="contact" value="${esc(tripData.contact || '')}" placeholder="電話、LINE 或備註"></div><div class="field"><label>行程</label><select name="duration"><option value="day" ${tripData.duration === 'day' ? 'selected' : ''}>日歸</option><option value="overnight" ${tripData.duration === 'overnight' ? 'selected' : ''}>2 日 1 夜</option><option value="multi-day" ${tripData.duration === 'multi-day' ? 'selected' : ''}>多日露營</option></select></div><div class="field"><label>量級</label><select name="level">${Object.entries(levelText).map(([value, label]) => `<option value="${value}" ${tripData.level === value ? 'selected' : ''}>${label}</option>`).join('')}</select></div><div class="field"><label>營地環境</label><select name="campType">${environmentOptions.map(([value, label]) => `<option value="${value}" ${tripData.campType === value ? 'selected' : ''}>${label}</option>`).join('')}</select></div><div class="field full"><label>現場設施</label><div class="compact-options amenities-options">${amenityOptions.map(([value, label]) => `<label><input type="checkbox" name="amenity" value="${value}" ${chosenAmenities.has(value) ? 'checked' : ''}> ${label}</label>`).join('')}</div></div><div class="field full"><label>這次想做什麼</label><div class="compact-options">${Object.entries(goalText).map(([value, label]) => `<label title="${esc(goalHelp[value] || '')}"><input type="checkbox" name="goal" value="${value}" ${(tripData.goals || []).includes(value) ? 'checked' : ''}> ${label}</label>`).join('')}</div></div><div class="field full"><label>這天的菜單</label>${plannerRecipePicker(tripData)}</div><div class="field full"><label class="inline-label"><input type="checkbox" name="prep" ${tripData.prep ? 'checked' : ''}> 在家先備料</label><span class="tiny">食譜若標示需要現場切配，砧板與菜刀仍會保留並標示原因。</span></div></div><div class="actions"><button class="primary">${existing ? '儲存變更' : '建立行程卡片'}</button><button type="button" class="secondary" id="cancel">取消</button></div></form>`);
    const form = $('#trip-form', dialogRoot);
    const date = $('input[name="date"]', dialogRoot);
    const duration = $('select[name="duration"]', dialogRoot);
    const endField = $('#end-date-field', dialogRoot);
    const endDate = $('input[name="endDate"]', dialogRoot);
    const mapShare = $('textarea[name="mapShare"]', dialogRoot);
    const location = $('input[name="location"]', dialogRoot);
    const address = $('input[name="address"]', dialogRoot);
    const contact = $('input[name="contact"]', dialogRoot);
    const updateDates = () => {
      const overnight = duration.value === 'overnight';
      const multiDay = duration.value === 'multi-day';
      endField.hidden = !(overnight || multiDay);
      endDate.disabled = overnight;
      endDate.required = multiDay;
      endDate.min = date.value;
      if (overnight) endDate.value = nextDate(date.value);
      if (multiDay && !endDate.value) endDate.value = date.value;
    };
    const readMap = () => {
      const details = parseMapShare(mapShare.value);
      if (!details.mapUrl && !details.mapName) { mapShare.focus(); return; }
      if (details.mapName) location.value = details.mapName;
      if (details.address) address.value = details.address;
      if (details.contact) contact.value = details.contact;
    };
    updateDates();
    duration.onchange = updateDates;
    date.onchange = updateDates;
    $('#cancel', dialogRoot).onclick = closeDialog;
    $('[data-read-map]', dialogRoot).onclick = readMap;
    $('[data-map-search]', dialogRoot).onclick = () => {
      const details = parseMapShare(mapShare.value);
      const query = details.mapUrl || location.value.trim();
      if (query) window.open(details.mapUrl || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`, '_blank', 'noopener');
      else location.focus();
    };
    dialogRoot.addEventListener('click', async event => {
      const tab = event.target.closest('[data-meal-tab]');
      const favorite = event.target.closest('[data-favorite-recipe]');
      if (tab) {
        event.preventDefault();
        $$('[data-meal-tab]', dialogRoot).forEach(button => button.classList.toggle('active', button === tab));
        $$('[data-meal-panel]', dialogRoot).forEach(panel => { panel.hidden = panel.dataset.mealPanel !== tab.dataset.mealTab; });
        return;
      }
      if (!favorite) return;
      event.preventDefault();
      const recipe = state.recipes.find(item => item.id === favorite.dataset.favoriteRecipe);
      if (!recipe) return;
      const selected = $$('input[name="recipe"]:checked', dialogRoot).map(input => input.value);
      recipe.favorite = !recipe.favorite;
      await store.save();
      $('.recipe-picker', dialogRoot).outerHTML = plannerRecipePicker({ recipeIds: selected });
    });
    form.onsubmit = async event => {
      event.preventDefault();
      const data = new FormData(form);
      const parsedMap = parseMapShare(data.get('mapShare'));
      const kind = data.get('duration');
      const values = {
        name: data.get('name').trim(), date: data.get('date'),
        endDate: kind === 'overnight' ? nextDate(data.get('date')) : (data.get('endDate') || ''),
        location: data.get('location').trim() || parsedMap.mapName,
        duration: kind, level: data.get('level'), campType: data.get('campType'),
        siteAmenities: data.getAll('amenity'), power: data.getAll('amenity').includes('power'),
        goals: data.getAll('goal'), prep: data.get('prep') === 'on', recipeIds: data.getAll('recipe'),
        mapShare: data.get('mapShare').trim(), mapUrl: parsedMap.mapUrl,
        address: data.get('address').trim() || parsedMap.address,
        contact: data.get('contact').trim() || parsedMap.contact,
        latitude: parsedMap.latitude, longitude: parsedMap.longitude, placeId: parsedMap.placeId
      };
      if (existing) {
        Object.assign(existing, values);
        recalc(existing);
      } else {
        const fresh = coreCreateTrip(values);
        Object.assign(fresh, values);
        fresh.items = buildTripItems(fresh);
        fresh.shopping = buildShopping(fresh);
        fresh.planningRuleVersion = 2;
        state.trips.unshift(fresh);
        state.activeTripId = fresh.id;
      }
      await store.save();
      closeDialog();
      state.page = 'trips';
      render();
    };
  }

function optionalPackingSuggestions(tripData) {
  const limits = { L1: 16, L2: 28, L3: 40, L4: 54 };
  const limit = limits[tripData.level] || 28;
  const extraCount = Math.max(0, (tripData.items || []).length - limit);
  if (!extraCount) return { limit, extraCount: 0, candidates: [] };
  const optionalReason = /適用情境|氣氛|拍照|野餐|咖啡茶飲|親友同樂|基本行程/;
  const essentialReason = /料理|過夜|營地|現場|焚火|遮陽|避雨/;
  const candidates = (tripData.items || [])
    .filter(item => optionalReason.test(item.reason || '') && !essentialReason.test(item.reason || ''))
    .slice(0, Math.min(extraCount, 5));
  return { limit, extraCount, candidates };
}

function decorateTripDetails() {
  // 行程摘要只屬於「行程卡片」與「本次清單」。
  // 其他頁面也有 .sub（例如裝備／料理的筆數），不能共用這個選取器。
  if (!['trips', 'lists'].includes(state.page)) return;
  const current = trip();
    if (!current) return;
    const details = mapDetails(current);
    const sub = document.querySelector('.page .sub');
    if (sub) sub.innerHTML = `${tripDateRange(current)}　${esc(current.location || '未填地點')}<br>${tripDurationName(current)} · ${levelText[current.level]}${details ? `<br>${details}` : ''}`;
    const context = document.querySelector('.trip-context');
    if (context) context.innerHTML = `${tripDateRange(current)}　${esc(current.location || '未填地點')}<br>${tripDurationName(current)} · ${levelText[current.level]}　｜　目的：${esc(cardPurpose(current))}${details ? `<br>${details}` : ''}`;
    const list = document.querySelector('#list-body');
    const guidance = current.guidance || buildGuidance(current);
    if (list && guidance.length && !document.querySelector('.trip-guidance')) {
      list.insertAdjacentHTML('afterbegin', `<section class="trip-guidance"><h3>營地條件提醒</h3>${guidance.map(line => `<p>${esc(line)}</p>`).join('')}</section>`);
    }
    if (list && listTab === 'pack' && state.preferences?.autoTrimSuggestions !== false && !document.querySelector('.packing-suggestions')) {
      const suggestion = optionalPackingSuggestions(current);
      if (suggestion.extraCount && suggestion.candidates.length) {
        list.insertAdjacentHTML('afterbegin', `<section class="packing-suggestions"><h3>精簡建議</h3><p>目前 ${current.items.length} 件，${levelText[current.level]} 建議約 ${suggestion.limit} 件內。以下屬於情境加選，可視需要不帶。</p><div class="suggestion-list">${suggestion.candidates.map(item => `<div><span>${esc(item.name)}</span><button type="button" class="ghost" data-action="remove-from-trip" data-id="${esc(item.gearId)}">不帶這件</button></div>`).join('')}</div></section>`);
      }
    }
  }

  function upgradeTripsToPlanningRules() {
    let changed = false;
    for (const tripData of state.trips || []) {
      if (tripData.planningRuleVersion === 2) continue;
      tripData.siteAmenities ||= [];
      tripData.overrides ||= { added: [], removed: [] };
      const checkedItems = new Map((tripData.items || []).map(entry => [entry.gearId, entry.checked]));
      const checkedShopping = new Map((tripData.shopping || []).map(entry => [`${entry.recipeId || ''}:${entry.name}`, entry.checked]));
      let items = buildTripItems(tripData).filter(entry => !tripData.overrides.removed.includes(entry.gearId));
      for (const entry of tripData.overrides.added) if (!items.some(item => item.gearId === entry.gearId)) items.push(entry);
      items.forEach(entry => { entry.checked = checkedItems.get(entry.gearId) || false; });
      tripData.items = items;
      tripData.shopping = buildShopping(tripData).map(entry => ({ ...entry, checked: checkedShopping.get(`${entry.recipeId || ''}:${entry.name}`) || false }));
      tripData.planningRuleVersion = 2;
      tripData.updatedAt = now();
      changed = true;
    }
    // Planning upgrades are persisted by the next explicit user mutation.
  }

  drawCard = function drawPlannerCard(tripData) {
    return new Promise(resolve => {
      const width = 1080;
      const items = tripData.items || [];
      const shopping = tripData.shopping || [];
      const recipeNames = (tripData.recipeIds || [])
        .map(id => state.recipes.find(recipe => recipe.id === id)?.name)
        .filter(Boolean);
      // A card is an image, not a paginated document.  Its height grows with the
      // longer list so every item remains readable and the footer never overlaps it.
      const listRows = Math.max(items.length, shopping.length, 1);
      const listStart = 680;
      const footerTop = listStart + 72 + listRows * 42 + 58;
      const height = Math.max(1500, footerTop + 112);
      const canvas = document.createElement('canvas');
      canvas.width = width; canvas.height = height;
      const context = canvas.getContext('2d');
      const left = 64;
      const right = width - 64;
      const columnGap = 48;
      const columnWidth = (right - left - columnGap) / 2;
      const shoppingX = left + columnWidth + columnGap;

      const clipped = (text, maxWidth) => {
        const value = String(text || '');
        if (context.measureText(value).width <= maxWidth) return value;
        let output = value;
        while (output && context.measureText(`${output}…`).width > maxWidth) output = output.slice(0, -1);
        return `${output}…`;
      };
      const wrapped = (text, x, y, maxWidth, lineHeight, maxLines = 2) => {
        const characters = [...String(text || '')];
        const lines = [];
        let line = '';
        for (const character of characters) {
          const next = line + character;
          if (line && context.measureText(next).width > maxWidth) {
            lines.push(line); line = character;
          } else line = next;
        }
        if (line) lines.push(line);
        lines.slice(0, maxLines).forEach((value, index) => {
          const finalLine = index === maxLines - 1 && lines.length > maxLines ? `${value}…` : value;
          context.fillText(finalLine, x, y + index * lineHeight);
        });
        return Math.min(lines.length, maxLines) * lineHeight;
      };
      const line = (y) => {
        context.strokeStyle = '#d8e0d8'; context.lineWidth = 2;
        context.beginPath(); context.moveTo(left, y); context.lineTo(right, y); context.stroke();
      };
      const stat = (label, value, x, y, maxWidth) => {
        context.fillStyle = '#68746d'; context.font = '700 19px sans-serif'; context.fillText(label, x, y);
        context.fillStyle = '#18352a'; context.font = '700 30px sans-serif'; context.fillText(clipped(value, maxWidth), x, y + 38);
      };
      const listColumn = (title, complete, total, entries, x) => {
        context.fillStyle = '#18352a'; context.font = '700 31px sans-serif';
        context.fillText(title, x, listStart);
        context.fillStyle = '#2f624a'; context.textAlign = 'right'; context.fillText(`${complete} / ${total}`, x + columnWidth, listStart); context.textAlign = 'left';
        context.font = '25px sans-serif';
        entries.forEach((entry, index) => {
          const y = listStart + 48 + index * 42;
          context.fillStyle = entry.checked ? '#2f624a' : '#6a756f';
          context.fillText(entry.checked ? '☑' : '☐', x + 10, y);
          context.fillStyle = '#18352a';
          context.fillText(clipped(entry.name, columnWidth - 52), x + 42, y);
        });
        if (!entries.length) {
          context.fillStyle = '#68746d'; context.font = '24px sans-serif'; context.fillText('目前沒有項目', x + 10, listStart + 48);
        }
      };

      context.fillStyle = '#fffefa'; context.fillRect(0, 0, width, height);
      context.fillStyle = '#1f4937'; context.fillRect(0, 0, width, 24);

      context.fillStyle = '#18352a'; context.font = '700 64px sans-serif';
      const titleHeight = wrapped(tripData.name, left, 120, 630, 74, 2);
      context.fillStyle = '#2f624a'; context.font = '700 28px sans-serif';
      context.fillText(cardPurpose(tripData), left, 146 + titleHeight);

      const statsY = 270;
       stat('日期', tripDateRange(tripData), left, statsY, 350);
       stat('行程', tripDurationName(tripData), 440, statsY, 180);
      stat('營地', tripData.location || '未填地點', left, statsY + 102, 500);
      stat('難度', levelText[tripData.level] || '未設定', 365, statsY + 102, 280);

      context.fillStyle = '#f1f5ef'; context.fillRect(710, 352, 306, 158);
      context.fillStyle = '#2f624a'; context.font = '700 20px sans-serif'; context.fillText('地點資訊', 736, 388);
      context.fillStyle = '#40564b'; context.font = '22px sans-serif';
      let detailY = 423;
      if (tripData.address) { detailY += wrapped(`地址：${tripData.address}`, 736, detailY, 252, 28, 2) + 6; }
      if (tripData.contact) wrapped(`聯絡：${tripData.contact}`, 736, detailY, 252, 28, 2);
      if (!tripData.address && !tripData.contact) context.fillText('尚未填寫地址或聯絡方式', 736, detailY);

      context.fillStyle = '#18352a'; context.font = '700 27px sans-serif'; context.fillText('這天的菜單', left, 552);
      context.fillStyle = '#40564b'; context.font = '24px sans-serif';
      wrapped(recipeNames.join('、') || '尚未選擇料理', left, 586, 930, 30, 1);

      listColumn('打包清單', done(items), items.length, items, left);
      listColumn('採買清單', done(shopping), shopping.length, shopping, shoppingX);
      line(footerTop - 36);
      context.fillStyle = '#68746d'; context.font = '20px sans-serif';
      context.fillText('原始 PNG 含可還原的行程資料；請以檔案模式傳送。', left, footerTop + 8);
      context.fillStyle = '#2f624a'; context.font = '700 20px sans-serif'; context.textAlign = 'right';
      context.fillText(`露營助手 ／ 行程卡片　${tripData.code} · v${tripData.revision}`, right, footerTop + 8);
      context.textAlign = 'left';
      const finish = () => canvas.toBlob(resolve, 'image/png');
      // Use the same location-map illustration that appears in the side panel.
      // It is drawn after layout because it occupies only the reserved right hero space.
      const mapIllustration = new Image();
      mapIllustration.onload = () => {
        context.drawImage(mapIllustration, 1024, 512, 512, 512, 718, 60, 298, 250);
        finish();
      };
      mapIllustration.onerror = finish;
      mapIllustration.src = 'assets/camping-illustrations-v1.png';
    });
  };

  tripDialog = plannerTripEditor;
  recipePicker = plannerRecipePicker;
  render = function renderPlanner() {
    upgradeTripsToPlanningRules();
    coreRender();
    decorateTripDetails();
  };
})();

/* Settings files and card import deliberately live in separate flows. */
function nextRecipeId() {
  const numbers = state.recipes
    .map(recipe => Number(String(recipe.id || '').replace(/^RCP/i, '')))
    .filter(Number.isFinite);
  return `RCP${String((numbers.length ? Math.max(...numbers) : 0) + 1).padStart(3, '0')}`;
}

function exportSettingsProfile() {
  const profile = {
    format: 'camp-assistant.settings.v1',
    exportedAt: now(),
    gear: structuredClone(state.gear),
    recipes: structuredClone(state.recipes),
    locations: [...state.locations]
  };
  download(new Blob([JSON.stringify(profile, null, 2)], { type: 'application/json' }), `露營助手設定檔_${new Date().toISOString().slice(0, 10)}.json`);
  notify('已備份裝備、料理與收納位置設定。');
}

function applySettingsProfile(profile, conflictMode) {
  const copyGear = gear => ({ ...structuredClone(gear), id: nextGearId(gear.category) });
  const copyRecipe = recipe => ({ ...structuredClone(recipe), id: nextRecipeId() });
  for (const incoming of profile.gear || []) {
    const current = state.gear.find(gear => gear.id === incoming.id);
    if (!current) { state.gear.push(structuredClone(incoming)); continue; }
    if (conflictMode === 'replace') Object.assign(current, structuredClone(incoming));
    if (conflictMode === 'copy') state.gear.push(copyGear(incoming));
  }
  for (const incoming of profile.recipes || []) {
    const current = state.recipes.find(recipe => recipe.id === incoming.id);
    if (!current) { state.recipes.push(structuredClone(incoming)); continue; }
    if (conflictMode === 'replace') Object.assign(current, structuredClone(incoming));
    if (conflictMode === 'copy') state.recipes.push(copyRecipe(incoming));
  }
  state.locations = [...new Set([...(state.locations || []), ...(profile.locations || [])])];
}

function settingsConflictDialog(profile) {
  const gearConflicts = (profile.gear || []).filter(incoming => state.gear.some(current => current.id === incoming.id));
  const recipeConflicts = (profile.recipes || []).filter(incoming => state.recipes.some(current => current.id === incoming.id));
  const conflicts = gearConflicts.length + recipeConflicts.length;
  if (!conflicts) {
    applySettingsProfile(profile, 'keep');
    store.save().then(() => { notify('設定檔已載入。'); render(); });
    return;
  }
  const dialogRoot = dialog(`<h2>載入設定檔</h2><p class="sub">偵測到 ${gearConflicts.length} 件裝備與 ${recipeConflicts.length} 道料理的編號相同。請選擇保留方式。</p><form id="settings-conflict-form"><div class="field"><label><input type="radio" name="conflict" value="keep" checked> 保留目前資料，略過同編號項目</label><label><input type="radio" name="conflict" value="replace"> 用設定檔覆蓋同編號項目</label><label><input type="radio" name="conflict" value="copy"> 同時保留，匯入項目自動取得新編號</label></div><div class="actions"><button class="primary">載入設定</button><button type="button" class="secondary" id="cancel">取消</button></div></form>`);
  $('#cancel', dialogRoot).onclick = closeDialog;
  $('#settings-conflict-form', dialogRoot).onsubmit = async event => {
    event.preventDefault();
    applySettingsProfile(profile, new FormData(event.target).get('conflict'));
    await store.save();
    closeDialog();
    notify('設定檔已載入。');
    render();
  };
}

function chooseSettingsProfile() {
  const input = $('#file-input');
  input.accept = '.json,application/json';
  input.value = '';
  input.onchange = async () => {
    const file = input.files[0];
    if (!file) return;
    try {
      const profile = JSON.parse(await file.text());
      if (profile.format !== 'camp-assistant.settings.v1' || !Array.isArray(profile.gear) || !Array.isArray(profile.recipes)) throw new Error('這不是露營助手設定檔。');
      settingsConflictDialog(profile);
    } catch (error) {
      console.error(error);
      notify(`載入設定檔失敗：${error.message}`, 'error');
    }
  };
  input.click();
}

function chooseTripCard() {
  const input = $('#file-input');
  input.accept = 'image/png,.png';
  input.value = '';
  input.onchange = async () => {
    const file = input.files[0];
    if (!file) return;
    try {
      await importCard(file);
      notify('行程卡片已匯入，可直接編輯。');
      render();
    } catch (error) {
      console.error(error);
      notify(`匯入行程卡片失敗：${error.message}`, 'error');
    }
  };
  input.click();
}

function settingsGearPage() {
  const visible = gearCategoryFilter === 'favorite' ? state.gear.filter(gear => gear.favorite) : gearCategoryFilter === 'all' ? state.gear : state.gear.filter(gear => gear.category === gearCategoryFilter);
  return `<section class="page"><div class="page-heading"><div><h2 class="title">我的裝備</h2></div><div class="heading-actions"><button class="secondary" data-action="manage-level-defaults">量級預設</button><button class="secondary" data-action="manage-locations">收納位置</button><button class="primary" data-action="add-gear">新增裝備</button></div></div><div class="gear-filter"><label for="gear-category-filter">顯示分類</label><select id="gear-category-filter"><option value="all" ${gearCategoryFilter === 'all' ? 'selected' : ''}>全部裝備</option><option value="favorite" ${gearCategoryFilter === 'favorite' ? 'selected' : ''}>★ 我的最愛</option>${categories.map(category => `<option value="${category}" ${gearCategoryFilter === category ? 'selected' : ''}>${category}</option>`).join('')}</select></div><p class="sub">${visible.length} / ${state.gear.length} 件已登記</p><div id="gear-list">${gearRows(visible)}</div></section>`;
}

function managedRecipeDialog() {
  const recipeId = nextRecipeId();
  const usable = state.gear.filter(gear => ['烹飪熱源', '鍋具選項', '餐具容器'].includes(gear.category));
  const dialogRoot = dialog(`<h2>新增料理</h2><form id="recipe-form"><p class="system-id">料理編號：<strong>${recipeId}</strong></p><div class="form-grid"><div class="field full"><label>料理名稱</label><input name="name" required placeholder="例如：奶油雞肉炊飯"></div><div class="field"><label>常用時段（僅分類）</label><select name="meal"><option>不限</option><option>早餐</option><option>午餐</option><option selected>晚餐</option><option>宵夜</option></select></div><div class="field"><label class="inline-label" title="即使在家先備料，這道料理仍須在營地切配；會保留砧板與菜刀。"><input type="checkbox" name="onsite"> 仍需現場切配</label></div><div class="field full"><label>單人份食材／醬料</label><textarea name="ingredients" required placeholder="一行一項，例如：&#10;白米 1 杯&#10;雞腿肉 120g"></textarea></div><div class="field full"><label>需要的裝備</label><select name="gear" multiple size="7">${usable.map(gear => `<option value="${gear.id}">${esc(gear.name)}（${gear.id}）</option>`).join('')}</select><span class="tiny">按 Ctrl／⌘ 可複選。</span></div></div><div class="actions"><button class="primary">儲存料理</button><button class="secondary" type="button" id="cancel">取消</button></div></form>`);
  $('#cancel', dialogRoot).onclick = closeDialog;
  $('#recipe-form', dialogRoot).onsubmit = async event => {
    event.preventDefault();
    const data = new FormData(event.target);
    state.recipes.push({ id: recipeId, name: data.get('name').trim(), meal: data.get('meal'), ingredients: data.get('ingredients').split(/\r?\n/).map(line => line.trim()).filter(Boolean), gear: data.getAll('gear'), onsite: data.get('onsite') === 'on', favorite: false });
    await store.save();
    closeDialog();
    render();
  };
}

const plannerAction = action;
action = async function settingsAction(name, data = {}) {
  if (name === 'import-trip-card') return chooseTripCard();
  if (name === 'export-settings') return exportSettingsProfile();
  if (name === 'import-settings') return chooseSettingsProfile();
  return plannerAction(name, data);
};

renderGear = settingsGearPage;
recipeDialog = managedRecipeDialog;

const plannerRender = render;
render = function renderWithHomeImport() {
  plannerRender();
  if (state.page !== 'home' || document.querySelector('[data-action="import-trip-card"]')) return;
  const newTrip = document.querySelector('[data-action="new-trip"]');
  if (!newTrip) return;
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'secondary';
  button.dataset.action = 'import-trip-card';
  button.textContent = '匯入行程卡片';
  button.onclick = () => action('import-trip-card');
  (newTrip.parentElement.classList.contains('home-header-actions') ? newTrip.parentElement : newTrip.parentElement).insertBefore(button, newTrip);
};

/* Recipes are organized by what they are and how much work they require, not
   by an assumed meal time.  Older recipes are classified from their name so
   existing libraries do not need a one-time migration. */
const recipeTypeOptions = [
  ['rice', '飯類'], ['noodles', '麵類'], ['soup', '湯鍋'], ['grill', '煎烤'],
  ['snack', '輕食'], ['drink', '飲品'], ['other', '其他']
];
const recipeEffortOptions = [
  ['no-heat', '免開火'], ['quick', '快速加熱（需開火）'], ['one-pot', '一般烹調（需開火）'], ['prep', '現場切配料理']
];

function recipeTypeLabel(value) { return recipeTypeOptions.find(([key]) => key === value)?.[1] || '其他'; }
function recipeEffortLabel(value) { return recipeEffortOptions.find(([key]) => key === value)?.[1] || '一鍋完成'; }
function recipeTypeOf(recipe) {
  if (recipe.type && recipeTypeOptions.some(([value]) => value === recipe.type)) return recipe.type;
  const name = recipe.name || '';
  if (/咖啡|紅茶|綠茶|奶茶|可可|飲|果汁|茶/.test(name)) return 'drink';
  if (/吐司|三明治|沙拉|優格|燕麥|麥片|飯糰|玉米|地瓜|燒賣|燒餅|蛋餅|鬆餅|餅乾/.test(name)) return 'snack';
  if (/湯|鍋|火鍋|味噌|濃湯/.test(name)) return 'soup';
  if (/麵|烏龍|義大利|泡麵|拉麵|粉/.test(name)) return 'noodles';
  if (/飯|炊飯|粥/.test(name)) return 'rice';
  if (/牛排|雞腿|鮭魚|香腸|燒肉|烤|煎|蒸蛋|玉子燒/.test(name)) return 'grill';
  return 'other';
}
function recipeRequiresHeat(recipe) {
  const text = `${recipe.name || ''} ${(recipe.ingredients || []).join(' ')}`;
  // "熱水" and all cooking methods are explicit heat requirements.  A cold
  // dish is only treated as no-heat when it contains none of these signals.
  return /熱水|沖泡|泡麵|茶泡飯|咖啡|奶茶|紅茶|綠茶|薑茶|可可|煮|煎|烤|炒|蒸|鍋|湯|烏龍|義大利麵|麵|炊飯|燉飯|咖哩|丼|火腿|培根|蛋餅|熱壓|法式吐司|鬆餅/.test(text);
}
function recipeEffortOf(recipe) {
  const needsHeat = recipeRequiresHeat(recipe);
  if (recipe.effort && recipeEffortOptions.some(([value]) => value === recipe.effort) && !(recipe.effort === 'no-heat' && needsHeat)) return recipe.effort;
  const name = recipe.name || '';
  if (!needsHeat) return 'no-heat';
  if (recipe.onsite) return 'prep';
  if ((recipe.ingredients || []).length <= 3 || /泡麵|沖泡|茶|咖啡|可可|濃湯|吐司|罐頭粥/.test(name)) return 'quick';
  return 'one-pot';
}
function normalizeRecipeClassification() {
  let changed = false;
  (state.recipes || []).forEach(recipe => {
    if (!recipe.type) { recipe.type = recipeTypeOf(recipe); changed = true; }
    const correctedEffort = recipeEffortOf(recipe);
    if (!recipe.effort || (recipe.effort === 'no-heat' && recipeRequiresHeat(recipe))) {
      recipe.effort = correctedEffort;
      changed = true;
    }
  });
  // Classification defaults are presentation migration only; do not save from render.
}

let recipeTypeFilter = 'all';
let recipeEffortFilter = 'all';

function recipeLibraryRows(recipesToShow) {
  return [...recipesToShow]
    .sort((a, b) => Number(!!b.favorite) - Number(!!a.favorite) || a.name.localeCompare(b.name, 'zh-Hant'))
    .map(recipe => `<div class="gear-row"><button class="gear-open" data-action="edit-recipe" data-id="${esc(recipe.id)}"><span class="tag">${esc(recipe.id)}</span><span><span class="item-name">${esc(recipe.name)}</span><span class="reason">${recipeTypeLabel(recipeTypeOf(recipe))} · ${recipeEffortLabel(recipeEffortOf(recipe))}</span></span></button><button type="button" class="favorite ${recipe.favorite ? 'is-favorite' : ''}" data-action="toggle-recipe-favorite" data-id="${esc(recipe.id)}" aria-label="${recipe.favorite ? '取消最愛' : '標記最愛'} ${esc(recipe.name)}">${recipe.favorite ? '★' : '☆'}</button></div>`)
    .join('');
}

function recipeLibraryDialog(existing) {
  const recipe = existing || { id: nextRecipeId(), name: '', type: 'other', effort: 'one-pot', ingredients: [], gear: [], onsite: false, favorite: false };
  const usable = state.gear.filter(gear => ['烹飪熱源', '鍋具選項', '餐具容器'].includes(gear.category));
  const dialogRoot = dialog(`<h2>${existing ? '編輯料理' : '新增料理'}</h2><form id="recipe-form"><p class="system-id">料理編號：<strong>${esc(recipe.id)}</strong></p><div class="form-grid"><div class="field full"><label>料理名稱</label><input name="name" required value="${esc(recipe.name)}" placeholder="例如：奶油雞肉炊飯"></div><div class="field"><label>料理類型</label><select name="type">${recipeTypeOptions.map(([value, label]) => `<option value="${value}" ${recipeTypeOf(recipe) === value ? 'selected' : ''}>${label}</option>`).join('')}</select></div><div class="field"><label>準備程度</label><select name="effort">${recipeEffortOptions.map(([value, label]) => `<option value="${value}" ${recipeEffortOf(recipe) === value ? 'selected' : ''}>${label}</option>`).join('')}</select></div><div class="field full"><label class="inline-label" title="即使在家先備料，這道料理仍須在營地切配；會保留砧板與菜刀。"><input type="checkbox" name="onsite" ${recipe.onsite ? 'checked' : ''}> 仍需現場切配</label></div><div class="field full"><label>單人份食材／醬料</label><textarea name="ingredients" required>${esc((recipe.ingredients || []).join('\n'))}</textarea></div><div class="field full"><label>需要的裝備</label><select name="gear" multiple size="7">${usable.map(gear => `<option value="${gear.id}" ${(recipe.gear || []).includes(gear.id) ? 'selected' : ''}>${esc(gear.name)}（${gear.id}）</option>`).join('')}</select><span class="tiny">按 Ctrl／⌘ 可複選。</span></div></div><div class="actions"><button class="primary">儲存料理</button><button type="button" class="secondary" id="cancel">取消</button>${existing ? '<button type="button" class="ghost danger" id="delete-recipe">刪除料理</button>' : ''}</div></form>`);
  $('#cancel', dialogRoot).onclick = closeDialog;
  $('#delete-recipe', dialogRoot)?.addEventListener('click', async () => {
    if (dialogRoot.dataset.deleteArmed !== 'true') {
      dialogRoot.dataset.deleteArmed = 'true';
      $('#delete-recipe', dialogRoot).textContent = '再次點擊刪除';
      return;
    }
    state.recipes = state.recipes.filter(item => item.id !== existing.id);
    state.trips.forEach(tripData => { tripData.recipeIds = (tripData.recipeIds || []).filter(id => id !== existing.id); recalc(tripData); });
    await store.save();
    closeDialog();
    render();
  });
  $('#recipe-form', dialogRoot).onsubmit = async event => {
    event.preventDefault();
    const data = new FormData(event.target);
    const values = { id: recipe.id, name: data.get('name').trim(), type: data.get('type'), effort: data.get('effort'), meal: recipe.meal || '不限', ingredients: data.get('ingredients').split(/\r?\n/).map(line => line.trim()).filter(Boolean), gear: data.getAll('gear'), onsite: data.get('onsite') === 'on', favorite: !!recipe.favorite };
    if (existing) Object.assign(existing, values);
    else state.recipes.push(values);
    state.trips.filter(tripData => (tripData.recipeIds || []).includes(recipe.id)).forEach(recalc);
    await store.save();
    closeDialog();
    render();
  };
}

function recordsPage() {
  const logs = state.logs || [];
  return `<section class="page"><div><p class="eyebrow">回顧</p><h2 class="title">露營紀錄</h2></div><section class="record-section"><h3>已完成行程</h3>${logs.length ? logs.map(log => `<div class="card"><h3>${esc(log.name)}</h3><p class="meta">${esc(log.date)} · ${esc(log.notes || '未填心得')}</p></div>`).join('') : '<p class="sub">完成一場露營後，可從行程卡片選擇「結束並歸檔」。</p>'}</section></section>`;
}

function recipesPage() {
  const visible = state.recipes.filter(recipe => (recipeTypeFilter === 'all' || recipeTypeOf(recipe) === recipeTypeFilter) && (recipeEffortFilter === 'all' || recipeEffortOf(recipe) === recipeEffortFilter));
  return `<section class="page"><div class="page-heading"><div><h2 class="title">我的料理</h2></div><div class="heading-actions"><button class="primary" data-action="add-recipe">新增料理</button></div></div><div class="gear-filter"><label for="recipe-type-filter">料理類型</label><select id="recipe-type-filter"><option value="all" ${recipeTypeFilter === 'all' ? 'selected' : ''}>全部類型</option>${recipeTypeOptions.map(([value, label]) => `<option value="${value}" ${recipeTypeFilter === value ? 'selected' : ''}>${label}</option>`).join('')}</select></div><div class="gear-filter"><label for="recipe-effort-filter">準備程度</label><select id="recipe-effort-filter"><option value="all" ${recipeEffortFilter === 'all' ? 'selected' : ''}>全部程度</option>${recipeEffortOptions.map(([value, label]) => `<option value="${value}" ${recipeEffortFilter === value ? 'selected' : ''}>${label}</option>`).join('')}</select></div><div id="recipe-library-list">${recipeLibraryRows(visible)}</div></section>`;
}

const settingsAction = action;
action = async function recordsAction(name, data = {}) {
  if (name === 'open-records') { state.page = 'logs'; return render(); }
  if (name === 'edit-recipe') return recipeLibraryDialog(state.recipes.find(recipe => recipe.id === data.id));
  if (name === 'toggle-recipe-favorite') {
    const recipe = state.recipes.find(item => item.id === data.id);
    if (recipe) { recipe.favorite = !recipe.favorite; await store.save(); render(); }
    return;
  }
  return settingsAction(name, data);
};

renderLogs = function renderLogsOrRecipes() { return state.page === 'recipes' ? recipesPage() : recordsPage(); };
recipeDialog = recipeLibraryDialog;
nav = function compactNav() {
  const tripNavigation = state.page === 'cancelled'
    ? '<button class="nav-back" data-action="back-home">返回</button>'
    : state.page === 'trips' && trip()
    ? '<button class="nav-back" data-action="show-trip-list">返回</button>'
    : '<button class="home-nav" data-page="home">行程</button>';
  return `<nav class="nav" aria-label="主要導覽">${tripNavigation}<button class="${state.page === 'lists' ? 'active' : ''}" data-page="lists">清單</button><button class="${state.page === 'gear' ? 'active' : ''}" data-page="gear">裝備</button><button class="${state.page === 'recipes' ? 'active' : ''}" data-page="recipes">料理</button></nav>`;
};

const renderWithHomeCardImport = render;
render = function renderWithRecordAccess() {
  renderWithHomeCardImport();
  if (state.page === 'home' && !document.querySelector('[data-action="open-records"]')) {
    const newTrip = document.querySelector('[data-action="new-trip"]');
    if (newTrip) {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'secondary';
      button.dataset.action = 'open-records';
      button.textContent = '露營紀錄';
      button.onclick = () => action('open-records');
      newTrip.parentElement.insertBefore(button, newTrip);
    }
  }
  $('#recipe-type-filter')?.addEventListener('change', event => { recipeTypeFilter = event.target.value; render(); });
  $('#recipe-effort-filter')?.addEventListener('change', event => { recipeEffortFilter = event.target.value; render(); });
};

/* Global settings stay outside individual gear or recipe management. */
function openSettingsDialog() {
  const preferences = state.preferences || { defaultLevel: 'L1', defaultCampType: 'grass', defaultPrep: false, illustrations: true };
  const dialogRoot = dialog(`<h2>設定</h2><form id="settings-form"><div class="form-grid"><div class="field full"><label>新行程預設</label><span class="tiny">只影響之後建立的行程，不會改動既有行程。</span></div><div class="field"><label>預設量級</label><select name="defaultLevel">${Object.entries(levelText).map(([value, label]) => `<option value="${value}" ${preferences.defaultLevel === value ? 'selected' : ''}>${label}</option>`).join('')}</select></div><div class="field"><label>預設營地環境</label><select name="defaultCampType">${[['grass','草地營位'],['pallet','棧板營位'],['forest','林地'],['riverside','溪邊'],['beach','海邊'],['mountain','山區'],['campground','一般營區'],['wild','野外營地']].map(([value, label]) => `<option value="${value}" ${preferences.defaultCampType === value ? 'selected' : ''}>${label}</option>`).join('')}</select></div><div class="field full"><label class="inline-label"><input type="checkbox" name="defaultPrep" ${preferences.defaultPrep ? 'checked' : ''}> 新行程預設在家先備料</label><label class="inline-label"><input type="checkbox" name="illustrations" ${preferences.illustrations !== false ? 'checked' : ''}> 顯示露營插圖</label><label class="inline-label"><input type="checkbox" name="autoTrimSuggestions" ${preferences.autoTrimSuggestions !== false ? 'checked' : ''}> 顯示裝備精簡建議</label></div><div class="field full settings-data"><label>資料與還原</label><p class="tiny">設定檔只包含裝備、料理與收納位置；行程與露營紀錄不會包含在內。</p><div class="actions"><button type="button" class="secondary" data-action="export-settings">備份設定檔</button><button type="button" class="secondary" data-action="import-settings">載入設定檔</button></div></div></div><div class="actions"><button class="primary">儲存設定</button><button type="button" class="secondary" id="cancel">取消</button></div></form>`);
  $('#cancel', dialogRoot).onclick = closeDialog;
  $('#settings-form', dialogRoot).onsubmit = async event => {
    event.preventDefault();
    const data = new FormData(event.target);
    state.preferences = { defaultLevel: data.get('defaultLevel'), defaultCampType: data.get('defaultCampType'), defaultPrep: data.get('defaultPrep') === 'on', illustrations: data.get('illustrations') === 'on', autoTrimSuggestions: data.get('autoTrimSuggestions') === 'on' };
    await store.save();
    closeDialog();
    render();
  };
}

function decoratePageWithIllustration() {
  document.querySelector('.page-decor')?.remove();
  if (state.preferences?.illustrations === false) return;
  const page = document.querySelector('.page');
  if (!page) return;
  page.classList.toggle('no-trip-page', state.page === 'lists' && !trip());
  const kind = ({ home: 'tent', trips: 'fire', lists: 'map', gear: 'backpack', recipes: 'pot', logs: 'forest', cancelled: 'forest' })[state.page] || 'forest';
  const decoration = document.createElement('span');
  decoration.className = `page-decor decor-${kind}`;
  decoration.setAttribute('aria-hidden', 'true');
  page.prepend(decoration);
}

function placePersistentAddGearButton() {
  document.querySelector('.list-add-gear')?.remove();
  if (state.page !== 'lists' || listTab !== 'pack') return;
  const original = document.querySelector('[data-action="add-to-trip"]');
  if (!original) return;
  original.textContent = '加入裝備';
  original.classList.remove('secondary');
  original.classList.add('primary', 'list-add-gear');
  original.closest('.actions')?.remove();
  // CSS presents this as a thin fixed bar above the bottom navigation, leaving
  // every row right edge available for its remove (×) control.
  const listBody = document.querySelector('#list-body');
  if (listBody) listBody.before(original);
  else document.querySelector('.page')?.append(original);
}

function arrangeHomeControls() {
  if (state.page !== 'home') return;
  const page = document.querySelector('.page');
  const heading = page?.querySelector('.row.between');
  if (!page || !heading) return;

  heading.classList.add('home-page-heading');
  heading.querySelector('.title')?.classList.add('home-page-title');

  // Earlier home renderers add buttons directly to the heading.  Always
  // normalize them into one primary-action row before arranging the layout.
  let actions = heading.querySelector('.home-header-actions');
  if (!actions) {
    actions = document.createElement('div');
    actions.className = 'home-header-actions';
    heading.append(actions);
  }
  const newTrip = heading.querySelector('[data-action="new-trip"]');
  const importCard = heading.querySelector('[data-action="import-trip-card"]');
  if (newTrip) actions.append(newTrip);
  if (importCard) actions.append(importCard);

  if (importCard) {
    importCard.textContent = '匯入卡片';
    importCard.classList.remove('primary');
    importCard.classList.add('secondary');
  }

  const footer = document.createElement('div');
  footer.className = 'home-secondary-actions';
  const records = heading.querySelector('[data-action="open-records"]');
  const cancelled = heading.querySelector('[data-action="show-cancelled-trips"]');
  if (records) footer.append(records);
  if (cancelled && (state.discardedTrips || []).length) {
    cancelled.textContent = `取消行程（${(state.discardedTrips || []).length}）`;
    footer.append(cancelled);
  } else {
    cancelled?.remove();
  }
  if (footer.children.length) {
    const tripRows = page.querySelectorAll('.home-trip-row');
    const lastTrip = tripRows[tripRows.length - 1];
    if (lastTrip) lastTrip.after(footer);
    else page.append(footer);
  }
}

function arrangeActiveTripHero() {
  if (state.page !== 'trips' || !state.activeTripId) return;
  const page = document.querySelector('.page');
  const editButton = page?.querySelector('[data-action="edit-trip"]');
  if (!page || !editButton || page.querySelector('.active-trip-hero')) return;

  const title = page.querySelector(':scope > .title');
  const summary = page.querySelector(':scope > .sub');
  const heading = [...page.children].find(element => element.classList.contains('row') && element.classList.contains('between'));
  const eyebrow = heading?.querySelector('.eyebrow');
  const back = heading?.querySelector('[data-action="show-trip-list"]');
  if (!title || !summary || !eyebrow || !heading) return;

  const active = trip();
  const hero = document.createElement('section');
  hero.className = 'active-trip-hero';
  const primary = document.createElement('div');
  primary.className = 'active-trip-primary';
  eyebrow.textContent = '行程卡片';
  const code = document.createElement('p');
  code.className = 'active-trip-code';
  code.textContent = `${active.code} · v${active.revision}`;
  primary.append(eyebrow, title, code, summary);
  hero.append(primary);
  if (back) {
    back.className = 'ghost trip-back-link';
    back.textContent = '所有行程';
    hero.append(back);
  }
  heading.replaceWith(hero);
  page.classList.add('active-trip-page');

  const actionGroups = page.querySelectorAll(':scope > .actions');
  actionGroups.forEach((group, index) => group.classList.add(index === 0 ? 'trip-main-actions' : 'trip-secondary-actions'));
}

const recordAction = action;
action = async function globalSettingsAction(name, data = {}) {
  if (name === 'open-settings') return openSettingsDialog();
  return recordAction(name, data);
};

const priorHeader = header;
header = function settingsHeader() {
  const root = document.createElement('template');
  root.innerHTML = priorHeader().trim();
  const brand = root.content.querySelector('.brand');
  const note = brand?.querySelector('.brand-note');
  if (note) {
    const tools = document.createElement('div');
    tools.className = 'brand-tools';
    tools.innerHTML = '<span class="brand-note">CAMP PLANNER</span><button type="button" class="header-settings" data-action="open-settings">設定</button>';
    note.replaceWith(tools);
  }
  return root.innerHTML;
};

const renderWithRecords = render;
render = function renderWithSettingsAndIllustrations() {
  normalizeRecipeClassification();
  renderWithRecords();
  if (state.page === 'home') {
    const actions = document.querySelector('.home-header-actions');
    const newTrip = actions?.querySelector('[data-action="new-trip"]');
    if (actions && newTrip) actions.prepend(newTrip);
  }
  arrangeHomeControls();
  arrangeActiveTripHero();
  decoratePageWithIllustration();
  placePersistentAddGearButton();
};

/* Keep manual additions as easy to browse as the main gear library. */
addToTripDialog = function filteredAddToTripDialog() {
  const currentTrip = trip();
  if (!currentTrip) return;
  const tripId = currentTrip.id;
  let filter = 'all';
  const dialogRoot = dialog(`<form id="manual-add-form"><h2>手動加入裝備</h2><div class="gear-filter manual-gear-filter"><label for="manual-gear-filter">顯示分類</label><select id="manual-gear-filter"><option value="all">全部裝備</option><option value="favorite">★ 我的最愛</option>${categories.map(category => `<option value="${esc(category)}">${esc(category)}</option>`).join('')}</select></div><p id="manual-gear-count" class="sub"></p><div id="manual-gear-list" class="list"></div><div class="actions"><button type="submit" class="primary" id="add-items">加入</button><button type="button" class="secondary" id="cancel">取消</button></div></form>`);
  const availableGear = () => state.gear
    .filter(gear => !currentTrip.items.some(itemData => itemData.gearId === gear.id))
    .filter(gear => filter === 'all' || filter === 'favorite' ? (filter !== 'favorite' || gear.favorite) : gear.category === filter)
    .sort((left, right) => Number(!!right.favorite) - Number(!!left.favorite) || left.name.localeCompare(right.name, 'zh-Hant'));
  const drawAvailable = () => {
    const visible = availableGear();
    $('#manual-gear-count', dialogRoot).textContent = `${visible.length} 件可加入`;
    $('#manual-gear-list', dialogRoot).innerHTML = visible.length
      ? visible.map(gear => `<label class="item"><input type="checkbox" value="${esc(gear.id)}"><span><span class="item-name">${esc(gear.name)}${gear.favorite ? '　★' : ''}</span><span class="reason">${esc(gear.category)} · ${esc(gear.location || '未設定收納位置')}</span></span></label>`).join('')
      : '<p class="sub">這個分類目前沒有可加入的裝備。</p>';
  };
  $('#manual-gear-filter', dialogRoot).addEventListener('change', event => { filter = event.target.value; drawAvailable(); });
  $('#cancel', dialogRoot).onclick = closeDialog;
  $('#manual-add-form', dialogRoot).onsubmit = async event => {
    event.preventDefault();
    const button = $('#add-items', dialogRoot);
    if (button.disabled) return;
    button.disabled = true;
    await commitMutation(async () => {
      const writableTrip = state.trips.find(entry => entry.id === tripId);
      if (!writableTrip) return;
      writableTrip.items ??= [];
      writableTrip.overrides ??= { added: [], removed: [] };
      writableTrip.overrides.added ??= [];
      writableTrip.overrides.removed ??= [];
      $$('input:checked', $('#manual-gear-list', dialogRoot)).forEach(input => {
        const gear = gearById(input.value);
        if (!gear || writableTrip.items.some(entry => entry.gearId === gear.id)) return;
        const entry = item(gear.id, '手動加入');
        entry.manual = true;
        writableTrip.items.push(entry);
        if (!writableTrip.overrides.added.some(itemData => itemData.gearId === gear.id)) writableTrip.overrides.added.push(structuredClone(entry));
        writableTrip.overrides.removed = writableTrip.overrides.removed.filter(id => id !== gear.id);
      });
      writableTrip.updatedAt = now();
    });
    closeDialog();
    render();
  };
  drawAvailable();
};

function openExtraDishDialog(recipeId) {
  const currentTrip = trip();
  const parentRecipe = state.recipes.find(recipe => recipe.id === recipeId);
  if (!currentTrip || !parentRecipe) return;
  const dialogRoot = dialog(`<h2>額外加菜</h2><form id="extra-dish-form"><div class="field"><label>菜名</label><input name="name" required placeholder="例如：烤玉米"></div><div class="field"><label>採買項目</label><textarea name="ingredients" required placeholder="一行一項，例如：&#10;玉米 2 根&#10;奶油 10g"></textarea></div><div class="field"><label class="inline-label"><input type="checkbox" name="saveRecipe"> 另存為料理</label></div><div class="actions"><button class="primary">加入</button><button type="button" class="secondary" id="cancel">取消</button></div></form>`);
  $('#cancel', dialogRoot).onclick = closeDialog;
  $('#extra-dish-form', dialogRoot).onsubmit = async event => {
    event.preventDefault();
    const data = new FormData(event.target);
    const name = data.get('name').trim();
    const ingredients = data.get('ingredients').split(/\r?\n/).map(item => item.trim()).filter(Boolean);
    if (data.get('saveRecipe') === 'on') {
      const addedRecipe = { id: nextRecipeId(), name, type: 'other', effort: 'one-pot', meal: '不限', ingredients, gear: [], onsite: false, favorite: false };
      state.recipes.push(addedRecipe);
      currentTrip.recipeIds.push(addedRecipe.id);
      currentTrip.recipeMeals ??= {};
      currentTrip.recipeMeals[addedRecipe.id] = currentTrip.recipeMeals[recipeId] || '';
    } else {
      currentTrip.extraShopping ??= {};
      currentTrip.extraShopping[recipeId] ??= [];
      ingredients.forEach(itemName => currentTrip.extraShopping[recipeId].push({ id: uid('extra'), name: itemName, checked: false }));
    }
    recalc(currentTrip);
    await store.save();
    closeDialog();
    render();
  };
}

const priorShoppingAction = action;
action = async function shoppingAction(name, data = {}) {
  if (name === 'add-extra-dish') return openExtraDishDialog(data.recipeId);
  if (name === 'remove-shopping') {
    const currentTrip = trip();
    const index = Number(data.index);
    const entry = currentTrip?.shopping?.[index];
    if (!currentTrip || !entry) return;
    currentTrip.shoppingRemoved ??= [];
    const key = data.shoppingKey || entry.shoppingKey || `recipe:${entry.recipeId}:${entry.name}`;
    if (!currentTrip.shoppingRemoved.includes(key)) currentTrip.shoppingRemoved.push(key);
    currentTrip.shopping.splice(index, 1);
    await store.save();
    render();
    return;
  }
  return priorShoppingAction(name, data);
};

const levelPresetFallbacks = {
  L1: ['F04', 'F06', 'F02', 'C01', 'C07', 'T02', 'T04', 'L05', 'L06', 'X01'],
  L2: ['F03', 'F04', 'F06', 'F01', 'C01', 'C07', 'T01', 'T02', 'T04', 'L05', 'L06', 'X01'],
  L3: ['F03', 'F04', 'F06', 'F01', 'C01', 'C07', 'T01', 'T02', 'T04', 'L05', 'L06', 'X01'],
  L4: ['F03', 'F04', 'F06', 'F01', 'C01', 'C07', 'T01', 'T02', 'T04', 'L05', 'L06', 'X01', 'F05', 'T05', 'T06', 'T07']
};

function levelDefaultGear(level) {
  return state.levelDefaults?.[level] || levelPresetFallbacks[level] || [];
}

function openLevelDefaultsDialog() {
  let selectedLevel = 'L1';
  const dialogRoot = dialog(`<h2>量級預設裝備</h2><div class="gear-filter"><label for="level-default-select">量級</label><select id="level-default-select">${Object.entries(levelText).map(([value, label]) => `<option value="${value}">${label}</option>`).join('')}</select></div><p class="sub">勾選此量級建立行程時自動帶入的裝備。</p><div id="level-default-list" class="list"></div><div class="actions"><button type="button" class="primary" id="save-level-defaults">儲存預設</button><button type="button" class="secondary" id="cancel">取消</button></div>`);
  const list = $('#level-default-list', dialogRoot);
  const draw = () => {
    const selected = new Set(levelDefaultGear(selectedLevel));
    list.innerHTML = [...state.gear]
      .sort((left, right) => left.category.localeCompare(right.category, 'zh-Hant') || left.name.localeCompare(right.name, 'zh-Hant'))
      .map(gear => `<label class="item"><input type="checkbox" name="level-default" value="${esc(gear.id)}" ${selected.has(gear.id) ? 'checked' : ''}><span><span class="item-name">${esc(gear.name)}</span><span class="reason">${esc(gear.category)}</span></span></label>`)
      .join('');
  };
  $('#level-default-select', dialogRoot).onchange = event => { selectedLevel = event.target.value; draw(); };
  $('#cancel', dialogRoot).onclick = closeDialog;
  $('#save-level-defaults', dialogRoot).onclick = async () => {
    state.levelDefaults ??= {};
    state.levelDefaults[selectedLevel] = $$('input[name="level-default"]:checked', list).map(input => input.value);
    state.trips.forEach(recalc);
    await store.save();
    closeDialog();
    render();
  };
  draw();
}

const previousLevelPresetAction = action;
action = async function levelPresetAction(name, data = {}) {
  if (name === 'manage-level-defaults') return openLevelDefaultsDialog();
  return previousLevelPresetAction(name, data);
};

/* Mobile offline card: the phone reads the original PNG card and only sends
   checklist state back. It cannot alter itinerary, gear, or recipes. */

async function readOfflineCardSnapshot(file) {
  if (file.type !== 'image/png' && !/\.png$/i.test(file.name)) {
    throw new Error('請選擇手機離線卡匯出的原始 PNG 行程卡。');
  }
  const bytes = new Uint8Array(await file.arrayBuffer());
  const chunk = readPngChunk(bytes, 'caMp');
  if (!chunk) throw new Error('這張 PNG 沒有可還原的行程資料。請選擇原始檔。');
  const metadata = JSON.parse(new TextDecoder().decode(chunk));
  if (metadata.format !== 'camp-card.v1' || metadata.compression !== 'gzip' || !metadata.payload) {
    throw new Error('不支援這張行程卡的資料格式。');
  }
  const json = await ungzip(unbase64(metadata.payload));
  if (metadata.sha256 && await digest(json) !== metadata.sha256) throw new Error('行程卡完整性檢查失敗。');
  const snapshot = JSON.parse(json);
  const source = snapshot?.trip;
  if (snapshot.format !== 'camp-card.v1' || !source?.id) throw new Error('行程卡內容不完整。');
  return snapshot;
}

async function mergeOfflineCardChecks(snapshot) {
  const source = snapshot.trip;
  const currentTrip = state.trips.find(entry => entry.id === source.id)
    || state.trips.find(entry => entry.code === source.code);
  if (!currentTrip) throw new Error('找不到對應行程；請先匯入原本的行程卡片。');

  const packChecks = new Map((source.items || []).map(entry => [entry.gearId, !!entry.checked]));
  const shoppingChecks = new Map((source.shopping || []).map((entry, index) => [entry.shoppingKey || `legacy:${entry.recipeId || ''}:${entry.name}:${index}`, !!entry.checked]));
  let changed = 0;
  (currentTrip.items || []).forEach(entry => {
    if (!packChecks.has(entry.gearId)) return;
    const checked = !!packChecks.get(entry.gearId);
    if (entry.checked !== checked) { entry.checked = checked; changed++; }
  });
  const shopping = currentTrip.shopping || [];
  shopping.forEach((entry, index) => {
    const id = entry.shoppingKey || `legacy:${entry.recipeId || ''}:${entry.name}:${index}`;
    if (!shoppingChecks.has(id)) return;
    const checked = !!shoppingChecks.get(id);
    if (entry.checked !== checked) { entry.checked = checked; changed++; }
  });
  currentTrip.updatedAt = now();
  await store.save();
  notify(changed ? `已從行程卡 PNG 同步 ${changed} 個勾選狀態。` : '勾選狀態沒有變更。');
  render();
}

async function importMobileCheckin(file) {
  return mergeOfflineCardChecks(await readOfflineCardSnapshot(file));
}

chooseTripCard = function chooseUnifiedTripCard() {
  const input = $('#file-input');
  input.accept = 'image/png,.png';
  input.value = '';
  input.onchange = async () => {
    const file = input.files?.[0];
    if (!file) return;
    try {
      const snapshot = await readOfflineCardSnapshot(file);
      const source = snapshot.trip;
      const existing = state.trips.some(entry => entry.id === source.id || entry.code === source.code);
      if (existing) await mergeOfflineCardChecks(snapshot);
      else {
        await importCard(file);
        notify('已匯入新的行程卡片，可直接編輯。');
        render();
      }
    } catch (error) {
      console.error(error);
      notify(`匯入行程卡失敗：${error.message}`, 'error');
    }
  };
  input.click();
}

const mobileCardAction = action;
action = async function mobileCardActionHandler(name, data = {}) {
  return mobileCardAction(name, data);
};

const mobileCardRender = render;
render = function renderWithMobileCardControls() {
  mobileCardRender();
};
