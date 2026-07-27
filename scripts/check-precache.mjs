#!/usr/bin/env node
/* Keeps sw.js honest.
 *
 * A service worker that precaches a file list drifts silently: add a module,
 * forget the list, and offline diners get a half-loaded app. This asserts the
 * list matches what is actually on disk. */

import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

const sw = readFileSync(join(ROOT, 'sw.js'), 'utf8');
const block = sw.match(/const PRECACHE = \[([\s\S]*?)\];/);
if (!block) {
  console.error('✗ could not find the PRECACHE array in sw.js');
  process.exit(1);
}
const listed = new Set([...block[1].matchAll(/'([^']+)'/g)].map((m) => m[1]));

/* Everything the app needs to boot and render offline. Photos and the raster
   icons are intentionally left to the runtime cache: they are large, optional,
   and fetched lazily. */
const WANTED_DIRS = ['assets/css', 'assets/js', 'assets/fonts', 'assets/img/ui', 'assets/img/dishes', 'data'];
const WANTED_FILES = ['index.html', 'manifest.webmanifest', 'assets/img/logo.svg', 'assets/img/icon.svg'];

function walk(dir) {
  const out = [];
  for (const entry of readdirSync(join(ROOT, dir))) {
    const rel = `${dir}/${entry}`;
    if (statSync(join(ROOT, rel)).isDirectory()) out.push(...walk(rel));
    else out.push(rel);
  }
  return out;
}

const expected = new Set([...WANTED_FILES, ...WANTED_DIRS.flatMap(walk)]);

const missing = [...expected].filter((f) => !listed.has(f)).sort();
const stale = [...listed].filter((f) => f !== './' && !expected.has(f)).sort();

if (missing.length) {
  console.error('✗ sw.js PRECACHE is missing:');
  for (const f of missing) console.error('    ' + f);
}
if (stale.length) {
  console.error('✗ sw.js PRECACHE lists files that no longer exist:');
  for (const f of stale) console.error('    ' + f);
}
if (missing.length || stale.length) process.exit(1);

console.log(`✓ service worker precaches all ${expected.size} shell files`);
