/* All rendering. Every value coming from menu data goes through `el({text})`
   or a validated guard, never through innerHTML. */

import { $, $$, clear, el, fold } from './dom.js';
import { ALLERGENS, FILTERABLE_ALLERGENS, FILTERABLE_DIETS, WEEKDAYS, localise, t } from './i18n.js';
import { formatPrice, indexForSearch, matches } from './model.js';
import { longDate, pickOfTheDay } from './daily.js';
import { fromMinutes, status, weekRows } from './hours.js';

const BADGE_ORDER = [
  ['tag', 'new'], ['tag', 'signature'], ['tag', 'local'], ['tag', 'sharing'],
  ['diet', 'vegan'], ['diet', 'vegetarian'], ['diet', 'spicy'], ['diet', 'glutenfree']
];
const MAX_BADGES = 3;

const money = (app, amount) => formatPrice(amount, app.lang, app.restaurant?.currency ?? 'EUR');
const sizeLabel = (app, key) => t('size_' + key, app.lang);

/* ------------------------------------------------------------------ *
 * static chrome
 * ------------------------------------------------------------------ */

export function applyStaticText(app) {
  const { lang } = app;
  document.documentElement.lang = lang;

  for (const node of $$('[data-i18n]')) node.textContent = t(node.dataset.i18n, lang);

  const search = $('#searchInput');
  search.placeholder = t('searchPlaceholder', lang);
  search.setAttribute('aria-label', t('searchLabel', lang));
  $('#searchClear').setAttribute('aria-label', t('clearSearch', lang));
  $('#themeToggle').setAttribute('aria-label', t('themeToggle', lang));
  $('#trayToggle').setAttribute('aria-label', t('trayOpen', lang));
  $('#trayClose').setAttribute('aria-label', t('close', lang));
  $('#toTop').setAttribute('aria-label', t('toTop', lang));
  $('#heroLede').textContent = t('dailyLede', lang);
  $('#disclaimer').textContent = t('disclaimer', lang);

  for (const btn of $$('.lang__btn')) {
    btn.setAttribute('aria-pressed', String(btn.dataset.lang === lang));
  }

  if (app.model.updated) {
    const locale = { es: 'es-ES', it: 'it-IT', en: 'en-GB', de: 'de-DE' }[lang] ?? 'es-ES';
    const stamp = new Intl.DateTimeFormat(locale, { dateStyle: 'long' }).format(new Date(app.model.updated + 'T00:00:00Z'));
    $('#dataStamp').textContent = t('dataStamp', lang, { d: stamp });
  }
}

/* ------------------------------------------------------------------ *
 * filters
 * ------------------------------------------------------------------ */

export function renderFilterChips(app) {
  const diet = clear($('#dietChips'));
  for (const key of FILTERABLE_DIETS) {
    diet.append(el('button', {
      class: 'chip',
      type: 'button',
      'aria-pressed': String(app.filters.diet.has(key)),
      dataset: { diet: key },
      text: t('diet_' + key, app.lang)
    }));
  }

  const allergens = clear($('#allergenChips'));
  for (const key of FILTERABLE_ALLERGENS) {
    allergens.append(el('button', {
      class: 'chip',
      type: 'button',
      'aria-pressed': String(app.filters.allergens.has(key)),
      dataset: { allergen: key },
      text: localise(ALLERGENS[key], app.lang)
    }));
  }

  const count = app.filters.diet.size + app.filters.allergens.size;
  const badge = $('#filterCount');
  badge.textContent = String(count);
  badge.hidden = count === 0;
}

/* ------------------------------------------------------------------ *
 * category rail
 * ------------------------------------------------------------------ */

export function renderRail(app) {
  const rail = clear($('#rail'));
  for (const section of app.model.sections) {
    rail.append(el('a', {
      class: 'rail__link',
      href: '#sec-' + section.id,
      dataset: { rail: section.id },
      style: { '--sect': section.accent },
      text: localise(section.name, app.lang)
    }));
  }
}

/** Hides rail entries whose section was filtered out, without rebuilding. */
function syncRail(visibleIds) {
  for (const link of $$('.rail__link')) link.hidden = !visibleIds.has(link.dataset.rail);
}

/* ------------------------------------------------------------------ *
 * hero — sugerencias del día
 * ------------------------------------------------------------------ */

export function renderDaily(app) {
  const tz = app.restaurant?.timezone ?? 'Atlantic/Canary';
  $('#heroDate').textContent = longDate(app.lang, tz);

  const host = clear($('#daily'));
  const picks = pickOfTheDay(app.model, app.daily, tz);

  for (const { label, item } of picks) {
    const pairing = item.pairing ? app.model.byId.get(item.pairing) : null;
    const name = localise(item.name, app.lang);

    host.append(el('button', {
      class: 'pick',
      type: 'button',
      style: { '--sect': item.accent },
      dataset: { open: item.uid }
    },
      el('span', { class: 'pick__media' },
        item.image
          /* above the fold — these four load eagerly */
          ? el('img', { src: item.image, alt: '', decoding: 'async' })
          : el('span', { class: 'plate' }, el('span', { class: 'plate__mono', text: name.trim().charAt(0).toUpperCase() })),
        el('span', { class: 'pick__slot', text: label ? localise(label, app.lang) : localise(item.sectionName, app.lang) })
      ),
      el('span', { class: 'pick__body' },
        el('span', { class: 'pick__name', text: name }),
        /* wines carry no prose — show grapes and region instead */
        el('span', {
          class: 'pick__desc',
          text: item.description
            ? localise(item.description, app.lang)
            : [item.meta?.grapes?.join(' · '), item.meta?.region].filter(Boolean).join(' — ')
        }),
        el('span', { class: 'pick__foot' },
          el('span', { class: 'pick__price', text: item.from != null ? money(app, item.from) : '' }),
          pairing
            ? el('span', { class: 'pick__pair', text: `${t('pairsWith', app.lang)} ${localise(pairing.name, app.lang)}` })
            : null
        )
      )
    ));
  }
}

/* ------------------------------------------------------------------ *
 * menu
 * ------------------------------------------------------------------ */

function badgesFor(app, item) {
  const out = [];
  for (const [group, key] of BADGE_ORDER) {
    if (out.length >= MAX_BADGES) break;
    const present = group === 'tag' ? item.tags.includes(key) : item.declaredDiet.includes(key) || (key === 'glutenfree' && item.diet.includes('glutenfree'));
    if (!present) continue;
    const cls = { new: 'new', signature: 'signature', local: 'local', sharing: 'local', vegan: 'vegan', vegetarian: 'veg', spicy: 'spicy', glutenfree: 'gf' }[key];
    out.push(el('span', { class: `badge badge--${cls}`, text: t((group === 'tag' ? 'tag_' : 'diet_') + key, app.lang) }));
  }
  return out;
}

function priceBlock(app, item) {
  if (!item.variants.length) return null;
  if (item.variants.length === 1) {
    return el('div', { class: 'card__price', text: money(app, item.variants[0].amount) });
  }
  return el('div', { class: 'card__prices' },
    item.variants.map((v) => el('span', {}, el('small', { text: sizeLabel(app, v.key) }), money(app, v.amount)))
  );
}

function addControls(app, item) {
  if (!item.variants.length) return null;
  return el('div', { class: 'card__adds' },
    item.variants.map((v) => {
      const inTray = app.tray.qty(item.uid, v.key) > 0;
      return el('button', {
        class: 'add' + (inTray ? ' is-in' : ''),
        type: 'button',
        dataset: { add: item.uid, variant: v.key },
        'aria-label': `${t('add', app.lang)} ${localise(item.name, app.lang)}${v.key === 'single' ? '' : ' · ' + sizeLabel(app, v.key)}`,
        text: item.variants.length === 1 ? t('add', app.lang) : sizeLabel(app, v.key)
      });
    })
  );
}

/** Photo, or a tinted plate with the dish's initial when there is none. */
function thumb(app, item, { lazy = true } = {}) {
  const name = localise(item.name, app.lang);
  return el('div', { class: 'card__media', dataset: { open: item.uid } },
    item.image
      ? el('img', {
          src: item.image,
          alt: name,
          loading: lazy ? 'lazy' : null,
          decoding: 'async'
        })
      : el('div', { class: 'plate' }, el('span', { class: 'plate__mono', text: name.trim().charAt(0).toUpperCase() }))
  );
}

function card(app, item) {
  const meta = [];
  if (item.meta?.grapes?.length) meta.push(item.meta.grapes.join(' · '));
  if (item.meta?.region) meta.push(item.meta.region);

  const badges = badgesFor(app, item);
  const withPhoto = item.kind === 'food';

  return el('article', {
    class: 'card' + (withPhoto ? ' card--photo' : ' card--drink'),
    style: { '--sect': item.accent },
    dataset: { uid: item.uid },
    id: 'item-' + item.id
  },
    withPhoto ? thumb(app, item) : null,
    el('div', { class: 'card__body' },
      el('div', { class: 'card__top' },
        el('h3', { class: 'card__name', dataset: { open: item.uid }, text: localise(item.name, app.lang) }),
        priceBlock(app, item)
      ),
      item.description ? el('p', { class: 'card__desc', text: localise(item.description, app.lang) }) : null,
      meta.length ? el('p', { class: 'card__meta-line', text: meta.join(' — ') }) : null,
      badges.length ? el('div', { class: 'card__meta' }, badges) : null,
      el('div', { class: 'card__foot' },
        el('button', { class: 'card__more', type: 'button', dataset: { open: item.uid }, text: t('details', app.lang) }),
        addControls(app, item)
      )
    )
  );
}

export function renderMenu(app) {
  const host = clear($('#menu'));
  const query = fold(app.query.trim());
  const filterCtx = {
    query,
    searchIndex: app.searchIndex,
    hideAllergens: [...app.filters.allergens],
    requireDiet: [...app.filters.diet]
  };

  let shown = 0;
  const visibleSections = new Set();

  for (const section of app.model.sections) {
    const visible = section.items.filter((item) => matches(item, filterCtx));
    if (!visible.length) continue;
    shown += visible.length;
    visibleSections.add(section.id);

    host.append(el('section', {
      class: 'section',
      id: 'sec-' + section.id,
      style: { '--sect': section.accent },
      dataset: { section: section.id }
    },
      el('header', { class: 'section__head' },
        el('h2', { class: 'section__title', text: localise(section.name, app.lang) }),
        el('span', {
          class: 'section__count',
          text: visible.length === 1 ? t('itemCountOne', app.lang) : t('itemCount', app.lang, { n: visible.length })
        })
      ),
      el('div', { class: 'grid' }, visible.map((item) => card(app, item)))
    ));
  }

  const empty = $('#empty');
  empty.hidden = shown > 0;
  if (!shown) {
    clear(empty).append(
      el('strong', { text: t('noResults', app.lang) }),
      el('br'),
      t('noResultsHint', app.lang)
    );
  }

  syncRail(visibleSections);
  return shown;
}

/* ------------------------------------------------------------------ *
 * dish detail
 * ------------------------------------------------------------------ */

export function renderDish(app, uid) {
  const item = app.model.byUid.get(uid);
  if (!item) return null;
  const { lang } = app;
  const body = clear($('#dishBody'));
  body.style.setProperty('--sect', item.accent);

  const media = el('div', { class: 'dish__media' },
    item.image
      ? el('img', { src: item.image, alt: localise(item.name, lang), loading: 'lazy', decoding: 'async' })
      : el('div', { class: 'plate' }, el('span', { class: 'plate__mono', text: localise(item.name, lang).trim().charAt(0).toUpperCase() })),
    el('button', { class: 'dish__close', type: 'button', 'aria-label': t('close', lang), dataset: { close: 'dish' } })
  );

  const rows = [];

  if (item.description) rows.push(el('p', { class: 'dish__desc', text: localise(item.description, lang) }));

  if (item.meta?.grapes?.length || item.meta?.region) {
    rows.push(el('p', { class: 'dish__desc', text: [item.meta.grapes?.join(' · '), item.meta.region].filter(Boolean).join(' — ') }));
  }

  const badges = badgesFor(app, item);
  if (badges.length) rows.push(el('div', { class: 'dish__allergens' }, badges));

  rows.push(el('div', { class: 'dish__row' },
    el('span', { class: 'dish__label', text: t('allergens', lang) }),
    item.allergens.length
      ? el('div', { class: 'dish__allergens' },
          item.allergens.map((key) => el('span', { class: 'badge', text: localise(ALLERGENS[key] ?? key, lang) })))
      : el('span', { text: t('noAllergens', lang) })
  ));

  if (item.nutrition?.calories) {
    const n = item.nutrition;
    const cells = [
      [n.calories, t('calories', lang), ''],
      [n.fat, t('fat', lang), ' g'],
      [n.carbohydrates, t('carbs', lang), ' g'],
      [n.protein, t('protein', lang), ' g']
    ].filter(([value]) => value != null);

    rows.push(el('div', { class: 'dish__row' },
      el('span', { class: 'dish__label', text: t('nutrition', lang) }),
      el('div', { class: 'nutri' }, cells.map(([value, label, unit]) =>
        el('div', { class: 'nutri__cell' },
          el('div', { class: 'nutri__val', text: String(value) + unit }),
          el('div', { class: 'nutri__key', text: label })
        )))
    ));
  }

  const pairing = item.pairing ? app.model.byId.get(item.pairing) : null;
  if (pairing) {
    const prices = pairing.variants.map((v) => money(app, v.amount)).join(' / ');
    rows.push(el('div', { class: 'pairing' },
      el('span', { class: 'pairing__glyph', 'aria-hidden': 'true' }),
      el('span', { class: 'pairing__text' },
        el('strong', { text: localise(pairing.name, lang) }),
        el('small', { text: `${t('pairing', lang)} · ${prices} (${t('glassBottle', lang)})` })
      )
    ));
  }

  const section = app.model.sections.find((s) => s.id === item.sectionId);
  if (section?.extras?.length) {
    rows.push(el('div', { class: 'dish__row' },
      el('span', { class: 'dish__label', text: t('extras', lang) }),
      el('div', { class: 'dish__allergens' },
        section.extras.map((extra) => {
          const amounts = ['medium', 'large']
            .filter((k) => typeof extra.price?.[k] === 'number')
            .map((k) => money(app, extra.price[k]));
          const label = amounts.length ? `${localise(extra.name, lang)} · ${amounts.join(' / ')}` : localise(extra.name, lang);
          return el('span', { class: 'badge', text: label });
        }))
    ));
  }

  rows.push(el('div', { class: 'dish__actions' },
    item.variants.map((v) => el('button', {
      class: 'btn' + (app.tray.qty(item.uid, v.key) > 0 ? '' : ' btn--ghost'),
      type: 'button',
      dataset: { add: item.uid, variant: v.key },
      text: item.variants.length === 1
        ? `${t('add', lang)} · ${money(app, v.amount)}`
        : `${sizeLabel(app, v.key)} · ${money(app, v.amount)}`
    })),
    el('button', { class: 'btn btn--ghost', type: 'button', dataset: { shareDish: item.id }, text: t('shareDish', lang) })
  ));

  body.append(media, el('div', { class: 'dish__body' },
    el('div', { class: 'dish__head' },
      el('h2', { class: 'dish__name', id: 'dishName', text: localise(item.name, lang) }),
      item.variants.length === 1 ? el('span', { class: 'dish__price', text: money(app, item.variants[0].amount) }) : null
    ),
    rows
  ));

  return item;
}

/* ------------------------------------------------------------------ *
 * tray
 * ------------------------------------------------------------------ */

export function renderTray(app) {
  const { lang } = app;
  const rows = app.tray.detailed(app.model);
  const body = clear($('#trayBody'));

  if (!rows.length) {
    body.append(el('p', { class: 'tray__empty', text: t('trayEmpty', lang) }));
  } else {
    for (const { item, variant, qty, line } of rows) {
      body.append(el('div', { class: 'tray__row' },
        el('div', {},
          el('div', { class: 'tray__name', text: localise(item.name, lang) }),
          variant.key === 'single' ? null : el('div', { class: 'tray__variant', text: sizeLabel(app, variant.key) })
        ),
        el('div', { class: 'tray__line', text: money(app, line) }),
        el('div', { class: 'qty' },
          el('button', { type: 'button', 'aria-label': t('decrease', lang), dataset: { add: item.uid, variant: variant.key, step: '-1' }, text: '−' }),
          el('output', { text: String(qty) }),
          el('button', { type: 'button', 'aria-label': t('increase', lang), dataset: { add: item.uid, variant: variant.key, step: '1' }, text: '+' })
        )
      ));
    }
  }

  const total = app.tray.total(app.model);
  $('#trayTotal').textContent = money(app, total);

  const count = app.tray.count;
  const badge = $('#trayCount');
  badge.textContent = String(count);
  badge.hidden = count === 0;

  const send = $('#traySend');
  if (!rows.length) {
    send.setAttribute('aria-disabled', 'true');
    send.href = '#';
  } else {
    send.removeAttribute('aria-disabled');
    send.href = whatsappHref(app, rows, total);
  }

  /* keep the "+" buttons in the grid in sync */
  for (const btn of $$('.add')) {
    const inTray = app.tray.qty(btn.dataset.add, btn.dataset.variant) > 0;
    btn.classList.toggle('is-in', inTray);
  }
}

function whatsappHref(app, rows, total) {
  const { lang } = app;
  const lines = rows.map(({ item, variant, qty, line }) => {
    const size = variant.key === 'single' ? '' : ` (${sizeLabel(app, variant.key)})`;
    return `• ${qty}× ${localise(item.name, lang)}${size} — ${money(app, line)}`;
  });
  const text = [
    t('waIntro', lang),
    '',
    ...lines,
    '',
    `${t('total', lang)}: ${money(app, total)}`,
    t('waOutro', lang)
  ].join('\n');

  const phone = String(app.restaurant?.contact?.phone ?? '').replace(/[^\d]/g, '');
  return `https://wa.me/${phone}?text=${encodeURIComponent(text)}`;
}

/* ------------------------------------------------------------------ *
 * status pill + footer
 * ------------------------------------------------------------------ */

export function renderStatus(app) {
  const { lang } = app;
  const tz = app.restaurant?.timezone ?? 'Atlantic/Canary';
  const info = status(app.restaurant?.hours, tz);
  const pill = $('#statusPill');
  const text = pill.querySelector('.status-pill__text');

  const days = WEEKDAYS[lang] ?? WEEKDAYS.es;
  let label;
  let state;

  switch (info.state) {
    case 'open':
      state = 'open';
      label = `${t('openNow', lang)} · ${t('closesAt', lang, { t: fromMinutes(info.closesAt) })}`;
      break;
    case 'closing':
      state = 'soon';
      label = t('closesSoon', lang, { n: info.minutes });
      break;
    case 'soon':
      state = 'soon';
      label = t('opensSoon', lang, { n: info.minutes });
      break;
    default:
      state = 'closed';
      label = info.opensAt == null
        ? t('closedNow', lang)
        : `${t('closedNow', lang)} · ${info.today
            ? t('opensAtToday', lang, { t: fromMinutes(info.opensAt) })
            : t('opensOn', lang, { d: days[info.opensDay], t: fromMinutes(info.opensAt) })}`;
  }

  pill.dataset.state = state;
  text.textContent = label;
  pill.setAttribute('aria-label', label);
}

export function renderFooter(app) {
  const { lang, restaurant } = app;
  const addr = restaurant?.address ?? {};

  clear($('#addressBlock')).append(
    el('strong', { text: restaurant?.name ?? '' }), el('br'),
    addr.street ?? '', el('br'),
    [addr.postalCode, addr.city].filter(Boolean).join(' '), el('br'),
    addr.region ?? ''
  );

  const maps = $('#mapsLink');
  if (addr.maps) maps.href = addr.maps;

  const tbody = clear($('#hoursTable').querySelector('tbody'));
  for (const row of weekRows(restaurant?.hours, restaurant?.timezone ?? 'Atlantic/Canary', WEEKDAYS[lang] ?? WEEKDAYS.es)) {
    tbody.append(el('tr', { class: row.isToday ? 'is-today' : null },
      el('td', { text: row.label }),
      el('td', { text: row.ranges.length ? row.ranges.join(' · ') : t('closedDay', lang) })
    ));
  }
  $('#hoursNote').textContent = localise(restaurant?.hours?.note, lang);

  const wa = $('#waLink');
  if (restaurant?.contact?.whatsapp) wa.href = restaurant.contact.whatsapp;
  $('#waLabel').textContent = restaurant?.contact?.phoneDisplay ?? '';

  const review = $('#reviewLink');
  if (restaurant?.links?.review) review.href = restaurant.links.review;
  const fb = $('#fbLink');
  if (restaurant?.links?.facebook) fb.href = restaurant.links.facebook;
}

/* ------------------------------------------------------------------ */

let toastTimer = 0;
export function toast(message) {
  const node = $('#toast');
  node.textContent = message;
  node.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { node.hidden = true; }, 2600);
}

export { indexForSearch };
