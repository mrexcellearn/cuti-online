/* Cache app shell saja. Data API tidak pernah di-cache. */
var VERSI = 'cuti-shell-v1';
var SHELL = ['./', './index.html', './tema.css', './gaya.css', './logika.js', './mock.js', './api.js', './app.js', './manifest.webmanifest', './ikon/ikon.svg', './ikon/ikon-192.png'];
self.addEventListener('install', function (e) { e.waitUntil(caches.open(VERSI).then(function (c) { return c.addAll(SHELL); }).then(function () { return self.skipWaiting(); })); });
self.addEventListener('activate', function (e) {
  e.waitUntil(caches.keys().then(function (k) { return Promise.all(k.filter(function (x) { return x !== VERSI; }).map(function (x) { return caches.delete(x); })); }).then(function () { return self.clients.claim(); }));
});
self.addEventListener('fetch', function (e) {
  var u = new URL(e.request.url);
  if (e.request.method !== 'GET' || u.origin !== location.origin) return; // API (POST ke script.google.com) lewat langsung
  e.respondWith(fetch(e.request).then(function (r) {
    var salin = r.clone(); caches.open(VERSI).then(function (c) { c.put(e.request, salin); }); return r;
  }).catch(function () { return caches.match(e.request).then(function (m) { return m || caches.match('./index.html'); }); }));
});
