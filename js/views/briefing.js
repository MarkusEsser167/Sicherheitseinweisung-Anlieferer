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
 * Symbole zu den Punkten - sie entsprechen den Piktogrammen des Aushangs.
 * "staff" hat kein Vorbild im Aushang, weil Punkt 7 dort (noch) nicht steht.
 */
const ICONS = ["speed", "parking", "ppe", "distance", "noentry", "cabin", "staff"];

const ICON_SVG = {
  speed:
    '<circle cx="20" cy="20" r="16" fill="#fff" stroke="#d32f2f" stroke-width="4"/>' +
    '<text x="20" y="26" text-anchor="middle" font-size="15" font-weight="700" fill="#111">5</text>',
  parking:
    '<rect x="4" y="4" width="32" height="32" rx="4" fill="#1565c0"/>' +
    '<text x="20" y="29" text-anchor="middle" font-size="22" font-weight="700" fill="#fff">P</text>',
  // Warnweste in Signalgelb - die Farbe traegt hier mehr zum Wiedererkennen bei
  // als die Silhouette, die in Knopfgroesse kaum noch aufloest.
  ppe:
    '<circle cx="20" cy="20" r="16" fill="#1565c0"/>' +
    '<rect x="13.5" y="13" width="13" height="16" rx="1.5" fill="#f7c600"/>' +
    '<path d="M17 13l3 4 3-4z" fill="#1565c0"/>' +
    '<path d="M13.5 21.5h13M13.5 25h13" stroke="#fff" stroke-width="1.5"/>',
  distance:
    '<circle cx="20" cy="20" r="16" fill="#fbc02d"/>' +
    '<path d="M8 20h24M8 20l4-3v6zM32 20l-4-3v6z" stroke="#111" stroke-width="2" fill="#111"/>' +
    '<text x="20" y="32" text-anchor="middle" font-size="9" font-weight="700" fill="#111">2 m</text>',
  noentry:
    '<circle cx="20" cy="20" r="16" fill="#d32f2f"/>' +
    '<rect x="8" y="17" width="24" height="6" rx="1" fill="#fff"/>',
  cabin:
    '<circle cx="20" cy="20" r="16" fill="#2e7d32"/>' +
    '<path d="M10 24V17l4-5h9l3 5h4v7z" fill="#fff"/>' +
    '<circle cx="15" cy="26" r="2.5" fill="#fff"/><circle cx="26" cy="26" r="2.5" fill="#fff"/>',

  // Lagerpersonal: Person mit erhobener Hand - blaues Rund wie die uebrigen
  // Gebotszeichen, damit der neue Punkt sich in die Reihe einfuegt.
  staff:
    '<circle cx="20" cy="20" r="16" fill="#1565c0"/>' +
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
