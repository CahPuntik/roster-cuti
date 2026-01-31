self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('push', function(event) {
  let data = {};
  try { data = event.data.json(); } catch (e) { data = { title: 'Pengingat Cuti', body: event.data && event.data.text ? event.data.text() : '' }; }
  const title = data.title || 'Pengingat Cuti';
  const options = {
    body: data.body || '',
    icon: data.icon || 'icons/icon-192.png',
    badge: data.badge || 'icons/icon-192.png',
    data: data
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = (event.notification.data && event.notification.data.url) || '/';
  event.waitUntil(
    self.clients.matchAll({ type: 'window' }).then((clientsArr) => {
      for (const client of clientsArr) {
        if (client.url === url && 'focus' in client) {
          return client.focus();
        }
      }
      if (self.clients.openWindow) return self.clients.openWindow(url);
    })
  );
});

self.addEventListener('notificationclose', (event) => {
  // Optional: handle close
});
