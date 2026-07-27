/* Normalises raw menu JSON into the shape the UI renders, so the rendering
   code never has to branch on "is this a pizza, a wine or a plate of pasta". */

import { fold, safeColor, safeId, safeImage } from './dom.js';
import { LANGS, localise } from './i18n.js';

const VARIANT_ORDER = ['single', 'medium', 'large', 'glass', 'bottle'];

function toVariants(price) {
  if (!price || typeof price !== 'object') return [];
  const out = [];
  for (const key of VARIANT_ORDER) {
    const raw = key === 'single' ? price.amount : price[key];
    const amount = typeof raw === 'number' ? raw : (raw && typeof raw.amount === 'number' ? raw.amount : null);
    if (amount != null && Number.isFinite(amount) && amount >= 0) out.push({ key, amount });
  }
  return out;
}

function normaliseItem(raw, section) {
  const id = safeId(raw.id);
  if (!id) return null;

  const variants = toVariants(raw.price);
  const allergens = Array.isArray(raw.allergens) ? raw.allergens.filter((a) => typeof a === 'string') : [];
  const diet = Array.isArray(raw.diet) ? raw.diet.filter((d) => typeof d === 'string') : [];
  const tags = Array.isArray(raw.tags) ? raw.tags.filter((x) => typeof x === 'string') : [];

  return {
    id,
    uid: section.id + ':' + id,
    sectionId: section.id,
    sectionName: section.name,
    accent: section.accent,
    kind: section.kind,
    name: raw.name,
    description: raw.description ?? null,
    meta: raw.meta ?? null,
    variants,
    from: variants.length ? Math.min(...variants.map((v) => v.amount)) : null,
    allergens,
    /* A dish is gluten-free if it says so, or if gluten simply is not in it. */
    diet: diet.includes('glutenfree') || !allergens.includes('gluten') ? [...new Set([...diet, 'glutenfree'])] : diet,
    declaredDiet: diet,
    tags,
    nutrition: raw.nutrition && typeof raw.nutrition === 'object' ? raw.nutrition : null,
    image: safeImage(raw.image),
    pairing: safeId(raw.pairing)
  };
}

export function buildModel(rawMenu) {
  const sections = [];
  const byUid = new Map();
  const byId = new Map();

  for (const rawSection of rawMenu?.sections ?? []) {
    const id = safeId(rawSection.id);
    if (!id || !Array.isArray(rawSection.items)) continue;

    const section = {
      id,
      kind: rawSection.kind === 'drink' ? 'drink' : 'food',
      name: rawSection.name,
      accent: safeColor(rawSection.accent, '#b8441f'),
      extras: Array.isArray(rawSection.extras) ? rawSection.extras : [],
      items: []
    };

    for (const rawItem of rawSection.items) {
      const item = normaliseItem(rawItem, section);
      if (!item) continue;
      section.items.push(item);
      byUid.set(item.uid, item);
      if (!byId.has(item.id)) byId.set(item.id, item);
    }

    if (section.items.length) sections.push(section);
  }

  return { sections, byUid, byId, updated: typeof rawMenu?.updated === 'string' ? rawMenu.updated : null };
}

/**
 * Pre-computes a folded haystack per item.
 *
 * Indexes *every* language, not just the one on screen: a German visitor
 * reading the German carte still types "gnocchi", and a local reading the
 * Spanish one may well type "ravioli". Accents are folded away too, so
 * "noquis" finds "Ñoquis".
 */
export function indexForSearch(model) {
  const index = new Map();
  for (const item of model.byUid.values()) {
    const parts = [];
    for (const lang of LANGS) {
      parts.push(localise(item.name, lang), localise(item.description, lang), localise(item.sectionName, lang));
    }
    parts.push(
      item.meta?.region ?? '',
      (item.meta?.grapes ?? []).join(' '),
      item.allergens.join(' '),
      item.tags.join(' ')
    );
    index.set(item.uid, fold([...new Set(parts)].join(' ')));
  }
  return index;
}

export function matches(item, { query, searchIndex, hideAllergens, requireDiet }) {
  if (query && !(searchIndex.get(item.uid) ?? '').includes(query)) return false;
  for (const allergen of hideAllergens) if (item.allergens.includes(allergen)) return false;
  for (const diet of requireDiet) if (!item.diet.includes(diet)) return false;
  return true;
}

export function formatPrice(amount, lang, currency = 'EUR') {
  return new Intl.NumberFormat(lang === 'en' ? 'en-IE' : lang === 'de' ? 'de-DE' : lang === 'it' ? 'it-IT' : 'es-ES', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2
  }).format(amount);
}
