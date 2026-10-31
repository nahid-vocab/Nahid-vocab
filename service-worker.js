const CACHE_NAME = 'vocab-app-v1';
const ASSETS_TO_CACHE = [
    './',
    './index.html',
    './style.css',
    './script.js',
    './manifest.json',
    './data.json',
    './icon-192.png',
    './icon-512.png'
];

// ফাইলগুলো ক্যাশ (সেভ) করে রাখা
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(ASSETS_TO_CACHE);
        })
    );
});

// ইন্টারনেট ছাড়া ক্যাশ থেকে ফাইল লোড করা
self.addEventListener('fetch', (event) => {
    event.respondWith(
        caches.match(event.request).then((response) => {
            return response || fetch(event.request);
        })
    );
});
