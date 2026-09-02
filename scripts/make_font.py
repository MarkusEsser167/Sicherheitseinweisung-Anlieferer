"""
Erzeugt fonts/dejavu.js - die in das PDF eingebettete Unicode-Schrift.

Hintergrund: jsPDF bringt nur WinAnsi-Standardschriften mit. Griechisch,
Kyrillisch (Russisch/Ukrainisch/Bulgarisch) und einige tuerkische bzw.
osteuropaeische Zeichen liessen sich damit nicht darstellen. Deshalb wird
DejaVu Sans auf die benoetigten Unicode-Bloecke reduziert und als Base64 in
die jsPDF-VFS eingebettet.

Aufruf (einmalig noetig, wenn Sprachen mit anderen Schriftsystemen dazukommen):
    pip install fonttools brotli
    python scripts/make_font.py

Die Original-TTFs stammen aus dem offiziellen DejaVu-Release:
https://github.com/dejavu-fonts/dejavu-fonts/releases  (Version 2.37)
"""
import base64
import io
import os
import sys
import urllib.request
import zipfile

DEJAVU_URL = (
    "https://github.com/dejavu-fonts/dejavu-fonts/releases/download/"
    "version_2_37/dejavu-fonts-ttf-2.37.zip"
)

# Basic Latin, Latin-1/Ext-A/Ext-B (Kroatisch, Polnisch, Rumaenisch, Slowakisch,
# Tschechisch, Tuerkisch), kombinierende Akzente, Griechisch, Kyrillisch,
# Interpunktion, Waehrungs- und Buchstabensymbole.
UNICODE_RANGES = ",".join([
    "U+0020-007E", "U+00A0-024F", "U+02B0-02FF", "U+0300-036F",
    "U+0370-03FF", "U+0400-04FF", "U+1E00-1EFF", "U+1F00-1FFF",
    "U+2000-206F", "U+20A0-20BF", "U+2100-214F",
])

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
FONT_DIR = os.path.join(ROOT, "fonts")


def fetch_originals():
    """Laedt das DejaVu-Release und legt Regular/Bold sowie die Lizenz in fonts/ ab."""
    print("Lade DejaVu 2.37 ...")
    with urllib.request.urlopen(DEJAVU_URL) as resp:
        zf = zipfile.ZipFile(io.BytesIO(resp.read()))
    for name in zf.namelist():
        base = name.rsplit("/", 1)[-1]
        if base in ("DejaVuSans.ttf", "DejaVuSans-Bold.ttf"):
            open(os.path.join(FONT_DIR, base), "wb").write(zf.read(name))
        elif base == "LICENSE":
            open(os.path.join(FONT_DIR, "LICENSE-DejaVu.txt"), "wb").write(zf.read(name))


def subset(src, dst):
    from fontTools import subset as ft_subset
    ft_subset.main([
        src,
        f"--unicodes={UNICODE_RANGES}",
        f"--output-file={dst}",
        "--layout-features=",
        "--no-hinting",
        "--drop-tables+=GSUB,GPOS,GDEF,kern",
    ])


def js_const(name, data):
    b64 = base64.b64encode(data).decode()
    lines = [b64[i:i + 120] for i in range(0, len(b64), 120)]
    body = "\n".join(f'  "{line}" +' for line in lines[:-1])
    return f"export const {name} =\n{body}\n  \"{lines[-1]}\";\n"


def main():
    os.makedirs(FONT_DIR, exist_ok=True)
    if not os.path.exists(os.path.join(FONT_DIR, "DejaVuSans.ttf")):
        fetch_originals()

    parts = []
    for src_name, const in (("DejaVuSans.ttf", "DEJAVU_REGULAR_B64"),
                            ("DejaVuSans-Bold.ttf", "DEJAVU_BOLD_B64")):
        src = os.path.join(FONT_DIR, src_name)
        dst = src.replace(".ttf", "-sub.ttf")
        subset(src, dst)
        data = open(dst, "rb").read()
        print(f"{src_name}: {os.path.getsize(src)} -> {len(data)} Bytes")
        parts.append(js_const(const, data))

    header = open(os.path.join(FONT_DIR, "dejavu.js"), encoding="utf-8").read().split("export const")[0]
    open(os.path.join(FONT_DIR, "dejavu.js"), "w", encoding="utf-8").write(header + "\n".join(parts))
    print("fonts/dejavu.js geschrieben.")


if __name__ == "__main__":
    sys.exit(main())
