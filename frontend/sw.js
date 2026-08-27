// 네트워크 우선(network-first) 전략: 온라인 상태에서는 항상 서버의 최신 파일을 쓰고,
// 요청이 실패할 때만(오프라인 등) 캐시된 이전 버전으로 대체한다. 캐시 우선 방식은 개발 중
// 파일을 고쳐도 화면에 반영되지 않는 혼란을 일으키고, 실제 배포 후에도 작업자가 앱을 완전히
// 지우기 전까지 예전 코드를 계속 쓰게 되는 위험이 있어 이 방식으로 바꿨다.
var CACHE_NAME = 'xrg1-ipr-scanner-v2';
var APP_SHELL = [
  './',
  './index.html',
  './css/style.css',
  './manifest.json',
  './icons/icon.svg',
  './js/app.js'
];

self.addEventListener('install', function (event) {
  event.waitUntil(caches.open(CACHE_NAME).then(function (cache) { return cache.addAll(APP_SHELL); }));
  self.skipWaiting();
});

self.addEventListener('activate', function (event) {
  event.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(keys.filter(function (key) { return key !== CACHE_NAME; }).map(function (key) { return caches.delete(key); }));
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', function (event) {
  if (event.request.method !== 'GET') return;
  event.respondWith(
    fetch(event.request)
      .then(function (response) {
        var copy = response.clone();
        caches.open(CACHE_NAME).then(function (cache) { cache.put(event.request, copy); });
        return response;
      })
      .catch(function () { return caches.match(event.request); })
  );
});
