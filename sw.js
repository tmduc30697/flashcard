const CACHE_VERSION = 'v23';
const CACHE_NAME = 'flashcard-' + CACHE_VERSION;

// Mọi file tĩnh của app (đường dẫn tương đối so với sw.js)
const PRECACHE = [
  './',
  './index.html',
  './manifest.json',
  './css/style.css',
  './js/app.js',
  './js/store.js',
  './js/ui-list.js',
  './js/sync.js',
  './js/ipa.js',
  './icons/icon.svg',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-maskable-512.png',
  './icons/apple-touch-icon.png',
];

self.addEventListener('install', (event) => {
  // Không tự skipWaiting: chờ trang gửi lệnh SKIP_WAITING
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE.map((u) => new Request(u, { cache: 'reload' }))))
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter((k) => k.startsWith('flashcard-') && k !== CACHE_NAME).map((k) => caches.delete(k)));
    await self.clients.claim();
  })());
});

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') self.skipWaiting();
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  // Mọi file (kể cả HTML) lấy từ cache của đúng phiên bản này để HTML/CSS/JS luôn khớp nhau.
  // Bản mới chỉ đến khi CACHE_VERSION đổi → SW mới cài đặt → người dùng bấm "Cập nhật".
  event.respondWith(cacheFirst(req));
});

async function cacheFirst(req) {
  const cache = await caches.open(CACHE_NAME);
  const isPage = req.mode === 'navigate';
  const cached = await cache.match(isPage ? './index.html' : req, { ignoreSearch: true });
  if (cached) return cached;
  try {
    const res = await fetch(req);
    if (res.ok && !isPage) cache.put(req, res.clone());
    return res;
  } catch {
    return Response.error();
  }
}
