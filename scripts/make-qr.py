#!/usr/bin/env python3
"""Genera el QR de la carta y una hoja lista para imprimir y recortar.

    pip install segno
    python3 scripts/make-qr.py
    # -> dist/qr-carta.svg    el código solo, vectorial
    # -> dist/qr-carta.png    el mismo, en mapa de bits (redes, WhatsApp)
    # -> dist/qr-carta.html   hoja A4: 4 tarjetas de mesa + 1 cartel

Este QR lleva a la carta entera, sin número de mesa. Para los QR por mesa
—que además le dicen a cocina desde dónde se pide— está `make-table-qr.py`.

Corrección de errores alta: una tarjeta que vive en una mesa acaba con una
gota de aceite o el pulgar de alguien encima. Medido sobre este código, con
el lector de OpenCV, que es más estricto que la cámara de un móvil:

  - se lee impreso hasta a 20 mm de lado, y desenfocado;
  - aguanta una mancha de hasta el 14 % del código; al 21 % ya falla.
    (El 30 % que promete el nivel H cuenta daño repartido; una mancha de una
    pieza se lleva por delante bloques enteros y cunde menos.)
  - pero tapar cualquiera de los tres cuadrados de las esquinas lo mata,
    aunque sea poco: son los localizadores, y sin ellos el lector ni
    encuentra el código. Por eso aquí no va ningún logotipo encima.
"""
import argparse
import html
import pathlib
import sys

try:
    import segno
except ImportError:
    sys.exit("Falta la dependencia: pip install segno")

ROOT = pathlib.Path(__file__).resolve().parent.parent
TINTA = '#241d15'

# Se enseña bajo el código para quien no pueda o no quiera escanear.
IDIOMAS = [
    ('es', 'Escanea y mira la carta'),
    ('it', 'Inquadra e guarda il menù'),
    ('en', 'Scan to see the menu'),
    ('de', 'Scannen und Karte ansehen'),
]


def qr_svg(data: str, escala: int = 1) -> str:
    """El QR como <svg> suelto, sin declaración XML ni fondo propio."""
    import io
    buf = io.BytesIO()
    segno.make(data, error='h').save(
        buf, kind='svg', xmldecl=False, svgns=True, omitsize=True,
        border=2, dark=TINTA, light=None, scale=escala,
    )
    return buf.getvalue().decode('utf-8')


def url_legible(url: str) -> str:
    """La URL como se lee en voz alta: sin esquema ni barra final."""
    return url.replace('https://', '').replace('http://', '').rstrip('/')


def tarjeta(url: str, svg: str, marca: str) -> str:
    """Una tarjeta de mesa: marca, código, y la URL escrita debajo."""
    lineas = '\n'.join(
        f'        <li lang="{lang}">{html.escape(texto)}</li>' for lang, texto in IDIOMAS
    )
    return f"""    <article class="tarjeta">
      <div class="tarjeta__marca">{marca}</div>
      <p class="tarjeta__nombre">Pasta y Gofio</p>
      <p class="tarjeta__lugar">La Aldea</p>
      <div class="tarjeta__qr">{svg}</div>
      <ul class="tarjeta__pie">
{lineas}
      </ul>
      <p class="tarjeta__url">{html.escape(url_legible(url))}</p>
    </article>"""


def hoja(url: str, copias: int, marca: str) -> str:
    svg = qr_svg(url)
    tarjetas = '\n'.join(tarjeta(url, svg, marca) for _ in range(copias))
    lineas_cartel = '\n'.join(
        f'      <li lang="{lang}">{html.escape(texto)}</li>' for lang, texto in IDIOMAS
    )
    return f"""<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="utf-8">
<title>Pasta y Gofio — QR de la carta</title>
<style>
  @page {{ size: A4; margin: 12mm; }}

  :root {{
    --tinta: {TINTA};
    --suave: #7a6f5d;
    --linea: #e2d8c1;
    --papel: #fffdf7;
  }}

  * {{ box-sizing: border-box; }}
  body {{
    margin: 0;
    background: #f4efe2;
    color: var(--tinta);
    font: 16px/1.5 'Inter', system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif;
  }}

  .aviso {{
    max-width: 190mm;
    margin: 10mm auto 6mm;
    padding: 4mm 5mm;
    border: 1px solid var(--linea);
    border-radius: 6px;
    background: var(--papel);
    font-size: 13px;
    color: var(--suave);
  }}
  .aviso strong {{ color: var(--tinta); }}

  .pliego {{
    width: 186mm;
    margin: 0 auto;
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 4mm;
  }}

  .tarjeta {{
    /* Media A5 en vertical: entra de pie en un portamenús de mesa y salen
       cuatro por folio sin recortar nada al margen. */
    height: 128mm;
    padding: 8mm 6mm 6mm;
    border: 1px dashed var(--linea);
    border-radius: 4mm;
    background: var(--papel);
    text-align: center;
    display: flex;
    flex-direction: column;
    align-items: center;
    break-inside: avoid;
  }}
  .tarjeta__marca {{ width: 16mm; height: 16mm; }}
  .tarjeta__marca svg {{ width: 100%; height: 100%; display: block; }}
  .tarjeta__nombre {{
    margin: 2.5mm 0 0;
    font-family: 'Fraunces', Georgia, 'Times New Roman', serif;
    font-size: 17px;
    font-weight: 600;
    letter-spacing: -.01em;
  }}
  .tarjeta__lugar {{
    margin: .5mm 0 0;
    font-size: 8.5px;
    letter-spacing: .18em;
    text-transform: uppercase;
    color: var(--suave);
  }}

  /* El QR manda: todo lo demás se aprieta antes que encogerlo. Impreso a
     45 mm se lee de sobra desde el otro lado de la mesa. */
  .tarjeta__qr {{
    width: 45mm;
    margin: 4mm 0 3.5mm;
  }}
  .tarjeta__qr svg {{ width: 100%; height: auto; display: block; }}

  .tarjeta__pie {{
    margin: 0;
    padding: 0;
    list-style: none;
    font-size: 9.5px;
    line-height: 1.55;
    color: var(--suave);
  }}
  .tarjeta__pie li:first-child {{
    font-size: 11px;
    font-weight: 600;
    color: var(--tinta);
  }}
  .tarjeta__url {{
    margin: auto 0 0;
    padding-top: 3mm;
    font-size: 8px;
    letter-spacing: .02em;
    color: var(--suave);
    word-break: break-all;
  }}

  /* --- el cartel, para la puerta o la barra --- */
  .cartel {{
    break-before: page;
    width: 186mm;
    margin: 8mm auto 0;
    padding: 14mm 10mm 12mm;
    border: 1px dashed var(--linea);
    border-radius: 6mm;
    background: var(--papel);
    text-align: center;
  }}
  .cartel__marca {{ width: 30mm; margin: 0 auto; }}
  .cartel__marca svg {{ width: 100%; height: auto; display: block; }}
  .cartel h1 {{
    margin: 5mm 0 0;
    font-family: 'Fraunces', Georgia, 'Times New Roman', serif;
    font-size: 34px;
    font-weight: 600;
    letter-spacing: -.015em;
  }}
  .cartel__lugar {{
    margin: 1mm 0 0;
    font-size: 11px;
    letter-spacing: .22em;
    text-transform: uppercase;
    color: var(--suave);
  }}
  .cartel__qr {{ width: 92mm; margin: 9mm auto 7mm; }}
  .cartel__qr svg {{ width: 100%; height: auto; display: block; }}
  .cartel ul {{
    margin: 0;
    padding: 0;
    list-style: none;
    font-size: 13px;
    line-height: 1.7;
    color: var(--suave);
  }}
  .cartel ul li:first-child {{ font-size: 17px; font-weight: 600; color: var(--tinta); }}
  .cartel__url {{ margin: 6mm 0 0; font-size: 11px; color: var(--suave); }}

  @media print {{
    body {{ background: #fff; }}
    .aviso {{ display: none; }}
    .tarjeta, .cartel {{ background: #fff; }}
  }}
</style>
</head>
<body>

<p class="aviso">
  <strong>Imprime esta hoja y recorta por la línea de puntos.</strong>
  La primera página trae {copias} tarjetas de mesa; la segunda, un cartel para
  la puerta o la barra. Imprime en papel normal para probar y en cartulina
  para lo definitivo. Este aviso no sale impreso.
</p>

<section class="pliego">
{tarjetas}
</section>

<section class="cartel">
  <div class="cartel__marca">{marca}</div>
  <h1>Pasta y Gofio</h1>
  <p class="cartel__lugar">Trattoria · Pizzería · La Aldea</p>
  <div class="cartel__qr">{svg}</div>
  <ul>
{lineas_cartel}
  </ul>
  <p class="cartel__url">{html.escape(url_legible(url))}</p>
</section>

</body>
</html>
"""


def main() -> None:
    ap = argparse.ArgumentParser(
        description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument('--url', default='https://straycoderx.github.io/PastaYGofio/',
                    help='URL donde está publicada la carta')
    ap.add_argument('--copias', type=int, default=4,
                    help='tarjetas de mesa por hoja (por defecto 4)')
    ap.add_argument('--salida', default='dist', help='carpeta de destino')
    args = ap.parse_args()

    if not args.url.startswith(('http://', 'https://')):
        sys.exit(f'la URL debe empezar por http:// o https:// — recibido: {args.url}')

    destino = ROOT / args.salida
    destino.mkdir(parents=True, exist_ok=True)

    codigo = segno.make(args.url, error='h')

    svg_suelto = destino / 'qr-carta.svg'
    codigo.save(str(svg_suelto), scale=10, border=2, dark=TINTA, light=None)

    png = destino / 'qr-carta.png'
    codigo.save(str(png), scale=16, border=2, dark=TINTA, light='#ffffff')

    marca = (ROOT / 'assets/img/logo.svg').read_text(encoding='utf-8')
    hoja_html = destino / 'qr-carta.html'
    hoja_html.write_text(hoja(args.url, args.copias, marca), encoding='utf-8')

    print(f'  apunta a       {args.url}')
    print(f'  versión {codigo.version}, corrección {codigo.error.upper()} (30 %)')
    print()
    for f in (svg_suelto, png, hoja_html):
        print(f'✓ {f.relative_to(ROOT)}  {f.stat().st_size / 1024:.0f} KB')


if __name__ == '__main__':
    main()
