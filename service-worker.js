const CACHE_NAME = "bearfit-v1";
const SCOPE = self.registration.scope.replace(/\/$/, "");
const ASSET_PATHS = [
  "",
  "index.html",
  "manifest.json",
  "styles.css",
  "js/achievements_def.js",
  "storage.js",
  "data_challenges.js",
  "challenges_ui.js",
  "navigation.js",
  "ui.js",
  "stats_ui.js",
  "league_ui.js",
  "success_ui.js",
  "combined_ui.js",
  "session_ui.js",
  "icons/icon-192.svg",
  "icons/icon-512.svg",
];
const ASSETS = ASSET_PATHS.map((path) =>
  path ? `${SCOPE}/${path}` : `${SCOPE}/`
);

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
