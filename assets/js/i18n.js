/* All user-facing copy. Order of languages everywhere: es, it, en, de. */

export const LANGS = ['es', 'it', 'en', 'de'];
export const DEFAULT_LANG = 'es';

export const T = {
  skipToMenu: { es: 'Ir a la carta', it: 'Vai al menu', en: 'Skip to menu', de: 'Zur Karte' },

  /* hero */
  dailyTitle: { es: 'Sugerencias del día', it: 'I consigli del giorno', en: "Today's suggestions", de: 'Tagesempfehlungen' },
  dailyLede: {
    es: 'Lo que hoy nos apetece cocinar: una selección que cambia cada día, con el vino que mejor le va.',
    it: 'Quello che oggi ci va di cucinare: una selezione che cambia ogni giorno, con il vino giusto.',
    en: 'What we feel like cooking today: a selection that changes daily, with the wine that suits it best.',
    de: 'Worauf wir heute Lust haben: eine täglich wechselnde Auswahl, mit dem passenden Wein.'
  },
  pairsWith: { es: 'marida con', it: 'in abbinamento a', en: 'pairs with', de: 'passt zu' },

  /* toolbar */
  searchPlaceholder: { es: 'Buscar plato, ingrediente…', it: 'Cerca piatto, ingrediente…', en: 'Search dish, ingredient…', de: 'Gericht, Zutat suchen…' },
  searchLabel: { es: 'Buscar en la carta', it: 'Cerca nel menu', en: 'Search the menu', de: 'Karte durchsuchen' },
  clearSearch: { es: 'Borrar búsqueda', it: 'Cancella ricerca', en: 'Clear search', de: 'Suche löschen' },
  filters: { es: 'Filtros', it: 'Filtri', en: 'Filters', de: 'Filter' },
  dietTitle: { es: 'Preferencias', it: 'Preferenze', en: 'Preferences', de: 'Vorlieben' },
  allergenTitle: { es: 'Ocultar platos con…', it: 'Nascondi piatti con…', en: 'Hide dishes containing…', de: 'Gerichte ausblenden mit…' },
  allergenHint: {
    es: 'El filtro se basa en la información declarada por el restaurante. Si tienes una alergia grave, avísanos siempre al pedir.',
    it: 'Il filtro si basa sulle informazioni dichiarate dal ristorante. In caso di allergia grave, avvisaci sempre al momento dell’ordine.',
    en: 'Filtering uses the information declared by the restaurant. If you have a severe allergy, always tell us when ordering.',
    de: 'Der Filter beruht auf den Angaben des Restaurants. Bei schweren Allergien informieren Sie uns bitte immer bei der Bestellung.'
  },
  reset: { es: 'Limpiar', it: 'Azzera', en: 'Reset', de: 'Zurücksetzen' },

  /* results */
  itemCount: { es: '{n} platos', it: '{n} piatti', en: '{n} dishes', de: '{n} Gerichte' },
  itemCountOne: { es: '1 plato', it: '1 piatto', en: '1 dish', de: '1 Gericht' },
  noResults: { es: 'No hay platos que coincidan.', it: 'Nessun piatto corrisponde.', en: 'No dishes match.', de: 'Keine passenden Gerichte.' },
  noResultsHint: { es: 'Prueba con otra palabra o quita algún filtro.', it: 'Prova un’altra parola o togli un filtro.', en: 'Try another word or remove a filter.', de: 'Anderes Wort probieren oder Filter entfernen.' },

  /* dish */
  details: { es: 'Ver detalle', it: 'Dettagli', en: 'Details', de: 'Details' },
  close: { es: 'Cerrar', it: 'Chiudi', en: 'Close', de: 'Schließen' },
  allergens: { es: 'Alérgenos', it: 'Allergeni', en: 'Allergens', de: 'Allergene' },
  noAllergens: { es: 'Sin alérgenos declarados', it: 'Nessun allergene dichiarato', en: 'No declared allergens', de: 'Keine deklarierten Allergene' },
  nutrition: { es: 'Información nutricional', it: 'Valori nutrizionali', en: 'Nutrition', de: 'Nährwerte' },
  calories: { es: 'kcal', it: 'kcal', en: 'kcal', de: 'kcal' },
  fat: { es: 'Grasas', it: 'Grassi', en: 'Fat', de: 'Fett' },
  carbs: { es: 'Carboh.', it: 'Carboidr.', en: 'Carbs', de: 'Kohlenh.' },
  protein: { es: 'Proteínas', it: 'Proteine', en: 'Protein', de: 'Eiweiß' },
  pairing: { es: 'Maridaje sugerido', it: 'Abbinamento consigliato', en: 'Suggested pairing', de: 'Empfohlene Weinbegleitung' },
  glassBottle: { es: 'copa / botella', it: 'calice / bottiglia', en: 'glass / bottle', de: 'Glas / Flasche' },
  extras: { es: 'Ingredientes extra', it: 'Aggiunte extra', en: 'Extra toppings', de: 'Extra-Zutaten' },
  shareDish: { es: 'Compartir plato', it: 'Condividi piatto', en: 'Share dish', de: 'Gericht teilen' },

  /* sizes */
  size_single: { es: '', it: '', en: '', de: '' },
  size_medium: { es: 'mediana', it: 'media', en: 'medium', de: 'mittel' },
  size_large: { es: 'familiar', it: 'familiare', en: 'family', de: 'Familie' },
  size_glass: { es: 'copa', it: 'calice', en: 'glass', de: 'Glas' },
  size_bottle: { es: 'botella', it: 'bottiglia', en: 'bottle', de: 'Flasche' },

  /* badges */
  tag_new: { es: 'Nuevo', it: 'Novità', en: 'New', de: 'Neu' },
  tag_signature: { es: 'De la casa', it: 'Della casa', en: 'House special', de: 'Hausspezialität' },
  tag_local: { es: 'Producto canario', it: 'Prodotto canario', en: 'Canarian produce', de: 'Kanarisches Produkt' },
  tag_sharing: { es: 'Para compartir', it: 'Da condividere', en: 'To share', de: 'Zum Teilen' },
  diet_vegetarian: { es: 'Vegetariano', it: 'Vegetariano', en: 'Vegetarian', de: 'Vegetarisch' },
  diet_vegan: { es: 'Vegano', it: 'Vegano', en: 'Vegan', de: 'Vegan' },
  diet_spicy: { es: 'Picante', it: 'Piccante', en: 'Spicy', de: 'Scharf' },
  diet_glutenfree: { es: 'Sin gluten', it: 'Senza glutine', en: 'Gluten free', de: 'Glutenfrei' },

  /* status */
  openNow: { es: 'Abierto ahora', it: 'Aperto ora', en: 'Open now', de: 'Jetzt geöffnet' },
  closesAt: { es: 'cierra a las {t}', it: 'chiude alle {t}', en: 'closes at {t}', de: 'schließt um {t}' },
  closesSoon: { es: 'Cierra en {n} min', it: 'Chiude tra {n} min', en: 'Closes in {n} min', de: 'Schließt in {n} Min.' },
  closedNow: { es: 'Cerrado', it: 'Chiuso', en: 'Closed', de: 'Geschlossen' },
  opensAtToday: { es: 'abre a las {t}', it: 'apre alle {t}', en: 'opens at {t}', de: 'öffnet um {t}' },
  opensOn: { es: 'abre {d} a las {t}', it: 'apre {d} alle {t}', en: 'opens {d} at {t}', de: 'öffnet {d} um {t}' },
  opensSoon: { es: 'Abre en {n} min', it: 'Apre tra {n} min', en: 'Opens in {n} min', de: 'Öffnet in {n} Min.' },

  /* tray */
  trayTitle: { es: 'Mi selección', it: 'La mia selezione', en: 'My selection', de: 'Meine Auswahl' },
  trayOpen: { es: 'Abrir mi selección', it: 'Apri la mia selezione', en: 'Open my selection', de: 'Meine Auswahl öffnen' },
  trayEmpty: {
    es: 'Todavía no has añadido nada. Toca «+» en cualquier plato para ir armando tu mesa.',
    it: 'Non hai ancora aggiunto nulla. Tocca «+» su un piatto per comporre il tuo tavolo.',
    en: 'Nothing added yet. Tap “+” on any dish to build your table.',
    de: 'Noch nichts hinzugefügt. Tippen Sie auf „+“, um Ihren Tisch zusammenzustellen.'
  },
  trayDisclaimer: {
    es: 'Orientativo: no es un pedido. Sirve para enseñárselo al camarero o mandárnoslo por WhatsApp.',
    it: 'Indicativo: non è un ordine. Serve per mostrarlo al cameriere o inviarcelo su WhatsApp.',
    en: 'Indicative only — this is not an order. Show it to the waiter or send it to us on WhatsApp.',
    de: 'Nur zur Orientierung — keine Bestellung. Zeigen Sie sie dem Kellner oder senden Sie sie per WhatsApp.'
  },
  total: { es: 'Total', it: 'Totale', en: 'Total', de: 'Gesamt' },
  clear: { es: 'Vaciar', it: 'Svuota', en: 'Clear', de: 'Leeren' },
  sendWhatsApp: { es: 'Enviar por WhatsApp', it: 'Invia su WhatsApp', en: 'Send on WhatsApp', de: 'Per WhatsApp senden' },
  add: { es: 'Añadir', it: 'Aggiungi', en: 'Add', de: 'Hinzufügen' },
  added: { es: 'Añadido a tu selección', it: 'Aggiunto alla selezione', en: 'Added to your selection', de: 'Zur Auswahl hinzugefügt' },
  increase: { es: 'Añadir uno', it: 'Aggiungi uno', en: 'Add one', de: 'Eins mehr' },
  decrease: { es: 'Quitar uno', it: 'Togli uno', en: 'Remove one', de: 'Eins weniger' },
  waIntro: {
    es: 'Hola, me gustaría reservar mesa en Pasta y Gofio. Estamos mirando:',
    it: 'Ciao, vorrei prenotare un tavolo da Pasta y Gofio. Stiamo guardando:',
    en: 'Hello, I would like to book a table at Pasta y Gofio. We are looking at:',
    de: 'Hallo, ich möchte einen Tisch im Pasta y Gofio reservieren. Wir schauen uns an:'
  },
  waOutro: {
    es: '(Selección orientativa desde la carta digital.)',
    it: '(Selezione indicativa dal menu digitale.)',
    en: '(Indicative selection from the digital menu.)',
    de: '(Unverbindliche Auswahl aus der digitalen Karte.)'
  },

  /* footer */
  findUs: { es: 'Dónde estamos', it: 'Dove siamo', en: 'Find us', de: 'Wo wir sind' },
  hoursTitle: { es: 'Horarios', it: 'Orari', en: 'Opening hours', de: 'Öffnungszeiten' },
  contactTitle: { es: 'Contacto', it: 'Contatti', en: 'Contact', de: 'Kontakt' },
  openMaps: { es: 'Cómo llegar', it: 'Come arrivare', en: 'Get directions', de: 'Route planen' },
  leaveReview: { es: 'Deja tu opinión', it: 'Lascia una recensione', en: 'Leave a review', de: 'Bewertung abgeben' },
  share: { es: 'Compartir', it: 'Condividi', en: 'Share', de: 'Teilen' },
  print: { es: 'Imprimir', it: 'Stampa', en: 'Print', de: 'Drucken' },
  install: { es: 'Instalar app', it: 'Installa app', en: 'Install app', de: 'App installieren' },
  linkCopied: { es: 'Enlace copiado', it: 'Link copiato', en: 'Link copied', de: 'Link kopiert' },
  closedDay: { es: 'Cerrado', it: 'Chiuso', en: 'Closed', de: 'Geschlossen' },
  toTop: { es: 'Volver arriba', it: 'Torna su', en: 'Back to top', de: 'Nach oben' },
  themeToggle: { es: 'Cambiar tema', it: 'Cambia tema', en: 'Toggle theme', de: 'Design wechseln' },

  offlineReady: { es: 'La carta ya funciona sin conexión', it: 'Il menu funziona anche offline', en: 'The menu now works offline', de: 'Die Karte funktioniert jetzt offline' },

  disclaimer: {
    es: 'IGIC incluido en el precio. Precios válidos hasta diciembre de 2026, salvo error tipográfico. Conforme al Reglamento (UE) n.º 1169/2011, la información sobre alérgenos está disponible en la carta y en el local. Las imágenes son orientativas.',
    it: 'IGIC incluso nel prezzo. Prezzi validi fino a dicembre 2026, salvo errori tipografici. Ai sensi del Regolamento (UE) n. 1169/2011, le informazioni sugli allergeni sono disponibili nel menu e nel locale. Le immagini sono indicative.',
    en: 'IGIC included in the price. Prices valid until December 2026, typographical errors excepted. In accordance with Regulation (EU) No 1169/2011, allergen information is available on the menu and on the premises. Images are indicative.',
    de: 'IGIC im Preis enthalten. Preise gültig bis Dezember 2026, Druckfehler vorbehalten. Gemäß Verordnung (EU) Nr. 1169/2011 sind Allergeninformationen in der Karte und im Lokal verfügbar. Abbildungen sind unverbindlich.'
  },
  dataStamp: { es: 'Carta actualizada el {d}', it: 'Menu aggiornato il {d}', en: 'Menu updated on {d}', de: 'Karte aktualisiert am {d}' }
};

export const ALLERGENS = {
  gluten:      { es: 'Gluten', it: 'Glutine', en: 'Gluten', de: 'Gluten' },
  lactose:     { es: 'Lactosa', it: 'Lattosio', en: 'Lactose', de: 'Laktose' },
  eggs:        { es: 'Huevos', it: 'Uova', en: 'Eggs', de: 'Eier' },
  nuts:        { es: 'Frutos secos', it: 'Frutta a guscio', en: 'Nuts', de: 'Nüsse' },
  soy:         { es: 'Soja', it: 'Soia', en: 'Soy', de: 'Soja' },
  peanuts:     { es: 'Cacahuetes', it: 'Arachidi', en: 'Peanuts', de: 'Erdnüsse' },
  fish:        { es: 'Pescado', it: 'Pesce', en: 'Fish', de: 'Fisch' },
  crustaceans: { es: 'Crustáceos', it: 'Crostacei', en: 'Crustaceans', de: 'Krebstiere' },
  mollusks:    { es: 'Moluscos', it: 'Molluschi', en: 'Molluscs', de: 'Weichtiere' },
  sesame:      { es: 'Sésamo', it: 'Sesamo', en: 'Sesame', de: 'Sesam' },
  mustard:     { es: 'Mostaza', it: 'Senape', en: 'Mustard', de: 'Senf' },
  celery:      { es: 'Apio', it: 'Sedano', en: 'Celery', de: 'Sellerie' },
  sulfites:    { es: 'Sulfitos', it: 'Solfiti', en: 'Sulphites', de: 'Sulfite' },
  lupin:       { es: 'Altramuces', it: 'Lupini', en: 'Lupin', de: 'Lupine' }
};

/* Which allergens get a filter chip — the ones people actually filter on. */
export const FILTERABLE_ALLERGENS = ['gluten', 'lactose', 'eggs', 'nuts', 'fish', 'crustaceans', 'mollusks'];
export const FILTERABLE_DIETS = ['vegetarian', 'vegan', 'glutenfree'];

export const WEEKDAYS = {
  es: ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'],
  it: ['Domenica', 'Lunedì', 'Martedì', 'Mercoledì', 'Giovedì', 'Venerdì', 'Sabato'],
  en: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
  de: ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag']
};

/** Look up a key, falling back to Spanish then to the key itself. */
export function t(key, lang, vars) {
  const entry = T[key];
  let s = entry ? (entry[lang] ?? entry[DEFAULT_LANG] ?? '') : key;
  if (vars) {
    for (const [k, v] of Object.entries(vars)) s = s.replaceAll('{' + k + '}', String(v));
  }
  return s;
}

/** Menu data allows either a plain string or a {lang: string} map. */
export function localise(value, lang) {
  if (value == null) return '';
  if (typeof value === 'string') return value;
  return value[lang] ?? value[DEFAULT_LANG] ?? Object.values(value)[0] ?? '';
}
