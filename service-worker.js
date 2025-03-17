// service-worker.js
// A simplified but robust service worker implementation for Tea App

const CACHE_NAME = 'tea-timer-v0.5.5';
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
  './js/services/notification-service.js',
  './js/services/timer-service.js',
  './js/services/wake-lock-service.js',
  './timer-worker.js'
];

// Media files that need special handling
const MEDIA_FILES = [
  './assets/sounds/notification.mp3',
  './assets/sounds/notification.ogg'
];

// Install event - cache assets
self.addEventListener('install', (event) => {
  console.log('[Service Worker] Installing');
  
  event.waitUntil(
    Promise.all([
      // Cache regular app files
      caches.open(CACHE_NAME)
        .then(cache => {
          console.log('[Service Worker] Caching app shell');
          return cache.addAll(URLS_TO_CACHE);
        }),
      
      // Cache media files separately with special handling
      caches.open(CACHE_NAME)
        .then(cache => {
          const mediaPromises = MEDIA_FILES.map(url => {
            return fetch(url, { mode: 'no-cors', cache: 'reload' })
              .then(response => {
                if (!response) throw new Error('Empty response');
                return cache.put(url, response);
              })
              .catch(error => {
                console.error(`[Service Worker] Failed to cache media file ${url}:`, error);
                // Continue even if media file caching fails
                return Promise.resolve();
              });
          });
          
          return Promise.allSettled(mediaPromises);
        })
    ])
    .then(() => self.skipWaiting())
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Activating');
  
  event.waitUntil(
    caches.keys()
      .then(keyList => {
        return Promise.all(keyList.map(key => {
          if (key !== CACHE_NAME) {
            console.log('[Service Worker] Removing old cache', key);
            return caches.delete(key);
          }
        }));
      })
      .then(() => self.clients.claim())
  );
});

// Fetch event - serve cached content when offline
self.addEventListener('fetch', (event) => {
  // Skip cross-origin requests
  if (!event.request.url.startsWith(self.location.origin)) return;
  
  // Special handling for media files
  if (MEDIA_FILES.some(file => event.request.url.includes(file))) {
    event.respondWith(
      caches.match(event.request)
        .then(cachedResponse => {
          if (cachedResponse) {
            return cachedResponse;
          }
          
          return fetch(event.request)
            .then(response => {
              // Cache the fetched response
              const responseToCache = response.clone();
              caches.open(CACHE_NAME)
                .then(cache => {
                  cache.put(event.request, responseToCache);
                });
              
              return response;
            })
            .catch(error => {
              console.error('[Service Worker] Fetch failed:', error);
              // Return a basic empty audio response as fallback
              return new Response(null, {
                status: 200,
                headers: { 'Content-Type': 'audio/mpeg' }
              });
            });
        })
    );
    return;
  }
  
  // For other requests, use a cache-first strategy
  event.respondWith(
    caches.match(event.request)
      .then(cachedResponse => {
        if (cachedResponse) {
          return cachedResponse;
        }
        
        return fetch(event.request)
          .then(response => {
            // Don't cache non-successful responses or non-GET requests
            if (!response || response.status !== 200 || event.request.method !== 'GET') {
              return response;
            }
            
            // Cache the new response
            const responseToCache = response.clone();
            caches.open(CACHE_NAME)
              .then(cache => {
                cache.put(event.request, responseToCache);
              });
            
            return response;
          })
          .catch(error => {
            console.error('[Service Worker] Fetch failed:', error);
            if (event.request.url.endsWith('.json')) {
              return new Response(JSON.stringify({
                error: 'You are offline and this resource is not cached.'
              }), {
                headers: { 'Content-Type': 'application/json' }
              });
            }
          });
      })
  );
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  console.log('[Service Worker] Notification click received');
  
  event.notification.close();
  
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then(clientList => {
        // Focus an existing window if available
        for (const client of clientList) {
          if (client.url.includes('/TeaApp/') && 'focus' in client) {
            return client.focus();
          }
        }
        
        // Otherwise open a new window
        if (clients.openWindow) {
          return clients.openWindow('./');
        }
      })
  );
});

// Handle messages from the client
self.addEventListener('message', (event) => {
  if (!event.data) return;
  
  // Handle timer notification request
  if (event.data.type === 'TIMER_COMPLETE') {
    const title = 'Tea Timer';
    const teaName = event.data.teaName || 'tea';
    
    console.log(`[Service Worker] Showing notification for tea: ${teaName}`);
    
    // First tell clients to play sound
    self.clients.matchAll().then(clients => {
      clients.forEach(client => {
        client.postMessage({
          type: 'PLAY_NOTIFICATION_SOUND',
          timestamp: Date.now()
        });
      });
      
      // Then show the notification
      self.registration.showNotification(title, {
        body: `Your ${teaName} is ready!`,
        icon: './assets/icons/icon-192x192.png',
        badge: './assets/icons/icon-72x72.png',
        vibrate: [200, 100, 200, 100, 200],
        tag: 'tea-timer-notification',
        renotify: true,
        requireInteraction: true
      })
      .catch(error => {
        console.error('[Service Worker] Failed to show notification:', error);
      });
    });
  }
});
