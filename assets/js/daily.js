/* "Sugerencias del día" without a backend.

   The selection is derived from the date with a stable hash, so every diner
   who opens the menu on the same day sees the same suggestions — and it still
   works offline, since nothing is fetched. Cocina can override any date by
   hand in data/daily.json. */

import { nowIn } from './hours.js';

/** FNV-1a — small, stable across engines, good enough to shuffle a menu. */
function hash(str) {
  let h = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h >>> 0;
}

const gcd = (a, b) => (b ? gcd(b, a % b) : a);

/**
 * How far to step through a pool from one day to the next.
 *
 * Any stride coprime with the pool size walks every dish before repeating one,
 * which is the difference between a rotation and a raffle: drawing each day
 * independently gave the same starter two days running often enough to look
 * broken, and left some dishes never shown at all. Derived from the slot so
 * each one walks its pool in a different order.
 */
function strideFor(seed, size) {
  if (size < 3) return 1;
  for (let i = 0; i < size; i++) {
    const stride = ((seed + i) % (size - 1)) + 1;
    if (gcd(stride, size) === 1) return stride;
  }
  return 1;
}

/** Whole days since the epoch, from a YYYY-MM-DD key. */
function dayNumber(dateKey) {
  const [y, m, d] = dateKey.split('-').map(Number);
  return Math.floor(Date.UTC(y, m - 1, d) / 86_400_000);
}

/** Today's date as YYYY-MM-DD in the restaurant's timezone. */
export function localDateKey(tz) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit'
  }).formatToParts(new Date());
  const get = (type) => parts.find((p) => p.type === type)?.value ?? '';
  return `${get('year')}-${get('month')}-${get('day')}`;
}

/**
 * `kind` says which block a pick belongs to: `featured` are the standing
 * novelties, `rotation` is the menu that changes every day. They are rendered
 * as two separate sections, so keeping them apart matters here.
 *
 * @returns {Array<{kind:'featured'|'rotation', slot:string, label:object, item:object}>}
 */
export function pickOfTheDay(model, config, tz) {
  const dateKey = localDateKey(tz);
  const override = config?.overrides?.[dateKey];
  const picks = config?.rotation?.picks ?? [];
  const salt = String(config?.rotation?.seedSalt ?? 'pyg');
  const excluded = new Set(config?.rotation?.exclude ?? []);
  const chosen = new Set();
  const out = [];

  /* A hand-pinned date wins outright. */
  if (Array.isArray(override?.items) && override.items.length) {
    override.items.forEach((entry, i) => {
      const item = model.byId.get(typeof entry === 'string' ? entry : entry?.id);
      if (!item || chosen.has(item.uid)) return;
      chosen.add(item.uid);
      out.push({ kind: 'rotation', slot: entry?.slot ?? `pinned-${i}`, label: entry?.label ?? picks[i]?.label ?? null, item });
    });
    if (out.length) return out;
  }

  /* `featured` runs every day, ahead of the rotation: it is where a new dish
     or a running promotion lives until the kitchen takes it back out. */
  for (const entry of config?.featured ?? []) {
    const item = model.byId.get(typeof entry === 'string' ? entry : entry?.id);
    if (!item || chosen.has(item.uid)) continue;
    chosen.add(item.uid);
    out.push({ kind: 'featured', slot: entry?.slot ?? 'featured', label: entry?.label ?? null, item });
  }

  for (const pick of picks) {
    const pool = [];
    for (const section of model.sections) {
      if (!pick.from?.includes(section.id)) continue;
      for (const item of section.items) {
        /* Dishes already on show are left out of the pool, not stepped over
           later: three of the ten starters are pinned as `featured`, and
           skipping them made consecutive days land on the same free
           neighbour — the same starter turned up four days running. */
        if (excluded.has(item.id) || chosen.has(item.uid) || !item.variants.length) continue;
        pool.push(item);
      }
    }
    if (!pool.length) continue;

    /* Where the slot starts in its pool never changes; the day is what moves
       it along. Same date, same dish, for every diner and with no backend —
       and every dish in the pool gets its turn before any comes round again. */
    const seed = hash(`${salt}|${pick.slot}`);
    const item = pool[(seed + dayNumber(dateKey) * strideFor(seed, pool.length)) % pool.length];

    chosen.add(item.uid);
    out.push({ kind: 'rotation', slot: pick.slot, label: pick.label ?? null, item });
  }

  return out;
}

/** Human date for the hero eyebrow, in the reader's language. */
export function longDate(lang, tz) {
  const locale = { es: 'es-ES', it: 'it-IT', en: 'en-GB', de: 'de-DE' }[lang] ?? 'es-ES';
  return new Intl.DateTimeFormat(locale, {
    timeZone: tz, weekday: 'long', day: 'numeric', month: 'long'
  }).format(new Date());
}

export { nowIn };
