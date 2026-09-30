const CACHE = 'camp-mobile-card-v41';
const APP_FILES = ['./', './index.html', './planner.css', './planner.js', './planner-enhancements.js', './storage-bridge.js', './sync-config.js', './sync-engine.js', './sync-extension.js', './manifest.webmanifest', './icon.svg', './assets/camping-illustrations-v1.png', './assets/moonlight-tent-type3.png', './assets/roll-table-low-chair.png', './assets/stove-solo-cookset.png'];

self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(APP_FILES)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', event => event.waitUntil(
  caches.keys().then(names => Promise.all(names.filter(name => name !== CACHE).map(name => caches.delete(name))))
    .then(() => self.clients.claim())
));

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  const updateCache = response => {
    const copy = response.clone();
    caches.open(CACHE).then(cache => cache.put(event.request, copy));
    return response;
  };
  // Always check the network for HTML navigations.  This prevents an installed
  // card from being stuck on an old UI after a GitHub Pages update.
  if (event.request.mode === 'navigate') {
    event.respondWith(fetch(event.request).then(updateCache).catch(() => caches.match(event.request).then(cached => cached || caches.match('./'))));
    return;
  }
  // JavaScript must also be network-first: an older cached app.js can be
  // incompatible with a freshly fetched index.html and leave buttons inert.
  const isAppCode = /\/(app|planner|planner-enhancements|storage-bridge|sync-config|sync-engine|sync-extension)\.js(?:\?|$)/.test(new URL(event.request.url).pathname);
  if (isAppCode) {
    event.respondWith(fetch(event.request).then(updateCache).catch(() => caches.match(event.request)));
    return;
  }
  event.respondWith(caches.match(event.request).then(cached => cached || fetch(event.request).then(updateCache)));
});
