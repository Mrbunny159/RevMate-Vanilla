// ============================================
// REVMATE PWA SERVICE WORKER
// Offline caching, network-first strategy, safe updates
// ============================================

const CACHE_NAME = 'revmate-v1';
const OFFLINE_PAGE = '/offline.html';

// Assets to cache on install
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/offline.html',
  '/css/styles.css',
  '/css/rides.css',
  '/css/theme.css',
  '/js/script.js',
  '/js/firebase-config.js',
  '/js/firebase-auth.js',
  '/js/auth-google.js',
  '/js/firebase-db.js',
  '/js/rides.js',
  '/js/discover-rides.js',
  '/js/host-ride.js',
  '/js/pwa-install.js',
  '/icons/icon-180.png',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  '/icons/icon-1024.png',
  '/icons/icon-maskable-192.png',
  '/icons/icon-maskable-512.png',
  '/icons/icon-maskable-1024.png',
  '/manifest.json'
];

// ============================================
// INSTALL EVENT - Cache static assets
// ============================================

self.addEventListener('install', (event) => {
  console.log('[SW] Installing service worker...');
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[SW] Caching static assets');
        // Cache critical assets, but don't fail if some are missing
        return cache.addAll(STATIC_ASSETS).catch((err) => {
          console.warn('[SW] Some assets failed to cache:', err);
          // Continue even if some assets fail
          return Promise.resolve();
        });
      })
      .then(() => {
        console.log('[SW] Service worker installed');
        // Force activation of new service worker
        return self.skipWaiting();
      })
  );
});

// ============================================
// ACTIVATE EVENT - Clean up old caches
// ============================================

self.addEventListener('activate', (event) => {
  console.log('[SW] Activating service worker...');
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            // Delete old caches
            if (cacheName !== CACHE_NAME) {
              console.log('[SW] Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log('[SW] Service worker activated');
        // Take control of all pages immediately
        return self.clients.claim();
      })
  );
});

// ============================================
// FETCH EVENT - Network-first with cache fallback
// ============================================

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Skip cross-origin requests (Firebase, CDNs, etc.)
  if (url.origin !== location.origin) {
    return;
  }

  // Skip Firebase Auth redirect handler
  if (url.pathname.includes('/auth-handler.html') || 
      url.pathname.includes('/__/auth/')) {
    return;
  }

  event.respondWith(
    // Network-first strategy for dynamic content
    fetch(request)
      .then((response) => {
        // If network request succeeds, cache and return
        if (response && response.status === 200) {
          const responseToCache = response.clone();
          
          caches.open(CACHE_NAME)
            .then((cache) => {
              cache.put(request, responseToCache);
            });
          
          return response;
        }
        
        // If network fails, try cache
        return caches.match(request);
      })
      .catch(() => {
        // Network failed - try cache
        return caches.match(request)
          .then((cachedResponse) => {
            // If cached response exists, return it
            if (cachedResponse) {
              return cachedResponse;
            }
            
            // If no cache and it's a navigation request, show offline page
            if (request.mode === 'navigate') {
              return caches.match(OFFLINE_PAGE);
            }
            
            // For other requests, return a basic response
            return new Response('Offline', {
              status: 503,
              statusText: 'Service Unavailable',
              headers: new Headers({
                'Content-Type': 'text/plain'
              })
            });
          });
      })
  );
});

// ============================================
// MESSAGE EVENT - Handle updates and cache busting
// ============================================

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    console.log('[SW] Skip waiting message received');
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'CACHE_BUST') {
    console.log('[SW] Cache bust requested');
    caches.delete(CACHE_NAME).then(() => {
      console.log('[SW] Cache cleared');
    });
  }
});

// ============================================
// SYNC EVENT - Background sync (future feature)
// ============================================

self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-rides') {
    event.waitUntil(
      // Future: Sync ride data when back online
      Promise.resolve()
    );
  }
});

// ============================================
// PUSH EVENT - Push notifications (future feature)
// ============================================

self.addEventListener('push', (event) => {
  // Future: Handle push notifications for ride updates
  console.log('[SW] Push notification received:', event);
});

