const CACHE_NAME = 'studiocloud-cache-v1';

// Assets that must be cached immediately
const PRECACHE_ASSETS = [
  '/',
  '/manifest.webmanifest',
  // Next.js chunks will be cached via the stale-while-revalidate strategy dynamically
];

// Helper to determine if a request is for a static asset
const isStaticAsset = (url) => {
  return (
    url.pathname.startsWith('/_next/static/') ||
    url.pathname.startsWith('/static/') ||
    url.pathname.match(/\.(png|jpg|jpeg|svg|webp|woff|woff2|ttf|otf|css|js)$/i)
  );
};

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_ASSETS))
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Skip cross-origin requests, API calls, backend routes
  if (
    url.origin !== location.origin ||
    url.pathname.startsWith('/api/') ||
    event.request.method !== 'GET'
  ) {
    return;
  }

  // 1. Static Assets: Stale-While-Revalidate
  // Fast local response, but updates cache in background for next time
  if (isStaticAsset(url)) {
    event.respondWith(
      caches.match(event.request).then((cachedResponse) => {
        const fetchPromise = fetch(event.request).then((networkResponse) => {
          if (networkResponse.ok) {
            const clone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, clone);
            });
          }
          return networkResponse;
        }).catch(() => {
          // Ignore network errors for static assets if we have a cache
          return null;
        });

        return cachedResponse || fetchPromise;
      })
    );
    return;
  }

  // 2. HTML and Page Navigations: Network-First (Fallback to Cache)
  // Ensures user always gets the freshest page if online, but can load offline
  if (event.request.mode === 'navigate' || url.pathname === '/') {
    event.respondWith(
      fetch(event.request)
        .then((networkResponse) => {
          const clone = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, clone);
          });
          return networkResponse;
        })
        .catch(async () => {
          const cachedResponse = await caches.match(event.request);
          if (cachedResponse) {
             return cachedResponse;
          }
          // If offline and page not cached, just return the root cache
          return caches.match('/');
        })
    );
    return;
  }
});
