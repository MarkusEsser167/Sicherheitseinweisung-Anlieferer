/**
 * Lokales Protokoll der Einweisungen (IndexedDB).
 *
 * Zweck: Nachweis auf dem Geraet, auch wenn der Mailversand scheitert. Die
 * Niederlassung kann so im Zweifel belegen, dass und wann ein Fahrer bestaetigt
 * hat, und den PDF-Versand spaeter nachholen.
 *
 * Es wird bewusst KEIN Unterschriftsbild gespeichert - das Protokoll soll klein
 * bleiben. Das vollstaendige Dokument inkl. Unterschrift ist das per Mail
 * versandte PDF.
 */

const DB_NAME = "sicherheitseinweisung";
const DB_VERSION = 1;
const STORE = "einweisungen";

function openDb() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) {
        const store = db.createObjectStore(STORE, { keyPath: "id", autoIncrement: true });
        store.createIndex("createdAt", "createdAt");
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function tx(db, mode, fn) {
  return new Promise((resolve, reject) => {
    const t = db.transaction(STORE, mode);
    const result = fn(t.objectStore(STORE));
    t.oncomplete = () => resolve(result && result.result !== undefined ? result.result : result);
    t.onerror = () => reject(t.error);
    t.onabort = () => reject(t.error);
  });
}

/**
 * Legt einen Protokolleintrag an.
 * @param {{createdAt:string, locationId:string, locationName:string, email:string,
 *          lang:string, driverName:string, plate:string, mailStatus:string}} entry
 */
export async function saveEntry(entry) {
  const db = await openDb();
  try {
    return await tx(db, "readwrite", (store) => store.add(entry));
  } finally {
    db.close();
  }
}

/** Aktualisiert den Versandstatus eines Eintrags ("gesendet" / "offen"). */
export async function updateMailStatus(id, mailStatus) {
  if (id == null) return;
  const db = await openDb();
  try {
    await tx(db, "readwrite", (store) => {
      const get = store.get(id);
      get.onsuccess = () => {
        const entry = get.result;
        if (entry) {
          entry.mailStatus = mailStatus;
          store.put(entry);
        }
      };
    });
  } finally {
    db.close();
  }
}

/** Alle Eintraege, neueste zuerst - Grundlage der Protokollansicht. */
export async function listEntries() {
  const db = await openDb();
  try {
    const all = await tx(db, "readonly", (store) => store.getAll());
    return (all || []).sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));
  } finally {
    db.close();
  }
}
