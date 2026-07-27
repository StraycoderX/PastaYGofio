#!/usr/bin/env node
/* Validates the menu data before it can reach a diner.
 *
 * The carte is edited by hand by people who are not developers, and a typo in
 * an allergen key is a food-safety problem, not a cosmetic one. This runs in
 * CI and blocks the deploy. */

import { readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const LANGS = ['es', 'it', 'en', 'de'];

const ALLERGENS = new Set([
  'gluten', 'lactose', 'eggs', 'nuts', 'soy', 'peanuts', 'fish',
  'crustaceans', 'mollusks', 'sesame', 'mustard', 'celery', 'sulfites', 'lupin'
]);
const DIETS = new Set(['vegetarian', 'vegan', 'spicy', 'glutenfree']);
const PRICE_KEYS = new Set(['amount', 'medium', 'large', 'glass', 'bottle']);
const ID = /^[a-z0-9][a-z0-9-]*$/;
const HEX = /^#[0-9a-f]{6}$/i;
const TIME = /^([01]\d|2[0-3]):[0-5]\d$/;

const errors = [];
const warnings = [];
const fail = (msg) => errors.push(msg);
const warn = (msg) => warnings.push(msg);

const load = (file) => JSON.parse(readFileSync(join(ROOT, file), 'utf8'));

/** name/description must carry every language, or a diner sees a blank. */
function checkI18n(value, where, { required = true, allowString = false } = {}) {
  if (value == null) {
    if (required) fail(`${where}: missing`);
    return;
  }
  if (typeof value === 'string') {
    if (!allowString) fail(`${where}: expected a {lang: text} object`);
    else if (!value.trim()) fail(`${where}: empty`);
    return;
  }
  if (typeof value !== 'object') return fail(`${where}: expected object, got ${typeof value}`);
  for (const lang of LANGS) {
    if (typeof value[lang] !== 'string' || !value[lang].trim()) fail(`${where}: missing "${lang}"`);
  }
}

/* ------------------------------------------------------------------ menu */

const menu = load('data/menu.json');
const itemIds = new Map();
const sectionIds = new Set();
const pairingRefs = [];

if (!Array.isArray(menu.sections) || !menu.sections.length) fail('menu.json: sections must be a non-empty array');

for (const [si, section] of (menu.sections ?? []).entries()) {
  const where = `menu.sections[${si}]`;
  if (!ID.test(section.id ?? '')) fail(`${where}: bad id "${section.id}"`);
  if (sectionIds.has(section.id)) fail(`${where}: duplicate section id "${section.id}"`);
  sectionIds.add(section.id);

  if (!HEX.test(section.accent ?? '')) fail(`${where} (${section.id}): accent must be a 6-digit hex colour`);
  if (!['food', 'drink'].includes(section.kind)) fail(`${where} (${section.id}): kind must be "food" or "drink"`);
  checkI18n(section.name, `${where} (${section.id}).name`);

  if (!Array.isArray(section.items) || !section.items.length) {
    fail(`${where} (${section.id}): items must be a non-empty array`);
    continue;
  }

  for (const [ii, item] of section.items.entries()) {
    const at = `${section.id}[${ii}] "${item.id ?? '?'}"`;

    if (!ID.test(item.id ?? '')) fail(`${at}: bad id`);
    /* ids are the deep-link key and the tray key — they must be globally unique */
    if (itemIds.has(item.id)) fail(`${at}: duplicate id, already used in "${itemIds.get(item.id)}"`);
    else itemIds.set(item.id, section.id);

    checkI18n(item.name, `${at}.name`, { allowString: true });
    if (section.kind === 'food') checkI18n(item.description, `${at}.description`);
    else checkI18n(item.description, `${at}.description`, { required: false });

    const price = item.price;
    if (!price || typeof price !== 'object') {
      fail(`${at}: price missing`);
    } else {
      const keys = Object.keys(price);
      if (!keys.length) fail(`${at}: price has no amounts`);
      for (const key of keys) {
        if (!PRICE_KEYS.has(key)) fail(`${at}: unknown price key "${key}"`);
        const value = typeof price[key] === 'object' ? price[key]?.amount : price[key];
        if (typeof value !== 'number' || !Number.isFinite(value) || value <= 0) fail(`${at}: price.${key} must be a positive number`);
        /* epsilon, not equality: 2.2 * 100 is 220.00000000000003 in binary floating point */
        else if (Math.abs(value * 100 - Math.round(value * 100)) > 1e-6) fail(`${at}: price.${key} has sub-cent precision`);
      }
    }

    for (const key of item.allergens ?? []) {
      if (!ALLERGENS.has(key)) fail(`${at}: unknown allergen "${key}"`);
    }
    for (const key of item.diet ?? []) {
      if (!DIETS.has(key)) fail(`${at}: unknown diet flag "${key}"`);
    }

    /* A vegan dish that declares lactose or eggs is a data entry mistake. */
    const allergens = new Set(item.allergens ?? []);
    if ((item.diet ?? []).includes('vegan')) {
      for (const animal of ['lactose', 'eggs', 'fish', 'crustaceans', 'mollusks']) {
        if (allergens.has(animal)) fail(`${at}: marked vegan but declares "${animal}"`);
      }
    }
    if ((item.diet ?? []).includes('vegetarian') && (allergens.has('fish') || allergens.has('crustaceans'))) {
      fail(`${at}: marked vegetarian but declares seafood`);
    }
    if ((item.diet ?? []).includes('glutenfree') && allergens.has('gluten')) {
      fail(`${at}: marked gluten free but declares gluten`);
    }

    if (item.nutrition) {
      for (const [key, value] of Object.entries(item.nutrition)) {
        if (!['calories', 'fat', 'carbohydrates', 'protein'].includes(key)) fail(`${at}: unknown nutrition key "${key}"`);
        else if (typeof value !== 'number' || value < 0) fail(`${at}: nutrition.${key} must be a non-negative number`);
      }
    }

    if (item.image) {
      if (!/^[a-z0-9][a-z0-9._-]*\.(svg|png|jpe?g|webp|avif)$/i.test(item.image)) {
        fail(`${at}: image "${item.image}" is not a plain filename`);
      } else if (!existsSync(join(ROOT, 'assets/img/dishes', item.image))) {
        fail(`${at}: image "${item.image}" not found in assets/img/dishes/`);
      }
    }

    if (item.pairing) pairingRefs.push([at, item.pairing]);
  }
}

for (const [at, ref] of pairingRefs) {
  if (!itemIds.has(ref)) fail(`${at}: pairing "${ref}" does not match any item id`);
}

/* --------------------------------------------------------------- daily */

const daily = load('data/daily.json');
for (const [pi, pick] of (daily.rotation?.picks ?? []).entries()) {
  const where = `daily.rotation.picks[${pi}]`;
  if (!pick.slot) fail(`${where}: missing slot`);
  if (!Array.isArray(pick.from) || !pick.from.length) fail(`${where}: "from" must list section ids`);
  for (const id of pick.from ?? []) {
    if (!sectionIds.has(id)) fail(`${where}: unknown section "${id}"`);
  }
  if (pick.label) checkI18n(pick.label, `${where}.label`);
}
for (const id of daily.rotation?.exclude ?? []) {
  if (!itemIds.has(id)) warn(`daily.rotation.exclude: "${id}" is not an item id`);
}
for (const [i, entry] of (daily.featured ?? []).entries()) {
  const id = typeof entry === 'string' ? entry : entry?.id;
  if (!itemIds.has(id)) fail(`daily.featured[${i}]: unknown item "${id}"`);
  if (entry?.label) checkI18n(entry.label, `daily.featured[${i}].label`);
}
for (const [date, override] of Object.entries(daily.overrides ?? {})) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) fail(`daily.overrides: "${date}" is not a YYYY-MM-DD date`);
  for (const entry of override.items ?? []) {
    const id = typeof entry === 'string' ? entry : entry?.id;
    if (!itemIds.has(id)) fail(`daily.overrides["${date}"]: unknown item "${id}"`);
  }
}

/* ---------------------------------------------------------- restaurant */

const restaurant = load('data/restaurant.json');
if (!/^\+?\d{6,15}$/.test(restaurant.contact?.phone ?? '')) fail('restaurant.contact.phone: expected an international number');
try {
  new Intl.DateTimeFormat('en', { timeZone: restaurant.timezone });
} catch {
  fail(`restaurant.timezone: "${restaurant.timezone}" is not a valid IANA zone`);
}
for (const [day, ranges] of Object.entries(restaurant.hours?.weekly ?? {})) {
  if (!/^[0-6]$/.test(day)) fail(`restaurant.hours.weekly: "${day}" is not a weekday index 0-6`);
  for (const range of ranges) {
    if (!Array.isArray(range) || range.length !== 2) { fail(`restaurant.hours.weekly[${day}]: expected [from, to]`); continue; }
    const [from, to] = range;
    if (!TIME.test(from) || !TIME.test(to)) fail(`restaurant.hours.weekly[${day}]: "${from}"–"${to}" must be HH:MM`);
    else if (from >= to) fail(`restaurant.hours.weekly[${day}]: "${from}" is not before "${to}"`);
  }
}
if (Object.values(restaurant.hours?.weekly ?? {}).every((r) => !r.length)) fail('restaurant.hours: the restaurant is never open');
checkI18n(restaurant.tagline, 'restaurant.tagline');

for (const url of [restaurant.address?.maps, restaurant.links?.review, restaurant.links?.facebook, restaurant.contact?.whatsapp]) {
  if (url && !/^https:\/\//.test(url)) fail(`restaurant: "${url}" must be https`);
}

/* -------------------------------------------------------------- report */

const counts = { sections: sectionIds.size, items: itemIds.size };
if (warnings.length) {
  console.warn(`\n${warnings.length} warning(s):`);
  for (const w of warnings) console.warn('  ! ' + w);
}
if (errors.length) {
  console.error(`\n${errors.length} error(s):`);
  for (const e of errors) console.error('  ✗ ' + e);
  process.exit(1);
}
console.log(`✓ data valid — ${counts.sections} sections, ${counts.items} items, ${LANGS.length} languages`);
