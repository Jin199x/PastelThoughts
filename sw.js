self.addEventListener("install", e => {
  e.waitUntil(
    caches.open("pastelthoughts-cache").then(cache => {
      return cache.addAll([
        "./",
        "./index.html",
        "./login.css",
        "./diary.html",
        "./diary.css",
        "./diary.js",
        "./calendar.js",
        "./profile.js"
      ]);
    })
  );
});

self.addEventListener("fetch", e => {
  e.respondWith(
    caches.match(e.request).then(response => {
      return response || fetch(e.request);
    })
  );
});
