/* Persisted preferences + "mi selección".

   localStorage can throw (Safari private mode, storage disabled), and its
   contents are user-writable, so every read is guarded and re-validated. */

const NS = 'pyg.';

export function read(key, fallback = null) {
  try {
    const raw = localStorage.getItem(NS + key);
    return raw == null ? fallback : JSON.parse(raw);
  } catch {
    return fallback;
  }
}

export function write(key, value) {
  try {
    localStorage.setItem(NS + key, JSON.stringify(value));
  } catch { /* storage full or unavailable — preferences just won't persist */ }
}

export function remove(key) {
  try { localStorage.removeItem(NS + key); } catch { /* ignore */ }
}

/* ------------------------------------------------------------------ */

const MAX_QTY = 20;
const MAX_LINES = 60;

export class Tray {
  constructor() {
    /** @type {Map<string, {uid:string, variant:string, qty:number}>} */
    this.lines = new Map();
    this.listeners = new Set();
    this.#load();
  }

  #key(uid, variant) { return `${uid}|${variant}`; }

  #load() {
    const saved = read('tray', []);
    if (!Array.isArray(saved)) return;
    for (const line of saved.slice(0, MAX_LINES)) {
      if (typeof line?.uid !== 'string' || typeof line?.variant !== 'string') continue;
      const qty = Math.min(MAX_QTY, Math.max(1, Math.trunc(Number(line.qty) || 1)));
      this.lines.set(this.#key(line.uid, line.variant), { uid: line.uid, variant: line.variant, qty });
    }
  }

  #save() {
    write('tray', [...this.lines.values()]);
    for (const fn of this.listeners) fn(this);
  }

  onChange(fn) { this.listeners.add(fn); return () => this.listeners.delete(fn); }

  /** Drops lines whose dish no longer exists in the current menu. */
  reconcile(model) {
    let dirty = false;
    for (const [key, line] of this.lines) {
      if (!model.byUid.has(line.uid)) { this.lines.delete(key); dirty = true; }
    }
    if (dirty) this.#save();
  }

  qty(uid, variant) { return this.lines.get(this.#key(uid, variant))?.qty ?? 0; }
  has(uid) { return [...this.lines.values()].some((l) => l.uid === uid); }
  get count() { return [...this.lines.values()].reduce((sum, l) => sum + l.qty, 0); }
  get size() { return this.lines.size; }

  add(uid, variant, step = 1) {
    const key = this.#key(uid, variant);
    const current = this.lines.get(key);
    if (!current && this.lines.size >= MAX_LINES) return;
    const qty = Math.min(MAX_QTY, (current?.qty ?? 0) + step);
    if (qty <= 0) this.lines.delete(key);
    else this.lines.set(key, { uid, variant, qty });
    this.#save();
  }

  removeLine(uid, variant) {
    this.lines.delete(this.#key(uid, variant));
    this.#save();
  }

  clear() {
    this.lines.clear();
    this.#save();
  }

  /** @returns {Array<{item:object, variant:object, qty:number, line:number}>} */
  detailed(model) {
    const out = [];
    for (const line of this.lines.values()) {
      const item = model.byUid.get(line.uid);
      if (!item) continue;
      const variant = item.variants.find((v) => v.key === line.variant) ?? item.variants[0];
      if (!variant) continue;
      out.push({ item, variant, qty: line.qty, line: variant.amount * line.qty });
    }
    return out;
  }

  total(model) {
    return this.detailed(model).reduce((sum, row) => sum + row.line, 0);
  }
}
