const CACHE_NAME = 'lan-file-share-v1';

self.addEventListener('install', function (e) {
  e.waitUntil(
    caches.open(CACHE_NAME).then(function (cache) {
      return cache.addAll(['/', '/index.html', '/manifest.json', '/icons/lan-file-share.png']);
    }).then(function () { return self.skipWaiting(); })
  );
});

self.addEventListener('activate', function (e) {
  e.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(keys.filter(function (k) { return k !== CACHE_NAME; }).map(function (k) { return caches.delete(k); }));
    }).then(function () { return self.clients.claim(); })
  );
});

self.addEventListener('fetch', function (e) {
  if (e.request.url.includes('/api/')) return;
  e.respondWith(caches.match(e.request).then(function (cached) { return cached || fetch(e.request); }));
});
