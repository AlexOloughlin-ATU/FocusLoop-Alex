const CACHE_NAME = "focusloop-v2";
const APP_SHELL = [
  "/",
  "/index.html",
  "/dashboard.html",
  "/css/styles.css",
  "/js/auth.js",
  "/js/dashboard.js",
  "/manifest.json",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
  "/icons/icon-192-maskable.png",
  "/icons/icon-512-maskable.png"
];

// Install: cache app shell
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL))
  );
  self.skipWaiting();
});

// Activate: clean old caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.map((k) => (k !== CACHE_NAME ? caches.delete(k) : null)))
    )
  );
  self.clients.claim();
});

// Fetch strategy:
// - For navigation (pages): network first, fallback to cache
// - For static assets: cache first
self.addEventListener("fetch", (event) => {
  const req = event.request;
  const url = new URL(req.url);

  // Only handle same-origin
  if (url.origin !== location.origin) return;

  // HTML navigation: network-first
  if (req.mode === "navigate") {
    event.respondWith(
      fetch(req).catch(() => caches.match("/dashboard.html").then(r => r || caches.match("/index.html")))
    );
    return;
  }

  // Static: cache-first
  event.respondWith(
    caches.match(req).then((cached) => cached || fetch(req))
  );
});