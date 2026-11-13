"""
Compara los PDF generados (out/pdf/) con los originales (referencia/ejemplos/).
Crea out/compare/<num>-p<pagina>.png: original | generado | superposición.
Uso: npm run pdf:compare   (requiere Python 3 + pymupdf + Pillow)
"""
import glob, os, sys
import pymupdf
from PIL import Image, ImageChops, ImageDraw, ImageOps

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, 'out', 'compare')
DPI = int(os.environ.get('DPI', '80'))
os.makedirs(OUT, exist_ok=True)
for old in glob.glob(os.path.join(OUT, "*.png")):
    os.remove(old)

def pages(path):
    doc = pymupdf.open(path)
    for p in doc:
        pix = p.get_pixmap(dpi=DPI)
        yield Image.frombytes('RGB', (pix.width, pix.height), pix.samples)

for mine in sorted(glob.glob(os.path.join(ROOT, 'out', 'pdf', '*.pdf'))):
    num = os.path.basename(mine)[:3]
    refs = glob.glob(os.path.join(ROOT, 'referencia', 'ejemplos', f'{num}-*.pdf')) + \
        glob.glob(os.path.join(ROOT, 'referencia', 'ejemplos', f'{num}-* *.pdf'))
    if not refs:
        continue
    a, b = list(pages(refs[0])), list(pages(mine))
    print(f'{num}: original {len(a)} páginas, generado {len(b)} páginas')
    for i in range(max(len(a), len(b))):
        ra = a[i] if i < len(a) else Image.new('RGB', b[0].size, 'white')
        rb = b[i] if i < len(b) else Image.new('RGB', a[0].size, 'white')
        # superposición: original en rojo, generado en azul (gris oscuro = coinciden)
        ga, gb = ImageOps.grayscale(ra), ImageOps.grayscale(rb)
        over = Image.merge('RGB', (gb, ImageChops.darker(ga, gb), ga))
        w, h = ra.size
        sheet = Image.new('RGB', (w * 3 + 40, h + 30), 'white')
        d = ImageDraw.Draw(sheet)
        for j, (im, label) in enumerate([(ra, 'ORIGINAL'), (rb, 'GENERADO'), (over, 'SUPERPOSICION (rojo=original, azul=generado)')]):
            sheet.paste(im, (j * (w + 20), 30))
            d.text((j * (w + 20) + 5, 8), label, fill='black')
        sheet.save(os.path.join(OUT, f'{num}-p{i + 1}.png'))
print('Listo:', OUT)
