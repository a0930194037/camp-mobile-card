/*
 * Retirement bridge for installations that registered the pre-v8 worker
 * (`sw.js`). That worker cached the old planner bundle cache-first, so an
 * installed client could keep rendering old screens after a deployment.
 *
 * The current app registers `service-worker.js`. On its next update check,
 * this bridge removes only the old cache family, unregisters itself, and
 * reloads open app windows. The fresh page then registers the v8 worker.
 */
self.addEventListener('install', (event) => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const cacheKeys = await caches.keys();
    await Promise.all(
      cacheKeys
        .filter((key) => key.startsWith('camp-mobile-card-'))
        .map((key) => caches.delete(key)),
    );

    await self.registration.unregister();

    const clients = await self.clients.matchAll({ type: 'window' });
    await Promise.all(clients.map((client) => client.navigate(client.url)));
  })());
});
