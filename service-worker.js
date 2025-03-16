// service-worker.js

const CACHE_NAME = 'tea-timer-v0.2';
const URLS_TO_CACHE = [
  './',
  './index.html',
  './manifest.json',
  './css/main.css',
  './css/components.css',
  './css/menu.css',
  './js/app.js',
  './js/db.js',
  './js/nfc-handler.js',
  './js/components/tea-card.js',
  './js/components/tea-timer.js',
  './js/components/tea-menu.js',
  'https://cdn.jsdelivr.net/npm/dexie@3.2.3/dist/dexie.min.js'
];

// Install event - cache assets
self.addEventListener('install', (event) => {
  console.log('[Service Worker] Install');
  
  // Perform install steps
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[Service Worker] Caching app shell');
        return cache.addAll(URLS_TO_CACHE);
      })
      .then(() => {
        return self.skipWaiting();
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Activate');
  
  event.waitUntil(
    caches.keys().then((keyList) => {
      return Promise.all(keyList.map((key) => {
        if (key !== CACHE_NAME) {
          console.log('[Service Worker] Removing old cache', key);
          return caches.delete(key);
        }
      }));
    })
    .then(() => {
      return self.clients.claim();
    })
  );
});

// Fetch event - serve cached content when offline
self.addEventListener('fetch', (event) => {
  // Skip cross-origin requests
  if (!event.request.url.startsWith(self.location.origin) && 
      !event.request.url.startsWith('https://cdn.jsdelivr.net/')) {
    return;
  }
  
  // For JSON data from NFC tags, always go to network
  if (event.request.url.endsWith('.json')) {
    event.respondWith(
      fetch(event.request)
        .catch((error) => {
          console.error('Fetch failed:', error);
          return new Response(JSON.stringify({
            error: 'You are offline and this resource is not cached.'
          }), {
            headers: { 'Content-Type': 'application/json' }
          });
        })
    );
    return;
  }
  
  // For other requests, try network first, then cache
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Check if we received a valid response
        if (!response || response.status !== 200 || response.type !== 'basic') {
          return response;
        }
        
        // Clone the response since the browser will consume it
        const responseToCache = response.clone();
        
        // Update the cache with the new response
        caches.open(CACHE_NAME)
          .then((cache) => {
            cache.put(event.request, responseToCache);
          });
        
        return response;
      })
      .catch(() => {
        // Network request failed, try to serve from cache
        return caches.match(event.request);
      })
  );
});