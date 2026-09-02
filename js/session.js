/**
 * Zustand einer laufenden Einweisung.
 *
 * Bewusst nur im Arbeitsspeicher: Wird die App zwischendurch geschlossen, soll
 * ein halb ausgefuelltes Formular NICHT beim naechsten Fahrer wieder auftauchen.
 * Dauerhaft gespeichert werden nur der Standort (settings.js) und das
 * Protokoll abgeschlossener Einweisungen (db.js).
 */

const empty = () => ({
  lang: null,
  confirmed: [],
  driverName: "",
  plate: "",
  signature: null,
  result: null,
});

let state = empty();

export function getSession() {
  return state;
}

export function startSession(langCode, ruleCount) {
  state = empty();
  state.lang = langCode;
  state.confirmed = new Array(ruleCount).fill(false);
  return state;
}

export function resetSession() {
  state = empty();
}

export function allConfirmed() {
  return state.confirmed.length > 0 && state.confirmed.every(Boolean);
}
