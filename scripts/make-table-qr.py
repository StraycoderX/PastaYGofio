#!/usr/bin/env python3
"""Genera la hoja de códigos QR, uno por mesa, lista para imprimir.

    pip install segno
    python3 scripts/make-table-qr.py --url https://tu-dominio/pastaygofio/ --mesas s1-s11 t1-t12
    # -> dist/qr-mesas.html   (abrir e imprimir; una tarjeta por mesa)

Cada QR apunta a `<url>?mesa=S1`. La carta lee ese número, lo recuerda durante
la visita y lo pone en la primera línea del mensaje de WhatsApp, de modo que en
cocina se sabe siempre de qué mesa viene el pedido.

Los QR se emiten como SVG dentro del propio HTML: no hay imágenes sueltas que
perder y la hoja se imprime nítida a cualquier tamaño.
"""
import argparse
import html
import pathlib
import re
import sys

try:
    import segno
except ImportError:
    sys.exit("Falta la dependencia: pip install segno")

ROOT = pathlib.Path(__file__).resolve().parent.parent


def qr_svg(data: str) -> str:
    """QR como <svg> embebido, sin declaración XML ni fondo."""
    import io
    buf = io.BytesIO()   # segno escribe bytes aunque el formato sea texto
    # error correction 'M' aguanta bien una esquina gastada o un dedo encima
    segno.make(data, error='m').save(
        buf, kind='svg', xmldecl=False, svgns=True, omitsize=True,
        border=2, dark='#241d15', light=None,
    )
    return buf.getvalue().decode('utf-8')


def expand(token: str) -> list[str]:
    """'s1-s11' -> ['s1', ..., 's11'];  'barra1' -> ['barra1']."""
    m = re.match(r'^([A-Za-z]*)(\d+)-([A-Za-z]*)(\d+)$', token)
    if not m:
        return [token]
    prefix, start, prefix2, end = m.group(1), int(m.group(2)), m.group(3), int(m.group(4))
    if prefix2 and prefix2.lower() != prefix.lower():
        sys.exit(f'rango incoherente: {token}')
    return [f'{prefix}{n}' for n in range(start, end + 1)]


def main() -> None:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument('--url', default='https://www.etnoteam.io/pastaygofio/',
                    help='URL donde está publicada la carta')
    ap.add_argument('--mesas', nargs='+', default=['s1-s11', 't1-t12'],
                    help='rangos o códigos sueltos: s1-s11 t1-t12 barra1')
    ap.add_argument('--zonas', default='s=Salón,t=Terraza',
                    help='nombre de cada prefijo, para agrupar la hoja')
    ap.add_argument('--param', default='mesa', help='nombre del parámetro (mesa|table)')
    ap.add_argument('--out', default='dist/qr-mesas.html')
    args = ap.parse_args()

    base = args.url if args.url.endswith('/') else args.url + '/'
    sep = '&' if '?' in base else '?'
    zones = dict(z.split('=', 1) for z in args.zonas.split(',') if '=' in z)

    codes = []
    for token in args.mesas:
        codes.extend(expand(token))

    # agrupadas por prefijo: se imprime, se corta y cada montón va a su zona
    groups: dict[str, list[str]] = {}
    for code in codes:
        prefix = re.match(r'^[A-Za-z]*', code).group(0).lower()
        groups.setdefault(prefix, []).append(code)

    blocks = []
    for prefix, group in groups.items():
        zone = zones.get(prefix, '')
        cards = []
        for code in group:
            target = f'{base}{sep}{args.param}={code}'
            cards.append(f"""  <article class="card">
    <div class="qr">{qr_svg(target)}</div>
    <p class="mesa">{html.escape(code.upper())}</p>
    <p class="hint">{html.escape(zone) or 'Escanea para ver la carta'}</p>
    <p class="url">{html.escape(target)}</p>
  </article>""")
        if zone:
            blocks.append(f'<h2 class="zone">{html.escape(zone)}</h2>')
        blocks.append('<div class="sheet">\n' + chr(10).join(cards) + '\n</div>')

    doc = f"""<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="utf-8">
<title>Pasta y Gofio — QR por mesa</title>
<style>
  @page {{ size: A4; margin: 12mm; }}
  * {{ box-sizing: border-box; }}
  body {{
    margin: 0;
    font-family: Georgia, 'Times New Roman', serif;
    color: #241d15;
    background: #f6f0dc;
  }}
  header {{ padding: 18mm 0 8mm; text-align: center; }}
  header h1 {{ margin: 0; font-size: 26pt; letter-spacing: .02em; }}
  header p {{ margin: 4mm 0 0; font-size: 11pt; color: #6b6152; }}
  .zone {{
    margin: 6mm 8mm 3mm;
    font-size: 13pt;
    letter-spacing: .22em;
    text-transform: uppercase;
    color: #6b6152;
    border-bottom: .6pt solid #d8cbae;
    padding-bottom: 2mm;
    break-after: avoid;
  }}
  .sheet {{
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 8mm;
    padding: 0 8mm 12mm;
  }}
  .card {{
    border: 1.2pt solid #241d15;
    border-radius: 4mm;
    padding: 7mm 5mm 5mm;
    text-align: center;
    background: #fffdf7;
    break-inside: avoid;
  }}
  .qr {{ width: 52mm; margin: 0 auto 4mm; }}
  .qr svg {{ width: 100%; height: auto; display: block; }}
  .mesa {{ margin: 0; font-size: 21pt; font-weight: 700; letter-spacing: .04em; }}
  .hint {{ margin: 1.5mm 0 0; font-size: 9.5pt; color: #6b6152; }}
  .url {{
    margin: 3mm 0 0;
    font-family: ui-monospace, 'SF Mono', Menlo, monospace;
    font-size: 6.5pt;
    color: #9a8f7c;
    word-break: break-all;
  }}
  @media print {{
    body {{ background: #fff; }}
    header {{ padding-top: 0; }}
    .card {{ background: #fff; }}
  }}
</style>
</head>
<body>
<header>
  <h1>Pasta y Gofio</h1>
  <p>Un código por mesa · recórtalos y colócalos en su mesa</p>
</header>
{chr(10).join(blocks)}
</body>
</html>
"""

    out = ROOT / args.out
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(doc, encoding='utf-8')
    print(f'{len(codes)} códigos -> {out.relative_to(ROOT)}')
    print(f'apuntan a {base}{sep}{args.param}=N')


if __name__ == '__main__':
    main()
