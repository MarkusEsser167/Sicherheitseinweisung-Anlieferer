"""
Erzeugt js/logos.js - das Firmenlogo als Base64-PNG fuer den PDF-Kopf.

Warum eingebettet und nicht als Bilddatei geladen: die PDF-Erzeugung laeuft
komplett im Browser und muss auch offline funktionieren. jsPDF braucht die
Bilddaten synchron zur Hand.

Verwendet wird das kombinierte wego/vti-Logo. Es wird auf weissen Grund
aufgeflacht (Vorlagen mit Transparenz wuerden in jsPDF sonst schwarz gefuellt)
und randlos zugeschnitten, damit die Platzierung im PDF exakt sitzt.

Aufruf aus dem Projektordner:
    pip install pillow && python scripts/make_logos.py
"""
import base64
import io
import os

from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

# Quelle liegt ausserhalb des Projekts; bei einem Logowechsel hier anpassen.
SOURCE = r"C:\Users\esser\OneDrive - SIG PLC\Pictures\Logos\wgo-vti-logo-horiz-plain-4c.bmp"

# Bildbreite, auf die das Logo vor dem Einbetten skaliert wird. 900 px reichen
# fuer die rund 40 mm Druckbreite deutlich ueber 300 dpi und halten die
# Base64-Zeichenkette klein.
TARGET_WIDTH = 900


def load_flat(path):
    """Laedt das Logo, legt es auf weissen Grund und schneidet den Rand weg."""
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

    if im.width > TARGET_WIDTH:
        h = round(im.height * TARGET_WIDTH / im.width)
        im = im.resize((TARGET_WIDTH, h), Image.LANCZOS)
    return im


def js_const(name, b64):
    lines = [b64[i:i + 120] for i in range(0, len(b64), 120)]
    body = "\n".join(f'  "{line}" +' for line in lines[:-1])
    return f"export const {name} =\n{body}\n  \"{lines[-1]}\";\n"


def main():
    im = load_flat(SOURCE)
    ratio = im.width / im.height

    buf = io.BytesIO()
    im.save(buf, format="PNG", optimize=True)
    b64 = base64.b64encode(buf.getvalue()).decode()

    header = (
        "/**\n"
        " * Kombiniertes wego/vti-Logo als Base64-PNG fuer den PDF-Kopf.\n"
        " *\n"
        " * AUTOMATISCH ERZEUGT von scripts/make_logos.py - nicht von Hand bearbeiten.\n"
        " * Auf weissem Grund aufgeflacht und randlos zugeschnitten, damit die\n"
        " * Platzierung im PDF exakt sitzt.\n"
        " */\n\n"
    )
    body = js_const("LOGO_B64", b64)
    footer = (
        "\n/** Seitenverhaeltnis Breite/Hoehe - pdf.js rechnet daraus die Breite aus. */\n"
        f"export const LOGO_RATIO = {ratio:.4f};\n"
    )

    out = os.path.join(ROOT, "js", "logos.js")
    open(out, "w", encoding="utf-8").write(header + body + footer)
    print(f"Logo: {im.width}x{im.height} px, Verhaeltnis {ratio:.4f}")
    print(f"js/logos.js geschrieben ({os.path.getsize(out)} Bytes)")


if __name__ == "__main__":
    main()
