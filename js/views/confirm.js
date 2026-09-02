/**
 * Dritte Seite: Pflichtangaben, Unterschrift, Absenden.
 *
 * Kennzeichen und Fahrername sind Pflicht - ohne sie ist die Bestaetigung
 * wertlos, weil sie niemandem zugeordnet werden kann. Der Absende-Knopf bleibt
 * deshalb gesperrt, bis beide Felder gefuellt sind.
 */

import { findLanguage } from "../i18n.js";
import { flagSvg } from "../flags.js";
import { getSession, allConfirmed } from "../session.js";
import { getLocationId } from "../settings.js";
import { findLocation } from "../locations.js";
import { attachSignaturePad } from "../signature.js";
import { buildEinweisungPdf } from "../pdf.js";
import { sendPdfByMail, downloadPdf } from "../mail.js";
import { saveEntry } from "../db.js";
import { escapeHtml } from "./home.js";

export async function renderConfirm(root, router, langCode) {
  const lang = findLanguage(langCode);
  const session = getSession();
  const location = findLocation(getLocationId());

  // Niemand soll das Formular erreichen, ohne die Punkte bestaetigt zu haben.
  if (!location) {
    router.navigate("standort");
    return;
  }
  if (session.lang !== lang.code || !allConfirmed()) {
    router.navigate(`regeln/${lang.code}`);
    return;
  }

  root.innerHTML = `
    <header class="topbar">
      <button class="btn-link" id="back" type="button">‹ ${escapeHtml(lang.ui.back)}</button>
      <span class="topbar-flag">${flagSvg(lang.code, "flag flag-sm")}</span>
    </header>

    <main class="page" lang="${lang.code}">
      <div class="confirm-box">
        <p class="confirm-text">${escapeHtml(lang.confirm)}</p>
        ${lang.code === "de" ? "" : `<p class="confirm-de">${escapeHtml(findLanguage("de").confirm)}</p>`}
      </div>

      <h2 class="section-title">${escapeHtml(lang.ui.driverData)}</h2>

      <label class="field">
        <span class="field-label">${escapeHtml(lang.labels.plate)} <em>*</em></span>
        <input id="plate" type="text" inputmode="text" autocomplete="off"
               autocapitalize="characters" spellcheck="false" maxlength="24"
               value="${escapeHtml(session.plate)}" />
      </label>

      <label class="field">
        <span class="field-label">${escapeHtml(lang.ui.driverName)} <em>*</em></span>
        <input id="driver" type="text" autocomplete="off" maxlength="80"
               value="${escapeHtml(session.driverName)}" />
      </label>

      <div class="field">
        <span class="field-label">${escapeHtml(lang.labels.signature)}</span>
        <canvas id="sig" class="sigpad"></canvas>
        <button class="btn-link sig-clear" id="clearSig" type="button">${escapeHtml(lang.ui.clear)}</button>
      </div>

      <p class="hint" id="error" hidden></p>
    </main>

    <footer class="actionbar">
      <span class="site-tag">${escapeHtml(location.name)}</span>
      <button class="btn-primary" id="submit" type="button" disabled>${escapeHtml(lang.ui.submit)}</button>
    </footer>
  `;

  const plateEl = root.querySelector("#plate");
  const driverEl = root.querySelector("#driver");
  const submitEl = root.querySelector("#submit");
  const errorEl = root.querySelector("#error");
  const pad = attachSignaturePad(root.querySelector("#sig"));

  function refresh() {
    session.plate = plateEl.value.trim();
    session.driverName = driverEl.value.trim();
    submitEl.disabled = !(session.plate && session.driverName);
  }

  plateEl.addEventListener("input", refresh);
  driverEl.addEventListener("input", refresh);
  root.querySelector("#clearSig").addEventListener("click", () => pad.clear());
  root.querySelector("#back").addEventListener("click", () => {
    pad.destroy();
    router.navigate(`regeln/${lang.code}`);
  });

  submitEl.addEventListener("click", async () => {
    refresh();
    if (!session.plate || !session.driverName) {
      errorEl.textContent = lang.ui.requiredHint;
      errorEl.hidden = false;
      return;
    }

    submitEl.disabled = true;
    submitEl.textContent = lang.ui.sending;
    errorEl.hidden = true;

    const entry = {
      createdAt: new Date().toISOString(),
      locationId: location.id,
      locationName: location.name,
      email: location.email,
      lang: lang.code,
      langName: lang.name,
      driverName: session.driverName,
      plate: session.plate,
      signature: pad.toDataURL(),
    };

    try {
      const { blob, filename } = buildEinweisungPdf(entry);
      const status = await sendPdfByMail(entry, blob, filename);

      // Das Protokoll haelt fest, dass bestaetigt wurde - ohne Unterschriftsbild.
      await saveEntry({
        createdAt: entry.createdAt,
        locationId: entry.locationId,
        locationName: entry.locationName,
        email: entry.email,
        lang: entry.lang,
        driverName: entry.driverName,
        plate: entry.plate,
        mailStatus: status === "sent" ? "gesendet" : "offen",
      });

      if (status !== "sent") downloadPdf(blob, filename);

      session.result = { status, entry, blob, filename };
      pad.destroy();
      router.navigate(`fertig/${lang.code}`);
    } catch (err) {
      console.error(err);
      errorEl.textContent = `${lang.ui.requiredHint} (${err.message})`;
      errorEl.hidden = false;
      submitEl.disabled = false;
      submitEl.textContent = lang.ui.submit;
    }
  });

  refresh();
}
