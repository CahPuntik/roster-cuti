const CACHE_NAME = "roster-cuti-v2";
const FILES_TO_CACHE = [
  "/",
  "/index.html",
  "/manifest.json",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
  "/icons/efek2.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(FILES_TO_CACHE)),
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.map((k) => {
          if (k !== CACHE_NAME) return caches.delete(k);
        }),
      ),
    ),
  );
  event.waitUntil(self.clients.claim());
});

self.addEventListener("fetch", (event) => {
  // Simple cache-first strategy for app shell
  if (event.request.method !== "GET") return;

  // Network-first for API requests to ensure fresh data
  if (event.request.url.includes('script.google.com')) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          // Optionally cache the response for offline use, but not for freshness
          return response;
        })
        .catch(() => caches.match(event.request) || caches.match('/index.html'))
    );
    return;
  }

  event.respondWith(
    caches.match(event.request).then(
      (resp) =>
        resp ||
        fetch(event.request)
          .then((r) => {
            // Put a copy in cache for future requests
            return caches.open(CACHE_NAME).then((cache) => {
              try {
                cache.put(event.request, r.clone());
              } catch (e) {
                /* ignore */
              }
              return r;
            });
          })
          .catch(() => caches.match("/index.html")),
    ),
  );
});

// Push / Notification handlers (keep existing behavior if using push)
self.addEventListener("push", function (event) {
  let data = {};
  try {
    data = event.data.json();
  } catch (e) {
    data = {
      title: "Pengingat Cuti",
      body: event.data && event.data.text ? event.data.text() : "",
    };
  }
  const title = data.title || "Pengingat Cuti";
  const options = {
    body: data.body || "",
    icon: data.icon || "icons/icon-192.png",
    badge: data.badge || "icons/icon-192.png",
    data: data,
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = (event.notification.data && event.notification.data.url) || "/";
  event.waitUntil(
    self.clients.matchAll({ type: "window" }).then((clientsArr) => {
      for (const client of clientsArr) {
        if (client.url === url && "focus" in client) {
          return client.focus();
        }
      }
      if (self.clients.openWindow) return self.clients.openWindow(url);
    }),
  );
});

self.addEventListener("notificationclose", (event) => {
  // Optional: handle close
});
