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
import { findLanguage } from "./i18n.js";

const MARGIN = 15;
const PAGE_W = 210;
const PAGE_H = 297;
const CONTENT_W = PAGE_W - MARGIN * 2;
const FONT = "DejaVu";

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
  doc.setFont(FONT, "bold");
  doc.setFontSize(16);
  doc.text(lang.title, MARGIN, y);
  y += 7;
  doc.setFontSize(12);
  const subLines = doc.splitTextToSize(lang.subtitle, CONTENT_W);
  doc.text(subLines, MARGIN, y);
  y += subLines.length * 5.5;

  if (bilingual) {
    doc.setFont(FONT, "normal");
    doc.setFontSize(9);
    doc.setTextColor(110);
    const deSub = doc.splitTextToSize(`${de.title} – ${de.subtitle}`, CONTENT_W);
    doc.text(deSub, MARGIN, y);
    y += deSub.length * 4;
    doc.setTextColor(0);
  }

  y += 2;
  doc.setDrawColor(180);
  doc.line(MARGIN, y, PAGE_W - MARGIN, y);
  y += 7;

  // --- Kopfdaten ----------------------------------------------------------
  doc.setFontSize(10);
  const headRows = [
    ["Standort / Site", `${entry.locationName} (${entry.locationId})`],
    [`${lang.labels.date} / ${de.labels.date}`, formatDateTime(entry.createdAt)],
    ["Sprache / Language", lang.name],
  ];
  headRows.forEach(([label, value]) => {
    doc.setFont(FONT, "bold");
    doc.text(String(label), MARGIN, y);
    doc.setFont(FONT, "normal");
    doc.text(String(value), MARGIN + 48, y);
    y += 5.5;
  });
  y += 4;

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

    const blockH = lines.length * 4.8 + deLines.length * 3.8 + 4;

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
      y += deLines.length * 3.8;
      doc.setTextColor(0);
    }
    y += 4;
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
  doc.setFontSize(10);
  const dataRows = [
    [`${lang.ui.driverName} / ${de.ui.driverName}`, entry.driverName],
    [`${lang.labels.plate} / ${de.labels.plate}`, entry.plate],
  ];
  dataRows.forEach(([label, value]) => {
    doc.setFont(FONT, "bold");
    const labelLines = doc.splitTextToSize(String(label), 70);
    doc.text(labelLines, MARGIN, y);
    doc.setFont(FONT, "normal");
    doc.text(String(value || "–"), MARGIN + 75, y);
    y += Math.max(6, labelLines.length * 4.6);
  });

  y += 6;
  doc.setFont(FONT, "bold");
  doc.text(`${lang.labels.signature} / ${de.labels.signature}`, MARGIN, y);
  y += 3;

  const sigW = 80;
  const sigH = 28;
  if (entry.signature) {
    try {
      doc.addImage(entry.signature, "PNG", MARGIN, y, sigW, sigH, undefined, "FAST");
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
