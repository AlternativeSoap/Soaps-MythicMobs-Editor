/**
 * Service Worker for Soaps MythicMobs Editor
 * Provides offline support, caching, and PWA functionality
 */

const CACHE_NAME = 'mythicmobs-editor-v2.8.0';
const OFFLINE_URL = '404.html';

// Assets to cache immediately on install
const PRECACHE_ASSETS = [
    '/',
    '/index.html',
    '/404.html',
    '/app.js',
    '/manifest.json',
    '/styles/main.css',
    '/styles/components.css',
    '/styles/mode-comparison.css',
    '/assets/favicon.svg',
    // Google Fonts (cache on use)
    // External CDNs cached on fetch
];

// Data files to cache
const DATA_FILES = [
    '/data/mobData.js',
    '/data/templates.js',
    '/data/mechanics.js',
    '/data/targeters.js',
    '/data/triggers.js',
    '/data/conditions/index.js',
    '/data/itemOptions.js',
    '/data/enchantments.js',
];

// Component files to cache
const COMPONENT_FILES = [
    '/components/mobEditor.js',
    '/components/skillEditor.js',
    '/components/itemEditor.js',
    '/components/droptableEditor.js',
    '/components/mechanicBrowser.js',
    '/components/targeterBrowser.js',
    '/components/conditionBrowser.js',
    '/components/triggerBrowser.js',
];

// Install event - precache essential assets
self.addEventListener('install', (event) => {
    console.log('[SW] Installing service worker...');
    
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('[SW] Precaching essential assets');
                return cache.addAll(PRECACHE_ASSETS);
            })
            .then(() => {
                console.log('[SW] Precache complete');
                return self.skipWaiting();
            })
            .catch((error) => {
                console.error('[SW] Precache failed:', error);
            })
    );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
    console.log('[SW] Activating service worker...');
    
    event.waitUntil(
        caches.keys()
            .then((cacheNames) => {
                return Promise.all(
                    cacheNames
                        .filter((name) => name !== CACHE_NAME)
                        .map((name) => {
                            console.log('[SW] Deleting old cache:', name);
                            return caches.delete(name);
                        })
                );
            })
            .then(() => {
                console.log('[SW] Claiming clients');
                return self.clients.claim();
            })
    );
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
    const { request } = event;
    const url = new URL(request.url);
    
    // Skip non-GET requests
    if (request.method !== 'GET') {
        return;
    }
    
    // Skip cross-origin requests except for specific CDNs
    if (url.origin !== location.origin) {
        // Cache Google Fonts and CDN resources
        if (url.hostname.includes('fonts.googleapis.com') ||
            url.hostname.includes('fonts.gstatic.com') ||
            url.hostname.includes('cdnjs.cloudflare.com') ||
            url.hostname.includes('cdn.jsdelivr.net')) {
            event.respondWith(cacheFirst(request));
        }
        return;
    }
    
    // For navigation requests (HTML pages)
    if (request.mode === 'navigate') {
        event.respondWith(networkFirst(request));
        return;
    }
    
    // For CSS, JS, and image files - cache first
    if (request.destination === 'style' ||
        request.destination === 'script' ||
        request.destination === 'image') {
        event.respondWith(cacheFirst(request));
        return;
    }
    
    // Default: network first
    event.respondWith(networkFirst(request));
});

/**
 * Cache-first strategy
 * Best for static assets that rarely change
 */
async function cacheFirst(request) {
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
        // Return cached version, but update cache in background
        updateCache(request);
        return cachedResponse;
    }
    
    try {
        const networkResponse = await fetch(request);
        if (networkResponse.ok) {
            const cache = await caches.open(CACHE_NAME);
            cache.put(request, networkResponse.clone());
        }
        return networkResponse;
    } catch (error) {
        console.error('[SW] Fetch failed:', error);
        return new Response('Offline', { status: 503 });
    }
}

/**
 * Network-first strategy  
 * Best for dynamic content and HTML pages
 */
async function networkFirst(request) {
    try {
        const networkResponse = await fetch(request);
        if (networkResponse.ok) {
            const cache = await caches.open(CACHE_NAME);
            cache.put(request, networkResponse.clone());
        }
        return networkResponse;
    } catch (error) {
        const cachedResponse = await caches.match(request);
        if (cachedResponse) {
            return cachedResponse;
        }
        
        // Return offline page for navigation requests
        if (request.mode === 'navigate') {
            const offlinePage = await caches.match(OFFLINE_URL);
            if (offlinePage) {
                return offlinePage;
            }
        }
        
        return new Response('Offline', { status: 503 });
    }
}

/**
 * Update cache in background (stale-while-revalidate)
 */
async function updateCache(request) {
    try {
        const networkResponse = await fetch(request);
        if (networkResponse.ok) {
            const cache = await caches.open(CACHE_NAME);
            cache.put(request, networkResponse.clone());
        }
    } catch (error) {
        // Silently fail - we already have a cached version
    }
}

// Handle messages from the main app
self.addEventListener('message', (event) => {
    if (event.data === 'skipWaiting') {
        self.skipWaiting();
    }
    
    if (event.data === 'clearCache') {
        caches.delete(CACHE_NAME).then(() => {
            console.log('[SW] Cache cleared');
        });
    }
    
    if (event.data.type === 'CACHE_URLS') {
        const urls = event.data.payload;
        caches.open(CACHE_NAME).then((cache) => {
            cache.addAll(urls);
        });
    }
});

// Background sync for offline saves
self.addEventListener('sync', (event) => {
    if (event.tag === 'sync-data') {
        event.waitUntil(syncData());
    }
});

async function syncData() {
    // This would sync localStorage data to Supabase when back online
    // Implementation depends on your sync strategy
    console.log('[SW] Background sync triggered');
}

// Push notifications (future feature)
self.addEventListener('push', (event) => {
    if (!event.data) return;
    
    const data = event.data.json();
    const options = {
        body: data.body || 'New notification',
        icon: '/assets/favicon.svg',
        badge: '/assets/favicon-32.png',
        vibrate: [100, 50, 100],
        data: {
            url: data.url || '/'
        }
    };
    
    event.waitUntil(
        self.registration.showNotification(data.title || 'MythicMobs Editor', options)
    );
});

self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    
    event.waitUntil(
        clients.openWindow(event.notification.data.url)
    );
});

console.log('[SW] Service worker loaded');
