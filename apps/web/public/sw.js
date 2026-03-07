const CACHE_NAME = 'studiocloud-cache-v2';

// Assets that must be cached immediately
const PRECACHE_ASSETS = [
  '/',
  '/manifest.webmanifest',
  // Next.js chunks will be cached via the stale-while-revalidate strategy dynamically
];

const PUBLIC_PATHS = new Set([
  '/',
  '/about',
  '/blog',
  '/careers',
  '/contact',
  '/features',
  '/forgot-password',
  '/login',
  '/pricing',
  '/privacy',
  '/security',
  '/showcase',
  '/signup',
  '/terms',
]);

const PUBLIC_PREFIXES = ['/blog/', '/showcase/'];

// Helper to determine if a request is for a static asset
const isStaticAsset = (url) => {
  return (
    url.pathname.startsWith('/_next/static/') ||
    url.pathname.startsWith('/static/') ||
    url.pathname.match(/\.(png|jpg|jpeg|svg|webp|woff|woff2|ttf|otf|css|js)$/i)
  );
};

const isPublicNavigation = (url) => {
  if (PUBLIC_PATHS.has(url.pathname)) {
    return true;
  }

  return PUBLIC_PREFIXES.some((prefix) => url.pathname.startsWith(prefix));
};

const canStoreNavigationResponse = (response) => {
  if (!response || !response.ok) {
    return false;
  }

  const cacheControl = (response.headers.get('cache-control') || '').toLowerCase();
  if (cacheControl.includes('no-store') || cacheControl.includes('private')) {
    return false;
  }

  return true;
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
          if (isPublicNavigation(url) && canStoreNavigationResponse(networkResponse)) {
            const clone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, clone);
            });
          }
          return networkResponse;
        })
        .catch(async () => {
          if (!isPublicNavigation(url)) {
            return new Response('Offline', { status: 503, statusText: 'Offline' });
          }
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
