// sw.js

// Define a cache name and the list of URLs to cache
const CACHE_NAME = 'les-studies-cache-v1';
const urlsToCache = [
    '/',                     // Root of your site
    '/index.html',           // Your main HTML file
    '/styles.css',           // Your stylesheet
    '/script.js',            // Your main JavaScript file for Le's Studies
    '/studies.json',         // Your studies JSON file
    '/data'
    // Add any additional assets (images, fonts, etc.) here
];

// The install event – cache all required assets.
self.addEventListener('install', event => {
    console.log('[ServiceWorker] Install');
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('[ServiceWorker] Caching app shell');
                return cache.addAll(urlsToCache);
            })
    );
    // Activate service worker immediately after installation.
    self.skipWaiting();
});

// The activate event – clean up old caches.
self.addEventListener('activate', event => {
    console.log('[ServiceWorker] Activate');
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    if (cacheName !== CACHE_NAME) {
                        console.log('[ServiceWorker] Deleting old cache:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
    // Claim clients so that the SW controls all pages immediately.
    self.clients.claim();
});

// The fetch event – respond with cached assets if available, or fetch from the network.
self.addEventListener('fetch', event => {
    // You might add custom handling here for API calls.
    event.respondWith(
        caches.match(event.request)
            .then(response => {
                // Return the cached response if found.
                if (response) {
                    return response;
                }
                // Otherwise, fetch the resource from the network.
                return fetch(event.request);
            })
    );
});
