# Pasta y Gofio — carta digital

Relanzamiento de la carta de **Pasta y Gofio**, trattoria y pizzería en La Aldea
de San Nicolás de Tolentino (Gran Canaria).

Sitio estático, sin dependencias, sin build. Se sirve tal cual está en el
repositorio.

---

## Qué trae

**Sugerencias del día.** Un menú entero que se arma solo cada día: entrante,
pasta o ravioli, carne o pescado, pizza y el vino que mejor le va. No hay
servidor — la elección se deriva de la fecha, así que todos los comensales ven
lo mismo el mismo día y sigue funcionando sin conexión.

Y es un turno de verdad, no un sorteo: cada categoría recorre su lista entera
antes de repetir ninguno, así que ningún plato se queda sin salir y ninguno
sale dos días seguidos. Cocina puede fijar a mano la selección de una fecha
concreta en `data/daily.json`.

**Novedades.** Banda propia, debajo y separada del menú del día: platos nuevos
y promociones, que se quedan ahí hasta que cocina los retira de `featured`.
Nunca se mezclan con las sugerencias — un plato que esté en novedades no sale
en el turno diario, y en cuanto se retira de ahí entra en él solo. Si no hay
ninguna, la banda entera desaparece.

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

**Pensada para el móvil primero.** Que es como se lee: alguien de pie con el
teléfono en una mano. La cabecera se queda en una sola fila y ocupa 164 px de
844 en lugar de 209. Cada plato lleva su foto a todo el ancho —356×237 en un
móvil de 390— y la foto va a la deriva dentro de su marco mientras la tarjeta
cruza la pantalla, así que la lista tiene profundidad en vez de ser un
catálogo. Y cuando hay algo elegido aparece abajo una barra con el número de
platos y el total, para no tener que subir 94 platos hasta el icono de la
cesta.

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

> **Al tocar `assets/` o `index.html`, sube `VERSION` en `sw.js`.**
> El CSS y los módulos se sirven desde caché primero, y el navegador solo
> reinstala el service worker cuando ese archivo cambia. Sin subirlo, quien ya
> tenga la carta abierta alguna vez se queda con la versión anterior para
> siempre. El cambio llega a la segunda visita: la página que dispara la
> reinstalación ya se cargó con la hoja de estilos vieja.

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

## El QR de la carta

```bash
pip install segno
npm run qr        # -> dist/qr-carta.svg, .png y .html
```

`dist/qr-carta.html` se abre en el navegador y se imprime: la primera página
trae cuatro tarjetas de mesa a media A5, la segunda un cartel para la puerta o
la barra. El aviso de arriba no sale impreso. El `.svg` y el `.png` son el
código a secas, por si hay que meterlo en un flyer, en Instagram o en la carta
de papel.

Si algún día cambia el dominio, se regenera con `npm run qr -- --url https://…`
y se vuelve a imprimir; el QR no es más que un enlace escrito de otra forma.

**Al recortar y al pegarlo en cualquier sitio, respeta los tres cuadrados de
las esquinas.** Son los localizadores: tapar aunque sea uno impide que el
lector encuentre el código, por muy alta que sea la corrección de errores.
Una mancha en el centro, en cambio, no molesta — medido, aguanta hasta un 14 %
del código cubierto, y se lee impreso incluso a 20 mm de lado.

---

## El pedido: en mesa o para llevar

La cesta se envía por WhatsApp, y hay **dos clases de pedido**. Las distingue
una sola cosa: si sabemos la mesa.

| | El botón dice | El mensaje empieza |
|---|---|---|
| **Con mesa** | Enviar pedido a cocina | «Hola, estamos en la Mesa S1 y nos gustaría pedir:» |
| **Sin mesa** | Enviar pedido para llevar | «Hola, me gustaría hacer este pedido para llevar:» y pide hora de recogida |

**El número de mesa no se puede escribir.** Entra solo al escanear el QR de esa
mesa (`…/?mesa=S1`) y en la cesta se enseña como un sello, sin campo que tocar:
así nadie manda comida a una mesa en la que no está sentado, y un pedido que
dice S1 salió de verdad de un teléfono en la S1. Si el número no cuadra, lo
arregla el camarero, y el aviso lo dice: «si no es la tuya, dínoslo antes de
enviar».

Sin mesa el pedido es para llevar, y a quien esté sentado en el local se le
explica el único camino de vuelta: escanear el QR de su mesa.

De quién es el pedido no hace falta preguntarlo: llega por su propio WhatsApp.

Ojo con lo que esto **no** es: el parámetro sigue viviendo en la URL, así que
quien quiera puede teclear `?mesa=S7` a mano. Quitar el campo evita el error
tonto y el cambio de última hora, no a alguien decidido — el control de verdad
sigue siendo que en sala se confirma el pedido antes de ponerlo en marcha.

La mesa se guarda en `sessionStorage`, no en `localStorage`: al cerrar la
pestaña se olvida, para que quien escaneó en el local y luego abre la carta
desde casa no siga siendo la mesa S1. Al compartir el enlace, el número se
retira.

Los QR por mesa se generan con vuestra numeración (S1-S11 salón, T1-T12
terraza):

```bash
npm run qr:mesas -- --url https://straycoderx.github.io/PastaYGofio/
# -> dist/qr-mesas.html   agrupado por zona, listo para imprimir y recortar
```

**Cada código lleva su mesa sellada en el centro**, y el color separa las zonas
(verde el salón, terracota la terraza). Veintitrés cuadrados en blanco y negro
son idénticos a ojo: sin el sello, en cuanto se recortan y se mezclan no hay
manera de saber cuál va a qué mesa, ni de comprobar después que nadie los
movió.

El script **lee de vuelta los 23** y verifica que cada uno apunta a su mesa; si
alguno fallara, aborta en vez de dejarte imprimir cartulina para nada. Necesita
`pip install zxing-cpp Pillow`. Sin ellos avisa y genera igual, sin comprobar.

**Lo que WhatsApp no resuelve** y conviene tener hablado en sala: quién vigila
el buzón en hora punta, cómo se confirma al comensal que su pedido ha entrado,
y qué pasa con las modificaciones («sin cebolla»). Los dos mensajes avisan de
que se confirma antes de ponerlo en marcha, pero eso es una promesa que hay que
cumplir a mano.

Para volver a dejar la cesta como simple selección para enseñar al camarero:
`data/restaurant.json` → `service.ordering` a `false`, y desaparecen el campo
de mesa y el botón.

---

## Despliegue

### GitHub Pages

La carta está publicada en **https://straycoderx.github.io/PastaYGofio/**, gratis
y con HTTPS. `.github/workflows/deploy.yml` valida los datos y publica en cada
push a la rama por defecto; si la validación falla, no se publica nada.

El sitio se sirve desde una subruta (`/PastaYGofio/`) y todas las rutas del
proyecto son relativas, así que funciona igual ahí que en la raíz de un dominio
propio: comprobado con el service worker, el manifiesto, las fotos y los enlaces
directos a plato.

Solo se publica el sitio, no el repositorio: el workflow prepara un `_site` con
`index.html`, `404.html`, el manifiesto, el service worker, `assets/` y `data/`.
Los scripts, la configuración de CI y los fragmentos de servidor se quedan fuera.

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

- **Pizza Estrella: alérgenos y gajos.** Declara gluten y lactosa, como el
  resto de pizzas. Es el plato donde más importa confirmarlo, porque los gajos
  cambian: si algún día lleva frutos secos, anchoas o marisco, hay que
  añadirlos a `allergens` ese mismo día o el filtro de alérgenos dirá que es
  apto para alguien que no puede comerlo.

- **Maridajes.** Los `pairing` de cada plato son sugerencias nuestras sobre la
  bodega real de la casa. Ajústalos a criterio de sala.
- **Alérgenos de la carta original.** «Salsa de tomate» y «Risotto con setas»
  no declaraban ninguno en la versión anterior. Aquí se han añadido gluten y
  lactosa respectivamente por ser lo esperable, pero conviene confirmarlo en
  cocina.
- **Fecha del descargo legal.** El texto dice «precios válidos hasta diciembre
  de 2026» (`disclaimer` en `assets/js/i18n.js`). La carta anterior seguía
  diciendo 2025.
