/**
 * AI Resume & Portfolio Builder - Service Worker
 * PWA 오프라인 캐싱 및 네트워크 전략 관리
 */

const CACHE_NAME = 'resume-builder-pwa-v1';
const PRECACHE_ASSETS = [
  '/',
  '/static/css/style.css',
  '/static/js/app.js',
  '/static/manifest.json',
  '/static/icons/icon-192.png',
  '/static/icons/icon-512.png'
];

// 1. 서비스 워커 설치 시 핵심 정적 자산 캐싱
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_ASSETS);
    }).then(() => self.skipWaiting())
  );
});

// 2. 서비스 워커 활성화 시 이전 버전 캐시 정리
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// 3. 네트워크 요청 가로채기 (Network-First 전략, /generate API는 네트워크 전용)
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Gemini 생성 API 요청 및 POST 요청은 캐시하지 않고 항상 네트워크로 직접 전송
  if (event.request.method !== 'GET' || url.pathname.startsWith('/generate')) {
    event.respondWith(fetch(event.request));
    return;
  }

  // 일반 정적 자산 및 페이지: Network-First (네트워크 우선 시도 후 실패 시 캐시 반환)
  event.respondWith(
    fetch(event.request)
      .then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
          const responseClone = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseClone);
          });
        }
        return networkResponse;
      })
      .catch(() => {
        return caches.match(event.request).then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse;
          }
          if (event.request.mode === 'navigate') {
            return caches.match('/');
          }
        });
      })
  );
});
