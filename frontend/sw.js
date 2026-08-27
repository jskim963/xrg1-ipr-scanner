// 파일럿 범위 내 의도된 선택: 캐시 우선(cache-first) 전략이라 배포 후에도 기존 사용자는
// CACHE_NAME을 수동으로 올려 캐시를 무효화하기 전까지 이전 버전을 계속 사용하게 된다.
// 업데이트 알림/자동 새로고침 로직은 파일럿 범위에서 제외(오프라인 큐잉/재시도와 동일한 판단).
// 배포자는 index.html/js 등 앱 셸 파일을 수정할 때마다 아래 버전 문자열을 반드시 올릴 것.
var CACHE_NAME = 'xrg1-ipr-scanner-v1';
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
    caches.match(event.request).then(function (cached) { return cached || fetch(event.request); })
  );
});
