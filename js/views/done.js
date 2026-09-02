/**
 * Abschlussseite.
 *
 * Zwei Faelle: verschickt, oder Fallback (kein Netz / Webhook nicht
 * eingerichtet). Im Fallback wurde das PDF bereits heruntergeladen; die Seite
 * sagt das in der Sprache des Fahrers und bietet den Download erneut an.
 *
 * Nach kurzer Zeit springt die App von selbst zur Startseite zurueck - am
 * Terminal soll der naechste Fahrer keine fremden Daten sehen.
 */

import { findLanguage } from "../i18n.js";
import { getSession, resetSession } from "../session.js";
import { downloadPdf } from "../mail.js";
import { escapeHtml } from "./home.js";

const AUTO_HOME_MS = 25000;

export async function renderDone(root, router, langCode) {
  const lang = findLanguage(langCode);
  const result = getSession().result;

  if (!result) {
    router.navigate("");
    return;
  }

  const sent = result.status === "sent";

  root.innerHTML = `
    <main class="page done" lang="${lang.code}">
      <div class="done-mark ${sent ? "is-ok" : "is-warn"}">
        <svg viewBox="0 0 64 64" role="presentation" focusable="false">
          <circle cx="32" cy="32" r="30" fill="currentColor" opacity="0.12"/>
          ${
            sent
              ? '<path d="M18 33l10 10 18-20" fill="none" stroke="currentColor" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/>'
              : '<path d="M32 16v22" stroke="currentColor" stroke-width="6" stroke-linecap="round"/>' +
                '<circle cx="32" cy="47" r="3.5" fill="currentColor"/>'
          }
        </svg>
      </div>

      <h1 class="done-title">${escapeHtml(lang.ui.doneTitle)}</h1>
      <p class="done-text">${escapeHtml(sent ? lang.ui.doneText : lang.ui.doneOffline)}</p>

      <dl class="done-facts">
        <div><dt>${escapeHtml(lang.labels.plate)}</dt><dd>${escapeHtml(result.entry.plate)}</dd></div>
        <div><dt>${escapeHtml(lang.ui.driverName)}</dt><dd>${escapeHtml(result.entry.driverName)}</dd></div>
        <div><dt>${escapeHtml(lang.ui.location)}</dt><dd>${escapeHtml(result.entry.locationName)}</dd></div>
      </dl>

      <button class="btn-secondary" id="download" type="button">${escapeHtml(lang.ui.download)}</button>
      <button class="btn-primary" id="again" type="button">${escapeHtml(lang.ui.newEntry)}</button>
    </main>
  `;

  const goHome = () => {
    resetSession();
    router.navigate("");
  };

  root.querySelector("#again").addEventListener("click", goHome);
  root.querySelector("#download").addEventListener("click", () => {
    downloadPdf(result.blob, result.filename);
  });

  const timer = setTimeout(() => {
    // Nur zurueckspringen, wenn der Nutzer die Seite nicht laengst verlassen hat.
    if (window.location.hash.includes("fertig")) goHome();
  }, AUTO_HOME_MS);

  window.addEventListener("hashchange", () => clearTimeout(timer), { once: true });
}
