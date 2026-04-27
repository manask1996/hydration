const CACHE_NAME = 'droplet-v1';
const ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  'https://fonts.googleapis.com/css2?family=Syne:wght@400;700;800&family=DM+Sans:wght@300;400;500&display=swap'
];

// Install — cache core assets
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

// Activate — clean old caches
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Fetch — cache-first for assets, network-first for GIFs
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);

  // Always go network for GIFs and external APIs
  if (url.hostname.includes('giphy') || url.hostname.includes('fonts.g')) {
    e.respondWith(
      fetch(e.request).catch(() => caches.match(e.request))
    );
    return;
  }

  // Cache-first for everything else
  e.respondWith(
    caches.match(e.request).then(cached => {
      if (cached) return cached;
      return fetch(e.request).then(response => {
        if (response.ok) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(e.request, clone));
        }
        return response;
      });
    })
  );
});

// Push notifications (for alarm reminders)
self.addEventListener('push', e => {
  const data = e.data ? e.data.json() : { title: 'droplet 💧', body: "time to drink! don't forget to hydrate." };
  e.waitUntil(
    self.registration.showNotification(data.title || 'droplet 💧', {
      body: data.body || "time to drink!",
      icon: '/icons/icon-192.png',
      badge: '/icons/icon-192.png',
      vibrate: [200, 100, 200],
      tag: 'hydration-reminder',
      renotify: true,
      actions: [
        { action: 'log250', title: '💧 log 250ml' },
        { action: 'snooze', title: '⏰ snooze 10min' }
      ]
    })
  );
});

self.addEventListener('notificationclick', e => {
  e.notification.close();
  if (e.action === 'log250') {
    e.waitUntil(clients.openWindow('/?action=log250'));
  } else {
    e.waitUntil(clients.openWindow('/'));
  }
});
