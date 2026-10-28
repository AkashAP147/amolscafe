// Service Worker for Amol's Cafe PWA & Background Notifications
const CACHE_NAME = 'amols-cafe-v2';
const STATIC_ASSETS = [
  '/manifest.json',
  '/logo.png',
  '/favicon.ico'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS).catch((err) => console.log('Static asset caching notice:', err));
    }).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      // Purge all old caches (including 'amols-cafe-v1')
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            console.log('Purging outdated cache:', key);
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Allow client pages to trigger immediate activation
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// Routing strategy:
// 1. Navigation (HTML pages): ALWAYS Network-First, never serve stale HTML when online
// 2. Images & Static assets: Cache-First for fast rendering
// 3. API & Firebase: Direct Network
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Skip non-GET requests or Firebase Realtime DB websockets/APIs
  if (event.request.method !== 'GET' || url.hostname.includes('firebase') || url.hostname.includes('googleapis')) {
    return;
  }

  // Navigation requests: Always fetch from network so customers always see the newest deployment
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .catch(async () => {
          // If network is completely offline, try cache fallback
          const cache = await caches.open(CACHE_NAME);
          return (await cache.match(event.request)) || (await cache.match('/'));
        })
    );
    return;
  }

  // Cache static image assets (FOOD photos, logos, static images)
  if (url.pathname.match(/\.(png|jpg|jpeg|webp|svg|ico)$/i) || url.pathname.startsWith('/FOOD/')) {
    event.respondWith(
      caches.open(CACHE_NAME).then(async (cache) => {
        const cachedResponse = await cache.match(event.request);
        if (cachedResponse) return cachedResponse;

        try {
          const networkResponse = await fetch(event.request);
          if (networkResponse && networkResponse.status === 200) {
            cache.put(event.request, networkResponse.clone());
          }
          return networkResponse;
        } catch (e) {
          return cachedResponse || Response.error();
        }
      })
    );
    return;
  }

  // Other requests: Network with Cache fallback
  event.respondWith(
    fetch(event.request)
      .catch(() => {
        return caches.match(event.request);
      })
  );
});

// Push notification event for background alerts outside of active browser tab
self.addEventListener('push', (event) => {
  let data = {
    title: "Amol's Cafe Update",
    body: 'Your order status has updated!',
    url: '/menu',
    icon: '/logo.png'
  };

  try {
    if (event.data) {
      data = event.data.json();
    }
  } catch (e) {
    if (event.data) data.body = event.data.text();
  }

  const options = {
    body: data.body,
    icon: data.icon || '/logo.png',
    badge: '/logo.png',
    vibrate: [200, 100, 200, 100, 400],
    data: {
      url: data.url || '/menu'
    },
    actions: [
      { action: 'open', title: 'Open App' }
    ]
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// Notification click event - brings PWA to front or opens target URL
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl = event.notification.data?.url || '/menu';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url && 'focus' in client) {
          client.navigate(targetUrl);
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});
