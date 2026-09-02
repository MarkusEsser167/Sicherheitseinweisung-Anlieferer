/**
 * Niederlassungen und ihre Empfaenger-Mailadressen.
 *
 * AUTOMATISCH ERZEUGT aus data/niederlassungen.xlsx durch scripts/make_locations.py -
 * nicht von Hand bearbeiten, sondern die Excel-Datei pflegen und das Skript erneut laufen lassen.
 */

export const LOCATIONS = [
  { id: "412", name: "Außenlager Dresden Wego", email: "dresden@wego-vti.de" },
  { id: "414", name: "Außenlager Hanau/FFM", email: "hanau@wego-vti.de" },
  { id: "411", name: "Außenlager München-Sendling Wego", email: "muenchen@wego-vti.de" },
  { id: "413", name: "Außenlager Olbersdorf", email: "bautzen@wego-vti.de" },
  { id: "417", name: "Außenlager Olching VTI", email: "vtiolching@wego-vti.de" },
  { id: "875", name: "Außenlager Suhl Wego", email: "erfurt@wego-vti.de" },
  { id: "819", name: "Elsenfeld", email: "Elsenfeld@wego-vti.de" },
  { id: "884", name: "Niederlassung Abstatt", email: "ilsfeld@wego-vti.de" },
  { id: "845", name: "Niederlassung Bautzen", email: "bautzen@wego-vti.de" },
  { id: "111", name: "Niederlassung Berlin", email: "berlin@wego-vti.de" },
  { id: "841", name: "Niederlassung Brandenburg", email: "brandenburg@wego-vti.de" },
  { id: "101", name: "Niederlassung Bremen", email: "bremen@wego-vti.de" },
  { id: "102", name: "Niederlassung Bremerhaven", email: "bremerhaven@wego-vti.de" },
  { id: "151", name: "Niederlassung Chemnitz", email: "chemnitz@wego-vti.de" },
  { id: "130", name: "Niederlassung Dortmund", email: "dortmund@wego-vti.de" },
  { id: "844", name: "Niederlassung Dresden", email: "dresden@wego-vti.de" },
  { id: "878", name: "Niederlassung Erfurt", email: "erfurt@wego-vti.de" },
  { id: "895", name: "Niederlassung Eschweiler", email: "eschweiler@wego-vti.de" },
  { id: "886", name: "Niederlassung Ettlingen", email: "ettlingen@wego-vti.de" },
  { id: "812", name: "Niederlassung Frankfurt/Main", email: "frankfurtmain@wego-vti.de" },
  { id: "835", name: "Niederlassung Frankfurt/Oder", email: "frankfurtoder@wego-vti.de" },
  { id: "108", name: "Niederlassung Fuldabrück", email: "fuldabrueck@wego-vti.de" },
  { id: "880", name: "Niederlassung Gießen", email: "giessen@wego-vti.de" },
  { id: "117", name: "Niederlassung Hamburg", email: "hamburg@wego-vti.de" },
  { id: "810", name: "Niederlassung Hanau", email: "hanau@wego-vti.de" },
  { id: "116", name: "Niederlassung Hannover", email: "hannover@wego-vti.de" },
  { id: "107", name: "Niederlassung Kiel", email: "kiel@wego-vti.de" },
  { id: "889", name: "Niederlassung Köfering-Regensburg", email: "vtikoefering@wego-vti.de" },
  { id: "891", name: "Niederlassung Köln-Niehl", email: "vtikoeln@wego-vti.de" },
  { id: "896", name: "Niederlassung Köln-Rodenkirchen", email: "koeln@wego-vti.de" },
  { id: "122", name: "Niederlassung Leipzig", email: "leipzig@wego-vti.de" },
  { id: "881", name: "Niederlassung Ludwigshafen", email: "vtiludwigshafen@wego-vti.de" },
  { id: "110", name: "Niederlassung Magdeburg", email: "magdeburg@wego-vti.de" },
  { id: "848", name: "Niederlassung Merzig", email: "merzig@wego-vti.de" },
  { id: "897", name: "Niederlassung Mönchengladbach", email: "moenchengladbach@wego-vti.de" },
  { id: "821", name: "Niederlassung München Eching VTI", email: "vtieching@wego-vti.de" },
  { id: "873", name: "Niederlassung München Eching Wego", email: "eching@wego-vti.de" },
  { id: "106", name: "Niederlassung Münster", email: "muenster@wego-vti.de" },
  { id: "815", name: "Niederlassung Neu-Ulm", email: "ulm@wego-vti.de" },
  { id: "872", name: "Niederlassung Nürnberg", email: "nuernberg@wego-vti.de" },
  { id: "823", name: "Niederlassung Oberhausen", email: "vtioberhausen@wego-vti.de" },
  { id: "103", name: "Niederlassung Oldenburg", email: "oldenburg@wego-vti.de" },
  { id: "105", name: "Niederlassung Paderborn", email: "paderborn@wego-vti.de" },
  { id: "112", name: "Niederlassung Rostock", email: "rostock@wego-vti.de" },
  { id: "867", name: "Niederlassung Schwerin", email: "schwerin@wego-vti.de" },
  { id: "885", name: "Niederlassung Viernheim", email: "viernheim@wego-vti.de" },
  { id: "822", name: "Niederlassung VTI-Berlin", email: "vtiberlin@wego-vti.de" },
  { id: "817", name: "Niederlassung VTI-Freiburg", email: "vtifreiburg@wego-vti.de" },
  { id: "840", name: "Niederlassung Wego/VTI Halle", email: "halle@wego-vti.de" },
  { id: "120", name: "Niederlassung Westerkappeln -Velpe", email: "westerkappeln@wego-vti.de" },
  { id: "887", name: "Niederlassungen Ettlingen vti", email: "vtiettlingen@wego-vti.de" },
  { id: "888", name: "Zentrallager Viernheim", email: "info.zentrallager@wego-vti.de" }
];

export function findLocation(id) {
  return LOCATIONS.find((l) => l.id === id) || null;
}
