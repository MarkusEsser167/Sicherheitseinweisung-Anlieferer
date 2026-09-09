/**
 * Flaggen als Inline-SVG, einheitlich im Seitenverhaeltnis 3:2 (viewBox 0 0 60 40).
 *
 * Bewusst KEINE Flaggen-Emojis: Windows stellt die Regional-Indicator-Emojis
 * nicht als Flaggen dar (dort erscheinen nur zwei Buchstaben), und auf aelteren
 * Android-Versionen sind sie uneinheitlich. Inline-SVG sieht auf jedem Geraet
 * gleich aus und funktioniert offline ohne zusaetzliche Dateien.
 *
 * Wappen (Kroatien, Slowakei) sind bewusst vereinfacht - in Knopfgroesse ist
 * die Flagge an Farben und Grundform erkennbar.
 */

const GREEK_STRIPE = 40 / 9;

function greekStripes() {
  let out = "";
  for (let i = 0; i < 9; i += 1) {
    if (i % 2 === 0) continue; // Grundflaeche ist blau, nur die weissen Streifen zeichnen
    out += `<rect y="${(i * GREEK_STRIPE).toFixed(3)}" width="60" height="${GREEK_STRIPE.toFixed(3)}" fill="#fff"/>`;
  }
  return out;
}

function checkerboard(x, y, size, cols, rows) {
  let out = "";
  for (let r = 0; r < rows; r += 1) {
    for (let c = 0; c < cols; c += 1) {
      if ((r + c) % 2 === 0) continue;
      out += `<rect x="${x + c * size}" y="${y + r * size}" width="${size}" height="${size}" fill="#e01020"/>`;
    }
  }
  return out;
}

function horizontal(colors) {
  const h = 40 / colors.length;
  return colors
    .map((c, i) => `<rect y="${(i * h).toFixed(3)}" width="60" height="${h.toFixed(3)}" fill="${c}"/>`)
    .join("");
}

function vertical(colors) {
  const w = 60 / colors.length;
  return colors
    .map((c, i) => `<rect x="${(i * w).toFixed(3)}" width="${w.toFixed(3)}" height="40" fill="${c}"/>`)
    .join("");
}

const FLAGS = {
  de: horizontal(["#000000", "#dd0000", "#ffce00"]),

  en:
    '<rect width="60" height="40" fill="#012169"/>' +
    '<path d="M0,0 60,40 M60,0 0,40" stroke="#fff" stroke-width="8"/>' +
    '<path d="M0,0 60,40 M60,0 0,40" stroke="#c8102e" stroke-width="4"/>' +
    '<path d="M30,0 V40 M0,20 H60" stroke="#fff" stroke-width="13"/>' +
    '<path d="M30,0 V40 M0,20 H60" stroke="#c8102e" stroke-width="8"/>',

  el:
    '<rect width="60" height="40" fill="#0d5eaf"/>' +
    greekStripes() +
    `<rect width="${(GREEK_STRIPE * 5).toFixed(3)}" height="${(GREEK_STRIPE * 5).toFixed(3)}" fill="#0d5eaf"/>` +
    `<path d="M${(GREEK_STRIPE * 2.5).toFixed(3)},0 V${(GREEK_STRIPE * 5).toFixed(3)} M0,${(GREEK_STRIPE * 2.5).toFixed(3)} H${(GREEK_STRIPE * 5).toFixed(3)}" stroke="#fff" stroke-width="${GREEK_STRIPE.toFixed(3)}"/>`,

  it: vertical(["#009246", "#ffffff", "#ce2b37"]),

  hr:
    horizontal(["#ff0000", "#ffffff", "#171796"]) +
    '<path d="M23,11 h14 v10 a7,7 0 0 1 -7,8 a7,7 0 0 1 -7,-8 z" fill="#fff" stroke="#171796" stroke-width="1"/>' +
    '<g clip-path="url(#hr-shield)">' + checkerboard(23, 11, 3.5, 4, 5) + "</g>" +
    '<clipPath id="hr-shield"><path d="M23,11 h14 v10 a7,7 0 0 1 -7,8 a7,7 0 0 1 -7,-8 z"/></clipPath>',

  nl: horizontal(["#ae1c28", "#ffffff", "#21468b"]),

  pl: horizontal(["#ffffff", "#dc143c"]),

  ro: vertical(["#002b7f", "#fcd116", "#ce1126"]),

  sk:
    horizontal(["#ffffff", "#0b4ea2", "#ee1c25"]) +
    '<path d="M16,11 h13 v11 a6.5,6.5 0 0 1 -6.5,8 a6.5,6.5 0 0 1 -6.5,-8 z" fill="#ee1c25" stroke="#fff" stroke-width="1.4"/>' +
    '<path d="M22.5,13 V26 M19,16 H26 M17.5,20 H27.5" stroke="#fff" stroke-width="1.8"/>',

  cs:
    '<rect width="60" height="20" fill="#ffffff"/>' +
    '<rect y="20" width="60" height="20" fill="#d7141a"/>' +
    '<path d="M0,0 L30,20 L0,40 Z" fill="#11457e"/>',

  tr:
    '<rect width="60" height="40" fill="#e30a17"/>' +
    '<circle cx="22.5" cy="20" r="10" fill="#fff"/>' +
    '<circle cx="26" cy="20" r="8" fill="#e30a17"/>' +
    '<path d="M36.2,20 l7.6,-2.5 -4.7,6.5 0,-8 4.7,6.5 z" fill="#fff"/>',

  uk: horizontal(["#005bbb", "#ffd500"]),

  bg: horizontal(["#ffffff", "#00966e", "#d62612"]),

  ru: horizontal(["#ffffff", "#0039a6", "#d52b1e"]),

  hu: horizontal(["#ce2939", "#ffffff", "#477050"]),

  fr: vertical(["#002395", "#ffffff", "#ed2939"]),

  // Spanien hat ungleiche Streifen (1:2:1), deshalb nicht ueber horizontal().
  // Ohne Wappen - das ist die zulaessige Zivilflagge und in Knopfgroesse
  // ohnehin nicht aufloesbar.
  es:
    '<rect width="60" height="10" fill="#aa151b"/>' +
    '<rect y="10" width="60" height="20" fill="#f1bf00"/>' +
    '<rect y="30" width="60" height="10" fill="#aa151b"/>',
};

/** Liefert das SVG-Markup einer Flagge; unbekannte Codes ergeben ein neutrales graues Feld. */
export function flagSvg(code, className = "flag") {
  const inner = FLAGS[code] || '<rect width="60" height="40" fill="#cbd5e1"/>';
  return (
    `<svg class="${className}" viewBox="0 0 60 40" role="presentation" focusable="false" ` +
    'xmlns="http://www.w3.org/2000/svg">' + inner + "</svg>"
  );
}
