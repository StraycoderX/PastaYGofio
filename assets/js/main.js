import { $, $$ } from './dom.js';
import { DEFAULT_LANG, LANGS, t } from './i18n.js';
import { buildModel, indexForSearch } from './model.js';
import { Tray, read, readSession, write, writeSession } from './store.js';
import {
  applyStaticText, renderDaily, renderDish, renderFilterChips, renderFooter,
  renderMenu, renderRail, renderStatus, renderTray, toast
} from './ui.js';

const app = {
  lang: DEFAULT_LANG,
  query: '',
  filters: { diet: new Set(), allergens: new Set() },
  model: null,
  searchIndex: null,
  restaurant: null,
  daily: null,
  /** Table number for this sitting, or null when we simply do not know. */
  table: null,
  tableFromQr: false,
  tray: new Tray()
};

/* Table numbers come off the QR taped to the table: /?mesa=7. Kept short and
   alphanumeric so nothing else can ride in on the query string — the value
   ends up in a WhatsApp message and on screen. */
const TABLE_RE = /^[A-Za-z0-9-]{1,8}$/;

function pickTable() {
  const params = new URLSearchParams(location.search);
  const fromQr = params.get('mesa') ?? params.get('table');

  if (fromQr && TABLE_RE.test(fromQr)) {
    app.table = fromQr.toUpperCase();
    app.tableFromQr = true;
    writeSession('table', app.table);
    writeSession('tableFromQr', '1');
    return;
  }

  const saved = readSession('table');
  if (saved && TABLE_RE.test(saved)) {
    app.table = saved.toUpperCase();
    app.tableFromQr = readSession('tableFromQr') === '1';
  }
}

/* ------------------------------------------------------------------ *
 * boot
 * ------------------------------------------------------------------ */

/** True when the page was produced by scripts/build-single-file.mjs. */
const isSingleFile = () => !!document.querySelector('script[type="application/json"][id^="data:"]');

async function loadJson(path) {
  const inline = document.getElementById('data:' + path);
  if (inline) return JSON.parse(inline.textContent);

  const res = await fetch(path, { credentials: 'omit' });
  if (!res.ok) throw new Error(`${path}: HTTP ${res.status}`);
  return res.json();
}

async function boot() {
  app.lang = pickLang();
  pickTable();

  let menu, restaurant, daily;
  try {
    [menu, restaurant, daily] = await Promise.all([
      loadJson('data/menu.json'),
      loadJson('data/restaurant.json'),
      loadJson('data/daily.json')
    ]);
  } catch (error) {
    console.error(error);
    $('#menu').textContent = 'No se ha podido cargar la carta. / Could not load the menu.';
    return;
  }

  app.model = buildModel(menu);
  app.restaurant = restaurant;
  app.daily = daily;
  app.tray.reconcile(app.model);

  restoreFilters();
  renderRail(app);
  renderAll();
  wire();

  app.tray.onChange(() => renderTray(app));
  setInterval(() => renderStatus(app), 60_000);

  openFromUrl();
  registerServiceWorker();
}

function renderAll() {
  app.searchIndex = indexForSearch(app.model);
  applyStaticText(app);
  renderFilterChips(app);
  renderDaily(app);
  refreshMenu();
  renderStatus(app);
  renderFooter(app);
}

/* Cards are rebuilt from scratch, so the tray highlight and the scroll-spy
   observer have to be re-bound to the new nodes every time. */
function refreshMenu() {
  renderMenu(app);
  renderTray(app);
  observeSections();
}

/* ------------------------------------------------------------------ *
 * language & theme
 * ------------------------------------------------------------------ */

function pickLang() {
  const fromUrl = new URLSearchParams(location.search).get('lang');
  if (LANGS.includes(fromUrl)) return fromUrl;
  const saved = read('lang');
  if (LANGS.includes(saved)) return saved;
  const browser = (navigator.language || DEFAULT_LANG).slice(0, 2).toLowerCase();
  return LANGS.includes(browser) ? browser : DEFAULT_LANG;
}

function setLang(lang) {
  if (!LANGS.includes(lang) || lang === app.lang) return;
  app.lang = lang;
  write('lang', lang);

  const url = new URL(location.href);
  url.searchParams.set('lang', lang);
  nav('replaceState', url);

  renderAll();
}

function setTheme(theme) {
  document.documentElement.dataset.theme = theme;
  write('theme', theme);
  $('#themeToggle').setAttribute('aria-pressed', String(theme === 'dark'));
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.content = theme === 'dark' ? '#15120e' : '#faf6ec';
}

/* ------------------------------------------------------------------ *
 * filters
 * ------------------------------------------------------------------ */

function restoreFilters() {
  const saved = read('filters', null);
  if (!saved) return;
  for (const key of Array.isArray(saved.diet) ? saved.diet : []) app.filters.diet.add(String(key));
  for (const key of Array.isArray(saved.allergens) ? saved.allergens : []) app.filters.allergens.add(String(key));
}

function persistFilters() {
  write('filters', { diet: [...app.filters.diet], allergens: [...app.filters.allergens] });
}

function toggleFilter(group, key) {
  const set = app.filters[group];
  if (set.has(key)) set.delete(key); else set.add(key);
  persistFilters();
  renderFilterChips(app);
  refreshMenu();
}

/* ------------------------------------------------------------------ *
 * dish dialog
 * ------------------------------------------------------------------ */

const dialog = () => $('#dishDialog');

/* Deep links are a nicety, not load-bearing: inside a sandboxed frame the
   History API throws, and a dish that opens without updating the URL is far
   better than one that does not open at all. */
function nav(method, url) {
  try { history[method]({}, '', url); } catch { /* sandboxed — keep going */ }
}

function openDish(uid, { push = true } = {}) {
  const item = renderDish(app, uid);
  if (!item) return;
  if (!dialog().open) dialog().showModal();
  if (push) {
    const url = new URL(location.href);
    url.searchParams.set('dish', item.id);
    nav('pushState', url);
  }
}

function closeDish({ pop = true } = {}) {
  if (dialog().open) dialog().close();
  const url = new URL(location.href);
  if (pop && url.searchParams.has('dish')) {
    url.searchParams.delete('dish');
    nav('pushState', url);
  }
}

function openFromUrl() {
  const id = new URLSearchParams(location.search).get('dish');
  if (!id) return;
  const item = app.model.byId.get(id);
  if (item) openDish(item.uid, { push: false });
}

/* ------------------------------------------------------------------ *
 * tray panel
 * ------------------------------------------------------------------ */

function setTrayOpen(open) {
  const tray = $('#tray');
  const scrim = $('#scrim');
  tray.classList.toggle('is-open', open);
  scrim.classList.toggle('is-open', open);
  scrim.hidden = !open;
  tray.setAttribute('aria-hidden', String(!open));
  $('#trayToggle').setAttribute('aria-expanded', String(open));
  document.body.classList.toggle('is-locked', open);
  if (open) $('#trayClose').focus();
}

/* ------------------------------------------------------------------ *
 * events
 * ------------------------------------------------------------------ */

function wire() {
  setTheme(document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light');

  /* one delegated listener for every data-attribute driven control */
  document.addEventListener('click', (event) => {
    const target = event.target instanceof Element ? event.target : null;
    if (!target) return;

    const add = target.closest('[data-add]');
    if (add) {
      const step = Number(add.dataset.step ?? 1);
      const first = !app.tray.has(add.dataset.add);
      app.tray.add(add.dataset.add, add.dataset.variant, step);
      if (step > 0 && first) toast(t('added', app.lang));
      return;
    }

    const open = target.closest('[data-open]');
    if (open) { openDish(open.dataset.open); return; }

    if (target.closest('[data-close="dish"]')) { closeDish(); return; }

    const share = target.closest('[data-share-dish]');
    if (share) { shareUrl(share.dataset.shareDish); return; }

    const chip = target.closest('.chip');
    if (chip) {
      if (chip.dataset.diet) toggleFilter('diet', chip.dataset.diet);
      else if (chip.dataset.allergen) toggleFilter('allergens', chip.dataset.allergen);
      return;
    }

    const lang = target.closest('.lang__btn');
    if (lang) { setLang(lang.dataset.lang); return; }

    const rail = target.closest('.rail__link');
    if (rail) { markRail(rail.dataset.rail); return; }
  });

  $('#themeToggle').addEventListener('click', () => {
    setTheme(document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark');
  });

  $('#trayToggle').addEventListener('click', () => setTrayOpen(!$('#tray').classList.contains('is-open')));
  $('#trayClose').addEventListener('click', () => setTrayOpen(false));
  $('#scrim').addEventListener('click', () => setTrayOpen(false));
  $('#trayClear').addEventListener('click', () => { app.tray.clear(); refreshMenu(); });

  $('#traySend').addEventListener('click', (event) => {
    if ($('#traySend').getAttribute('aria-disabled') === 'true') event.preventDefault();
  });

  /* search */
  /* table number — the one field the diner may need to correct */
  const table = $('#tableInput');
  table.value = app.table ?? '';
  table.addEventListener('input', () => {
    const value = table.value.trim();
    const valid = value === '' || TABLE_RE.test(value);
    table.setAttribute('aria-invalid', String(!valid));
    if (!valid) return;
    app.table = value ? value.toUpperCase() : null;
    app.tableFromQr = false;
    writeSession('table', app.table);
    writeSession('tableFromQr', '');
    renderTray(app);
  });

  const search = $('#searchInput');
  let debounce = 0;
  search.addEventListener('input', () => {
    clearTimeout(debounce);
    debounce = setTimeout(() => {
      app.query = search.value;
      $('#searchClear').hidden = !search.value;
      refreshMenu();
    }, 120);
  });
  $('#searchClear').addEventListener('click', () => {
    search.value = '';
    app.query = '';
    $('#searchClear').hidden = true;
    refreshMenu();
    search.focus();
  });

  /* filters panel */
  const filterToggle = $('#filterToggle');
  filterToggle.addEventListener('click', () => {
    const open = filterToggle.getAttribute('aria-expanded') !== 'true';
    filterToggle.setAttribute('aria-expanded', String(open));
    $('#filters').hidden = !open;
  });
  $('#filterReset').addEventListener('click', () => {
    app.filters.diet.clear();
    app.filters.allergens.clear();
    persistFilters();
    renderFilterChips(app);
    refreshMenu();
  });

  /* dialog */
  dialog().addEventListener('close', () => {
    const url = new URL(location.href);
    if (url.searchParams.has('dish')) { url.searchParams.delete('dish'); nav('replaceState', url); }
  });
  dialog().addEventListener('click', (event) => {
    if (event.target === dialog()) closeDish();
  });

  window.addEventListener('popstate', () => {
    const id = new URLSearchParams(location.search).get('dish');
    if (id) {
      const item = app.model.byId.get(id);
      if (item) { openDish(item.uid, { push: false }); return; }
    }
    if (dialog().open) dialog().close();
  });

  /* footer actions */
  $('#shareBtn').addEventListener('click', () => shareUrl(null));
  $('#printBtn').addEventListener('click', () => window.print());

  /* scroll chrome */
  const toTop = $('#toTop');
  toTop.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
  const onScroll = () => {
    const y = window.scrollY;
    $('#masthead').classList.toggle('is-stuck', y > 8);
    toTop.hidden = y < 600;
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  trackMastheadHeight();

  /* keyboard */
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && $('#tray').classList.contains('is-open')) {
      setTrayOpen(false);
      return;
    }
    if (event.key === '/' && !/^(INPUT|TEXTAREA)$/.test(document.activeElement?.tagName ?? '')) {
      event.preventDefault();
      search.focus();
    }
  });

  installPrompt();
}

/* The masthead wraps to two rows on narrow screens, so the sticky toolbar
   offset and scroll-padding are driven by its measured height. */
function trackMastheadHeight() {
  const masthead = $('#masthead');
  const apply = () => document.documentElement.style.setProperty('--masthead-h', `${masthead.offsetHeight}px`);
  apply();
  if ('ResizeObserver' in window) new ResizeObserver(apply).observe(masthead);
  else window.addEventListener('resize', apply, { passive: true });
}

/* ------------------------------------------------------------------ *
 * scroll spy
 * ------------------------------------------------------------------ */

let observer = null;

function markRail(id) {
  for (const link of $$('.rail__link')) {
    const active = link.dataset.rail === id;
    link.classList.toggle('is-active', active);
    if (active) link.scrollIntoView({ block: 'nearest', inline: 'center', behavior: 'smooth' });
  }
}

function observeSections() {
  observer?.disconnect();
  const visible = new Map();

  observer = new IntersectionObserver((entries) => {
    for (const entry of entries) visible.set(entry.target.dataset.section, entry.isIntersecting ? entry.intersectionRatio : 0);
    let best = null;
    let bestRatio = 0;
    for (const [id, ratio] of visible) if (ratio > bestRatio) { best = id; bestRatio = ratio; }
    if (best) markRail(best);
  }, { rootMargin: '-180px 0px -55% 0px', threshold: [0, 0.15, 0.4, 0.75] });

  for (const section of $$('.section')) observer.observe(section);
}

/* ------------------------------------------------------------------ *
 * share + install + service worker
 * ------------------------------------------------------------------ */

async function shareUrl(dishId) {
  const url = new URL(location.href);
  url.searchParams.set('lang', app.lang);
  if (dishId) url.searchParams.set('dish', dishId);
  else url.searchParams.delete('dish');
  /* never hand your table number to whoever you share the menu with */
  url.searchParams.delete('mesa');
  url.searchParams.delete('table');

  const payload = { title: document.title, url: url.toString() };
  try {
    if (navigator.share) { await navigator.share(payload); return; }
    await navigator.clipboard.writeText(payload.url);
    toast(t('linkCopied', app.lang));
  } catch { /* user dismissed the share sheet */ }
}

function installPrompt() {
  let deferred = null;
  const button = $('#installBtn');

  window.addEventListener('beforeinstallprompt', (event) => {
    event.preventDefault();
    deferred = event;
    button.hidden = false;
  });

  button.addEventListener('click', async () => {
    if (!deferred) return;
    button.hidden = true;
    deferred.prompt();
    deferred = null;
  });
}

function registerServiceWorker() {
  /* Nothing to cache in the single-file build — it is already one document. */
  if (!('serviceWorker' in navigator) || location.protocol === 'file:' || isSingleFile()) return;

  const register = () => navigator.serviceWorker
    .register('sw.js')
    .catch((error) => console.warn('SW registration failed', error));

  /* boot() awaits the data fetches, so by the time we get here `load` has
     usually already fired — listening for it would silently never register. */
  if (document.readyState === 'complete') register();
  else window.addEventListener('load', register, { once: true });
}

boot();
