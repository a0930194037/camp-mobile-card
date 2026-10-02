const CACHE='camp-v8-386f65ec0e1d3f1b35bec4a2f51017bdbaf1e7c0b26a42438c4e123da7800dc4';const SHELL=["./","./index.html","./legacy-ui.js","./sync-config.js","./sync-v8.js","./boot.js","./sidepanel.css","./assets/camping-illustrations-v1.png","./assets/moonlight-tent-type3.png","./assets/roll-table-low-chair.png","./assets/stove-solo-cookset.png","./assets/camp-map-chibi.png?v=20261003-chibi","./assets/campfire-chibi.png?v=20261003-chibi","./assets/pine-grove-chibi.png?v=20261003-chibi"];
self.addEventListener('install',event=>event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(SHELL)).then(()=>self.skipWaiting())));
self.addEventListener('activate',event=>event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key.startsWith('camp-v8-')&&key!==CACHE).map(key=>caches.delete(key)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',event=>{
 const url=new URL(event.request.url);
 if(event.request.method!=='GET'||url.origin!==self.location.origin||!SHELL.some(path=>new URL(path,self.registration.scope).href===url.href))return;
 // Code is network-first so a published sync fix is never paired with an old
 // cached engine. The current cache remains the offline fallback.
 event.respondWith(fetch(event.request).then(response=>{const copy=response.clone();caches.open(CACHE).then(cache=>cache.put(event.request,copy));return response;}).catch(()=>caches.match(event.request)));
});