// lulz-sec.com — Service Worker
// Caches core pages and assets for offline access

const CACHE_NAME = 'lulz-sec-v1';
const CACHE_VERSION = '1.0.0';

// Core assets to cache immediately on install
const CORE_ASSETS = [
  '/',
  '/index.html',
  '/zero-day.html',
  '/archive.html',
  '/legends.html',
  '/foia.html',
  '/white-hat.html',
  '/media.html',
  '/community.html',
  '/about.html',
  '/css/style.css',
  '/js/main.js',
  '/images/og-image.svg',
  '/data/feed.json',
  '/data/podcasts.json',
  '/archive/sabu.html',
  '/archive/topiary.html',
  '/archive/tflow.html',
  '/archive/kayla.html',
  '/archive/pwnsauce.html',
  '/archive/avunit.html',
  '/legends/snowden.html',
  '/legends/assange.html',
  '/legends/swartz.html',
  '/legends/manning.html',
  '/legends/mitnick.html',
  '/legends/hammond.html',
  '/legends/barrett-brown.html',
  '/legends/ulbricht.html',
];

// ─── INSTALL ──────────────────────────────────────────────────────────────────
self.addEventListener('install', (event) => {
  console.log('[SW] Installing lulz-sec service worker v' + CACHE_VERSION);
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[SW] Caching core assets');
      return cache.addAll(CORE_ASSETS);
    }).then(() => {
      console.log('[SW] Install complete');
      return self.skipWaiting();
    }).catch((err) => {
      console.log('[SW] Cache failed:', err);
    })
  );
});

// ─── ACTIVATE ─────────────────────────────────────────────────────────────────
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => {
            console.log('[SW] Deleting old cache:', name);
            return caches.delete(name);
          })
      );
    }).then(() => {
      console.log('[SW] Activated — claiming clients');
      return self.clients.claim();
    })
  );
});

// ─── FETCH ────────────────────────────────────────────────────────────────────
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Only handle same-origin requests
  if (url.origin !== location.origin) return;

  // Network-first for data files — always want fresh feed
  if (url.pathname.startsWith('/data/')) {
    event.respondWith(networkFirst(request));
    return;
  }

  // Cache-first for static assets
  if (
    url.pathname.startsWith('/css/') ||
    url.pathname.startsWith('/js/') ||
    url.pathname.startsWith('/images/')
  ) {
    event.respondWith(cacheFirst(request));
    return;
  }

  // Stale-while-revalidate for HTML pages
  event.respondWith(staleWhileRevalidate(request));
});

// ─── STRATEGIES ───────────────────────────────────────────────────────────────

// Network first — try network, fall back to cache
async function networkFirst(request) {
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch {
    const cached = await caches.match(request);
    return cached || offlineFallback();
  }
}

// Cache first — serve from cache, update in background
async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch {
    return offlineFallback();
  }
}

// Stale while revalidate — serve cache immediately, update in background
async function staleWhileRevalidate(request) {
  const cache = await caches.open(CACHE_NAME);
  const cached = await cache.match(request);

  const fetchPromise = fetch(request).then((networkResponse) => {
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  }).catch(() => null);

  return cached || fetchPromise || offlineFallback();
}

// Offline fallback
function offlineFallback() {
  return new Response(`
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>LULZ-SEC.COM — Offline</title>
      <style>
        body { background: #030b03; color: #00ff41; font-family: 'Courier New', monospace; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; text-align: center; }
        h1 { font-size: 48px; letter-spacing: 4px; margin-bottom: 16px; }
        p { color: #008f24; font-size: 14px; letter-spacing: 2px; }
        .dash { color: #ff2d2d; }
      </style>
    </head>
    <body>
      <div>
        <h1>LULZ<span class="dash">-</span>SEC</h1>
        <p>You are offline.</p>
        <p>The lulz will return when you reconnect.</p>
        <p style="margin-top:24px;color:#003b0e;">you cannot arrest an idea.</p>
      </div>
    </body>
    </html>
  `, {
    headers: { 'Content-Type': 'text/html' }
  });
}

// ─── BACKGROUND SYNC ──────────────────────────────────────────────────────────
// Update feed cache when back online
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-feed') {
    event.waitUntil(
      fetch('/data/feed.json').then((response) => {
        if (response.ok) {
          return caches.open(CACHE_NAME).then((cache) => {
            return cache.put('/data/feed.json', response);
          });
        }
      }).catch(() => {
        console.log('[SW] Sync failed — will retry');
      })
    );
  }
});
