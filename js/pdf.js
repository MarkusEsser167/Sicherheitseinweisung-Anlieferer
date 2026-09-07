/**
 * Erzeugt das Bestaetigungs-PDF der Sicherheitseinweisung.
 *
 * Das PDF ist ZWEISPRACHIG: oben der Text in der Sprache, die der Fahrer
 * gewaehlt und bestaetigt hat, darunter klein und grau der deutsche Text.
 * Grund: Empfaenger ist die deutsche Niederlassung - sie muss nachvollziehen
 * koennen, was bestaetigt wurde, ohne die Fremdsprache zu lesen. Bei Auswahl
 * "Deutsch" entfaellt die Wiederholung.
 */

import { DEJAVU_REGULAR_B64, DEJAVU_BOLD_B64 } from "../fonts/dejavu.js";
import { WEGO_LOGO_B64, VTI_LOGO_B64, LOGO_RATIO } from "./logos.js";
import { findLanguage } from "./i18n.js";

const MARGIN = 15;
const PAGE_W = 210;
const PAGE_H = 297;
const CONTENT_W = PAGE_W - MARGIN * 2;
const FONT = "DejaVu";

// Logos oben rechts, an der Oberkante des Titels ausgerichtet.
const LOGO_H = 7;
const LOGO_GAP = 3.5;
const WEGO_W = LOGO_H * LOGO_RATIO.wego;
const VTI_W = LOGO_H * LOGO_RATIO.vti;
const LOGO_BLOCK_W = WEGO_W + LOGO_GAP + VTI_W;

// Restbreite fuer Titel und Untertitel, damit sie nicht unter die Logos laufen.
const TITLE_W = CONTENT_W - LOGO_BLOCK_W - 8;

const ACCENT = [15, 92, 79];
const BOX_BG = [240, 247, 245];

let fontRegistered = false;

/**
 * Haengt die Unicode-Schrift in die jsPDF-VFS.
 *
 * Die jsPDF-Standardschriften koennen nur WinAnsi - Griechisch, Kyrillisch und
 * ein Teil der tuerkischen/osteuropaeischen Zeichen wuerden sonst als leere
 * Kaesten im PDF landen.
 */
function registerFont(doc) {
  doc.addFileToVFS("DejaVuSans.ttf", DEJAVU_REGULAR_B64);
  doc.addFont("DejaVuSans.ttf", FONT, "normal");
  doc.addFileToVFS("DejaVuSans-Bold.ttf", DEJAVU_BOLD_B64);
  doc.addFont("DejaVuSans-Bold.ttf", FONT, "bold");
  fontRegistered = true;
}

/**
 * Haken als Vektorlinien statt als Zeichen: das Haekchen-Zeichen (U+2713) liegt
 * im Dingbats-Block, der zugunsten der Dateigroesse nicht mit in die Schrift
 * aufgenommen wurde.
 */
function drawCheck(doc, x, y) {
  doc.setDrawColor(21, 128, 61);
  doc.setLineWidth(0.7);
  doc.setFillColor(220, 252, 231);
  doc.roundedRect(x, y - 3.4, 4.6, 4.6, 0.8, 0.8, "F");
  doc.lines([[1.2, 1.5], [2.2, -3.2]], x + 0.8, y - 1.2);
  doc.setLineWidth(0.2);
}

/**
 * Liest Breite und Hoehe aus dem IHDR-Kopf eines PNG-Data-URLs.
 *
 * Die PDF-Erzeugung laeuft synchron; ein Image-Objekt zu laden waere
 * asynchron. Der PNG-Kopf steht aber an fester Stelle (Bytes 16-23), lasst
 * sich also direkt aus den ersten Base64-Zeichen herauslesen.
 *
 * @returns {{w:number,h:number}|null}
 */
function pngSize(dataUrl) {
  try {
    const b64 = String(dataUrl).split(",")[1];
    const bin = atob(b64.slice(0, 64));
    const bytes = Uint8Array.from(bin, (c) => c.charCodeAt(0));
    const view = new DataView(bytes.buffer);
    const w = view.getUint32(16);
    const h = view.getUint32(20);
    return w > 0 && h > 0 ? { w, h } : null;
  } catch (err) {
    return null;
  }
}

/** Zeichnet die beiden Firmenlogos buendig an den rechten Satzspiegelrand. */
function drawLogos(doc, topY) {
  const vtiX = PAGE_W - MARGIN - VTI_W;
  const wegoX = vtiX - LOGO_GAP - WEGO_W;
  try {
    doc.addImage(WEGO_LOGO_B64, "PNG", wegoX, topY, WEGO_W, LOGO_H, undefined, "FAST");
    doc.addImage(VTI_LOGO_B64, "PNG", vtiX, topY, VTI_W, LOGO_H, undefined, "FAST");
  } catch (err) {
    // Ein Problem mit den Logos darf das Dokument nicht unbrauchbar machen.
    console.warn("Logos konnten nicht eingebettet werden", err);
  }
}

/**
 * Setzt die Schriftgroesse so weit herunter, bis der Text in `maxWidth` passt.
 *
 * Gebraucht fuer die zweisprachigen Beschriftungen im Fussblock: sie sollen je
 * EINE Zeile ergeben, sind aber je nach Sprache unterschiedlich lang - russisch
 * etwa "Регистрационный номер транпортного средства / KFZ-Kennzeichen".
 * Umbrechen waere hier haesslicher als ein Punkt kleinere Schrift.
 *
 * @returns {number} die tatsaechlich gesetzte Groesse
 */
function fitFontSize(doc, text, maxWidth, startSize, minSize) {
  let size = startSize;
  doc.setFontSize(size);
  while (size > minSize && doc.getTextWidth(text) > maxWidth) {
    size -= 0.25;
    doc.setFontSize(size);
  }
  return size;
}

function formatDateTime(iso) {
  const d = new Date(iso);
  const p = (n) => String(n).padStart(2, "0");
  return `${p(d.getDate())}.${p(d.getMonth() + 1)}.${d.getFullYear()} ${p(d.getHours())}:${p(d.getMinutes())}`;
}

/**
 * @param {object} entry Bestaetigung: lang, locationName, locationId, driverName,
 *                       plate, createdAt (ISO), signature (dataURL oder null)
 * @returns {{blob: Blob, filename: string}}
 */
export function buildEinweisungPdf(entry) {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  registerFont(doc);

  const lang = findLanguage(entry.lang);
  const de = findLanguage("de");
  const bilingual = lang.code !== "de";
  let y = MARGIN;

  // --- Kopf ---------------------------------------------------------------
  drawLogos(doc, y - 4.5);

  doc.setFont(FONT, "bold");
  doc.setFontSize(16);
  doc.text(lang.title, MARGIN, y);
  y += 7;
  doc.setFontSize(12);
  const subLines = doc.splitTextToSize(lang.subtitle, TITLE_W);
  doc.text(subLines, MARGIN, y);
  y += subLines.length * 5.5;

  if (bilingual) {
    doc.setFont(FONT, "normal");
    doc.setFontSize(9);
    doc.setTextColor(110);
    const deSub = doc.splitTextToSize(`${de.title} – ${de.subtitle}`, TITLE_W);
    doc.text(deSub, MARGIN, y);
    y += deSub.length * 4;
    doc.setTextColor(0);
  }

  // Untertitel duerfen den Logoblock nicht ueberlaufen.
  y = Math.max(y, MARGIN + LOGO_H + 4);
  y += 3;

  // --- Kopfdaten ----------------------------------------------------------
  // Als abgesetzter Kasten mit farbiger Kante: Standort, Zeitpunkt und Sprache
  // sind die Angaben, nach denen die Niederlassung das Dokument einordnet.
  // Beschriftungen nur dort zweisprachig, wo die Fassungen sich unterscheiden -
  // sonst stuende in der deutschen Fassung "Datum / Datum".
  const dual = (foreign, german) => (bilingual ? `${foreign} / ${german}` : german);

  const headRows = [
    [dual(lang.ui.location, de.ui.location), `${entry.locationName} (${entry.locationId})`],
    [dual(lang.labels.date, de.labels.date), formatDateTime(entry.createdAt)],
    // Fuer "Sprache" gibt es keine Uebersetzung in den Aushaengen, daher fest
    // deutsch/englisch statt einer erfundenen Fassung.
    [bilingual ? "Language / Sprache" : "Sprache", lang.name],
  ];
  const headBoxH = headRows.length * 6 + 6;

  doc.setFillColor(...BOX_BG);
  doc.setDrawColor(...ACCENT);
  doc.setLineWidth(0.3);
  doc.roundedRect(MARGIN, y, CONTENT_W, headBoxH, 2, 2, "FD");
  // Kraeftige Kante links als optischer Anker
  doc.setFillColor(...ACCENT);
  doc.rect(MARGIN, y + 0.6, 1.6, headBoxH - 1.2, "F");

  let hy = y + 6;
  headRows.forEach(([label, value]) => {
    doc.setTextColor(70);
    doc.setFont(FONT, "normal");
    doc.setFontSize(9);
    doc.text(String(label), MARGIN + 5, hy);
    doc.setTextColor(0);
    doc.setFont(FONT, "bold");
    doc.setFontSize(11);
    doc.text(String(value), MARGIN + 48, hy);
    hy += 6;
  });
  doc.setTextColor(0);
  y += headBoxH + 7;

  // --- Regelwerk ----------------------------------------------------------
  doc.setFont(FONT, "bold");
  doc.setFontSize(11);
  doc.text(lang.ui.readHint, MARGIN, y);
  y += 6;

  const textX = MARGIN + 7;
  const textW = CONTENT_W - 7;
  doc.setFontSize(10);

  lang.rules.forEach((rule, i) => {
    // splitTextToSize misst in der GERADE gesetzten Schriftgroesse. Sie muss
    // deshalb vor jedem Umbruch passend gesetzt werden - sonst wird der Text
    // in 8 pt umbrochen, aber in 10 pt gezeichnet und laeuft rechts heraus.
    doc.setFont(FONT, "normal");
    doc.setFontSize(10);
    const lines = doc.splitTextToSize(rule, textW);

    let deLines = [];
    if (bilingual) {
      doc.setFontSize(8);
      deLines = doc.splitTextToSize(de.rules[i], textW);
    }

    // Zeilenabstaende bewusst knapp: mit acht Punkten und der laengsten Sprache
    // (Russisch) passt das Dokument sonst nicht mehr auf eine Seite.
    const blockH = lines.length * 4.8 + deLines.length * 3.6 + 3.2;

    if (y + blockH > PAGE_H - MARGIN - 60) {
      doc.addPage();
      y = MARGIN;
    }

    drawCheck(doc, MARGIN, y);
    doc.setFont(FONT, "normal");
    doc.setFontSize(10);
    doc.setTextColor(0);
    doc.text(lines, textX, y);
    y += lines.length * 4.8;

    if (bilingual) {
      doc.setFontSize(8);
      doc.setTextColor(120);
      doc.text(deLines, textX, y);
      y += deLines.length * 3.6;
      doc.setTextColor(0);
    }
    y += 3.2;
  });

  // --- Bestaetigung -------------------------------------------------------
  y += 2;
  doc.setFont(FONT, "bold");
  doc.setFontSize(10);
  const confirmLines = doc.splitTextToSize(lang.confirm, CONTENT_W - 6);

  let deConfirm = [];
  if (bilingual) {
    doc.setFont(FONT, "normal");
    doc.setFontSize(8);
    deConfirm = doc.splitTextToSize(de.confirm, CONTENT_W - 6);
  }

  const boxH = confirmLines.length * 5 + deConfirm.length * 4 + 8;

  if (y + boxH + 55 > PAGE_H - MARGIN) {
    doc.addPage();
    y = MARGIN;
  }

  doc.setFillColor(240, 247, 245);
  doc.setDrawColor(15, 92, 79);
  doc.roundedRect(MARGIN, y, CONTENT_W, boxH, 2, 2, "FD");
  let by = y + 6;
  doc.setFont(FONT, "bold");
  doc.setFontSize(10);
  doc.text(confirmLines, MARGIN + 3, by);
  by += confirmLines.length * 5;
  if (bilingual) {
    doc.setFont(FONT, "normal");
    doc.setFontSize(8);
    doc.setTextColor(90);
    doc.text(deConfirm, MARGIN + 3, by);
    doc.setTextColor(0);
  }
  y += boxH + 10;

  // --- Fahrerdaten und Unterschrift --------------------------------------
  // Ebenfalls als hervorgehobener Kasten, mit fester Spalte fuer die Werte:
  // Beschriftung links, Wert rechts, jeweils GENAU eine Zeile. Zu lange
  // Beschriftungen werden verkleinert statt umbrochen (siehe fitFontSize).
  const dataRows = [
    [dual(lang.ui.driverName, de.ui.driverName), entry.driverName],
    [dual(lang.labels.plate, de.labels.plate), entry.plate],
  ];
  // Die Beschriftungsspalte muss die laengste zweisprachige Fassung tragen:
  // russisch "Регистрационный номер транпортного средства / KFZ-Kennzeichen"
  // misst bei 6 pt rund 75 mm. Mit 82 mm bleibt Luft, und fuer den Wert stehen
  // immer noch gut 90 mm bereit.
  const VALUE_X = MARGIN + 87;
  const LABEL_W = VALUE_X - MARGIN - 5;
  const dataBoxH = dataRows.length * 7.5 + 5;

  doc.setFillColor(...BOX_BG);
  doc.setDrawColor(...ACCENT);
  doc.setLineWidth(0.3);
  doc.roundedRect(MARGIN, y, CONTENT_W, dataBoxH, 2, 2, "FD");
  doc.setFillColor(...ACCENT);
  doc.rect(MARGIN, y + 0.6, 1.6, dataBoxH - 1.2, "F");

  let dy = y + 6.5;
  dataRows.forEach(([label, value]) => {
    doc.setFont(FONT, "normal");
    doc.setTextColor(70);
    fitFontSize(doc, String(label), LABEL_W, 9, 6);
    doc.text(String(label), MARGIN + 5, dy);

    doc.setFont(FONT, "bold");
    doc.setTextColor(0);
    fitFontSize(doc, String(value || "–"), PAGE_W - MARGIN - VALUE_X - 4, 12, 8);
    doc.text(String(value || "–"), VALUE_X, dy);
    dy += 7.5;
  });
  doc.setTextColor(0);
  y += dataBoxH + 8;
  doc.setFont(FONT, "bold");
  doc.text(dual(lang.labels.signature, de.labels.signature), MARGIN, y);
  y += 3;

  const sigW = 80;

  // Hoehe an den Rest der Seite anpassen: bei der laengsten Sprache (Russisch,
  // acht Punkte, alles zweisprachig) bleibt unten nur wenig Platz, und die
  // Unterschriftslinie darf nicht in die Fusszeile laufen. 10 mm Reserve fuer
  // die Fusszeile, darunter wird das Feld kleiner statt die Seite zu brechen.
  const FOOTER_RESERVE = 12;
  const sigH = Math.max(14, Math.min(25, PAGE_H - MARGIN - FOOTER_RESERVE - y));

  if (entry.signature) {
    try {
      // Seitenverhaeltnis erhalten: das Unterschriftenfeld ist je nach Geraet
      // unterschiedlich breit, stur auf feste Masse gezogen waere die
      // Unterschrift verzerrt. Sie wird linksbuendig in den Rahmen eingepasst.
      const size = pngSize(entry.signature);
      let w = sigW;
      let h = sigH;
      if (size) {
        const scale = Math.min(sigW / size.w, sigH / size.h);
        w = size.w * scale;
        h = size.h * scale;
      }
      doc.addImage(entry.signature, "PNG", MARGIN, y + (sigH - h), w, h, undefined, "FAST");
    } catch (err) {
      // Ungueltiges Bild soll das Dokument nicht unbrauchbar machen.
      console.warn("Unterschrift konnte nicht eingebettet werden", err);
    }
  }
  doc.setDrawColor(120);
  doc.line(MARGIN, y + sigH, MARGIN + sigW, y + sigH);

  // --- Fuss ---------------------------------------------------------------
  doc.setFont(FONT, "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(130);
  doc.text(
    `Digital bestätigt über die App "Sicherheitseinweisung Anlieferer" – ${formatDateTime(entry.createdAt)}`,
    MARGIN,
    PAGE_H - 10
  );

  const safePlate = String(entry.plate || "ohne-kennzeichen").replace(/[^A-Za-z0-9-]+/g, "-");
  const stamp = new Date(entry.createdAt).toISOString().slice(0, 16).replace(/[:T]/g, "-");
  return {
    blob: doc.output("blob"),
    filename: `Sicherheitseinweisung_${safePlate}_${stamp}.pdf`,
  };
}

export function isFontRegistered() {
  return fontRegistered;
}
