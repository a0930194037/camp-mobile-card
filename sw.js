const CACHE = 'camp-mobile-card-v9';
const APP_FILES = ['./', './index.html', './app.js', './sync-config.js', './sync-engine.js', './manifest.webmanifest', './icon.svg'];

self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(APP_FILES)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', event => event.waitUntil(self.clients.claim()));

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
  const isAppCode = /\/(app|sync-config|sync-engine)\.js(?:\?|$)/.test(new URL(event.request.url).pathname);
  if (isAppCode) {
    event.respondWith(fetch(event.request).then(updateCache).catch(() => caches.match(event.request)));
    return;
  }
  event.respondWith(caches.match(event.request).then(cached => cached || fetch(event.request).then(updateCache)));
});
