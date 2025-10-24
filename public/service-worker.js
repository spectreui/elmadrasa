// public/service-worker.js

const CACHE_NAME = "elmadrasa-v1.0.0";
const urlsToCache = [
  "/",
  "/index.html",
  "/manifest.json",
  // Add any additional static files you want cached:
  // "/assets/icons/icon-192.png",
  // "/assets/icons/icon-512.png",
];

self.addEventListener("install", (event) => {
  console.log("[SW] Installing service worker...");
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(urlsToCache))
      .then(() => self.skipWaiting()) // ✅ Activate immediately
  );
});

self.addEventListener("activate", (event) => {
  console.log("[SW] Activating service worker...");
  event.waitUntil(
    caches.keys().then((cacheNames) =>
      Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log("[SW] Deleting old cache:", cacheName);
            return caches.delete(cacheName);
          }
        })
      )
    )
  );
  self.clients.claim(); // ✅ Take control of open tabs immediately
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  // For API calls, don't cache (avoid stale data)
  if (event.request.url.includes("/api/")) {
    return fetch(event.request);
  }

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        // ✅ Return cached version, but update it in the background
        fetch(event.request).then((response) => {
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, response.clone());
          });
        });
        return cachedResponse;
      }

      // Not cached — fetch and store
      return fetch(event.request)
        .then((response) => {
          const cloned = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, cloned);
          });
          return response;
        })
        .catch(() => {
          // Offline fallback: return index.html for navigations
          if (event.request.mode === "navigate") {
            return caches.match("/");
          }
        });
    })
  );
});

self.addEventListener("message", (event) => {
  // ✅ Support for "skip waiting" when a new SW is available
  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});
