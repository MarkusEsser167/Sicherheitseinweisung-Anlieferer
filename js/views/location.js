/**
 * Standortauswahl - einmalige Einrichtung pro Geraet.
 *
 * 52 Niederlassungen sind zu viele fuer eine reine Liste, darum mit Suchfeld.
 * Die Auswahl landet in localStorage und wird beim naechsten Start nicht mehr
 * abgefragt.
 */

import { LOCATIONS, findLocation } from "../locations.js";
import { getLocationId, setLocationId } from "../settings.js";
import { escapeHtml } from "./home.js";

export async function renderLocation(root, router) {
  const currentId = getLocationId();
  const current = findLocation(currentId);

  root.innerHTML = `
    <header class="topbar">
      <div class="topbar-site"><strong>Standort wählen</strong></div>
      ${current ? '<button class="btn-link" id="cancel" type="button">Abbrechen</button>' : ""}
    </header>

    <main class="page">
      <p class="hint">
        Der Standort bestimmt, an welche Mailadresse die Bestätigungen gehen.
        Er bleibt auf diesem Gerät gespeichert.
      </p>

      <input class="search" id="search" type="search" inputmode="search"
             placeholder="Standort suchen …" autocomplete="off" />

      <ul class="loc-list" id="list"></ul>
    </main>
  `;

  const listEl = root.querySelector("#list");
  const searchEl = root.querySelector("#search");

  function draw(filter) {
    const needle = filter.trim().toLowerCase();
    const rows = needle
      ? LOCATIONS.filter(
          (l) => l.name.toLowerCase().includes(needle) || l.id.includes(needle) || l.email.includes(needle)
        )
      : LOCATIONS;

    if (!rows.length) {
      listEl.innerHTML = '<li class="loc-empty">Kein Standort gefunden.</li>';
      return;
    }

    listEl.innerHTML = rows
      .map(
        (l) => `
        <li>
          <button class="loc-btn${l.id === currentId ? " is-current" : ""}" type="button" data-id="${l.id}">
            <span class="loc-name">${escapeHtml(l.name)}</span>
            <span class="loc-meta">${escapeHtml(l.id)} · ${escapeHtml(l.email)}</span>
          </button>
        </li>`
      )
      .join("");

    listEl.querySelectorAll(".loc-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        setLocationId(btn.dataset.id);
        router.navigate("");
      });
    });
  }

  draw("");
  searchEl.addEventListener("input", () => draw(searchEl.value));

  const cancelEl = root.querySelector("#cancel");
  if (cancelEl) cancelEl.addEventListener("click", () => router.navigate(""));
}
