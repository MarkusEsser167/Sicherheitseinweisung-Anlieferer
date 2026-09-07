"""
Erzeugt js/logos.js - die beiden Firmenlogos als Base64-PNG fuer den PDF-Kopf.

Warum eingebettet und nicht als Bilddatei geladen: die PDF-Erzeugung laeuft
komplett im Browser und muss auch offline funktionieren. jsPDF braucht die
Bilddaten synchron zur Hand.

Beide Logos werden auf Weiss aufgeflacht (das wego-Logo ist RGBA mit
Transparenz; jsPDF wuerde transparente Bereiche sonst schwarz fuellen) und
randlos zugeschnitten, damit die Platzierung im PDF exakt sitzt.

Aufruf aus dem Projektordner:
    pip install pillow && python scripts/make_logos.py
"""
import base64
import io
import os

from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

# Quellen liegen ausserhalb des Projekts; bei Bedarf hier anpassen.
SOURCES = {
    "WEGO_LOGO_B64": r"C:\Users\esser\OneDrive - SIG PLC\Dokumente\wego-logo 2026.png",
    "VTI_LOGO_B64": r"C:\Users\esser\OneDrive - SIG PLC\Pictures\VTI Logo.jpg",
}


def load_flat(path):
    """Laedt ein Logo, legt es auf weissen Grund und schneidet den Rand weg."""
    im = Image.open(path)
    if im.mode in ("RGBA", "LA", "P"):
        im = im.convert("RGBA")
        bg = Image.new("RGB", im.size, (255, 255, 255))
        bg.paste(im, mask=im.split()[-1])
        im = bg
    else:
        im = im.convert("RGB")

    # Randloser Zuschnitt: alles wegschneiden, was sich nicht von Weiss abhebt.
    gray = im.convert("L")
    mask = gray.point(lambda v: 255 if v < 245 else 0)
    box = mask.getbbox()
    if box:
        im = im.crop(box)
    return im


def to_b64(im):
    buf = io.BytesIO()
    im.save(buf, format="PNG", optimize=True)
    return base64.b64encode(buf.getvalue()).decode()


def js_const(name, b64, ratio):
    lines = [b64[i:i + 120] for i in range(0, len(b64), 120)]
    body = "\n".join(f'  "{line}" +' for line in lines[:-1])
    head = f"/** Seitenverhaeltnis Breite/Hoehe: {ratio:.4f} */\nexport const {name} =\n"
    return head + body + f'\n  "{lines[-1]}";\n'


def main():
    parts = [
        "/**\n"
        " * Firmenlogos als Base64-PNG fuer den PDF-Kopf.\n"
        " *\n"
        " * AUTOMATISCH ERZEUGT von scripts/make_logos.py - nicht von Hand bearbeiten.\n"
        " * Auf weissem Grund aufgeflacht und randlos zugeschnitten, damit die\n"
        " * Platzierung im PDF exakt sitzt.\n"
        " */\n"
    ]
    ratios = []
    for const, path in SOURCES.items():
        im = load_flat(path)
        ratio = im.width / im.height
        ratios.append((const, im.size, ratio))
        parts.append(js_const(const, to_b64(im), ratio))

    # Seitenverhaeltnisse zusaetzlich als Zahlen, damit pdf.js nicht raten muss.
    parts.append(
        "export const LOGO_RATIO = {\n"
        f"  wego: {ratios[0][2]:.4f},\n"
        f"  vti: {ratios[1][2]:.4f},\n"
        "};\n"
    )

    out = os.path.join(ROOT, "js", "logos.js")
    open(out, "w", encoding="utf-8").write("\n".join(parts))
    for const, size, ratio in ratios:
        print(f"{const}: {size[0]}x{size[1]} px, ratio {ratio:.4f}")
    print(f"js/logos.js geschrieben ({os.path.getsize(out)} Bytes)")


if __name__ == "__main__":
    main()
