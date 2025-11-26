// ============================================
// REVMATE PWA SERVICE WORKER (CLEAN VERSION)
// ============================================

const CACHE_NAME = "revmate-v2";
const OFFLINE_PAGE = "/offline.html";

const STATIC_ASSETS = [
  "/",
  "/index.html",
  OFFLINE_PAGE,
  "/css/styles.css",
  "/css/rides.css",
  "/css/theme.css",
  "/js/script.js",
  "/js/firebase-config.js",
  "/js/firebase-auth.js",
  "/js/auth-google.js",
  "/js/firebase-db.js",
  "/js/rides.js",
  "/js/discover-rides.js",
  "/js/host-ride.js",
  "/js/pwa-install.js",
  "/icons/icon-180.png",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
  "/icons/icon-1024.png",
  "/icons/icon-maskable-192.png",
  "/icons/icon-maskable-512.png",
  "/icons/icon-maskable-1024.png"
];

// ============================================
// INSTALL
// ============================================

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS).catch((err) => {
        console.warn("[SW] Some assets failed to cache:", err);
      });
    }).then(() => self.skipWaiting())
  );
});

// ============================================
// ACTIVATE
// ============================================

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) return caches.delete(key);
        })
      )
    ).then(() => self.clients.claim())
  );
});

// ============================================
// FETCH (Network-first)
// ============================================

self.addEventListener("fetch", (event) => {
  const request = event.request;
  const url = new URL(request.url);

  // Only GET requests are cacheable
  if (request.method !== "GET") return;

  // Skip Firebase/Google/OAuth
  if (
    url.pathname.includes("/__/auth/") ||
    url.pathname.includes("/auth-handler.html") ||
    url.hostname.includes("googleusercontent.com") ||
    url.hostname.includes("accounts.google.com") ||
    url.hostname.includes("firebaseapp.com")
  ) {
    return;
  }

  // Only cache same-origin
  if (url.origin !== location.origin) return;

  event.respondWith(
    fetch(request)
      .then((response) => {
        if (response.ok) {
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, response.clone());
          });
        }
        return response;
      })
      .catch(() =>
        caches.match(request).then((cached) => {
          if (cached) return cached;
          if (request.mode === "navigate") return caches.match(OFFLINE_PAGE);

          return new Response("Offline", { status: 503 });
        })
      )
  );
});

// ============================================
// MESSAGES (update triggers)
// ============================================

self.addEventListener("message", (event) => {
  if (event.data === "SKIP_WAITING") self.skipWaiting();
  if (event.data === "CACHE_BUST") caches.delete(CACHE_NAME);
});
