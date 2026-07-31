#!/usr/bin/env python3
"""Genera la hoja de códigos QR, uno por mesa, lista para imprimir.

    pip install segno
    npm run qr:mesas -- --url https://straycoderx.github.io/PastaYGofio/
    # -> dist/qr-mesas.html   (abrir e imprimir; una tarjeta por mesa)

Cada QR apunta a `<url>?mesa=S1`. La carta lee ese número, lo enseña como sello
en la cesta —no se puede escribir a mano— y lo pone en la primera línea del
mensaje de WhatsApp, de modo que en cocina se sabe siempre de qué mesa viene.

**Cada código lleva su mesa escrita en el centro.** Veintitrés cuadrados
blancos y negros son indistinguibles a ojo, y en cuanto se recortan y se
mezclan no hay manera de saber cuál va a qué mesa. Con el sello en medio se
lee de un vistazo, también cuando ya está pegado a la mesa y alguien duda de
si lo movieron. El color del sello separa las dos zonas: salón y terraza.

Ese sello tapa parte del dibujo, así que los códigos van a corrección de
errores alta (H) y el sello ocupa un 6 % de la superficie — muy por debajo del
14 % que aguantan de una pieza, medido. Aun así el script **comprueba los
códigos que genera**: no confía en la teoría.

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

TINTA = '#241d15'
# un color por zona, para separar los dos montones al recortar
COLOR_ZONA = {'s': '#4a5f2f', 't': '#9a3616'}
COLOR_POR_DEFECTO = '#241d15'

BORDE = 4          # zona de silencio, en módulos (el mínimo del estándar)
SELLO_ANCHO = 13   # el sello del centro, en módulos
SELLO_ALTO = 8


def qr_svg(data: str, etiqueta: str, color: str) -> str:
    """El QR, con la mesa sellada en el centro, como <svg> embebido.

    Se dibuja a mano desde la matriz en vez de usar el escritor de segno: hace
    falta saber dónde cae el centro en módulos para colocar el sello, y apagar
    los que quedan debajo en lugar de pintar encima (que dejaría esquinas
    negras asomando bajo el rótulo).
    """
    qr = segno.make(data, error='h')
    matriz = [list(fila) for fila in qr.matrix]
    n = len(matriz)
    lado = n + 2 * BORDE
    centro = n / 2

    # el hueco del sello, con medio módulo de aire alrededor
    x0, x1 = centro - SELLO_ANCHO / 2 - .5, centro + SELLO_ANCHO / 2 + .5
    y0, y1 = centro - SELLO_ALTO / 2 - .5, centro + SELLO_ALTO / 2 + .5

    partes = []
    for y, fila in enumerate(matriz):
        for x, modulo in enumerate(fila):
            if not modulo:
                continue
            if x0 <= x + .5 <= x1 and y0 <= y + .5 <= y1:
                continue          # cae bajo el sello: no se dibuja
            partes.append(f'M{x + BORDE} {y + BORDE}h1v1h-1z')

    sx, sy = centro + BORDE - SELLO_ANCHO / 2, centro + BORDE - SELLO_ALTO / 2
    texto = html.escape(etiqueta.upper())

    return (
        f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {lado} {lado}" '
        f'shape-rendering="crispEdges" role="img" aria-label="Mesa {texto}">'
        f'<path fill="{TINTA}" d="{"".join(partes)}"/>'
        f'<rect x="{sx:.2f}" y="{sy:.2f}" width="{SELLO_ANCHO}" height="{SELLO_ALTO}" '
        f'rx="{SELLO_ALTO / 2:.2f}" fill="{color}"/>'
        f'<text x="{centro + BORDE:.2f}" y="{centro + BORDE:.2f}" fill="#fff" '
        f'text-anchor="middle" dominant-baseline="central" '
        f'font-family="Georgia, \'Times New Roman\', serif" font-weight="700" '
        f'font-size="{SELLO_ALTO * .62:.2f}" letter-spacing="{SELLO_ALTO * .03:.2f}"'
        f'>{texto}</text>'
        f'</svg>'
    )


def expand(token: str) -> list[str]:
    """'s1-s11' -> ['s1', ..., 's11'];  'barra1' -> ['barra1']."""
    m = re.match(r'^([A-Za-z]*)(\d+)-([A-Za-z]*)(\d+)$', token)
    if not m:
        return [token]
    prefix, start, prefix2, end = m.group(1), int(m.group(2)), m.group(3), int(m.group(4))
    if prefix2 and prefix2.lower() != prefix.lower():
        sys.exit(f'rango incoherente: {token}')
    if end < start:
        sys.exit(f'rango al revés: {token}')
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
    ap.add_argument('--sin-comprobar', action='store_true',
                    help='no leer de vuelta los códigos generados')
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
    destinos: dict[str, str] = {}
    for prefix, group in groups.items():
        zone = zones.get(prefix, '')
        color = COLOR_ZONA.get(prefix, COLOR_POR_DEFECTO)
        cards = []
        for code in group:
            target = f'{base}{sep}{args.param}={code.upper()}'
            destinos[code.upper()] = target
            cards.append(f"""  <article class="card" style="--zona: {color}">
    <div class="qr">{qr_svg(target, code, color)}</div>
    <p class="mesa">{html.escape(code.upper())}</p>
    <p class="hint">{html.escape(zone) or 'Escanea para ver la carta'}</p>
    <p class="url">{html.escape(target)}</p>
  </article>""")
        if zone:
            blocks.append(f'<h2 class="zone" style="--zona: {color}">{html.escape(zone)}</h2>')
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
    color: var(--zona, #6b6152);
    border-bottom: 1.2pt solid var(--zona, #d8cbae);
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
    border: 1.2pt solid var(--zona, #241d15);
    border-radius: 4mm;
    padding: 7mm 5mm 5mm;
    text-align: center;
    background: #fffdf7;
    break-inside: avoid;
  }}
  .qr {{ width: 52mm; margin: 0 auto 4mm; }}
  .qr svg {{ width: 100%; height: auto; display: block; }}
  .mesa {{
    margin: 0;
    font-size: 21pt;
    font-weight: 700;
    letter-spacing: .04em;
    color: var(--zona, #241d15);
  }}
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

    if not args.sin_comprobar:
        comprueba(destinos)


def comprueba(destinos: dict[str, str]) -> None:
    """Lee de vuelta cada código, con el sello puesto, y verifica su mesa.

    Con zxing-cpp, que es el motor de los lectores de móvil. Se probó antes con
    el de OpenCV y daba dos códigos por malos —S6 y T6— que estaban perfectos:
    fallaban igual **sin** sello, y encoger el sello hacía fallar más códigos
    en vez de menos, que es imposible si el problema fuera taparlos. Un
    comprobador que miente es peor que no tener ninguno, así que se cambió.
    """
    try:
        import io
        import zxingcpp
        from PIL import Image, ImageDraw
    except ImportError:
        print('\n(pip install zxing-cpp Pillow para comprobar los códigos generados)')
        return

    fallos = []
    for code, destino in destinos.items():
        qr = segno.make(destino, error='h')
        buf = io.BytesIO()
        qr.save(buf, kind='png', scale=12, border=BORDE)
        img = Image.open(io.BytesIO(buf.getvalue())).convert('RGB')

        # el mismo hueco que en el SVG, ahora en píxeles
        lado = img.size[0]
        modulo = lado / (len(qr.matrix) + 2 * BORDE)
        centro = lado / 2
        ImageDraw.Draw(img).rectangle(
            (centro - SELLO_ANCHO * modulo / 2, centro - SELLO_ALTO * modulo / 2,
             centro + SELLO_ANCHO * modulo / 2, centro + SELLO_ALTO * modulo / 2),
            fill=COLOR_ZONA['s'])

        leido = zxingcpp.read_barcode(img)
        if not leido or leido.text != destino:
            fallos.append((code, leido.text if leido else ''))

    if fallos:
        print(f'\n‼ {len(fallos)} de {len(destinos)} no se leen bien:')
        for code, leido in fallos:
            print(f'   {code}: {leido[:60] or "(no se lee)"}')
        sys.exit('los códigos no sirven; baja SELLO_ANCHO/SELLO_ALTO y repite')
    print(f'✓ los {len(destinos)} se leen con el sello puesto y apuntan a su mesa')


if __name__ == '__main__':
    main()
