const CACHE_NAME = 'game-cache-v1';

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return fetch('asset-manifest.json')
        .then(response => response.ok ? response.json() : { files: [] })
        .then(manifest => {
          // Fallback: cache index.html and root if manifest missing
          const files = manifest.files || [
            '/',
            '/index.html',
          ];
          return cache.addAll(files);
        })
        .catch(() => cache.addAll(['/', '/index.html']));
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);
  // Handle navigation requests (SPA fallback)
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(() => caches.match('/index.html'))
    );
    return;
  }
  // Cache-first for static assets
  event.respondWith(
    caches.match(event.request).then(response => {
      return response || fetch(event.request).then(fetchRes => {
        // Optionally cache new requests here if desired
        return fetchRes;
      });
    })
  );
}); 