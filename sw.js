const CACHE_NAME = 'aac-board-v2.8.6'; // 更新版本號

const urlsToCache = [
  './',
  './index.html', // 記得你的 HTML 檔名在 GitHub 上要是小寫的 index.html 喔！
  './manifest.json',
  './icon.png',
  'https://cdn.tailwindcss.com',
  // 下方三個網址已經同步更新為 jsdelivr 的穩定來源
  'https://cdn.jsdelivr.net/npm/react@18.2.0/umd/react.production.min.js',
  'https://cdn.jsdelivr.net/npm/react-dom@18.2.0/umd/react-dom.production.min.js',
  'https://cdn.jsdelivr.net/npm/@babel/standalone@7.23.6/babel.min.js'
];

self.addEventListener('install', event => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      // 確保即使某個檔案載入較慢，也會盡可能把所有檔案抓進手機
      return Promise.all(urlsToCache.map(url => {
        return fetch(url).then(response => {
          if (response.ok || response.type === 'opaque') {
            return cache.put(url, response);
          }
        }).catch(err => console.log('快取失敗的檔案:', url, err));
      }));
    })
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(response => {
      // 離線時：如果有存到檔案，直接回傳
      if (response) return response;
      
      // 有網路時：一邊抓取新檔案，一邊存起來備用
      return fetch(event.request).then(netRes => {
        return caches.open(CACHE_NAME).then(cache => {
          cache.put(event.request, netRes.clone());
          return netRes;
        });
      });
    }).catch(() => console.log('目前處於離線狀態，且無法取得該檔案。'))
  );
});

self.addEventListener('activate', event => {
  // 清除舊版本的快取，確保家長永遠使用最新版
  event.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.map(key => {
        if (key !== CACHE_NAME) return caches.delete(key);
      })
    ))
  );
  self.clients.claim();
});
