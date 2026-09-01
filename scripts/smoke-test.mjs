/**
 * Prueba de humo: abre la carta en un navegador de verdad y comprueba las
 * cosas que se romperían en silencio.
 *
 *     npm run test
 *
 * Necesita Chromium y playwright-core:
 *
 *     npm install --no-save playwright-core
 *     # y un Chromium: la variable CHROMIUM apunta al ejecutable, o se usa
 *     # el del sistema (/usr/bin/chromium, Chrome en Mac/Windows...)
 *
 * Sin ellos avisa y no falla: la validación de datos (`npm run check`) no
 * depende de esto y sigue siendo lo que bloquea el despliegue.
 *
 * Por qué existe: todo lo de aquí se comprobó a mano al construirlo, y a mano
 * no se vuelve a comprobar. Son fallos que no dan error en consola ni rompen
 * la página — simplemente el pedido llega en el idioma equivocado, o el
 * carrusel se queda en español, o la mesa se puede escribir a mano otra vez.
 */
import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const PORT = Number(process.env.PORT ?? 8399);
const BASE = `http://127.0.0.1:${PORT}/`;

const CHROMIUM = [
  process.env.CHROMIUM,
  '/opt/pw-browsers/chromium',
  '/usr/bin/chromium',
  '/usr/bin/chromium-browser',
  '/usr/bin/google-chrome',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
].find((p) => p && existsSync(p));

let chromium;
try {
  ({ chromium } = await import('playwright-core'));
} catch {
  console.log('· playwright-core no está instalado; me salto la prueba de humo.');
  console.log('  npm install --no-save playwright-core');
  process.exit(0);
}
if (!CHROMIUM) {
  console.log('· no encuentro Chromium; me salto la prueba de humo.');
  console.log('  CHROMIUM=/ruta/al/chromium npm run test');
  process.exit(0);
}

/* ------------------------------------------------------------------ *
 * andamiaje
 * ------------------------------------------------------------------ */

let fallos = 0;
let pruebas = 0;

function comprueba(titulo, real, esperado) {
  pruebas++;
  const ok = typeof esperado === 'function' ? esperado(real) : real === esperado;
  if (ok) {
    console.log(`  ✓ ${titulo}`);
  } else {
    fallos++;
    console.log(`  ✗ ${titulo}`);
    console.log(`      esperaba: ${typeof esperado === 'function' ? '(condición)' : JSON.stringify(esperado)}`);
    console.log(`      recibido: ${JSON.stringify(real)}`);
  }
}

const server = spawn('python3', ['-m', 'http.server', String(PORT), '--bind', '127.0.0.1'], {
  cwd: ROOT, stdio: 'ignore'
});
const cierra = () => { try { server.kill(); } catch { /* ya estaba muerto */ } };
process.on('exit', cierra);

/* esperar a que el servidor responda, en vez de dormir a ciegas */
for (let intento = 0; intento < 50; intento++) {
  try { await fetch(BASE); break; } catch { await new Promise((r) => setTimeout(r, 100)); }
}

const browser = await chromium.launch({ executablePath: CHROMIUM, args: ['--no-sandbox'] });

/** Abre la carta, añade platos y devuelve la página lista para interrogar. */
async function abre(query = '', { platos = 1 } = {}) {
  const ctx = await browser.newContext({
    viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, locale: 'es-ES'
  });
  const page = await ctx.newPage();
  const errores = [];
  page.on('pageerror', (e) => errores.push(e.message));
  page.on('console', (m) => { if (m.type() === 'error') errores.push(m.text()); });

  await page.goto(BASE + query, { waitUntil: 'networkidle' });
  await page.waitForSelector('.card');
  for (let i = 0; i < platos; i++) {
    await page.evaluate((n) => document.querySelectorAll('.add')[n]?.click(), i);
  }
  if (platos) await page.waitForTimeout(300);
  return { ctx, page, errores };
}

const mensajeWhatsApp = (page) => page.evaluate(() => {
  const href = document.querySelector('#traySend').getAttribute('href') ?? '';
  try { return decodeURIComponent(new URL(href).searchParams.get('text') ?? ''); } catch { return ''; }
});

/* ------------------------------------------------------------------ *
 * las pruebas
 * ------------------------------------------------------------------ */

console.log('\nPedido en mesa (QR ?mesa=s1)');
{
  const { ctx, page, errores } = await abre('?mesa=s1');
  const estado = await page.evaluate(() => ({
    modo: document.querySelector('#tray').dataset.mode,
    boton: document.querySelector('#traySendLabel').textContent,
    mesa: document.querySelector('#tableValue').textContent,
    editables: document.querySelectorAll('#tray input, #tray [contenteditable="true"]').length
  }));
  comprueba('el modo es "mesa"', estado.modo, 'mesa');
  comprueba('el botón manda a cocina', estado.boton, 'Enviar pedido a cocina');
  comprueba('el sello lleva la mesa del QR', estado.mesa, 'S1');
  comprueba('la mesa no se puede escribir', estado.editables, 0);
  comprueba('el mensaje nombra la mesa', await mensajeWhatsApp(page), (t) => t.includes('Mesa S1'));
  comprueba('sin errores de consola', errores, (e) => e.length === 0);
  await ctx.close();
}

console.log('\nPedido para llevar (sin QR)');
{
  const { ctx, page } = await abre('');
  const estado = await page.evaluate(() => ({
    modo: document.querySelector('#tray').dataset.mode,
    boton: document.querySelector('#traySendLabel').textContent,
    mesa: document.querySelector('#tableValue').textContent
  }));
  comprueba('el modo es "llevar"', estado.modo, 'llevar');
  comprueba('el botón dice para llevar', estado.boton, 'Enviar pedido para llevar');
  comprueba('no hay mesa que enseñar', estado.mesa, '');
  comprueba('el mensaje pide hora de recogida', await mensajeWhatsApp(page), (t) => t.includes('recogerlo'));
  await ctx.close();
}

console.log('\nUna mesa inventada en la URL no cuela');
{
  const { ctx, page } = await abre('?mesa=<script>x');
  comprueba('cae a "llevar"', await page.evaluate(() => document.querySelector('#tray').dataset.mode), 'llevar');
  await ctx.close();
}

console.log('\nEl pedido llega en el idioma del restaurante, no en el del cliente');
{
  const { ctx, page } = await abre('?mesa=s1&lang=de');
  const texto = await mensajeWhatsApp(page);
  comprueba('el saludo va en español', texto, (t) => t.startsWith('Hola, estamos en la Mesa S1'));
  comprueba('nada de alemán en la cabecera', texto, (t) => !t.includes('Hallo'));
  comprueba('avisa del idioma del cliente', texto, (t) => t.includes('lee la carta en alemán'));
  /* \s y no " ": Intl separa la cifra del € con un espacio duro (U+00A0), así
     que buscar un espacio normal aquí no encuentra nada. */
  comprueba('el precio va en formato español', texto, (t) => /\d,\d{2}\s€/u.test(t));
  await ctx.close();
}

console.log('\nLa cesta vacía no deja enviar');
{
  const { ctx, page } = await abre('?mesa=s1', { platos: 0 });
  const estado = await page.evaluate(() => ({
    desactivado: document.querySelector('#traySend').getAttribute('aria-disabled'),
    href: document.querySelector('#traySend').getAttribute('href')
  }));
  comprueba('el botón está desactivado', estado.desactivado, 'true');
  comprueba('y no lleva a ningún sitio', estado.href, '#');
  await ctx.close();
}

console.log('\nLa salida sin WhatsApp: el pedido en pantalla');
{
  const { ctx, page } = await abre('?mesa=s1&lang=de', { platos: 2 });
  await page.click('#trayToggle');
  await page.click('#trayShow');
  await page.waitForTimeout(300);
  const pizarra = await page.evaluate(() => ({
    abierta: document.querySelector('#orderBoard').open,
    mesa: document.querySelector('#boardTitle').textContent,
    donde: document.querySelector('#boardWhere').textContent,
    lineas: document.querySelectorAll('.board__line').length,
    primerPlato: document.querySelector('.board__dish')?.textContent ?? '',
    pista: document.querySelector('#boardHint').textContent,
    total: document.querySelector('#boardTotalLabel').textContent,
    llamar: !document.querySelector('#boardCall').hidden
  }));
  comprueba('se abre', pizarra.abierta, true);
  comprueba('con la mesa en grande', pizarra.mesa, 'Mesa S1');
  comprueba('encabezada para el camarero, en español', pizarra.donde, (t) => t.startsWith('Comanda'));
  comprueba('lista los dos platos', pizarra.lineas, 2);
  comprueba('el plato va en español', pizarra.primerPlato, (s) => s.startsWith('Bruschetta'));
  comprueba('la instrucción va en alemán', pizarra.pista, (s) => s.includes('Kellner'));
  comprueba('el total también en español', pizarra.total, 'Total');
  comprueba('sentado en el local no ofrece llamar', pizarra.llamar, false);
  await ctx.close();
}

console.log('\nLa misma pantalla, pero para llevar');
{
  const { ctx, page } = await abre('', { platos: 1 });
  await page.click('#trayToggle');
  await page.click('#trayShow');
  await page.waitForTimeout(300);
  const pizarra = await page.evaluate(() => ({
    donde: document.querySelector('#boardWhere').textContent,
    llamar: !document.querySelector('#boardCall').hidden,
    telefono: document.querySelector('#boardCall').getAttribute('href')
  }));
  comprueba('se anuncia como para llevar', pizarra.donde, 'Pedido para llevar');
  comprueba('ofrece llamar, que aquí no hay camarero', pizarra.llamar, true);
  comprueba('y el teléfono es marcable', pizarra.telefono, (h) => /^tel:\+?\d{6,}$/.test(h));
  await ctx.close();
}

console.log('\nAlérgenos sin confirmar: no se deduce nada');
{
  const { ctx, page } = await abre('', { platos: 0 });
  const estado = await page.evaluate(() => {
    /* el risotto declara solo lactosa; sin la marca de revisión, la carta
       deduciría «sin gluten» de una suposición */
    const card = document.querySelector('#item-risotto-setas');
    card.querySelector('.card__more').click();
    return new Promise((r) => setTimeout(() => r({
      insignias: [...document.querySelectorAll('#dishBody .badge')].map((b) => b.textContent),
      aviso: document.querySelector('.dish__unconfirmed')?.textContent ?? ''
    }), 200));
  });
  comprueba('no se anuncia sin gluten', estado.insignias, (b) => !b.includes('Sin gluten'));
  comprueba('y la ficha lo dice', estado.aviso, (t) => t.includes('pendiente de confirmar'));
  await ctx.close();
}

console.log('\nAlérgenos sin confirmar: fuera del filtro de celíacos');
{
  const { ctx, page } = await abre('', { platos: 0 });
  const visible = await page.evaluate(() => {
    document.querySelector('[data-allergen="gluten"]').click();
    return new Promise((r) => setTimeout(() => r({
      risotto: !!document.querySelector('#item-risotto-setas'),
      quedan: document.querySelectorAll('.card').length
    }), 300));
  });
  comprueba('el risotto se retira', visible.risotto, false);
  comprueba('pero la carta no se vacía', visible.quedan, (n) => n > 10);
  await ctx.close();
}

console.log('\nLa nota del comensal viaja con el pedido');
{
  const { ctx, page } = await abre('?mesa=s1', { platos: 1 });
  await page.click('#trayToggle');
  await page.fill('#notesInput', 'Sin cebolla,\npor favor');
  await page.waitForTimeout(300);
  const texto = await mensajeWhatsApp(page);
  comprueba('llega en el mensaje', texto, (t) => t.includes('Sin cebolla, por favor'));
  comprueba('rotulada en español', texto, (t) => t.includes('Indicaciones del cliente'));
  comprueba('sin saltos de línea que partan la comanda', texto, (t) => !/Sin cebolla,\n/.test(t));
  await page.click('#trayShow');
  await page.waitForTimeout(300);
  const enPizarra = await page.evaluate(() => document.querySelector('#boardNotes').textContent);
  comprueba('y también en la pizarra', enPizarra, (t) => t.includes('Sin cebolla'));
  await ctx.close();
}

console.log('\nEl carrusel de categorías cambia de idioma');
{
  for (const [lang, primera] of [['it', 'Antipasti'], ['en', 'Starters'], ['de', 'Vorspeisen'], ['es', 'Empezar']]) {
    const { ctx, page } = await abre(`?lang=${lang}`, { platos: 0 });
    const rail = await page.evaluate(() => document.querySelector('.rail__link')?.textContent);
    comprueba(`[${lang}] la primera categoría`, rail, primera);
    await ctx.close();
  }
}

console.log('\nLa carta entera está ahí');
{
  const { ctx, page } = await abre('', { platos: 0 });
  const conteo = await page.evaluate(() => ({
    secciones: document.querySelectorAll('.section').length,
    platos: document.querySelectorAll('.card').length,
    sinFoto: [...document.querySelectorAll('.card--photo')].filter((c) => !c.querySelector('img')).length
  }));
  comprueba('15 secciones', conteo.secciones, 15);
  comprueba('todas las tarjetas de plato traen foto', conteo.sinFoto, 0);
  comprueba('hay platos de sobra', conteo.platos, (n) => n > 80);
  await ctx.close();
}

await browser.close();
cierra();

console.log(`\n${pruebas - fallos}/${pruebas} comprobaciones pasan`);
if (fallos) {
  console.log(`${fallos} fallan.`);
  process.exit(1);
}
