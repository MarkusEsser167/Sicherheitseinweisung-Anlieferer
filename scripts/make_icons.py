"""
Erzeugt die App-Icons (Warnweste mit Haken auf gruenem Grund).

Aufruf aus dem Projektordner:
    pip install pillow && python scripts/make_icons.py
"""
from PIL import Image, ImageDraw

GREEN = (15, 92, 79, 255)
VEST = (245, 200, 60, 255)
VEST_DARK = (214, 168, 32, 255)
STRIPE = (245, 247, 250, 255)
CHECK = (34, 197, 94, 255)


def make_icon(size, path, maskable=False):
    img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)

    # Maskable-Icons duerfen am Rand beschnitten werden - Motiv daher kleiner halten.
    pad = int(size * 0.10) if maskable else 0
    d.rounded_rectangle([pad, pad, size - pad, size - pad], radius=int(size * 0.18), fill=GREEN)

    s = size * (0.80 if maskable else 1.0)
    off = (size - s) / 2

    def px(fx, fy):
        return (off + s * fx, off + s * fy)

    # Warnweste: Rumpf
    body = [px(0.30, 0.34), px(0.70, 0.34), px(0.74, 0.76), px(0.26, 0.76)]
    d.polygon(body, fill=VEST)

    # Schulterpartie
    d.polygon([px(0.30, 0.34), px(0.42, 0.26), px(0.50, 0.36), px(0.38, 0.44)], fill=VEST_DARK)
    d.polygon([px(0.70, 0.34), px(0.58, 0.26), px(0.50, 0.36), px(0.62, 0.44)], fill=VEST_DARK)

    # Reflexstreifen quer
    bar_h = s * 0.045
    for fy in (0.545, 0.635):
        d.rectangle([px(0.28, fy)[0], px(0, fy)[1], px(0.72, fy)[0], px(0, fy)[1] + bar_h], fill=STRIPE)

    # Bestaetigungshaken unten rechts
    r = s * 0.17
    cx, cy = px(0.70, 0.70)
    d.ellipse([cx - r, cy - r, cx + r, cy + r], fill=CHECK)
    w = max(2, int(s * 0.035))
    d.line([cx - r * 0.45, cy, cx - r * 0.08, cy + r * 0.38], fill=(255, 255, 255, 255), width=w)
    d.line([cx - r * 0.08, cy + r * 0.38, cx + r * 0.48, cy - r * 0.35], fill=(255, 255, 255, 255), width=w)

    img.save(path)
    print("geschrieben:", path)


if __name__ == "__main__":
    make_icon(192, "icons/icon-192.png")
    make_icon(512, "icons/icon-512.png")
    make_icon(512, "icons/icon-512-maskable.png", maskable=True)
