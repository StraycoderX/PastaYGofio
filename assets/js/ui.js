/* All rendering. Every value coming from menu data goes through `el({text})`
   or a validated guard, never through innerHTML. */

import { $, $$, clear, el, fold } from './dom.js';
import { ALLERGENS, DEFAULT_LANG, FILTERABLE_ALLERGENS, FILTERABLE_DIETS, LANG_NAMES, WEEKDAYS, localise, t } from './i18n.js';
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
  $('#tableValue').setAttribute('aria-label', t('tableLabel', lang));
  $('#notesInput').placeholder = t('notesPlaceholder', lang);
  $('#heroSkip').textContent = t('seeMenu', lang);
  $('#indexBtn').textContent = t('menuIndex', lang);
  $('#indexBtn').setAttribute('aria-label', t('menuIndexTitle', lang));
  $('#indexTitle').textContent = t('menuIndexTitle', lang);
  $('#indexClose').setAttribute('aria-label', t('close', lang));
  $('#addHint').textContent = t('addHint', lang);
  $('#allergyHint').textContent = t('allergyHint', lang);
  const hasta = app.restaurant?.legal?.pricesValidUntil;
  const locale = { es: 'es-ES', it: 'it-IT', en: 'en-GB', de: 'de-DE' }[lang] ?? 'es-ES';
  $('#disclaimer').textContent = t('disclaimer', lang, {
    hasta: hasta
      ? new Intl.DateTimeFormat(locale, { month: 'long', year: 'numeric', timeZone: 'UTC' })
          .format(new Date(hasta + 'T00:00:00Z'))
      : '—'
  });

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
  $('#newsLede').textContent = t('newsLede', app.lang);

  const today = clear($('#daily'));
  const news = clear($('#newsStrip'));
  let novelties = 0;

  /* Two bands, one list: the day's menu rotates, the novelties stand. Mixing
     them put ten cards in the hero and buried the part that changes. */
  for (const pick of pickOfTheDay(app.model, app.daily, tz)) {
    if (pick.kind === 'featured') { news.append(pickCard(app, pick)); novelties++; }
    else today.append(pickCard(app, pick));
  }

  /* nothing new on the carte: the band goes, heading and all */
  $('#news').hidden = novelties === 0;
}

function pickCard(app, { label, item }) {
  const pairing = item.pairing ? app.model.byId.get(item.pairing) : null;
  const name = localise(item.name, app.lang);

  return el('button', {
    class: 'pick',
    type: 'button',
    style: { '--sect': item.accent },
    dataset: { open: item.uid }
  },
    el('span', { class: 'pick__media' },
      item.image
        /* above the fold — these load eagerly */
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
  );
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

  /* Una lista de alérgenos sin confirmar se lee igual que una confirmada, y
     ahí está el peligro: quien la consulta necesita saber cuál de las dos
     tiene delante antes de decidir si come. */
  if (item.allergensUnconfirmed) {
    rows.push(el('p', { class: 'dish__unconfirmed', text: t('allergensUnconfirmed', lang) }));
  }

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

/**
 * El índice: las categorías con cuántos platos tiene cada una.
 *
 * La carta mide 35 pantallas y el carrusel enseña cuatro de quince. Sin esto,
 * que existan los postres es algo que solo descubre quien arrastra.
 */
export function renderIndex(app) {
  const host = clear($('#indexList'));
  for (const section of app.model.sections) {
    const n = section.items.length;
    host.append(el('li', {},
      el('a', {
        class: 'index__link',
        href: '#sec-' + section.id,
        style: { '--sect': section.accent },
        dataset: { indexJump: section.id }
      },
        el('span', { class: 'index__name', text: localise(section.name, app.lang) }),
        el('span', {
          class: 'index__count',
          text: section.kind === 'drink'
            ? (n === 1 ? t('drinkCountOne', app.lang) : t('drinkCount', app.lang, { n }))
            : (n === 1 ? t('itemCountOne', app.lang) : t('itemCount', app.lang, { n }))
        })
      )
    ));
  }
}

/* ------------------------------------------------------------------ *
 * tray
 * ------------------------------------------------------------------ */

export function renderTray(app) {
  const { lang } = app;
  const rows = app.tray.detailed(app.model);
  const body = clear($('#trayBody'));

  if (!rows.length) {
    body.append(el('p', {
      class: 'tray__empty',
      text: t(app.restaurant?.service?.ordering === true ? 'orderEmpty' : 'trayEmpty', lang)
    }));
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

  /* the phone-only bar mirrors the header basket, which scrolls out of reach */
  /* Un vocabulario, no tres: con el pedido activo esto es «tu pedido», no
     «mi selección». Los tres nombres sobraban de cuando la cesta no enviaba
     nada a ninguna parte. */
  const pedido = app.restaurant?.service?.ordering === true;
  $('#trayTitle').textContent = t(pedido ? 'orderTitle' : 'trayTitle', lang);
  $('#trayToggle').setAttribute('aria-label', t(pedido ? 'orderOpen' : 'trayOpen', lang));

  const bar = $('#cartBar');
  if (bar) {
    $('.cartbar__label').textContent = t(pedido ? 'orderTitle' : 'trayTitle', lang);
    $('#cartBarCount').textContent = String(count);
    $('#cartBarTotal').textContent = money(app, total);
    bar.setAttribute('aria-label', `${t('trayOpen', lang)} — ${money(app, total)}`);
    bar.hidden = count === 0;
    document.body.classList.toggle('has-cartbar', count > 0);
  }

  /* Table service is off for now: the tray is a selection the diner shows to
     the waiter, not something that gets sent anywhere. Flipping
     restaurant.json -> service.ordering brings back the table field and the
     WhatsApp hand-off, both of which are still wired below. */
  const ordering = app.restaurant?.service?.ordering === true;
  /* Two kinds of order, told apart by one thing: whether we know the table.
     The QR taped to each table fills it in (?mesa=S1) and typing it by hand
     counts the same — what decides is whether there is somewhere to carry the
     food to. With a table it goes to the kitchen; without one the diner is
     somewhere else, so it is a takeaway order. */
  const dineIn = ordering && Boolean(app.table);
  const send = $('#traySend');

  $('#tray').dataset.ordering = String(ordering);
  $('#tray').dataset.mode = ordering ? (dineIn ? 'mesa' : 'llevar') : 'seleccion';
  $('#trayTable').hidden = !ordering;
  $('#trayNotes').hidden = !ordering;
  send.hidden = !ordering;
  /* con ordering en false no hay pedido que enseñar: la cesta vuelve a ser
     una selección y el camarero ya la ve en la propia carta */
  $('#trayShow').hidden = true;

  $('#trayDisclaimer').textContent = t(
    !ordering ? 'trayDisclaimer' : dineIn ? 'trayDisclaimerTable' : 'trayDisclaimerTakeaway',
    lang
  );

  if (ordering) {
    $('#traySendLabel').textContent = t(dineIn ? 'sendKitchen' : 'sendTakeaway', lang);
    $('#tableValue').textContent = app.table ?? '';
    $('#trayTable').dataset.empty = String(!dineIn);
    $('#tableHint').textContent = t(dineIn ? 'tableFromQr' : 'tableAsk', lang);

    /* la salida para quien no tiene WhatsApp: sin platos no hay nada que
       enseñar, así que aparece con el primero */
    const show = $('#trayShow');
    show.textContent = t(dineIn ? 'showWaiter' : 'showTakeaway', lang);
    show.hidden = !rows.length;
    if (!rows.length) {
      send.setAttribute('aria-disabled', 'true');
      send.href = '#';
    } else {
      send.removeAttribute('aria-disabled');
      send.href = whatsappHref(app, rows, total);
    }
  }

  /* La pista del ＋ existe para quien no sabe que se puede pedir. En cuanto
     añade el primer plato ya lo sabe, y la ayuda estorba. */
  $('#addHint').hidden = !ordering || count > 0;

  /* keep the "+" buttons in the grid in sync */
  for (const btn of $$('.add')) {
    const inTray = app.tray.qty(btn.dataset.add, btn.dataset.variant) > 0;
    btn.classList.toggle('is-in', inTray);
  }
}

/** Idioma en que se escribe el pedido: el de quien lo lee, no el del cliente. */
const kitchenLang = (app) => app.restaurant?.service?.orderLanguage ?? DEFAULT_LANG;

/**
 * Las líneas del pedido, una por plato.
 *
 * En el idioma del restaurante, porque quien las lee es cocina o el camarero.
 * En el del comensal, una mesa alemana llega como «Teror-Bruschetta (Familie)»
 * y hay que traducir cada comanda en plena faena — hasta el nombre cambia: la
 * Margarita vuelve como Margherita. El nombre que vio el cliente va detrás
 * entre paréntesis, y solo cuando difiere, para que él reconozca lo suyo sin
 * llenar la comanda de ruido.
 *
 * Lo usan el mensaje de WhatsApp y la pantalla que se le enseña al camarero:
 * son el mismo pedido y tienen que decir lo mismo.
 */
function orderLines(app, rows) {
  const kitchen = kitchenLang(app);
  const price = (amount) => formatPrice(amount, kitchen, app.restaurant?.currency ?? 'EUR');

  return rows.map(({ item, variant, qty, line }) => {
    const name = localise(item.name, kitchen);
    const size = variant.key === 'single' ? '' : `, ${t('size_' + variant.key, kitchen)}`;
    const theirs = localise(item.name, app.lang);
    const echo = theirs && theirs !== name ? ` (${theirs})` : '';
    return { qty, texto: `${name}${size}${echo}`, precio: price(line) };
  });
}

/**
 * La nota del comensal, limpia.
 *
 * Acaba dentro de un mensaje de WhatsApp cuyas líneas separan plato de plato,
 * así que los saltos de línea se aplanan: una nota de seis renglones haría
 * ilegible la comanda. Los caracteres de control se van por el mismo motivo.
 */
function dinerNotes(app) {
  return String(app.notes ?? '')
    /* saltos de línea y caracteres de control fuera: esto viaja dentro de un
       mensaje cuyas líneas separan plato de plato */
    .replace(/[\u0000-\u001f\u007f]+/g, ' ')
    .replace(/\s{2,}/g, ' ')
    .trim()
    .slice(0, 200);
}

/** El pedido entero como texto plano: lo que viaja por WhatsApp o al portapapeles. */
function orderText(app, rows, total) {
  const kitchen = kitchenLang(app);
  const price = (amount) => formatPrice(amount, kitchen, app.restaurant?.currency ?? 'EUR');
  const notas = dinerNotes(app);

  /* Same order, two framings. With a table the first line tells the kitchen
     where to carry it; without one it asks for a pickup time instead, which is
     the only thing a takeaway order needs that a table order does not. Who is
     ordering comes free — it is their own WhatsApp chat. */
  const table = app.table ? `${t('tableLabel', kitchen)} ${app.table}` : null;
  return [
    table ? t('waIntroOrder', kitchen, { mesa: table }) : t('waIntroTakeaway', kitchen),
    /* so whoever answers knows which language to greet them in */
    app.lang === kitchen ? null : t('waDinerLanguage', kitchen, { idioma: localise(LANG_NAMES[app.lang], kitchen) }),
    '',
    ...orderLines(app, rows).map(({ qty, texto, precio }) => `• ${qty}× ${texto} — ${precio}`),
    '',
    notas ? `${t('waNotes', kitchen)}${app.lang === kitchen ? '' : ` (${localise(LANG_NAMES[app.lang], kitchen)})`}: ${notas}` : null,
    notas ? '' : null,
    `${t('total', kitchen)}: ${price(total)}`,
    table ? t('waOutroOrder', kitchen) : t('waOutroTakeaway', kitchen)
  ].filter((line) => line !== null).join('\n');
}

function whatsappHref(app, rows, total) {
  const phone = String(app.restaurant?.contact?.phone ?? '').replace(/[^\d]/g, '');
  return `https://wa.me/${phone}?text=${encodeURIComponent(orderText(app, rows, total))}`;
}

/**
 * El pedido en pantalla, grande, para quien no tiene WhatsApp.
 *
 * Sentado en el local basta con enseñárselo al camarero; desde fuera lo que
 * sirve es copiarlo o llamar, así que el pie cambia según haya mesa o no.
 */
export function renderBoard(app) {
  const { lang } = app;
  const rows = app.tray.detailed(app.model);
  const total = app.tray.total(app.model);
  const kitchen = kitchenLang(app);

  /* Todo el bloque del pedido va en el idioma del restaurante, incluida la
     cabecera: quien lee esta pantalla es un camarero que solo habla español,
     y «Zum Mitnehmen» sobre una comanda no le dice nada. */
  $('#boardWhere').textContent = app.table
    ? t('boardForWaiter', kitchen)
    : t('boardTakeaway', kitchen);
  $('#boardTitle').textContent = app.table ? `${t('tableLabel', kitchen)} ${app.table}` : '';
  $('#boardTitle').hidden = !app.table;

  const host = clear($('#boardLines'));
  for (const { qty, texto, precio } of orderLines(app, rows)) {
    host.append(el('li', { class: 'board__line' },
      el('span', { class: 'board__qty', text: `${qty}×` }),
      el('span', { class: 'board__dish', text: texto }),
      el('span', { class: 'board__price', text: precio })
    ));
  }

  /* El pedido en el idioma del restaurante —platos, total, mesa—, porque lo
     lee el camarero. Lo que va dirigido al comensal —la instrucción, los
     botones— en el suyo, que para eso está mirando su propio móvil. */
  const notas = dinerNotes(app);
  const notasNodo = $('#boardNotes');
  notasNodo.hidden = !notas;
  /* La nota la escribe el comensal en su idioma y no hay quien la traduzca
     aquí: sin conexión a nada externo, inventarse una traducción sería peor
     que no tenerla. Lo que sí se puede es decir en qué idioma está, para que
     el camarero pregunte en vez de descifrar. */
  const idiomaNota = app.lang === kitchen ? '' : ` (${localise(LANG_NAMES[app.lang], kitchen)})`;
  notasNodo.textContent = notas ? `${t('boardNotesLabel', kitchen)}${idiomaNota}: ${notas}` : '';

  $('#boardTotalLabel').textContent = t('total', kitchen);
  $('#boardTotal').textContent = formatPrice(total, kitchen, app.restaurant?.currency ?? 'EUR');
  $('#boardHint').textContent = t(app.table ? 'boardHintTable' : 'boardHintTakeaway', lang);
  $('#boardCopy').textContent = t('copyOrder', lang);
  $('#boardClose').setAttribute('aria-label', t('close', lang));

  /* llamar solo tiene sentido cuando no hay un camarero delante */
  const call = $('#boardCall');
  call.hidden = Boolean(app.table);
  call.textContent = t('callUs', lang);
  call.href = `tel:${String(app.restaurant?.contact?.phone ?? '').replace(/[^\d+]/g, '')}`;
}

/** El pedido como texto, para el portapapeles. */
export function orderClipboard(app) {
  return orderText(app, app.tray.detailed(app.model), app.tray.total(app.model));
}

/* ------------------------------------------------------------------ *
 * status pill + footer
 * ------------------------------------------------------------------ */

export function renderStatus(app) {
  const { lang } = app;
  const tz = app.restaurant?.timezone ?? 'Atlantic/Canary';
  const info = status(app.restaurant?.hours, tz);
  const pill = $('#statusPill');

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

  /* Two pills exist — one in the masthead, one in the hero — and CSS shows
     whichever fits the viewport. Both carry the same state. */
  for (const node of [pill, $('#statusPillHero')]) {
    if (!node) continue;
    node.dataset.state = state;
    node.querySelector('.status-pill__text').textContent = label;
    node.setAttribute('aria-label', label);
  }
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
