/* Offline-first service worker.

   Why it matters here: the restaurant sits in a valley where mobile signal is
   patchy, and diners open the menu from a QR code at the table. Once the shell
   is cached the carte works with no connection at all.

   Same-origin only — cross-origin requests are never touched, let alone
   cached, so a third party can never poison this cache. */

/* SUBE ESTE NÚMERO cada vez que cambie el CSS, el JavaScript o el index.
   Las hojas de estilo y los módulos se sirven desde caché primero (ver
   cacheFirst más abajo), así que a quien ya tenga la carta instalada no le
   llega nada nuevo hasta que este identificador cambia: el navegador solo
   reinstala el service worker cuando este archivo es distinto. Sin subirlo,
   un visitante que vuelve se queda con el diseño viejo y el index nuevo —
   la peor mezcla posible. */
const VERSION = 'pyg-v9';
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
      /* `cache: 'reload'` es imprescindible, no un detalle. Sin él estas
         peticiones pasan por el caché HTTP del navegador, que acaba de
         guardarse la versión anterior — GitHub Pages las sirve con diez
         minutos de validez —, así que el service worker nuevo se precachearía
         los archivos viejos y el rediseño no llegaría nunca. Comprobado:
         subir VERSION sin esto deja las fotos con el recorte antiguo. */
      .then((cache) => cache.addAll(PRECACHE.map((path) => new Request(path, { cache: 'reload' }))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== SHELL && key !== RUNTIME).map((key) => caches.delete(key))))
      .then(() => self.clients.claim())
      .then(warmDishPhotos)
  );
});

/**
 * Pull the dish photos into the runtime cache once the shell is live.
 *
 * They are deliberately *not* in PRECACHE: `cache.addAll` is atomic, so one
 * flaky request out of fifty would fail the whole install and leave the diner
 * with no offline menu at all. Here each photo is fetched on its own and a
 * failure costs nothing — the menu already works, the photo just arrives on
 * the next visit.
 */
async function warmDishPhotos() {
  try {
    const response = await fetch('data/menu.json', { cache: 'no-cache' });
    if (!response.ok) return;
    const menu = await response.json();
    const cache = await caches.open(RUNTIME);

    const files = [];
    for (const section of menu.sections ?? []) {
      for (const item of section.items ?? []) {
        if (typeof item.image === 'string' && /^[a-z0-9][a-z0-9._-]*$/i.test(item.image)) {
          files.push('assets/img/dishes/' + item.image);
        }
      }
    }

    /* a few at a time, so warming never competes with the page itself */
    for (let i = 0; i < files.length; i += 4) {
      await Promise.all(files.slice(i, i + 4).map(async (path) => {
        if (await cache.match(path)) return;
        try {
          const res = await fetch(path);
          if (res.ok && res.type === 'basic') await cache.put(path, res);
        } catch { /* offline or missing — try again next activation */ }
      }));
    }
  } catch { /* nothing to warm */ }
}

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
