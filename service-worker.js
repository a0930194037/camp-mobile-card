const CACHE='camp-v8-ce1ac3c3bc3bd06e085363c87f565177f36eb71585639a367b2c28d56d90cfff';const SHELL=["./","./index.html","./legacy-ui.js","./sync-config.js","./sync-v8.js","./boot.js","./sidepanel.css","./assets/camping-illustrations-v1.png","./assets/moonlight-tent-type3.png","./assets/roll-table-low-chair.png","./assets/stove-solo-cookset.png"];
self.addEventListener('install',event=>event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(SHELL)).then(()=>self.skipWaiting())));
self.addEventListener('activate',event=>event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key.startsWith('camp-v8-')&&key!==CACHE).map(key=>caches.delete(key)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',event=>{
 const url=new URL(event.request.url);
 if(event.request.method!=='GET'||url.origin!==self.location.origin||!SHELL.some(path=>new URL(path,self.registration.scope).href===url.href))return;
 // Code is network-first so a published sync fix is never paired with an old
 // cached engine. The current cache remains the offline fallback.
 event.respondWith(fetch(event.request).then(response=>{const copy=response.clone();caches.open(CACHE).then(cache=>cache.put(event.request,copy));return response;}).catch(()=>caches.match(event.request)));
});