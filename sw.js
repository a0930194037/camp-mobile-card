const CACHE = 'camp-mobile-card-v6';
const APP_FILES = ['./', './index.html', './app.js', './manifest.webmanifest', './icon.svg'];

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
  event.respondWith(caches.match(event.request).then(cached => cached || fetch(event.request).then(updateCache)));
});
