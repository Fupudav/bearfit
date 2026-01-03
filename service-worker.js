const CACHE_NAME = "bearfit-v1";
const ASSETS = [
  "/bearfit/",
  "/bearfit/index.html",
  "/bearfit/manifest.json",
  "/bearfit/styles.css",
  "/bearfit/js/achievements_def.js",
  "/bearfit/storage.js",
  "/bearfit/data_challenges.js",
  "/bearfit/challenges_ui.js",
  "/bearfit/navigation.js",
  "/bearfit/ui.js",
  "/bearfit/stats_ui.js",
  "/bearfit/league_ui.js",
  "/bearfit/success_ui.js",
  "/bearfit/combined_ui.js",
  "/bearfit/session_ui.js",
  "/bearfit/icons/icon-192.svg",
  "/bearfit/icons/icon-512.svg"
];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS)));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.map((k) => (k !== CACHE_NAME ? caches.delete(k) : null)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches.match(event.request).then((cached) => cached || fetch(event.request))
  );
});
