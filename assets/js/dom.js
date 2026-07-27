/* Tiny DOM helpers.
   Deliberately no innerHTML anywhere in this app: every string that comes from
   menu data reaches the page as a text node, so a malicious/typo'd JSON value
   can never become markup. */

export function el(tag, props = null, ...children) {
  const node = document.createElement(tag);
  if (props) {
    for (const [key, value] of Object.entries(props)) {
      if (value == null || value === false) continue;
      if (key === 'class') node.className = value;
      else if (key === 'text') node.textContent = value;
      else if (key === 'dataset') Object.assign(node.dataset, value);
      else if (key === 'style') for (const [p, v] of Object.entries(value)) node.style.setProperty(p, v);
      else if (key.startsWith('on') && typeof value === 'function') node.addEventListener(key.slice(2), value);
      else if (value === true) node.setAttribute(key, '');
      else node.setAttribute(key, String(value));
    }
  }
  append(node, children);
  return node;
}

function append(parent, children) {
  for (const child of children) {
    if (child == null || child === false) continue;
    if (Array.isArray(child)) append(parent, child);
    else parent.append(child.nodeType ? child : document.createTextNode(String(child)));
  }
}

export function clear(node) {
  node.replaceChildren();
  return node;
}

export const $ = (sel, root = document) => root.querySelector(sel);
export const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

/** Diacritic-insensitive, case-insensitive key for search. */
export function fold(str) {
  return String(str).normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase();
}

/* ------------------------------------------------------------------ *
 * Value guards. Menu data is same-origin JSON, but it is still content
 * that a non-developer edits by hand — validate before it reaches an
 * attribute or a style.
 * ------------------------------------------------------------------ */

const HEX = /^#(?:[0-9a-f]{3}|[0-9a-f]{4}|[0-9a-f]{6}|[0-9a-f]{8})$/i;
export const safeColor = (value, fallback = '') => (typeof value === 'string' && HEX.test(value.trim()) ? value.trim() : fallback);

const FILENAME = /^[a-z0-9](?:[a-z0-9._-]*[a-z0-9])?\.(?:svg|png|jpe?g|webp|avif)$/i;
export function safeImage(name, base = 'assets/img/dishes/') {
  if (typeof name !== 'string' || !FILENAME.test(name) || name.includes('..')) return null;
  return base + name;
}

const ID = /^[a-z0-9][a-z0-9-]{0,63}$/i;
export const safeId = (value) => (typeof value === 'string' && ID.test(value) ? value : null);
