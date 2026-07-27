/* Offline-first service worker.

   Why it matters here: the restaurant sits in a valley where mobile signal is
   patchy, and diners open the menu from a QR code at the table. Once the shell
   is cached the carte works with no connection at all.

   Same-origin only — cross-origin requests are never touched, let alone
   cached, so a third party can never poison this cache. */

const VERSION = 'pyg-v1';
const SHELL = VERSION + '-shell';
const RUNTIME = VERSION + '-runtime';

const PRECACHE = [
  './',
  'index.html',
  'manifest.webmanifest',
  'assets/css/app.css',
  'assets/css/fonts.css',
  'assets/js/theme-init.js',
  'assets/js/main.js',
  'assets/js/ui.js',
  'assets/js/model.js',
  'assets/js/store.js',
  'assets/js/daily.js',
  'assets/js/hours.js',
  'assets/js/i18n.js',
  'assets/js/dom.js',
  'assets/fonts/fraunces-latin.woff2',
  'assets/fonts/fraunces-latin-ext.woff2',
  'assets/fonts/inter-latin.woff2',
  'assets/fonts/inter-latin-ext.woff2',
  'assets/img/logo.svg',
  'assets/img/icon.svg',
  'assets/img/dishes/focaccia-teror.svg',
  'assets/img/ui/basket.svg',
  'assets/img/ui/check.svg',
  'assets/img/ui/close.svg',
  'assets/img/ui/moon.svg',
  'assets/img/ui/plus.svg',
  'assets/img/ui/search.svg',
  'assets/img/ui/sun.svg',
  'assets/img/ui/whatsapp.svg',
  'assets/img/ui/wine.svg',
  'data/menu.json',
  'data/restaurant.json',
  'data/daily.json'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(SHELL)
      .then((cache) => cache.addAll(PRECACHE))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== SHELL && key !== RUNTIME).map((key) => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  /* Menu data: network first, so a price change shows up as soon as the
     device is online again, with the cached copy as the safety net. */
  if (url.pathname.includes('/data/')) {
    event.respondWith(networkFirst(request));
    return;
  }

  /* Navigations: serve the app shell so deep links work offline. */
  if (request.mode === 'navigate') {
    event.respondWith(
      networkFirst(request).catch(() => caches.match('index.html', { ignoreSearch: true }))
    );
    return;
  }

  event.respondWith(cacheFirst(request));
});

async function cacheFirst(request) {
  const cached = await caches.match(request, { ignoreSearch: false });
  if (cached) return cached;
  const response = await fetch(request);
  if (response.ok && response.type === 'basic') {
    const cache = await caches.open(RUNTIME);
    cache.put(request, response.clone());
  }
  return response;
}

async function networkFirst(request) {
  try {
    const response = await fetch(request);
    if (response.ok && response.type === 'basic') {
      const cache = await caches.open(RUNTIME);
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    const cached = await caches.match(request, { ignoreSearch: request.mode === 'navigate' });
    if (cached) return cached;
    throw error;
  }
}
