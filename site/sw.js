// Healthy Women v1.1 — privacy-restricted offline application shell.
// Never cache dynamic requests, API responses, health diary or URL query strings.
const VERSION="healthy-women-pwa-v28-ux";
const PREFIX="healthy-women-pwa-v";
const CACHE_FILES=[
 "./","./index.html","./manifest.webmanifest","./icons/icon.svg",
 "./sw.js","./privacy.html","./style.css","./app.mjs","./config.js","./privacy.css","./privacy-page.mjs","./checkins.mjs","./checkin-ui.mjs",
 "./vault.mjs","./vault-ui.mjs","./cycle-safety.mjs","./insights.mjs","./analytics.mjs","./calendar-day.mjs","./date-uz.mjs","./ai-client.mjs","./install-ui.mjs",
 "./reminders.mjs","./diary.mjs","./privacy-screen.mjs","./telegram-launch.mjs",
 "./local-crypto.mjs","./local-crypto-ui.mjs","./journal-guard.mjs","./legacy-recovery.mjs","./restore-safety.mjs","./erasure.mjs","./password-rotation-ui.mjs"
];
const SCOPE=self.registration.scope;
const STATIC_PATHS=new Set(CACHE_FILES.map(file=>new URL(file,SCOPE).pathname));
self.addEventListener("install",event=>{
 event.waitUntil(caches.open(VERSION).then(cache=>cache.addAll(CACHE_FILES)).then(()=>self.skipWaiting()));
});
self.addEventListener("activate",event=>{
 event.waitUntil(caches.keys().then(names=>Promise.all(
  names.filter(name=>name.startsWith(PREFIX)&&name!==VERSION).map(name=>caches.delete(name))
 )).then(()=>self.clients.claim()));
});
self.addEventListener("fetch",event=>{
 const request=event.request;
 if(request.method!=="GET")return;
 const url=new URL(request.url);
 if(url.origin!==self.location.origin||url.search||url.hash||!STATIC_PATHS.has(url.pathname))return;
 // App-shell resources only. No dynamic runtime cache additions.
 event.respondWith(caches.open(VERSION).then(cache=>cache.match(request).then(hit=>hit||fetch(request))));
});
