/**
 * Geraetebezogene Einstellungen (localStorage).
 *
 * Der Standort wird einmal pro Tablet/Telefon eingestellt und bleibt dann fuer
 * alle weiteren Einweisungen erhalten - genau das ist der Zweck: der Anlieferer
 * soll ihn nicht selbst auswaehlen muessen.
 */

const KEY_LOCATION = "einweisung.locationId";

/** Liefert die gespeicherte Niederlassungs-Nummer oder null, wenn noch keine gesetzt ist. */
export function getLocationId() {
  try {
    return window.localStorage.getItem(KEY_LOCATION) || null;
  } catch (err) {
    // Privater Modus / gesperrter Speicher: App bleibt bedienbar, fragt dann jedes Mal.
    console.warn("localStorage nicht verfuegbar", err);
    return null;
  }
}

export function setLocationId(id) {
  try {
    window.localStorage.setItem(KEY_LOCATION, id);
  } catch (err) {
    console.warn("Standort konnte nicht gespeichert werden", err);
  }
}
