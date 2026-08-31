/* All user-facing copy. Order of languages everywhere: es, it, en, de. */

export const LANGS = ['es', 'it', 'en', 'de'];
export const DEFAULT_LANG = 'es';

/* How each language is named *in* each language. The order that reaches
   WhatsApp is written in the restaurant's language, and one of its lines says
   which language the diner is reading in — so the floor knows how to greet
   them. That line needs "alemán", not "Deutsch". */
export const LANG_NAMES = {
  es: { es: 'español', it: 'spagnolo', en: 'Spanish', de: 'Spanisch' },
  it: { es: 'italiano', it: 'italiano', en: 'Italian', de: 'Italienisch' },
  en: { es: 'inglés', it: 'inglese', en: 'English', de: 'Englisch' },
  de: { es: 'alemán', it: 'tedesco', en: 'German', de: 'Deutsch' }
};

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

  /* novedades */
  newsTitle: { es: 'Novedades', it: 'Novità', en: "What's new", de: 'Neu bei uns' },
  newsLede: {
    es: 'Lo último que ha entrado en la carta. Se queda aquí hasta que deja de ser nuevo.',
    it: 'Le ultime entrate nel menu. Restano qui finché non smettono di essere una novità.',
    en: 'The latest additions to the menu. They stay here until they are no longer new.',
    de: 'Die neuesten Gerichte auf der Karte. Sie bleiben hier, bis sie nicht mehr neu sind.'
  },

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
    es: 'Es tu selección, no un pedido. Enséñasela al camarero cuando venga a tomar nota.',
    it: 'È la tua selezione, non un ordine. Mostrala al cameriere quando viene a prendere la comanda.',
    en: 'This is your selection, not an order. Show it to the waiter when they come to take it.',
    de: 'Das ist Ihre Auswahl, keine Bestellung. Zeigen Sie sie dem Kellner bei der Aufnahme.'
  },
  total: { es: 'Total', it: 'Totale', en: 'Total', de: 'Gesamt' },
  clear: { es: 'Vaciar', it: 'Svuota', en: 'Clear', de: 'Leeren' },
  /* The send button names the destination, not the app: what the diner needs
     to know is whether this reaches the kitchen at their table or goes on the
     takeaway list. The WhatsApp mark stays on the button so nobody is
     surprised when the chat opens. */
  sendKitchen: {
    es: 'Enviar pedido a cocina',
    it: 'Invia l’ordine in cucina',
    en: 'Send order to the kitchen',
    de: 'Bestellung an die Küche'
  },
  sendTakeaway: {
    es: 'Enviar pedido para llevar',
    it: 'Invia ordine da asporto',
    en: 'Send takeaway order',
    de: 'Bestellung zum Mitnehmen'
  },
  /* La salida para quien no tiene WhatsApp. Sentado en el local, la pantalla
     es el pedido: se la enseña al camarero y ya está. Desde fuera no hay
     camarero a quien enseñársela, así que lo que sirve es copiarlo o llamar. */
  showWaiter: {
    es: 'No tengo WhatsApp · mostrar al camarero',
    it: 'Non ho WhatsApp · mostra al cameriere',
    en: 'No WhatsApp · show it to the waiter',
    de: 'Kein WhatsApp · dem Kellner zeigen'
  },
  showTakeaway: {
    es: 'No tengo WhatsApp · ver y copiar el pedido',
    it: 'Non ho WhatsApp · vedi e copia l’ordine',
    en: 'No WhatsApp · view and copy the order',
    de: 'Kein WhatsApp · Bestellung ansehen und kopieren'
  },
  boardHintTable: {
    es: 'Enseña esta pantalla al camarero. Está en español, como la lee cocina.',
    it: 'Mostra questo schermo al cameriere. È in spagnolo, come lo legge la cucina.',
    en: 'Show this screen to the waiter. It is in Spanish, the way the kitchen reads it.',
    de: 'Zeigen Sie diesen Bildschirm dem Kellner. Er ist auf Spanisch, so wie die Küche ihn liest.'
  },
  boardHintTakeaway: {
    es: 'Copia el pedido y mándanoslo como prefieras, o llámanos y te lo tomamos.',
    it: 'Copia l’ordine e mandacelo come preferisci, oppure chiamaci.',
    en: 'Copy the order and send it however you like, or call us and we will take it.',
    de: 'Kopieren Sie die Bestellung und schicken Sie sie, wie Sie mögen, oder rufen Sie uns an.'
  },
  boardTakeaway: {
    es: 'Pedido para llevar',
    it: 'Ordine da asporto',
    en: 'Takeaway order',
    de: 'Zum Mitnehmen'
  },
  copyOrder: { es: 'Copiar pedido', it: 'Copia ordine', en: 'Copy order', de: 'Bestellung kopieren' },
  orderCopied: { es: 'Pedido copiado', it: 'Ordine copiato', en: 'Order copied', de: 'Bestellung kopiert' },
  callUs: { es: 'Llamar al restaurante', it: 'Chiama il ristorante', en: 'Call the restaurant', de: 'Restaurant anrufen' },
  add: { es: 'Añadir', it: 'Aggiungi', en: 'Add', de: 'Hinzufügen' },
  added: { es: 'Añadido a tu selección', it: 'Aggiunto alla selezione', en: 'Added to your selection', de: 'Zur Auswahl hinzugefügt' },
  increase: { es: 'Añadir uno', it: 'Aggiungi uno', en: 'Add one', de: 'Eins mehr' },
  decrease: { es: 'Quitar uno', it: 'Togli uno', en: 'Remove one', de: 'Eins weniger' },
  /* table service */
  tableLabel: { es: 'Mesa', it: 'Tavolo', en: 'Table', de: 'Tisch' },
  /* No longer "change it if it is wrong" — there is nothing to change. The
     way out of a wrong number is a person, and saying so is what stops
     someone hunting for a field that is not there. */
  tableFromQr: {
    es: 'Leída del QR de tu mesa. Si no es la tuya, dínoslo antes de enviar.',
    it: 'Letto dal QR del tuo tavolo. Se non è il tuo, dillo prima di inviare.',
    en: 'Read from your table’s QR code. If it is not yours, tell us before sending.',
    de: 'Vom QR-Code Ihres Tisches gelesen. Stimmt er nicht, sagen Sie uns vor dem Senden Bescheid.'
  },
  /* Without a table this is a takeaway order, and someone sitting in the
     dining room needs to be told how to change that — otherwise their lunch
     quietly joins the takeaway list. The QR on their own table is the answer,
     and the only one. */
  tableAsk: {
    es: '¿Estás en el local? Escanea el QR de tu mesa y el pedido irá a cocina.',
    it: 'Sei nel locale? Inquadra il QR del tuo tavolo e l’ordine andrà in cucina.',
    en: 'In the restaurant? Scan the QR code on your table and the order goes to the kitchen.',
    de: 'Sind Sie im Lokal? Scannen Sie den QR-Code auf Ihrem Tisch, dann geht die Bestellung in die Küche.'
  },
  trayDisclaimerTable: {
    es: 'Al enviarlo nos llega tu mesa y lo que habéis elegido. Te lo confirmamos en sala antes de ponerlo en marcha.',
    it: 'Inviandolo ci arrivano il tuo tavolo e quello che avete scelto. Te lo confermiamo in sala prima di procedere.',
    en: 'Sending it tells us your table and what you have chosen. We will confirm it at the table before starting.',
    de: 'Beim Senden erhalten wir Ihren Tisch und Ihre Auswahl. Wir bestätigen sie am Tisch, bevor es losgeht.'
  },
  waIntroOrder: {
    es: 'Hola, estamos en la {mesa} y nos gustaría pedir:',
    it: 'Ciao, siamo al {mesa} e vorremmo ordinare:',
    en: 'Hello, we are at {mesa} and would like to order:',
    de: 'Hallo, wir sitzen an {mesa} und möchten bestellen:'
  },
  waOutroOrder: {
    es: '(Enviado desde la carta digital. Esperamos vuestra confirmación.)',
    it: '(Inviato dal menu digitale. Attendiamo conferma.)',
    en: '(Sent from the digital menu. Awaiting your confirmation.)',
    de: '(Über die digitale Karte gesendet. Wir warten auf Ihre Bestätigung.)'
  },

  trayDisclaimerTakeaway: {
    es: 'Pedido para llevar. Se abre WhatsApp con tu selección y te confirmamos por ahí a qué hora lo tienes listo.',
    it: 'Ordine da asporto. Si apre WhatsApp con la tua selezione e ti confermiamo lì a che ora sarà pronto.',
    en: 'Takeaway order. WhatsApp opens with your selection and we confirm there when it will be ready.',
    de: 'Bestellung zum Mitnehmen. WhatsApp öffnet sich mit Ihrer Auswahl; wann sie fertig ist, bestätigen wir dort.'
  },
  waDinerLanguage: {
    es: '(El cliente lee la carta en {idioma}.)',
    it: '(Il cliente legge il menu in {idioma}.)',
    en: '(The diner is reading the menu in {idioma}.)',
    de: '(Der Gast liest die Karte auf {idioma}.)'
  },
  waIntroTakeaway: {
    es: 'Hola, me gustaría hacer este pedido para llevar:',
    it: 'Ciao, vorrei fare questo ordine da asporto:',
    en: 'Hello, I would like to place this takeaway order:',
    de: 'Hallo, ich möchte diese Bestellung zum Mitnehmen aufgeben:'
  },
  waOutroTakeaway: {
    es: '(Pedido para llevar desde la carta digital. Decidme a qué hora puedo pasar a recogerlo.)',
    it: '(Ordine da asporto dal menu digitale. Ditemi a che ora posso passare a ritirarlo.)',
    en: '(Takeaway order from the digital menu. Let me know what time I can collect it.)',
    de: '(Bestellung zum Mitnehmen über die digitale Karte. Sagen Sie mir bitte, wann ich sie abholen kann.)'
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
