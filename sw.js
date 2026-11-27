const CACHE = 'bairx-v5';
const OFFLINE_PAGE = '/';

const PRECACHE = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png'
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE)
      .then(c => c.addAll(PRECACHE.map(url => new Request(url, { cache: 'reload' }))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;

  const url = new URL(e.request.url);

  // Don't cache Google Fonts or other CDN requests
  if (!url.origin.includes(self.location.hostname) && !url.origin.includes('fonts.googleapis.com')) {
    return;
  }

  // Network-first for navigation (always try fresh HTML)
  if (e.request.mode === 'navigate') {
    e.respondWith(
      fetch(e.request)
        .then(res => {
          const clone = res.clone();
          caches.open(CACHE).then(c => c.put(e.request, clone));
          return res;
        })
        .catch(() => caches.match('/index.html').then(r => r || caches.match('/')))
    );
    return;
  }

  // Same-origin app code (js/css/html) — network-first so a new deploy is picked up
  // immediately instead of silently serving a stale cached script forever. Cache is
  // only a fallback for when the network is unavailable (offline support).
  // /data/*.json (bank list etc.) is included: it changes without a code deploy.
  if (url.origin.includes(self.location.hostname) && /\.(js|css|json)$/.test(url.pathname)) {
    e.respondWith(
      fetch(e.request).then(res => {
        if (res && res.status === 200) {
          const clone = res.clone();
          caches.open(CACHE).then(c => c.put(e.request, clone));
        }
        return res;
      }).catch(() => caches.match(e.request))
    );
    return;
  }

  // Path-routed pages (/complexes, /b/250 …) are navigations, handled above.
  // Cache-first for everything else (fonts, images — rarely change, safe to cache aggressively)
  e.respondWith(
    caches.match(e.request).then(cached => {
      if (cached) return cached;
      return fetch(e.request).then(res => {
        if (!res || res.status !== 200 || res.type === 'opaque') return res;
        const clone = res.clone();
        caches.open(CACHE).then(c => c.put(e.request, clone));
        return res;
      }).catch(() => null);
    })
  );
});

// ===== WEB PUSH (FCM) — alerts from functions/index.js =====
// FCM delivers { notification: { title, body, icon }, fcmOptions: { link } } (or the same
// under data); shown here without loading the Firebase SDK into the worker.
self.addEventListener('push', e => {
  let p = {};
  try { p = e.data ? e.data.json() : {}; } catch (err) { p = { notification: { title: 'BairX', body: e.data && e.data.text() } }; }
  const n = p.notification || p.data || {};
  const link = (p.fcmOptions && p.fcmOptions.link) || (p.data && p.data.link) || '/';
  e.waitUntil(self.registration.showNotification(n.title || 'BairX', {
    body: n.body || '', icon: n.icon || '/icon-192.png', badge: '/icon-192.png', data: { link }
  }));
});
self.addEventListener('notificationclick', e => {
  e.notification.close();
  const link = (e.notification.data && e.notification.data.link) || '/';
  e.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(list => {
    for (const c of list) { if ('focus' in c) { c.navigate(link); return c.focus(); } }
    return self.clients.openWindow(link);
  }));
});
