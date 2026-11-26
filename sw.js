/* Offline caching for this small, fully static prototype. */
const CACHE = "png-adventure-v0.20";
const ASSETS = [
  "./", "./index.html", "./style.css", "./src/core.js", "./src/level.js", "./src/art.js", "./src/game.js",
  "./manifest.webmanifest", "./assets/icon.svg", "./assets/player/atlas.png",
  "./coast/", "./coast/index.html", "./coast/style.css", "./coast/level.js", "./coast/player/character.js", "./coast/player/animator.js", "./coast/player/controller.js", "./coast/world/platforms.js", "./coast/world/canoes.js", "./coast/world/breakaways.js", "./coast/world/nets.js", "./coast/world/interactions.js", "./coast/input/touch.js", "./coast/sprites.js", "./coast/environment/parallax.js", "./coast/environment/water.js", "./coast/environment/village.js", "./coast/environment/vegetation.js", "./coast/environment/wildlife.js", "./coast/environment/feedback.js", "./coast/environment/render-budget.js", "./coast/audio/sound.js", "./coast/game.js",
  "./coast/player/", "./coast/player/index.html", "./coast/player/workshop.js"
];
self.addEventListener("install", function (event) {
  event.waitUntil(caches.open(CACHE).then(function (cache) { return cache.addAll(ASSETS); })
    .then(function () { return self.skipWaiting(); }));
});
self.addEventListener("activate", function (event) {
  event.waitUntil(caches.keys().then(function (keys) {
    return Promise.all(keys.filter(function (name) {
      return name.startsWith("png-adventure-") && name !== CACHE;
    }).map(function (name) { return caches.delete(name); }));
  }).then(function () { return self.clients.claim(); }));
});
self.addEventListener("fetch", function (event) {
  const request = event.request;
  if (request.method !== "GET" || new URL(request.url).origin !== self.location.origin) return;
  if (request.mode === "navigate") {
    event.respondWith(fetch(request).catch(function () {
      const u=new URL(request.url);
      return caches.match(u.pathname.includes("/coast")?"./coast/index.html":"./index.html");
    }));
    return;
  }
  event.respondWith(caches.match(request).then(function (hit) {
    return hit || fetch(request).then(function (response) {
      if (response.ok) {
        const copy = response.clone();
        caches.open(CACHE).then(function (cache) { return cache.put(request, copy); });
      }
      return response;
    });
  }));
});
