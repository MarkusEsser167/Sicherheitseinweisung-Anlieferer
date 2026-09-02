/**
 * Startseite: Sprachauswahl per Flagge.
 *
 * Erste Seite fuer den Anlieferer - sie enthaelt absichtlich keinen deutschen
 * Fliesstext ausser dem Standortnamen, damit auch jemand ohne Deutschkenntnisse
 * sofort weiterkommt. Der Standort wird nur klein im Kopf angezeigt und ist
 * ueber "Ändern" erreichbar; er ist Sache des Personals, nicht des Fahrers.
 */

import { LANGUAGES } from "../i18n.js";
import { flagSvg } from "../flags.js";
import { getLocationId } from "../settings.js";
import { findLocation } from "../locations.js";
import { startSession } from "../session.js";

export async function renderHome(root, router) {
  const location = findLocation(getLocationId());

  // Ohne Standort ist kein Versand moeglich - dann zuerst die Einrichtung.
  if (!location) {
    router.navigate("standort");
    return;
  }

  root.innerHTML = `
    <header class="topbar">
      <div class="topbar-site">
        <span class="topbar-label">Standort</span>
        <strong>${escapeHtml(location.name)}</strong>
      </div>
      <button class="btn-link" id="changeLocation" type="button">Ändern</button>
    </header>

    <main class="home">
      <h1 class="home-title">Sicherheitseinweisung</h1>
      <p class="home-sub">Safety briefing · Instrucţiune · Инструкция</p>
      <p class="home-hint">Bitte Sprache wählen · Please select your language</p>

      <div class="flag-grid">
        ${LANGUAGES.map(
          (lang) => `
          <button class="flag-btn" type="button" data-lang="${lang.code}" lang="${lang.code}">
            ${flagSvg(lang.code)}
            <span class="flag-name">${escapeHtml(lang.name)}</span>
          </button>`
        ).join("")}
      </div>

      <button class="btn-link btn-log" id="showLog" type="button">Protokoll auf diesem Gerät</button>
    </main>
  `;

  root.querySelector("#changeLocation").addEventListener("click", () => router.navigate("standort"));
  root.querySelector("#showLog").addEventListener("click", () => router.navigate("protokoll"));

  root.querySelectorAll(".flag-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const code = btn.dataset.lang;
      const lang = LANGUAGES.find((l) => l.code === code);
      startSession(code, lang.rules.length);
      router.navigate(`regeln/${code}`);
    });
  });
}

export function escapeHtml(value) {
  return String(value == null ? "" : value).replace(/[&<>"']/g, (c) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  })[c]);
}
