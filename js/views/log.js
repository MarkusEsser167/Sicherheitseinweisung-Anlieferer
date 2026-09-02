/**
 * Protokoll der auf diesem Geraet erfassten Einweisungen.
 *
 * Fuer das Standortpersonal gedacht, nicht fuer den Fahrer: hier ist ablesbar,
 * ob eine Bestaetigung tatsaechlich rausgegangen ist ("gesendet") oder nur
 * lokal vorliegt ("offen", z. B. weil das Tablet offline war).
 */

import { listEntries } from "../db.js";
import { findLanguage } from "../i18n.js";
import { escapeHtml } from "./home.js";

function formatDateTime(iso) {
  const d = new Date(iso);
  const p = (n) => String(n).padStart(2, "0");
  return `${p(d.getDate())}.${p(d.getMonth() + 1)}.${d.getFullYear()} ${p(d.getHours())}:${p(d.getMinutes())}`;
}

export async function renderLog(root, router) {
  const entries = await listEntries();

  root.innerHTML = `
    <header class="topbar">
      <button class="btn-link" id="back" type="button">‹ Zurück</button>
      <div class="topbar-site"><strong>Protokoll</strong></div>
    </header>

    <main class="page">
      <p class="hint">
        ${entries.length} Einweisung(en) auf diesem Gerät.
        Das Protokoll dient als Nachweis, falls eine Mail nicht zugestellt wurde.
      </p>

      ${
        entries.length
          ? `<ul class="log-list">
              ${entries
                .map(
                  (e) => `
                <li class="log-item">
                  <div class="log-head">
                    <strong>${escapeHtml(e.plate)}</strong>
                    <span class="badge ${e.mailStatus === "gesendet" ? "badge-ok" : "badge-warn"}">
                      ${escapeHtml(e.mailStatus)}
                    </span>
                  </div>
                  <div class="log-meta">
                    ${escapeHtml(e.driverName)} · ${escapeHtml(findLanguage(e.lang).name)}<br />
                    ${formatDateTime(e.createdAt)} · ${escapeHtml(e.locationName)}
                  </div>
                </li>`
                )
                .join("")}
            </ul>`
          : '<p class="loc-empty">Noch keine Einweisungen erfasst.</p>'
      }
    </main>
  `;

  root.querySelector("#back").addEventListener("click", () => router.navigate(""));
}
