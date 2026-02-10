const CACHE_NAME = "roster-cuti-v4"; // ⬅️ Naikkan versi kalau update SW
const FILES_TO_CACHE = [
  "/",
  "/index.html",
  "/manifest.json",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
  "/icons/efek2.png",
];

// Install: cache app shell
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(FILES_TO_CACHE);
    }),
  );
  self.skipWaiting();
});

// Activate: hapus cache lama
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.map((k) => {
          if (k !== CACHE_NAME) {
            return caches.delete(k);
          }
        }),
      ),
    ),
  );
  event.waitUntil(self.clients.claim());
});

// Fetch handler
self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  const url = new URL(event.request.url);

  // 🔴 JANGAN cache API Google Apps Script (biar data selalu fresh)
  if (url.hostname.includes("script.google.com")) {
    event.respondWith(
      fetch(event.request).catch(() => {
        // Kalau offline, balikin JSON kosong (atau bisa kamu ganti sesuai kebutuhan)
        return new Response(JSON.stringify([]), {
          headers: { "Content-Type": "application/json" },
        });
      }),
    );
    return;
  }

  // � Network-first untuk HTML (development mode - lihat perubahan langsung)
  if (event.request.mode === "navigate") {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          // Cache new version jika berhasil fetch
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, response.clone());
          });
          return response;
        })
        .catch(() => {
          // Fallback ke cache kalau offline
          return caches.match(event.request);
        }),
    );
    return;
  }

  // 🟢 Cache-first untuk file statis (icon, dll)
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }

      return fetch(event.request)
        .then((networkResponse) => {
          return caches.open(CACHE_NAME).then((cache) => {
            try {
              cache.put(event.request, networkResponse.clone());
            } catch (e) {
              // abaikan error cache (misal cross-origin)
            }
            return networkResponse;
          });
        })
        .catch(() => {
          // Fallback kalau offline
          return caches.match("/");
        });
    }),
  );
});

// Push Notification
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

// Klik notifikasi
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
  // optional
});
