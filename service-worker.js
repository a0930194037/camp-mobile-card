const CACHE='camp-v8-9e553b76336fa6ec7e2f72d95c9e0ad38dd9efac390e2557ba796b69c30e1d60';const SHELL=["./","./index.html","./legacy-ui.js","./sync-config.js","./sync-v8.js","./boot.js","./sidepanel.css","./assets/camping-illustrations-v1.png","./assets/moonlight-tent-type3.png","./assets/roll-table-low-chair.png","./assets/stove-solo-cookset.png"];
self.addEventListener('install',event=>event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(SHELL))));
self.addEventListener('activate',event=>event.waitUntil(self.clients.claim()));
self.addEventListener('fetch',event=>{
 const url=new URL(event.request.url);
 if(event.request.method!=='GET'||url.origin!==self.location.origin||!SHELL.some(path=>new URL(path,self.registration.scope).href===url.href))return;
 event.respondWith(caches.open(CACHE).then(async cache=>(await cache.match(event.request))||fetch(event.request)));
});