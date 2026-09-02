/**
 * Router der App. Hash-basiert, damit sie ohne Server-Konfiguration auf
 * GitHub Pages oder von einem beliebigen Webspace laeuft.
 *
 * Routen:
 *   #/                      Sprachauswahl (Startseite)
 *   #/standort              Standortauswahl (einmalige Einrichtung)
 *   #/regeln/<lang>         Sicherheitsregeln zum Bestaetigen
 *   #/bestaetigen/<lang>    Fahrerdaten, Unterschrift, Absenden
 *   #/fertig/<lang>         Abschlussmeldung
 *   #/protokoll             Lokales Protokoll fuer das Personal
 */

import { renderHome } from "./views/home.js";
import { renderLocation } from "./views/location.js";
import { renderBriefing } from "./views/briefing.js";
import { renderConfirm } from "./views/confirm.js";
import { renderDone } from "./views/done.js";
import { renderLog } from "./views/log.js";

const appEl = document.getElementById("app");

const router = {
  navigate(path) {
    window.location.hash = `#/${path}`;
  },
};

let routeToken = 0;

async function route() {
  const myToken = ++routeToken;
  const hash = window.location.hash.replace(/^#\/?/, "");
  const [head, param] = hash.split("/");

  try {
    if (head === "standort") {
      await renderLocation(appEl, router);
    } else if (head === "regeln") {
      await renderBriefing(appEl, router, param);
    } else if (head === "bestaetigen") {
      await renderConfirm(appEl, router, param);
    } else if (head === "fertig") {
      await renderDone(appEl, router, param);
    } else if (head === "protokoll") {
      await renderLog(appEl, router);
    } else {
      await renderHome(appEl, router);
    }
  } catch (err) {
    if (myToken === routeToken) {
      appEl.innerHTML = `<div class="error-box">Fehler: ${err.message}</div>`;
    }
    console.error(err);
    return;
  }

  if (myToken !== routeToken) return; // eine neuere Navigation hat diese ueberholt
  window.scrollTo(0, 0);
}

window.addEventListener("hashchange", route);
if (document.readyState === "loading") {
  window.addEventListener("DOMContentLoaded", route);
} else {
  route();
}

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("./sw.js")
      .catch((err) => console.warn("SW-Registrierung fehlgeschlagen", err));
  });
}
