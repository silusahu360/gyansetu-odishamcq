// GyanSetu Odisha - offline cache (use only when the app is hosted on https, e.g. GitHub Pages)
const CACHE = "gyansetu-v1";
const APP_URL = new URL("app.html", self.registration.scope).href;

self.addEventListener("install", function (e) {
  e.waitUntil(
    caches.open(CACHE)
      .then(function (c) { return c.addAll([APP_URL]).catch(function () {}); })
      .then(function () { return self.skipWaiting(); })
  );
});

self.addEventListener("activate", function (e) {
  e.waitUntil(
    caches.keys()
      .then(function (ks) { return Promise.all(ks.filter(function (k) { return k !== CACHE; }).map(function (k) { return caches.delete(k); })); })
      .then(function () { return self.clients.claim(); })
  );
});

self.addEventListener("fetch", function (e) {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.protocol.indexOf("http") !== 0) return;
  if (url.pathname.endsWith("version.json")) return; // update check must always use the network
  const key = url.origin + url.pathname; // ignore ?t=... cache-busting
  e.respondWith(
    fetch(req).then(function (res) {
      if (res && res.ok) {
        const copy = res.clone();
        caches.open(CACHE).then(function (c) { c.put(key, copy); });
      }
      return res;
    }).catch(function () {
      return caches.match(key).then(function (r) {
        return r || (req.mode === "navigate" ? caches.match(APP_URL) : undefined);
      });
    })
  );
});
