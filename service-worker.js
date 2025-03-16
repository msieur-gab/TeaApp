// service-worker.js

const CACHE_NAME = 'tea-timer-v0.3';
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
  './timer-worker.js', // Add the timer worker
  'https://cdn.jsdelivr.net/npm/dexie@3.2.3/dist/dexie.min.js',
  './assets/sounds/notification.mp3',
  './assets/sounds/notification.ogg'
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
  if (event.request.url.endsWith('.json') || event.request.url.endsWith('.cha')) {
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
  
  // For timer-worker.js requests, provide the most current version
  if (event.request.url.includes('timer-worker.js')) {
    event.respondWith(
      caches.open(CACHE_NAME).then((cache) => {
        return cache.match('./timer-worker.js').then((response) => {
          return response || fetch(event.request);
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

// Handle notification click
self.addEventListener('notificationclick', (event) => {
  console.log('[Service Worker] Notification click received', event.notification.tag);
  
  // Close the notification
  event.notification.close();
  
  // Handle different notification types
  let urlToOpen = './';
  
  if (event.notification.tag === 'tea-timer-notification') {
    urlToOpen = './?action=timer-complete';
  }
  
  // Focus on or open a client window
  event.waitUntil(
    clients.matchAll({
      type: 'window',
      includeUncontrolled: true
    })
    .then((clientList) => {
      // Try to focus an existing window
      for (const client of clientList) {
        if (client.url.includes('/TeaApp/') && 'focus' in client) {
          return client.focus();
        }
      }
      
      // If no existing window, open a new one
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});

// Handle messages from the client
self.addEventListener('message', (event) => {
  if (!event.data) return;
  
  // Handle timer notifications
  if (event.data.type === 'TIMER_COMPLETE') {
    const title = 'Tea Timer';
    const teaName = event.data.teaName || 'tea';
    
    // Show a notification with sound
    self.registration.showNotification(title, {
      body: `Your ${teaName} is ready!`,
      icon: './assets/icons/icon-192x192.png',
      badge: './assets/icons/icon-72x72.png',
      vibrate: [200, 100, 200],
      tag: 'tea-timer-notification',
      renotify: true,
      timestamp: Date.now(),
      requireInteraction: true,
      sound: './assets/sounds/notification.mp3'  // Custom notification sound
    });
  }
});

// Handle periodic background sync for PWA
self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'tea-timer-sync') {
    event.waitUntil(syncTimers());
  }
});

// Function to sync timers in the background
async function syncTimers() {
  // This is a placeholder for any timer synchronization code
  // In the future, you could synchronize timer state across devices
  console.log('[Service Worker] Performing timer sync');
  
  // You could retrieve timer states from IndexedDB here
  // For now, we just log that sync happened
  return Promise.resolve();
}
