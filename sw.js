'use strict';
// Versioned application shell. New versions wait until the player elects to update.
const ROOT=self.registration.scope;
const PREFIX='driftport-pwa:'+ROOT+':';
const CACHE=PREFIX+'eaf437de1113ec52';
const FILES=['index.html','manifest.webmanifest','icons/icon-192.png','icons/icon-512.png','icons/apple-touch-icon.png'];
const urls=FILES.map(file=>new URL(file,ROOT).href);
self.addEventListener('install',event=>event.waitUntil((async()=>{
 const cache=await caches.open(CACHE);
 await cache.addAll(urls.map(url=>new Request(url,{cache:'reload'})));
})()));
self.addEventListener('activate',event=>event.waitUntil((async()=>{
 const keys=await caches.keys();
 await Promise.all(keys.filter(key=>key.startsWith(PREFIX)&&key!==CACHE).map(key=>caches.delete(key)));
 await self.clients.claim();
})()));
self.addEventListener('message',event=>{
 if(event.data?.type==='ACTIVATE_UPDATE')event.waitUntil(self.skipWaiting());
});
self.addEventListener('fetch',event=>{
 if(event.request.method!=='GET')return;
 const url=new URL(event.request.url),base=new URL(ROOT);
 if(url.origin!==base.origin||!url.pathname.startsWith(base.pathname))return;
 if(event.request.mode==='navigate'&&url.pathname===base.pathname+'latest.html'){
  event.respondWith((async()=>{
   try{const fresh=await fetch(new Request(event.request,{cache:'no-store'}));if(fresh.ok)return fresh;}catch{}
   const cached=await (await caches.open(CACHE)).match(urls[0]);
   return cached||Response.error();
  })());return;
 }
 const navigation=event.request.mode==='navigate'&&(url.pathname===base.pathname||url.pathname===base.pathname+'index.html');
 const canonical=new URL(url.pathname,url.origin).href;
 if(!navigation&&!urls.includes(canonical))return;
 const key=navigation?urls[0]:canonical;
 event.respondWith((async()=>{
  const cache=await caches.open(CACHE),cached=await cache.match(key);
  if(cached)return cached;
  // Never cache an error page or replace the pinned release with a partial deployment.
  return fetch(event.request);
 })());
});
