const CACHE_NAME = "routine-runner-v9";
const ASSETS = [
  "./",
  "./index.html",
  "./manifest.json",
  "./assets/iphone_alarm.mp3",
  "./assets/RR.png",
  "./assets/Routine.txt",
];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS)));
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key !== CACHE_NAME)
            .map((key) => caches.delete(key)),
        ),
      ),
  );
  self.clients.claim(); // Immediately control pages
});

self.addEventListener("fetch", (e) => {
  const url = new URL(e.request.url);

  // Only cache GET requests (Cache API doesn't support POST, etc.)
  if (e.request.method !== "GET") {
    return;
  }

  // Cache external dependencies (Firebase, Tailwind, Fonts)
  if (
    url.hostname.includes("tailwindcss.com") ||
    url.hostname.includes("cloudflare.com") ||
    url.hostname.includes("googleapis.com") ||
    url.hostname.includes("gstatic.com") ||
    url.hostname.includes("jsdelivr.net")
  ) {
    e.respondWith(
      caches.open(CACHE_NAME).then(async (cache) => {
        const cached = await cache.match(e.request);
        if (cached) return cached;
        try {
          const fetched = await fetch(e.request);
          // Clone the response because it can only be consumed once
          cache.put(e.request, fetched.clone());
          return fetched;
        } catch (err) {
          // If offline and not in cache, nothing we can do for external resources
          // But usually, they should be cached on the first load
          throw err;
        }
      }),
    );
    return;
  }

  // Local assets: Cache First, fallback to Network
  e.respondWith(
    caches.match(e.request).then((response) => response || fetch(e.request)),
  );
});
