/**
 * Umschrift kyrillischer und griechischer Namen in lateinische Buchstaben.
 *
 * Zweck ist die Betreffzeile der Bestaetigungsmail: die Niederlassung soll einen
 * Fahrer im Postfach wiederfinden koennen. Nach "Ковальчук" kann in einem
 * deutschen Postfach niemand suchen - nach "Kovalchuk" schon.
 *
 * BEWUSST NUR nichtlateinische Schriften. Lateinische Sonderzeichen (polnisch
 * "Szczęsny", tuerkisch "Şoför", kroatisch "Đurđević") bleiben unangetastet:
 * sie sind lesbar, und die Suche in Outlook/Exchange ignoriert lateinische
 * Diakritika ohnehin - "Szczesny" findet "Szczęsny".
 *
 * Die Umschrift ist auf Auffindbarkeit ausgelegt, nicht auf eine Norm wie
 * ISO 9. Sie soll so aussehen, wie ein deutscher Leser den Namen schreiben
 * wuerde.
 */

/** Griechische Buchstabenkombinationen, die einzeln falsch herauskaemen. */
const GREEK_DIGRAPHS = [
  ["ου", "ou"],
  ["αυ", "av"],
  ["ευ", "ev"],
  ["ηυ", "iv"],
  ["μπ", "b"],
  ["γκ", "g"],
  ["γγ", "ng"],
  ["τσ", "ts"],
  ["τζ", "tz"],
];

const GREEK = {
  α: "a", ά: "a", β: "v", γ: "g", δ: "d", ε: "e", έ: "e", ζ: "z",
  η: "i", ή: "i", θ: "th", ι: "i", ί: "i", ϊ: "i", ΐ: "i", κ: "k",
  λ: "l", μ: "m", ν: "n", ξ: "x", ο: "o", ό: "o", π: "p", ρ: "r",
  σ: "s", ς: "s", τ: "t", υ: "y", ύ: "y", ϋ: "y", ΰ: "y", φ: "f",
  χ: "ch", ψ: "ps", ω: "o", ώ: "o",
};

/** Grundtabelle, am Russischen orientiert. */
const CYRILLIC = {
  а: "a", б: "b", в: "v", г: "g", д: "d", е: "e", ё: "yo", ж: "zh",
  з: "z", и: "i", й: "y", к: "k", л: "l", м: "m", н: "n", о: "o",
  п: "p", р: "r", с: "s", т: "t", у: "u", ф: "f", х: "kh", ц: "ts",
  ч: "ch", ш: "sh", щ: "shch", ъ: "", ы: "y", ь: "", э: "e",
  ю: "yu", я: "ya",
  // Ukrainisch und Bulgarisch zusaetzlich
  і: "i", ї: "yi", є: "ye", ґ: "g",
};

/**
 * Sprachabhaengige Abweichungen.
 *
 * Ukrainisch: "г" ist ein h-Laut (Гончар -> Honchar), "и" klingt wie ein
 * dumpfes i. Bulgarisch: "ъ" ist ein echter Vokal (Търново -> Tarnovo) und
 * duerfte nicht wie im Russischen verschluckt werden.
 */
const CYRILLIC_BY_LANG = {
  uk: { г: "h", и: "y" },
  bg: { ъ: "a", щ: "sht", ж: "zh", ц: "ts" },
};

/** Erkennt griechische oder kyrillische Zeichen. */
export function hasNonLatinScript(text) {
  return /[Ͱ-Ͽἀ-῿Ѐ-ӿ]/.test(String(text || ""));
}

function mapWord(word, table, digraphs) {
  const lower = word.toLowerCase();
  let out = "";
  let i = 0;

  while (i < lower.length) {
    let matched = null;
    for (const [from, to] of digraphs) {
      if (lower.startsWith(from, i)) {
        matched = [from, to];
        break;
      }
    }

    const src = matched ? matched[0] : lower[i];
    const dst = matched ? matched[1] : table[lower[i]] ?? word[i];
    // Grossbuchstabe in der Quelle: Ergebnis gross anschreiben. Aus "Щ" wird
    // so "Shch" und nicht "SHCH".
    out += word[i] === word[i].toUpperCase() && word[i] !== word[i].toLowerCase()
      ? dst.charAt(0).toUpperCase() + dst.slice(1)
      : dst;
    i += src.length;
  }

  // Durchgehend grossgeschriebene Woerter bleiben grossgeschrieben.
  const letters = word.replace(/[^\p{L}]/gu, "");
  if (letters.length > 1 && letters === letters.toUpperCase()) return out.toUpperCase();
  return out;
}

/**
 * Schreibt kyrillischen oder griechischen Text in lateinischen Buchstaben.
 * Lateinischer Text kommt unveraendert zurueck.
 *
 * @param {string} text
 * @param {string} [lang] Sprachcode der Einweisung, steuert die Feinheiten
 *                        bei Ukrainisch und Bulgarisch.
 */
export function toLatin(text, lang) {
  const value = String(text || "");
  if (!hasNonLatinScript(value)) return value;

  const greek = /[Ͱ-Ͽἀ-῿]/.test(value);
  const table = greek ? GREEK : { ...CYRILLIC, ...(CYRILLIC_BY_LANG[lang] || {}) };
  const digraphs = greek ? GREEK_DIGRAPHS : [];

  return value
    .split(/(\s+|-)/)
    .map((part) => (/^(\s+|-)$/.test(part) ? part : mapWord(part, table, digraphs)))
    .join("");
}
