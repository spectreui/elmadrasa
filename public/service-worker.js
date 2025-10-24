// public/service-worker.js - FIXED VERSION
const CACHE_NAME = "elmadrasa-v1.0.1";

// Only cache essential files that definitely exist
const urlsToCache = [
  "/",
  "/index.html",
  "/manifest.json",
  // Remove any assets that might not exist or cause issues
];

self.addEventListener("install", (event) => {
  console.log("[SW] Installing service worker...");
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log("[SW] Opened cache");
        
        // Use Promise.allSettled to handle individual request failures
        return Promise.allSettled(
          urlsToCache.map(url => 
            cache.add(url).catch(error => {
              console.warn(`[SW] Failed to cache ${url}:`, error);
              return null; // Don't fail the entire install if one file fails
            })
          )
        ).then(results => {
          const successful = results.filter(r => r.status === 'fulfilled').length;
          const failed = results.filter(r => r.status === 'rejected').length;
          console.log(`[SW] Cache results: ${successful} successful, ${failed} failed`);
        });
      })
      .then(() => self.skipWaiting()) // ✅ Activate immediately
      .catch(error => {
        console.error("[SW] Cache installation failed:", error);
        // Still skip waiting even if cache fails
        self.skipWaiting();
      })
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
    ).then(() => {
      console.log("[SW] Claiming clients...");
      return self.clients.claim(); // ✅ Take control of open tabs immediately
    })
  );
});

self.addEventListener("fetch", (event) => {
  // Only handle GET requests
  if (event.request.method !== 'GET') return;

  // For API calls or external resources, don't use cache
  if (event.request.url.includes('/api/') || 
      event.request.url.includes('google') ||
      event.request.url.includes('facebook') ||
      event.request.url.includes('analytics')) {
    return fetch(event.request);
  }

  event.respondWith(
    caches.match(event.request)
      .then((cachedResponse) => {
        // If found in cache, return it
        if (cachedResponse) {
          console.log(`[SW] Serving from cache: ${event.request.url}`);
          return cachedResponse;
        }

        // Otherwise fetch from network
        console.log(`[SW] Fetching from network: ${event.request.url}`);
        return fetch(event.request)
          .then((response) => {
            // Check if we received a valid response
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }

            // Clone the response to cache it
            const responseToCache = response.clone();
            
            caches.open(CACHE_NAME)
              .then((cache) => {
                cache.put(event.request, responseToCache)
                  .then(() => {
                    console.log(`[SW] Cached new resource: ${event.request.url}`);
                  })
                  .catch(cacheError => {
                    console.warn(`[SW] Failed to cache: ${event.request.url}`, cacheError);
                  });
              });

            return response;
          })
          .catch((fetchError) => {
            console.warn(`[SW] Network request failed: ${event.request.url}`, fetchError);
            
            // For navigation requests, return the homepage
            if (event.request.mode === 'navigate') {
              return caches.match('/')
                .then(homepage => homepage || new Response('Network error'));
            }
            
            return new Response('Network error', {
              status: 408,
              statusText: 'Network error'
            });
          });
      })
  );
});

self.addEventListener("message", (event) => {
  console.log("[SW] Message received:", event.data);
  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});

console.log("[SW] Service worker script loaded successfully");