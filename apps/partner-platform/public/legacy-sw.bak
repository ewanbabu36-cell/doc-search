/**
 * DocSearch Partner Platform - Service Worker
 * PWA Offline Cache & Background Sync Engine
 */

const CACHE_NAME = 'docsearch-pos-cache-v1';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    }).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      );
    }).then(() => self.clients.claim())
  );
});

// Background Sync Listener (Native SyncManager)
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-pharmacy-offline-bills') {
    event.waitUntil(notifyAllClientsToSync());
  }
});

async function notifyAllClientsToSync() {
  const clients = await self.clients.matchAll({ type: 'window' });
  for (const client of clients) {
    client.postMessage({
      type: 'DOCSEARCH_SW_SYNC_TRIGGER',
      timestamp: new Date().toISOString()
    });
  }
}

// Fetch listener - Network first with cache fallback for static assets
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Do not intercept non-GET or API calls
  if (event.request.method !== 'GET' || url.pathname.startsWith('/api')) {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        if (response && response.status === 200 && response.type === 'basic') {
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return response;
      })
      .catch(() => {
        return caches.match(event.request).then((cached) => {
          if (cached) return cached;
          if (event.request.headers.get('accept')?.includes('text/html')) {
            return caches.match('/index.html');
          }
          return new Response('Offline - DocSearch POS Cached', {
            status: 503,
            statusText: 'Service Unavailable'
          });
        });
      })
  );
});
