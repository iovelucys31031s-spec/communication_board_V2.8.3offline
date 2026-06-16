const CACHE_NAME = 'aac-board-v2.8.4'; // 更新版本號

// 網頁需要的所有檔案與外部資源
const urlsToCache = [
  './',
  './index.html',
  './manifest.json',
  './icon.png',
  'https://cdn.tailwindcss.com',
  'https://unpkg.com/react@18/umd/react.production.min.js',
  'https://unpkg.com/react-dom@18/umd/react-dom.production.min.js',
  'https://unpkg.com/@babel/standalone/babel.min.js'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      console.log('開始快取資源...');
      // 強制將外部 CDN 資源抓下來存進手機
      return Promise.all(urlsToCache.map(url => {
        return fetch(url, { mode: 'no-cors' }).then(response => {
          if (response.ok || response.type === 'opaque') {
            return cache.put(url, response);
          }
        }).catch(error => console.log('資源快取失敗:', url, error));
      }));
    })
  );
  self.skipWaiting();
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(response => {
      if (response) return response; // 如果手機裡有存，就直接用手機裡的

      // 如果沒存到，就試著去網路抓，抓到順便存起來
      return fetch(event.request).then(networkResponse => {
        if (!networkResponse || (networkResponse.status !== 200 && networkResponse.type !== 'opaque')) {
          return networkResponse;
        }
        const responseToCache = networkResponse.clone();
        caches.open(CACHE_NAME).then(cache => {
          cache.put(event.request, responseToCache);
        });
        return networkResponse;
      }).catch(error => {
        console.log('目前處於離線狀態，且該資源未快取。', error);
      });
    })
  );
});

// 清除舊版快取
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('清除舊快取:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});
