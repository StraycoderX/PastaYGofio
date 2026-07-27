# Pasta y Gofio — carta digital

Relanzamiento de la carta de **Pasta y Gofio**, trattoria y pizzería en La Aldea
de San Nicolás de Tolentino (Gran Canaria).

Sitio estático, sin dependencias, sin build. Se sirve tal cual está en el
repositorio.

---

## Qué trae

**Sugerencias del día.** Una selección — entrante, plato, pizza, postre — que
cambia sola cada día y propone el vino que mejor le va. No hay servidor: la
elección se deriva de la fecha con un hash estable, así que todos los comensales
ven lo mismo el mismo día y sigue funcionando sin conexión. Cocina puede fijar a
mano la selección de una fecha concreta en `data/daily.json`.

**Abierto / cerrado en vivo.** La cabecera calcula el estado real desde los
horarios (`Atlantic/Canary`, no la zona del visitante): «Abierto · cierra a las
23:00», «Cierra en 20 min», «Cerrado · abre miércoles a las 19:00». Los tramos
viven en `data/restaurant.json`; miércoles y jueves solo cenas.

**Filtro de alérgenos.** Ocultar todo lo que lleve gluten, lactosa, huevo,
frutos secos, pescado, crustáceos o moluscos; o quedarse solo con lo
vegetariano, vegano o sin gluten. El filtro se guarda entre visitas —
para alguien celíaco, entrar y ver ya solo lo que puede comer.

**Mi selección.** Se van tocando platos y se ve el total. Es una selección, no
un pedido: sirve para enseñársela al camarero cuando venga a tomar nota.

**Cuatro idiomas** (es · it · en · de) con detección automática y URL
compartible. El buscador indexa **todos** los idiomas a la vez y es
insensible a acentos: `noquis` encuentra «Ñoquis», y un alemán puede escribir
`gnocchi` con la carta en alemán.

**Funciona sin conexión.** PWA instalable con service worker. En un valle con
cobertura irregular, la carta abre igual después de escanear el QR una vez.

Además: modo claro/oscuro, enlaces directos a cada plato (`?dish=…`), maridajes,
alérgenos y nutrición por plato, hoja de estilos de impresión, teclado y
lectores de pantalla, y respeto por `prefers-reduced-motion`.

---

## Estructura

```
index.html               una sola página, sin build
manifest.webmanifest     PWA
sw.js                    caché offline (solo mismo origen)
assets/
  css/app.css            design system: tokens, claro/oscuro, responsive
  css/fonts.css          @font-face locales
  fonts/                 Fraunces + Inter (woff2, latin + latin-ext)
  js/                    módulos ES, sin dependencias
    main.js              arranque y eventos
    ui.js                todo el renderizado
    model.js             normaliza el JSON crudo
    daily.js             sugerencias del día
    hours.js             abierto/cerrado
    store.js             preferencias + «mi selección»
    dom.js               helpers seguros (nunca innerHTML)
    i18n.js              todos los textos
  img/dishes/            fotos e ilustraciones de platos
data/
  menu.json              la carta
  restaurant.json        horarios, contacto, dirección
  daily.json             rotación de sugerencias
deploy/                  cabeceras para nginx / Apache
scripts/                 validación y migración
```

---

## Editar la carta

Todo vive en `data/menu.json`. Un plato:

```jsonc
{
  "id": "bruschetta-teror",            // único en toda la carta; es el enlace directo
  "name":        { "es": "…", "it": "…", "en": "…", "de": "…" },
  "description": { "es": "…", "it": "…", "en": "…", "de": "…" },
  "price": { "amount": 7.5 },          // o { "medium": 8.5, "large": 11.5 }
                                       // o { "glass": 3.8, "bottle": 18.5 }
  "allergens": ["gluten", "lactose"],  // claves del Reglamento (UE) 1169/2011
  "diet": ["vegetarian"],              // vegetarian | vegan | spicy | glutenfree
  "nutrition": { "calories": 420, "fat": 24, "carbohydrates": 38, "protein": 16 },
  "image": "bruschetta-teror.webp",    // archivo dentro de assets/img/dishes/
  "pairing": "tinto-canario",          // id de un vino de la carta
  "tags": ["signature", "local"]       // De la casa / Producto canario / Para compartir
}
```

Después de tocar cualquier archivo de `data/`:

```bash
npm run check      # valida datos + lista de caché offline
```

La validación **bloquea el despliegue** si encuentra un alérgeno mal escrito, un
precio negativo, un id duplicado, una traducción que falta, una imagen que no
existe o un plato marcado como vegano que declara lactosa.

`glutenfree` no hace falta ponerlo: se deduce de que el plato declare alérgenos y
que entre ellos no esté el gluten. Ojo: un plato **sin** alérgenos declarados no
cuenta como sin gluten, se considera desconocido.

### Volcar de nuevo desde el sitio antiguo

`data/menu.json` contiene la carta real, transcrita de la versión publicada en
julio de 2026: 49 platos, 15 categorías y las fotos de esa misma carta. Si en
algún momento hay que volver a partir del `menu.json` antiguo, el conversor
sigue disponible:

```bash
node scripts/migrate-legacy-menu.mjs menu-antiguo.json > data/menu.json
cp -r /ruta/al/sitio/antiguo/images/* assets/img/dishes/
npm run check:data
```

Avisa por stderr de todo lo que hay que revisar a mano (traducciones que
faltaban, categorías sin color asignado). Los campos que el formato viejo no
tenía — `diet`, `tags`, `pairing` — se añaden después.

---

## Desarrollo

```bash
npm start          # http://localhost:8080
npm run check
```

No hay compilación ni `node_modules` en producción: Node solo se usa para los
scripts de validación.

### Carta en un solo archivo

```bash
npm run build:single    # -> dist/carta.html (~3 MB, fotos incluidas)
```

Empaqueta todo — CSS, fuentes, ilustraciones, datos y JavaScript — en un único
HTML sin ninguna petición de red. Se abre con doble clic desde una memoria USB,
se manda por correo o se deja en la tablet de la barra: funciona igual sin
internet. Útil también para enseñar la carta a alguien sin desplegar nada.

---

## Pedido en mesa (preparado, sin activar)

`data/restaurant.json` → `service.ordering` está en `false`. Poniéndolo en
`true` la cesta gana dos cosas:

- **Número de mesa.** Cada mesa lleva su propio QR apuntando a `…/?mesa=S1`.
  La carta lo lee, lo recuerda durante la visita y lo enseña en la cesta por si
  hay que corregirlo. Se guarda en `sessionStorage`, no en `localStorage`: al
  cerrar la pestaña se olvida, para que quien abra la carta desde casa no siga
  siendo la mesa S1. Al compartir el enlace, el número se retira.
- **Envío por WhatsApp.** El mensaje se abre con la mesa —«Hola, estamos en la
  Mesa T7 y nos gustaría pedir:»— seguido de las líneas y el total.

Los códigos QR se generan ya con vuestra numeración (S1-S11 salón, T1-T12
terraza):

```bash
pip install segno
python3 scripts/make-table-qr.py --url https://tu-dominio/pastaygofio/
# -> dist/qr-mesas.html   agrupado por zona, listo para imprimir y recortar
```

Antes de activarlo conviene resolver lo que WhatsApp no cubre: quién vigila el
buzón en hora punta, cómo se confirma al comensal que su pedido ha entrado, y
qué pasa con las modificaciones («sin cebolla»). El mensaje ya avisa de que se
confirma en sala antes de ponerlo en marcha.

---

## Despliegue

### GitHub Pages

La carta se publica en **https://straycoderx.github.io/PastaYGofio/**, gratis y
con HTTPS. El workflow `.github/workflows/deploy.yml` valida los datos y publica
en cada push a la rama por defecto.

**Falta un paso manual, una sola vez.** Crear el sitio de Pages no está
permitido al token de Actions: el workflow lo intenta con
`configure-pages: enablement: true` y GitHub responde *«Resource not accessible
by integration»*. Hay que darlo de alta a mano:

> [Settings → Pages](https://github.com/StraycoderX/PastaYGofio/settings/pages)
> → **Build and deployment** → **Source: GitHub Actions**

Hecho eso, se relanza el último despliegue (Actions → Deploy → *Re-run all
jobs*) y a partir de ahí cada cambio en `data/menu.json` se publica solo,
siempre que pase la validación.

Todas las rutas del sitio son relativas, así que funciona igual en la subruta
`/PastaYGofio/` que en la raíz de un dominio propio: comprobado con el service
worker, el manifiesto, las fotos y los enlaces directos a plato.

### Servidor propio (etnoteam.io/pastaygofio)

Todas las rutas son relativas, así que el sitio funciona en cualquier
subdirectorio. Copia el repositorio a la carpeta y añade las cabeceras:

```bash
rsync -av --exclude '.git' --exclude 'node_modules' ./ servidor:/var/www/pastaygofio/
cp deploy/apache.htaccess /var/www/pastaygofio/.htaccess   # Apache
# o pega el bloque de deploy/headers.conf en nginx
```

Las cabeceras importan: son las que aportan `frame-ancestors`, `nosniff` y HSTS,
que un `<meta>` no puede dar. Ver [SECURITY.md](SECURITY.md).

---

## Seguridad

Revisión completa en **[SECURITY.md](SECURITY.md)**, con lo que fallaba en la
versión anterior (XSS a través de los datos de la carta, jQuery desde CDN sin
SRI, Google Fonts y el RGPD) y lo que hace esta.

En corto: cero dependencias, cero orígenes de terceros, cero `innerHTML`, CSP
estricta sin `unsafe-inline`, y los datos validados antes de llegar a un
comensal.

---

## Pendiente de revisar

- **`assets/img/logo.svg`** reproduce el logotipo (La Aldea + espiga y mazorca +
  Pasta y Gofio · Trattoria-Pizzería). Sustituir por el archivo original y
  regenerar los iconos con `scripts/` (ver historial de commits).
- **Fotos.** Cinco platos vienen de los carteles originales, a 1100-1200 px:
  Bruschetta Teror, Queso a la plancha, Tequeños, Lomo alto y Lasaña Bolognese.
  El resto se recuperó de las capturas de la carta anterior y no pasa de 450 px
  de ancho: se ven bien en la tarjeta y algo blandas en la ficha ampliada.
  Cuando haya fotos de estudio basta con dejarlas en `assets/img/dishes/` con el
  mismo nombre de archivo, sin tocar nada más.

  Las dos más justas son `tabla-quesos-mixtos` (237 px) y
  `tabla-quesos-embutidos` (236 px): son las primeras que conviene rehacer.

- **Cartel de la lasaña.** El cartel «Nueva lasaña casera» anuncia dos lasañas
  a la vez, de carne y vegetal, así que su foto no se ha usado: no está claro
  cuál de las dos muestra. Confirmadlo y se asigna.

- **Alérgenos de los platos nuevos.** Declarados por analogía con platos
  parecidos de la carta: queso → lactosa; tequeños → gluten y lactosa; lomo
  alto → gluten (igual que el entrecot). Confirmar en cocina.
- **Maridajes.** Los `pairing` de cada plato son sugerencias nuestras sobre la
  bodega real de la casa. Ajústalos a criterio de sala.
- **Alérgenos de la carta original.** «Salsa de tomate» y «Risotto con setas»
  no declaraban ninguno en la versión anterior. Aquí se han añadido gluten y
  lactosa respectivamente por ser lo esperable, pero conviene confirmarlo en
  cocina.
- **Fecha del descargo legal.** El texto dice «precios válidos hasta diciembre
  de 2026» (`disclaimer` en `assets/js/i18n.js`). La carta anterior seguía
  diciendo 2025.
