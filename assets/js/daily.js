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

/** Today's date as YYYY-MM-DD in the restaurant's timezone. */
export function localDateKey(tz) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit'
  }).formatToParts(new Date());
  const get = (type) => parts.find((p) => p.type === type)?.value ?? '';
  return `${get('year')}-${get('month')}-${get('day')}`;
}

/**
 * @returns {Array<{slot:string, label:object, item:object}>}
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
      out.push({ slot: entry?.slot ?? `pinned-${i}`, label: entry?.label ?? picks[i]?.label ?? null, item });
    });
    if (out.length) return out;
  }

  for (const pick of picks) {
    const pool = [];
    for (const section of model.sections) {
      if (!pick.from?.includes(section.id)) continue;
      for (const item of section.items) {
        if (!excluded.has(item.id) && item.variants.length) pool.push(item);
      }
    }
    if (!pool.length) continue;

    /* Deterministic index, stepping forward if that dish is already on show. */
    const seed = hash(`${salt}|${dateKey}|${pick.slot}`);
    let item = null;
    for (let step = 0; step < pool.length; step++) {
      const candidate = pool[(seed + step) % pool.length];
      if (!chosen.has(candidate.uid)) { item = candidate; break; }
    }
    if (!item) continue;

    chosen.add(item.uid);
    out.push({ slot: pick.slot, label: pick.label ?? null, item });
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
