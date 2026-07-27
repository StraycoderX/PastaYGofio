#!/usr/bin/env node
/* Converts the old etnoteam.io/pastaygofio menu.json into the v2 schema.
 *
 *   node scripts/migrate-legacy-menu.mjs old-menu.json > data/menu.json
 *   node scripts/validate-data.mjs
 *
 * The legacy file kept food under `menu[]` and hand-rolled a different shape
 * for each drink family (wine / beer / beverages / coffee / spirits). v2 puts
 * everything into one `sections[]` list, so the renderer has a single path.
 *
 * Anything the old file never carried — accents, diet flags, wine pairings —
 * is filled with a sane default and flagged on stderr for a human to review. */

import { readFileSync } from 'node:fs';

const LANGS = ['es', 'it', 'en', 'de'];

const ACCENTS = {
  starters: '#6f9f5c', pasta: '#e07a1f', ravioli: '#c9c34f', rice: '#b89a74',
  meat: '#c98a52', fish: '#1497b8', salad: '#8a7b47', pizzas: '#b81f13',
  sweet: '#4a3a2e', redwine: '#8d2440', whitewine: '#c9b458', beer: '#d9a51a',
  beverages: '#e07a1f', coffee: '#6b4226', spirits: '#d2471f'
};

const DRINK_NAMES = {
  redwine:   { es: 'Vino tinto', it: 'Vino rosso', en: 'Red wine', de: 'Rotwein' },
  whitewine: { es: 'Vino blanco', it: 'Vino bianco', en: 'White wine', de: 'Weißwein' },
  beer:      { es: 'Cerveza', it: 'Birra', en: 'Beer', de: 'Bier' },
  beverages: { es: 'Refrescos', it: 'Bibite', en: 'Soft drinks', de: 'Erfrischungsgetränke' },
  coffee:    { es: 'Café', it: 'Caffè', en: 'Coffee', de: 'Kaffee' },
  spirits:   { es: 'Licores', it: 'Liquori', en: 'Spirits', de: 'Spirituosen' }
};

const notes = [];
const note = (msg) => notes.push(msg);

const slug = (value) => String(value ?? '')
  .normalize('NFD').replace(/\p{Diacritic}/gu, '')
  .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 48);

const used = new Set();
function uniqueId(base, fallback) {
  let id = slug(base) || fallback;
  if (!/^[a-z]/.test(id)) id = fallback + '-' + id;
  let candidate = id;
  for (let n = 2; used.has(candidate); n++) candidate = `${id}-${n}`;
  used.add(candidate);
  return candidate;
}

function i18n(value, what) {
  if (value == null) return null;
  if (typeof value === 'string') return value;
  const out = {};
  for (const lang of LANGS) {
    if (typeof value[lang] === 'string' && value[lang].trim()) out[lang] = value[lang];
  }
  const missing = LANGS.filter((l) => !out[l]);
  if (missing.length) {
    const first = out[LANGS.find((l) => out[l])] ?? '';
    for (const lang of missing) out[lang] = first;
    if (first) note(`${what}: no ${missing.join('/')} translation — copied the existing text, please translate`);
    else return null;
  }
  return out;
}

const num = (value) => (typeof value === 'number' && Number.isFinite(value) && value > 0 ? Math.round(value * 100) / 100 : null);

/* ------------------------------------------------------------------ food */

function convertFood(legacy) {
  const sections = [];

  for (const category of legacy.menu ?? []) {
    const key = String(category.category?.en ?? '').toLowerCase().replace(/[^a-z]/g, '');
    const id = uniqueId(key || category.category?.en, 'section');
    const section = {
      id,
      kind: 'food',
      accent: ACCENTS[key] ?? '#b8441f',
      name: i18n(category.category, `section ${id}`) ?? { es: id, it: id, en: id, de: id }
    };
    if (!ACCENTS[key]) note(`section "${id}": no known accent colour, defaulted to terracotta`);

    if (Array.isArray(category.options) && category.options.length) {
      section.sizes = [
        { key: 'medium', label: { es: 'Mediana', it: 'Media', en: 'Medium', de: 'Mittel' } },
        { key: 'large', label: { es: 'Familiar', it: 'Familiare', en: 'Family', de: 'Familie' } }
      ];
      section.extras = category.options.map((option, i) => ({
        id: uniqueId(option.name?.en ?? `extra-${i}`, 'extra'),
        name: i18n(option.name, `extra in ${id}`) ?? { es: 'Extra', it: 'Extra', en: 'Extra', de: 'Extra' },
        price: {
          ...(num(option.price?.medium) ? { medium: num(option.price.medium) } : {}),
          ...(num(option.price?.large) ? { large: num(option.price.large) } : {})
        }
      }));
    }

    section.items = [];
    for (const wrapper of category.items ?? []) {
      const raw = wrapper.item ?? wrapper;
      const name = i18n(raw.name, `item in ${id}`);
      if (!name) { note(`section "${id}": skipped an item with no usable name`); continue; }

      const price = {};
      if (num(raw.price?.amount)) price.amount = num(raw.price.amount);
      if (num(raw.price?.medium?.amount)) price.medium = num(raw.price.medium.amount);
      if (num(raw.price?.large?.amount)) price.large = num(raw.price.large.amount);
      if (!Object.keys(price).length) { note(`"${name.es}": no price found, skipped`); continue; }

      const item = {
        id: uniqueId(name.es ?? name.en, 'item'),
        name,
        description: i18n(raw.description, `description of "${name.es}"`) ?? { es: '', it: '', en: '', de: '' },
        price,
        allergens: Array.isArray(raw.allergens) ? raw.allergens : []
      };
      if (raw.nutrition && Object.keys(raw.nutrition).length) item.nutrition = raw.nutrition;
      if (raw.image) item.image = raw.image;
      section.items.push(item);
    }

    if (section.items.length) sections.push(section);
  }

  return sections;
}

/* ----------------------------------------------------------------- drinks */

function drinkSection(id, items) {
  return items.length ? [{ id, kind: 'drink', accent: ACCENTS[id], name: DRINK_NAMES[id], items }] : [];
}

function convertDrinks(drinks = {}) {
  const sections = [];

  const red = [];
  const white = [];
  for (const wine of drinks.wine ?? []) {
    if (!wine?.name) continue;
    const price = {};
    if (num(wine.price?.glass)) price.glass = num(wine.price.glass);
    if (num(wine.price?.bottle)) price.bottle = num(wine.price.bottle);
    if (!Object.keys(price).length) { note(`wine "${wine.name}": no price, skipped`); continue; }

    const entry = { id: uniqueId(wine.name, 'wine'), name: wine.name, price, allergens: ['sulfites'] };
    if (wine.grapes?.length || wine.region) {
      entry.meta = { ...(wine.grapes?.length ? { grapes: wine.grapes } : {}), ...(wine.region ? { region: wine.region } : {}) };
    }
    (wine.type === 'white' ? white : red).push(entry);
  }
  sections.push(...drinkSection('redwine', red), ...drinkSection('whitewine', white));

  const beers = [];
  for (const size of ['small', 'large']) {
    const glass = drinks.beer?.glass?.[size];
    if (!glass || !num(glass.price)) continue;
    const name = i18n(glass.name, `draught beer (${size})`);
    beers.push({
      id: uniqueId(`draught-${size}`, 'beer'),
      name: name ? Object.fromEntries(LANGS.map((l) => [l, `${name[l]}${glass.volume ? ` (${glass.volume})` : ''}`])) : `Draught ${size}`,
      price: { amount: num(glass.price) },
      allergens: ['gluten']
    });
  }
  for (const volume of ['33cl', '50cl']) {
    for (const bottle of drinks.beer?.bottle?.[volume] ?? []) {
      const label = bottle.nome ?? bottle.name;
      if (!label || !num(bottle.price)) continue;
      beers.push({ id: uniqueId(label, 'beer'), name: `${label} (${volume})`, price: { amount: num(bottle.price) }, allergens: ['gluten'] });
    }
  }
  sections.push(...drinkSection('beer', beers));

  const beverages = [];
  const coffees = [];
  for (const [key, value] of Object.entries(drinks.beverages ?? {})) {
    if (key === 'coffee') {
      for (const [coffeeKey, coffee] of Object.entries(value)) {
        if (coffeeKey === 'name' || !num(coffee?.price)) continue;
        const label = String(coffee.name ?? coffeeKey).replace(/_/g, ' ');
        coffees.push({ id: uniqueId(label, 'coffee'), name: label, price: { amount: num(coffee.price) } });
      }
      continue;
    }
    if (!num(value?.price)) continue;
    const name = i18n(value.name, `beverage "${key}"`);
    if (!name) continue;
    beverages.push({ id: uniqueId(key, 'drink'), name, price: { amount: num(value.price) } });
  }
  sections.push(...drinkSection('beverages', beverages), ...drinkSection('coffee', coffees));

  const spirits = [];
  for (const spirit of (drinks.spirits ?? []).flat()) {
    const label = spirit?.nome ?? spirit?.name;
    if (!label || !num(spirit.price)) continue;
    spirits.push({ id: uniqueId(label, 'spirit'), name: label, price: { amount: num(spirit.price) } });
  }
  sections.push(...drinkSection('spirits', spirits));

  return sections;
}

/* -------------------------------------------------------------------- run */

const input = process.argv[2];
if (!input) {
  console.error('usage: node scripts/migrate-legacy-menu.mjs <old-menu.json> > data/menu.json');
  process.exit(2);
}

const legacy = JSON.parse(readFileSync(input, 'utf8'));
const sections = [...convertFood(legacy), ...convertDrinks(legacy.drinks)];

const out = {
  version: 2,
  updated: new Date().toISOString().slice(0, 10),
  source: 'migrated',
  sections
};

process.stdout.write(JSON.stringify(out, null, 2) + '\n');

const items = sections.reduce((n, s) => n + s.items.length, 0);
console.error(`\nmigrated ${sections.length} sections / ${items} items`);
if (notes.length) {
  console.error(`\n${notes.length} thing(s) to review by hand:`);
  for (const n of notes) console.error('  · ' + n);
}
console.error('\nNext: add `diet` flags, `tags` and `pairing` ids where you want them, then run scripts/validate-data.mjs');
