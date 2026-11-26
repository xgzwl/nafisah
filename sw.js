/* Nafisah Shrine service worker — offline fallback, version-string safe.
   Strategy:
     - navigation/HTML: network-first, cache fallback (so ?v= bumps take effect)
     - images/fonts: cache-first (immutable, one-year cache upstream)
     - css/js/html-assets: stale-while-revalidate (?v= makes URLs versioned)
     - API / agent routes: never cached
   Bump CACHE when shipping new static assets. */
"use strict";

var CACHE = "nafisah-v20261126g";
var CORE = [
  "/index.html",
  "/manifest.webmanifest",
  "/icon.svg"
];

function isApi(url) {
  return url.pathname.indexOf("/api/") === 0 ||
    url.pathname === "/chat" || url.pathname === "/stop" ||
    url.pathname.indexOf("/agents/") === 0;
}
function nonCacheable(request) {
  if (request.method !== "GET") return true;
  var url = new URL(request.url);
  if (url.origin !== self.location.origin) return true;
  return isApi(url);
}
function isImmutable(url) {
  return url.pathname.indexOf("/assets/img/") === 0 || url.pathname.indexOf("/assets/fonts/") === 0;
}

self.addEventListener("install", function (event) {
  event.waitUntil(
    caches.open(CACHE).then(function (cache) {
      return cache.addAll(CORE).catch(function () {});
    }).then(function () { return self.skipWaiting(); })
  );
});

self.addEventListener("activate", function (event) {
  event.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(keys.map(function (key) {
        if (key.indexOf("nafisah-v") === 0 && key !== CACHE) return caches.delete(key);
        return undefined;
      }));
    }).then(function () { return self.clients.claim(); })
  );
});

self.addEventListener("fetch", function (event) {
  var request = event.request;
  if (nonCacheable(request)) return;

  var url = new URL(request.url);
  var isNavigation = request.mode === "navigate" ||
    (request.headers.get("accept") || "").indexOf("text/html") >= 0;

  if (isNavigation) {
    event.respondWith(
      fetch(request).then(function (response) {
        var copy = response.clone();
        caches.open(CACHE).then(function (cache) { cache.put(request, copy); });
        return response;
      }).catch(function () {
        return caches.match(request).then(function (cached) {
          return cached || caches.match("/index.html");
        });
      })
    );
    return;
  }

  if (isImmutable(url)) {
    event.respondWith(
      caches.match(request).then(function (cached) {
        if (cached) return cached;
        return fetch(request).then(function (response) {
          var copy = response.clone();
          caches.open(CACHE).then(function (cache) { cache.put(request, copy); });
          return response;
        });
      })
    );
    return;
  }

  // css / js / manifest / icon: network-first with cache fallback.
  // JS must be fresh — main.js has no ?v= token, so a stale-while-revalidate
  // cache would pin an old build (e.g. missing features) until next bump.
  event.respondWith(
    fetch(request).then(function (response) {
      var copy = response.clone();
      caches.open(CACHE).then(function (cache) { cache.put(request, copy); });
      return response;
    }).catch(function () {
      return caches.match(request);
    })
  );
});
