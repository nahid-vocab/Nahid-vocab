const CACHE_NAME = 'vocab-app-v1';
const urlsToCache = [
    'index.html',
    'style.css',
    'script.js',
    'manifest.json',
    'database/data.json'
];

// ফাইলগুলো ফোনে সেভ (Cache) করা
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => cache.addAll(urlsToCache))
    );
});

// ইন্টারনেট ছাড়া ফাইলগুলো লোড করা
self.addEventListener('fetch', event => {
    event.respondWith(
        caches.match(event.request)
            .then(response => {
                return response || fetch(event.request);
            })
    );
});