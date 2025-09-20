const CACHE_NAME = "pastelthoughts-cache-v1";
const FILES_TO_CACHE = [
  "./index.html",
  "./login.css",
  "./diary.html",
  "./diary.css",
  "./diary.js",
  "./calendar.js",
  "./profile.js",
  "./manifest.json",
  "./icon.png"
];

// Install
self.addEventListener("install", (event) => {
  console.log("Service Worker installing...");
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(FILES_TO_CACHE);
    })
  );
  self.skipWaiting();
});

// Activate
self.addEventListener("activate", (event) => {
  console.log("Service Worker activated");
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

// Fetch
self.addEventListener("fetch", (event) => {
  event.respondWith(
    fetch(event.request).catch(() => caches.match(event.request))
  );
});
