const CACHE_NAME = "fantasy-tune-v36";
const APP_SHELL = [
  "./",
  "./index.html",
  "./articles.html",
  "./articles/2026-07-10-unfamiliar-song.html",
  "./articles/2026-07-10-night-drive-music-companion.html",
  "./articles/2026-07-10-fantasy-tune-start.html",
  "./privacy.html",
  "./styles.css",
  "./app.js",
  "./manifest.webmanifest",
  "./data/auto-picks.json",
  "./assets/favicon.ico",
  "./assets/favicon-32.png",
  "./assets/apple-touch-icon.png",
  "./assets/icon-192.png",
  "./assets/icon-512.png",
  "./assets/og-image.png",
  "./assets/article-2026-07-10-unfamiliar-song.webp",
  "./assets/article-2026-07-10-night-drive.webp",
  "./assets/article-cover-default.svg",
  "./assets/deepsea-background.webp",
  "./assets/music-wave.svg",
  "./assets/ambient-street-market.webp",
  "./assets/ambient-china-market.webp",
  "./assets/ambient-night-market.webp",
  "./assets/ambient-city-walk.webp",
  "./assets/ambient-taxi-window.webp",
  "./assets/ambient-market-noise.webp",
];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)))),
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  const requestUrl = new URL(event.request.url);
  if (requestUrl.origin !== self.location.origin) return;

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        const responseClone = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, responseClone));
        return response;
      })
      .catch(() => caches.match(event.request)),
  );
});
