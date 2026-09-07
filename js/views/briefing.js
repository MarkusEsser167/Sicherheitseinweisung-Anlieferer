/**
 * Zweite Seite: die Sicherheitsregeln in der gewaehlten Sprache.
 *
 * Jeder Punkt wird EINZELN bestaetigt. Ein Sammelhaken waere schneller, belegt
 * aber nicht, dass der Fahrer die Punkte auch gelesen hat - genau das ist der
 * Zweck der Unterweisung. "Weiter" bleibt gesperrt, bis alle Punkte bestaetigt
 * sind; der Fortschritt ist an der Zaehlung im Fussbereich ablesbar.
 */

import { findLanguage } from "../i18n.js";
import { flagSvg } from "../flags.js";
import { getSession, startSession } from "../session.js";
import { escapeHtml } from "./home.js";

/**
 * Symbole zu den Punkten.
 *
 * Nachgezeichnet nach den Schildern auf dem Betriebsgelaendeschild und dem
 * Unterweisungsbogen (HSE, Mail vom 04.09.2026): Gebotszeichen blau rund,
 * Warnzeichen gelbes Dreieck, Verbotszeichen rot durchgestrichen. Als Vektor
 * statt als Bild, damit sie auf jedem Geraet scharf bleiben und offline
 * funktionieren.
 *
 * "parking" und "staff" haben kein Vorbild auf den Schildern - der Parkhinweis
 * teilt sich auf dem Aushang die Zeile mit der Geschwindigkeit, und Punkt 8
 * steht dort (noch) gar nicht.
 */
const ICONS = ["report", "speed", "parking", "ppe", "distance", "noentry", "cabin", "staff"];

/** Blau der Gebotszeichen bzw. Gelb der Warnzeichen, wie auf den Schildern. */
const SIGN_BLUE = "#005ca9";
const SIGN_YELLOW = "#f9c000";
const SIGN_RED = "#d81e26";

const ICON_SVG = {
  // Gebotszeichen "Beim Lagerbuero melden": blaues Rund mit Ausrufezeichen,
  // wie der erste Punkt auf dem Betriebsgelaendeschild.
  report:
    `<circle cx="20" cy="20" r="16" fill="${SIGN_BLUE}"/>` +
    '<rect x="18.1" y="9.5" width="3.8" height="13.5" rx="1.9" fill="#fff"/>' +
    '<circle cx="20" cy="27.6" r="2.4" fill="#fff"/>',

  // Zulaessige Hoechstgeschwindigkeit 15 km/h - so steht es auf dem
  // Betriebsgelaendeschild und dem Unterweisungsbogen (nicht 5).
  speed:
    `<circle cx="20" cy="20" r="15.5" fill="#fff" stroke="${SIGN_RED}" stroke-width="4.5"/>` +
    '<text x="20" y="25.6" text-anchor="middle" font-size="14" font-weight="700" ' +
    'font-family="Arial, Helvetica, sans-serif" fill="#111">15</text>',

  // Kein Vorbild auf den Schildern: der Parkhinweis teilt sich dort die Zeile
  // mit der Geschwindigkeit. Blaues Parkschild als naheliegende Entsprechung.
  parking:
    `<rect x="4" y="4" width="32" height="32" rx="4" fill="${SIGN_BLUE}"/>` +
    '<text x="20" y="29" text-anchor="middle" font-size="22" font-weight="700" ' +
    'font-family="Arial, Helvetica, sans-serif" fill="#fff">P</text>',

  // Zwei Gebotszeichen nebeneinander wie auf dem Unterweisungsbogen:
  // Fussschutz benutzen und Warnweste benutzen.
  ppe:
    // Linker Kreis: Sicherheitsschuh im Profil - Schaft, dann schraeg zur
    // Spitze und flache Sohle. Rechter Kreis: Warnweste mit zwei Reflexstreifen.
    `<circle cx="10.5" cy="20" r="9.5" fill="${SIGN_BLUE}"/>` +
    '<path d="M6.8 13.4 L10.8 13.4 L10.8 18.6 ' +
    'C10.8 20.0 12.2 20.8 14.0 21.5 C15.2 22.0 15.8 22.6 15.8 23.4 ' +
    'L15.8 24.4 L6.8 24.4 Z" fill="#fff"/>' +
    `<circle cx="29.5" cy="20" r="9.5" fill="${SIGN_BLUE}"/>` +
    '<path d="M25.2 15.6 L28.0 14.6 L29.5 17.4 L31.0 14.6 L33.8 15.6 ' +
    'L33.8 25.4 L25.2 25.4 Z" fill="#fff"/>' +
    `<path d="M25.2 20.4 H33.8 M25.2 22.6 H33.8" stroke="${SIGN_BLUE}" stroke-width="1.2"/>`,

  // Warnzeichen "Warnung vor Flurfoerderzeugen" - gelbes Dreieck mit schwarzem
  // Rand, wie von HSE gewuenscht (vorher ein gelber Kreis mit Massangabe).
  distance:
    `<path d="M20 3.5 L37.5 34 L2.5 34 Z" fill="${SIGN_YELLOW}" stroke="#111" ` +
    'stroke-width="2.6" stroke-linejoin="round"/>' +
    '<g fill="#111">' +
    '<rect x="12.6" y="16.5" width="1.7" height="10.5"/>' +
    '<rect x="9.2" y="25.6" width="4" height="1.5"/>' +
    '<rect x="15.2" y="20.4" width="9" height="5.6" rx="0.8"/>' +
    '<rect x="17.4" y="16.2" width="1.5" height="4.4"/>' +
    '<rect x="17.4" y="16.2" width="6.4" height="1.4"/>' +
    '<circle cx="17.2" cy="27.4" r="2"/><circle cx="23" cy="27.4" r="2"/>' +
    '</g>',

  // Verbotszeichen "Zutritt verboten" (Hand und Gesicht), NICHT "Einfahrt
  // verboten" - HSE hatte auf die abweichende Bedeutung hingewiesen.
  noentry:
    // Person links, abwehrend erhobene Hand rechts - die Hand traegt die
    // Aussage und ist deshalb gross und mit wenigen, breiten Fingern gezeichnet.
    `<circle cx="20" cy="20" r="15.2" fill="#fff" stroke="${SIGN_RED}" stroke-width="4"/>` +
    '<g fill="#111">' +
    '<circle cx="13.2" cy="15.0" r="3.0"/>' +
    '<path d="M9.4 26.2c0-3.0 1.7-4.9 3.8-4.9s3.8 1.9 3.8 4.9z"/>' +
    '<rect x="19.8" y="15.0" width="2.4" height="9.0" rx="1.2"/>' +
    '<rect x="22.5" y="12.6" width="2.4" height="11.4" rx="1.2"/>' +
    '<rect x="25.2" y="13.6" width="2.4" height="10.4" rx="1.2"/>' +
    '<rect x="27.9" y="15.8" width="2.4" height="8.2" rx="1.2"/>' +
    '<path d="M19.4 21.8h11.3v3.0a4.0 4.0 0 0 1-4.0 4.0h-3.3a4.0 4.0 0 0 1-4.0-4.0z"/>' +
    '</g>' +
    `<path d="M9.2 30.8 L30.8 9.2" stroke="${SIGN_RED}" stroke-width="4" stroke-linecap="round"/>`,

  cabin:
    '<circle cx="20" cy="20" r="16" fill="#2e7d32"/>' +
    '<path d="M10 24V17l4-5h9l3 5h4v7z" fill="#fff"/>' +
    '<circle cx="15" cy="26" r="2.5" fill="#fff"/><circle cx="26" cy="26" r="2.5" fill="#fff"/>',

  // Lagerpersonal: Person mit erhobener Hand - blaues Rund wie die uebrigen
  // Gebotszeichen, damit der neue Punkt sich in die Reihe einfuegt.
  staff:
    `<circle cx="20" cy="20" r="16" fill="${SIGN_BLUE}"/>` +
    '<circle cx="18" cy="13.5" r="3.4" fill="#fff"/>' +
    '<path d="M12 30v-7a6 6 0 0 1 12 0v7z" fill="#fff"/>' +
    '<path d="M26 20V13" stroke="#fff" stroke-width="2.6" stroke-linecap="round"/>' +
    '<circle cx="26" cy="10.5" r="2" fill="#fff"/>',
};

export async function renderBriefing(root, router, langCode) {
  const lang = findLanguage(langCode);
  let session = getSession();

  // Direkter Aufruf per Link/Reload: Sitzung passend zur Sprache neu aufsetzen.
  if (session.lang !== lang.code || session.confirmed.length !== lang.rules.length) {
    session = startSession(lang.code, lang.rules.length);
  }

  root.innerHTML = `
    <header class="topbar">
      <button class="btn-link" id="back" type="button">‹ ${escapeHtml(lang.ui.back)}</button>
      <span class="topbar-flag">${flagSvg(lang.code, "flag flag-sm")}</span>
    </header>

    <main class="page" lang="${lang.code}">
      <h1 class="page-title">${escapeHtml(lang.title)}</h1>
      <p class="page-sub">${escapeHtml(lang.subtitle)}</p>
      <p class="hint">${escapeHtml(lang.ui.readHint)}</p>

      <ol class="rules">
        ${lang.rules
          .map(
            (rule, i) => `
          <li class="rule${session.confirmed[i] ? " is-done" : ""}" data-index="${i}">
            <svg class="rule-icon" viewBox="0 0 40 40" role="presentation" focusable="false">
              ${ICON_SVG[ICONS[i]] || ""}
            </svg>
            <div class="rule-body">
              <p class="rule-text">${escapeHtml(rule)}</p>
              <label class="rule-check">
                <input type="checkbox" data-index="${i}" ${session.confirmed[i] ? "checked" : ""} />
                <span>${escapeHtml(lang.ui.understood)}</span>
              </label>
            </div>
          </li>`
          )
          .join("")}
      </ol>
    </main>

    <footer class="actionbar">
      <span class="progress" id="progress"></span>
      <button class="btn-primary" id="next" type="button" disabled>${escapeHtml(lang.ui.next)} ›</button>
    </footer>
  `;

  const nextBtn = root.querySelector("#next");
  const progressEl = root.querySelector("#progress");

  function refresh() {
    const done = session.confirmed.filter(Boolean).length;
    const total = session.confirmed.length;
    progressEl.textContent = `${done} / ${total}`;
    const complete = done === total;
    nextBtn.disabled = !complete;
    progressEl.classList.toggle("is-complete", complete);
  }

  root.querySelectorAll('.rule-check input[type="checkbox"]').forEach((box) => {
    box.addEventListener("change", () => {
      const index = Number(box.dataset.index);
      session.confirmed[index] = box.checked;
      root.querySelector(`.rule[data-index="${index}"]`).classList.toggle("is-done", box.checked);
      refresh();
    });
  });

  root.querySelector("#back").addEventListener("click", () => router.navigate(""));
  nextBtn.addEventListener("click", () => {
    if (session.confirmed.every(Boolean)) router.navigate(`bestaetigen/${lang.code}`);
  });

  refresh();
}
