/* DALOG Service Tools — lets the GitHub page open with NO signal (on site).
   Uploaded once next to index.html. The page itself (index.html) is fetched
   fresh whenever there is signal and kept for when there isn't, so a new
   index.html upload reaches the phones without touching this file.
   Google calls (sheets, drive, sign-in) are never cached: the form keeps its
   own queue on the phone for those. */
const CACHE = 'dalog-tools-v1';
const SHELL = ['./', './index.html', './manifest.webmanifest', './icon-192.png', './icon-512.png'];
const FONTS = /^https:\/\/fonts\.(googleapis|gstatic)\.com\//;
const WAIT = 6000;   // weak signal: after 6 s use the phone's copy

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});

// Network first (so updates arrive), the phone's copy when there is no/weak signal.
function pageFromNetwork(req) {
  return new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new Error('slow')), WAIT);
    fetch(req).then(r => {
      clearTimeout(t);
      if (r && r.ok) {
        const copy = r.clone();
        caches.open(CACHE).then(c => Promise.all([c.put(req, copy.clone()), c.put('./index.html', copy)]));
      }
      resolve(r);
    }, err => { clearTimeout(t); reject(err); });
  });
}

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (req.mode === 'navigate' && url.origin === location.origin) {
    e.respondWith(pageFromNetwork(req).catch(() =>
      caches.match(req, { ignoreSearch: true }).then(r => r || caches.match('./index.html'))));
    return;
  }
  if (url.origin === location.origin || FONTS.test(req.url)) {
    // icons, manifest, fonts: the phone's copy first, refreshed in the background
    e.respondWith(caches.open(CACHE).then(c => c.match(req).then(hit => {
      const net = fetch(req).then(r => { if (r && (r.ok || r.type === 'opaque')) c.put(req, r.clone()); return r; });
      return hit || net;
    })));
  }
});
