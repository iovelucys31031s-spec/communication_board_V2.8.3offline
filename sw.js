const CACHE_NAME = 'aac-board-v2.8.3-cache';

// 需要在離線時也能存取的資源列表
const urlsToCache = [
  './',
  './index.html',
  './manifest.json',
  // 快取外部函式庫，確保斷網時依然能載入
  'https://cdn.tailwindcss.com',
  'https://unpkg.com/react@18/umd/react.production.min.js',
  'https://unpkg.com/react-dom@18/umd/react-dom.production.min.js',
  'https://unpkg.com/@babel/standalone/babel.min.js'
];

// 安裝 Service Worker 並快取資源
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
  );
  self.skipWaiting();
});

// 攔截網路請求：如果快取有就用快取，沒有再去網路上抓
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // 快取有命中，直接回傳
        if (response) {
          return response;
        }
        return fetch(event.request).then(
          function(response) {
            // 檢查是否為有效的請求
            if(!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }
            // 若為新的資源，將其動態加入快取
            var responseToCache = response.clone();
            caches.open(CACHE_NAME)
              .then(function(cache) {
                cache.put(event.request, responseToCache);
              });
            return response;
          }
        );
      })
  );
});

// 更新 Service Worker 時清除舊的快取
self.addEventListener('activate', event => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});