const CACHE_NAME = "bearfit-v1";
const SCOPE = self.registration.scope;
const ASSETS = [
  SCOPE,
  new URL("index.html", SCOPE).toString(),
  new URL("manifest.json", SCOPE).toString(),
  new URL("styles.css", SCOPE).toString(),
  new URL("js/achievements_def.js", SCOPE).toString(),
  new URL("storage.js", SCOPE).toString(),
  new URL("data_challenges.js", SCOPE).toString(),
  new URL("challenges_ui.js", SCOPE).toString(),
  new URL("navigation.js", SCOPE).toString(),
  new URL("ui.js", SCOPE).toString(),
  new URL("stats_ui.js", SCOPE).toString(),
  new URL("league_ui.js", SCOPE).toString(),
  new URL("success_ui.js", SCOPE).toString(),
  new URL("combined_ui.js", SCOPE).toString(),
  new URL("session_ui.js", SCOPE).toString(),
  new URL("icons/icon-192.svg", SCOPE).toString(),
  new URL("icons/icon-512.svg", SCOPE).toString()
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
