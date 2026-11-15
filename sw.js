/* Projects Control Platform – service worker of the installable app.
   The tool (index.html): network first – online it always loads the newest tool, offline it opens the copy kept on this device.
   App files (manifest, icons): kept on the device. Fonts: kept and refreshed. OneDrive / Microsoft sign-in and every other request: not touched. */
const CACHE = 'pcp-app';
const CORE = ['./', './manifest.webmanifest', './icons/icon-192.png', './icons/icon-512.png', './icons/icon-maskable-512.png'];
self.addEventListener('install', e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(CORE)).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => { e.waitUntil(self.clients.claim()); });
const timeout = (p, ms) => new Promise((res, rej) => { const t = setTimeout(() => rej(new Error('timeout')), ms); p.then(v => { clearTimeout(t); res(v); }, e => { clearTimeout(t); rej(e); }); });
self.addEventListener('fetch', e => {
  const r = e.request; if (r.method !== 'GET') return;
  const u = new URL(r.url);
  if (u.origin === self.location.origin) {
    const tool = r.mode === 'navigate' || /\/(index\.html)?$/.test(u.pathname);
    if (tool) {
      e.respondWith(timeout(fetch(r, { cache: 'no-cache' }), 8000).then(res => { if (res && res.ok) { const c = res.clone(); caches.open(CACHE).then(k => k.put('./', c)); } return res; })
        .catch(() => caches.match('./').then(m => m || caches.match(r)).then(m => m || new Response('<h3 style="font-family:sans-serif">Offline – open the platform once while online.</h3>', { headers: { 'Content-Type': 'text/html' } }))));
      return;
    }
    if (/\.(webmanifest|png|svg|ico)$/.test(u.pathname)) { e.respondWith(caches.match(r).then(m => m || fetch(r).then(res => { if (res.ok) { const c = res.clone(); caches.open(CACHE).then(k => k.put(r, c)); } return res; }))); }
    return;
  }
  if (/^fonts\.(googleapis|gstatic)\.com$/.test(u.hostname)) {
    e.respondWith(caches.open(CACHE).then(k => k.match(r).then(m => { const f = fetch(r).then(res => { if (res && (res.ok || res.type === 'opaque')) k.put(r, res.clone()); return res; }).catch(() => m); return m || f; })));
  }
});
