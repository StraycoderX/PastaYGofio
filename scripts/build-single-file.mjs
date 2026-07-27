#!/usr/bin/env node
/* Bundles the whole carte into one self-contained HTML file.
 *
 *   node scripts/build-single-file.mjs
 *     -> dist/carta.html      full document — open from a USB stick, email it,
 *                             keep it on the tablet behind the bar
 *     -> dist/artifact.html   body-only fragment for preview hosts that supply
 *                             their own <html>/<head> wrapper
 *
 * Nothing is minified or transformed beyond what inlining requires: the point
 * is that the bundle behaves exactly like the deployed site.
 *
 * Only the `latin` font subset is inlined. es/it/en/de need nothing outside
 * U+0000–00FF plus punctuation, so `latin-ext` would add ~145 KB for glyphs no
 * diner will ever see. */

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname, extname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = (p) => readFileSync(join(ROOT, p), 'utf8');
const readBin = (p) => readFileSync(join(ROOT, p));

const MIME = {
  '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.png': 'image/png',
  '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.avif': 'image/avif'
};

function dataUri(path) {
  const type = MIME[extname(path).toLowerCase()];
  if (!type) throw new Error(`no MIME type for ${path}`);
  /* SVG stays as text — smaller than base64 and readable in the output. */
  if (type === 'image/svg+xml') {
    const svg = read(path).replace(/\s+/g, ' ').trim();
    return `data:${type};charset=utf-8,${encodeURIComponent(svg).replace(/'/g, '%27').replace(/"/g, '%22')}`;
  }
  return `data:${type};base64,${readBin(path).toString('base64')}`;
}

/* ------------------------------------------------------------------ CSS */

const ASSET_PATHS = new Set();

function inlineCss() {
  const fonts = read('assets/css/fonts.css')
    /* drop the latin-ext @font-face blocks */
    .split(/(?=\/\* [a-z-]+ \*\/)/)
    .filter((block) => !block.includes('latin-ext'))
    .join('')
    .replace(/url\(\.\.\/fonts\/([^)]+)\)/g, (_, file) => `url(${dataUri('assets/fonts/' + file)})`);

  const app = read('assets/css/app.css')
    .replace(/url\(["']?\.\.\/img\/([^"')]+)["']?\)/g, (_, file) => {
      ASSET_PATHS.add('assets/img/' + file);
      return `url("${dataUri('assets/img/' + file)}")`;
    });

  return fonts + '\n' + app;
}

/* ------------------------------------------------------------------- JS */

/* Load order matters: a module may only depend on ones listed before it. */
const MODULES = [
  'assets/js/dom.js',
  'assets/js/i18n.js',
  'assets/js/hours.js',
  'assets/js/daily.js',
  'assets/js/store.js',
  'assets/js/model.js',
  'assets/js/ui.js',
  'assets/js/main.js'
];

function inlineJs() {
  const declared = new Map();

  const parts = MODULES.map((path) => {
    const source = read(path)
      /* strip module plumbing — after concatenation everything shares one scope */
      .replace(/^import\s[\s\S]*?from\s+'[^']+';\s*$/gm, '')
      .replace(/^export\s*\{[^}]*\}\s*;\s*$/gm, '')
      .replace(/^export\s+(?=(?:async\s+)?(?:function|class|const|let|var)\b)/gm, '');

    /* Guard against two modules declaring the same top-level name — silent
       shadowing here would be a nightmare to debug in a 300 KB file. */
    for (const [, name] of source.matchAll(/^(?:async\s+)?(?:function|class|const|let|var)\s+([A-Za-z_$][\w$]*)/gm)) {
      if (declared.has(name)) {
        throw new Error(`name collision: "${name}" declared in both ${declared.get(name)} and ${path}`);
      }
      declared.set(name, path);
    }

    return `/* ===== ${path} ===== */\n${source.trim()}\n`;
  });

  console.log(`  ${declared.size} top-level names across ${MODULES.length} modules, no collisions`);
  return parts.join('\n');
}

/* ----------------------------------------------------------------- data */

/* `<` is escaped so a stray "</script>" inside the data can never break out. */
const jsonScript = (path) =>
  `<script type="application/json" id="data:${path}">${read(path).replace(/</g, '\\u003c')}</script>`;

/* ----------------------------------------------------------------- HTML */

function build() {
  const css = inlineCss();
  const js = inlineJs();

  const html = read('index.html');
  const bodyMatch = html.match(/<body>([\s\S]*)<\/body>/);
  if (!bodyMatch) throw new Error('could not find <body> in index.html');

  let body = bodyMatch[1]
    /* the logo is the only asset referenced straight from the markup */
    .replace(/src="assets\/img\/logo\.svg"/g, `src="${dataUri('assets/img/logo.svg')}"`)
    /* the <noscript> fallback is meaningless once the script is inline */
    .replace(/<noscript>[\s\S]*?<\/noscript>/, '')
    .trim();

  /* Dish artwork is resolved at runtime by safeImage(), so hand it a map. */
  const menu = JSON.parse(read('data/menu.json'));
  const inlineAssets = {};
  for (const section of menu.sections) {
    for (const item of section.items) {
      if (!item.image) continue;
      const path = 'assets/img/dishes/' + item.image;
      inlineAssets[path] = dataUri(path);
      ASSET_PATHS.add(path);
    }
  }

  const head = [
    '<title>Pasta y Gofio · La Aldea — Carta</title>',
    `<style>\n${css}\n</style>`
  ].join('\n');

  const scripts = [
    jsonScript('data/menu.json'),
    jsonScript('data/restaurant.json'),
    jsonScript('data/daily.json'),
    `<script>window.__PYG_INLINE_ASSETS = ${JSON.stringify(inlineAssets)};</script>`,
    `<script>\n${read('assets/js/theme-init.js')}\n</script>`,
    `<script type="module">\n${js}\n</script>`
  ].join('\n');

  mkdirSync(join(ROOT, 'dist'), { recursive: true });

  /* fragment: the host supplies <html>, <head> and <body> */
  writeFileSync(join(ROOT, 'dist/artifact.html'), `${head}\n\n${body}\n\n${scripts}\n`);

  /* standalone: a complete document that opens from the filesystem */
  const standalone = [
    '<!DOCTYPE html>',
    '<html lang="es" data-theme="light">',
    '<head>',
    '<meta charset="utf-8">',
    '<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">',
    '<meta name="color-scheme" content="light dark">',
    head,
    '</head>',
    '<body>',
    body,
    scripts,
    '</body>',
    '</html>'
  ].join('\n');
  writeFileSync(join(ROOT, 'dist/carta.html'), standalone);

  const kb = (s) => (Buffer.byteLength(s) / 1024).toFixed(0) + ' KB';
  console.log(`  inlined ${ASSET_PATHS.size} assets + 3 data files`);
  console.log(`\n✓ dist/carta.html    ${kb(standalone)}  (standalone)`);
  console.log(`✓ dist/artifact.html ${kb(`${head}\n\n${body}\n\n${scripts}\n`)}  (fragment)`);
}

build();
