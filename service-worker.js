const CACHE_NAME = "fantasy-tune-v46";
const APP_SHELL = [
  "./",
  "./index.html",
  "./articles.html",
  "./articles/2026-07-13-shirakawa-air-force-village.html",
  "./articles/2026-07-12-walking-back-to-myself.html",
  "./articles/2026-07-11-every-man-shoulders.html",
  "./articles/2026-07-11-light-through-the-sea.html",
  "./articles/2026-07-11-before-city-wakes.html",
  "./articles/2026-07-10-unfamiliar-song.html",
  "./articles/2026-07-10-night-drive-music-companion.html",
  "./articles/2026-07-10-fantasy-tune-start.html",
  "./privacy.html",
  "./styles.css?v=41",
  "./app.js?v=42",
  "./manifest.webmanifest",
  "./data/auto-picks.json",
  "./assets/favicon.ico",
  "./assets/favicon-32.png",
  "./assets/apple-touch-icon.png",
  "./assets/icon-192.png",
  "./assets/icon-512.png",
  "./assets/og-image.png",
  "./assets/article-2026-07-13-shirakawa-village-01.webp",
  "./assets/article-2026-07-13-shirakawa-village-02.webp",
  "./assets/article-2026-07-13-shirakawa-village-03.webp",
  "./assets/article-2026-07-13-shirakawa-village-04.webp",
  "./assets/article-2026-07-13-shirakawa-village-05.webp",
  "./assets/article-2026-07-13-shirakawa-village-06.webp",
  "./assets/article-2026-07-13-shirakawa-village-07.webp",
  "./assets/article-2026-07-13-shirakawa-village-08.webp",
  "./assets/article-2026-07-13-shirakawa-village-09.webp",
  "./assets/article-2026-07-13-shirakawa-village-10.webp",
  "./assets/article-2026-07-12-walking-back-01.webp",
  "./assets/article-2026-07-12-walking-back-02.webp",
  "./assets/article-2026-07-12-walking-back-03.webp",
  "./assets/article-2026-07-12-walking-back-04.webp",
  "./assets/article-2026-07-12-walking-back-05.webp",
  "./assets/article-2026-07-12-walking-back-06.webp",
  "./assets/article-2026-07-12-walking-back-07.webp",
  "./assets/article-2026-07-12-walking-back-08.webp",
  "./assets/article-2026-07-12-walking-back-09.webp",
  "./assets/article-2026-07-12-walking-back-10.webp",
  "./assets/article-2026-07-12-walking-back-11.webp",
  "./assets/article-2026-07-12-walking-back-12.webp",
  "./assets/article-2026-07-12-walking-back-13.webp",
  "./assets/article-2026-07-12-walking-back-14.webp",
  "./assets/article-2026-07-12-walking-back-15.webp",
  "./assets/article-2026-07-11-every-man-shoulders-01.webp",
  "./assets/article-2026-07-11-every-man-shoulders-02.webp",
  "./assets/article-2026-07-11-light-through-sea-01.webp",
  "./assets/article-2026-07-11-light-through-sea-02.webp",
  "./assets/article-2026-07-11-before-city-wakes.webp",
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
