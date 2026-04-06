/**
 * Service Worker — Formosa ESG 2026 Minimal Offline Support
 * Scope: /projects/formosa-esg-2026/
 *
 * Strategy:
 *   _astro/* (hashed assets) → cache-first (immutable)
 *   HTML pages             → network-first, fallback to cache
 *   API requests           → network-only
 *   Uncached offline       → offline fallback page
 */

const CACHE_NAME = 'formosa-v1';
const OFFLINE_URL = '/offline.html';

// Install: cache the offline fallback page
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.add(OFFLINE_URL))
  );
  self.skipWaiting();
});

// Activate: clean old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Skip non-GET requests
  if (event.request.method !== 'GET') return;

  // API requests → network-only, never cache
  if (url.hostname === 'api.paulkuo.tw' || url.pathname.startsWith('/api/')) return;

  // External resources (CDN, LINE SDK, etc.) → let browser handle
  if (url.origin !== self.location.origin) return;

  // _astro/* hashed assets → cache-first (immutable content-hash filenames)
  if (url.pathname.startsWith('/_astro/')) {
    event.respondWith(
      caches.match(event.request).then((cached) => {
        if (cached) return cached;
        return fetch(event.request).then((response) => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          }
          return response;
        });
      })
    );
    return;
  }

  // Static assets (images, manifest, favicon) → cache-first
  if (url.pathname.startsWith('/images/') || url.pathname === '/manifest.json' || url.pathname === '/favicon.png') {
    event.respondWith(
      caches.match(event.request).then((cached) => {
        if (cached) return cached;
        return fetch(event.request).then((response) => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          }
          return response;
        });
      })
    );
    return;
  }

  // HTML pages under formosa paths → network-first, fallback to cache, then offline page
  // Only cache formosa-related pages, not the entire paulkuo.tw site
  const isFormosaPage = url.pathname.includes('/projects/formosa-esg-2026/') || url.pathname.includes('/formosa');
  if (event.request.headers.get('Accept')?.includes('text/html') && isFormosaPage) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          }
          return response;
        })
        .catch(() =>
          caches.match(event.request).then((cached) => cached || caches.match(OFFLINE_URL))
        )
    );
    return;
  }
});
