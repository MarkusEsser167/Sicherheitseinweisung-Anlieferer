# Sicherheitseinweisung Anlieferer

Mehrsprachige PWA für Smartphone und Tablet, mit der Anlieferer die
Sicherheitseinweisung "Verhalten auf dem Betriebsgelände" selbst durchgehen und
bestätigen. Am Ende geht die Bestätigung als PDF automatisch an die
Mailadresse der Niederlassung.

Ersetzt den bisherigen Papieraushang samt Unterschriftenzettel.

## Ablauf für den Fahrer

1. **Startseite** – Sprachauswahl über Flaggen (15 Sprachen).
2. **Regelseite** – die sieben Punkte in der gewählten Sprache; jeder Punkt wird
   **einzeln** bestätigt. "Weiter" ist gesperrt, bis alle sieben bestätigt sind.
3. **Abschlussseite** – **KFZ-Kennzeichen** und **Fahrername** sind Pflicht,
   dazu eine Unterschrift per Finger. "Bestätigen und senden" ist gesperrt,
   solange ein Pflichtfeld leer ist.
4. **Bestätigung** – PDF geht an die Standort-Mailadresse; nach 25 Sekunden
   springt die App von selbst auf die Startseite zurück, damit der nächste
   Fahrer keine fremden Daten sieht.

Der **Standort** wird einmal pro Gerät eingerichtet (Suchfeld über alle 52
Niederlassungen) und bleibt dann in `localStorage` gespeichert. Der Fahrer sieht
ihn nur oben in der Leiste; geändert wird er über "Ändern".

## Sprachen

Deutsch, English, Ελληνικά, Italiano, Hrvatski, Nederlands, Polski, Română,
Slovenčina, Čeština, Türkçe, Українська, Български, Русский — dazu **Magyar**,
weil der offizielle Aushang auch auf Ungarisch vorliegt und die Aufnahme nichts
gekostet hat. Nicht gewünscht? Den `hu`-Block in `js/i18n.js` löschen.

> **Wichtig:** Regeltexte, Bestätigungssatz und Feldbeschriftungen stammen aus
> den offiziellen PDFs `BETRIEBSGELAENDE_REGELN_<SPRACHE>_*.pdf` — das ist der
> rechtlich relevante Text. Nur die Bedienoberfläche (Knöpfe, Hinweise) wurde
> für diese App übersetzt. Ändern sich die Aushänge, müssen die Texte in
> `js/i18n.js` nachgezogen werden.

> **Abweichungen vom Aushang** (Stand 07.09.2026, auf Anweisung des
> Auftraggebers): Der Sicherheitsabstand zu Flurförderzeugen wurde in Punkt 4
> von **3,00 m auf 2,00 m** geändert, und **Punkt 7** ("Den Anweisungen des
> Lagerpersonals ist Folge zu leisten") kam neu hinzu. Für Punkt 7 gibt es
> keinen offiziellen Aushangtext — die 15 Fassungen sind eigene Übersetzungen.
> **Solange die Papieraushänge nicht nachgezogen sind, weichen App und Aushang
> inhaltlich voneinander ab.**

## Das PDF

Zweisprachig: oben der Text in der Sprache des Fahrers, darunter klein und grau
der deutsche Text. Die Niederlassung kann so nachvollziehen, was bestätigt
wurde, ohne die Fremdsprache zu lesen. Bei Auswahl "Deutsch" entfällt die
Wiederholung. Alle 15 Sprachen passen auf eine A4-Seite.

Enthalten: die Firmenlogos oben rechts, ein hervorgehobener Kopfblock mit
Standort/Zeitpunkt/Sprache, die sieben abgehakten Punkte, der Bestätigungssatz,
ein hervorgehobener Block mit Fahrername und Kennzeichen sowie die Unterschrift.

Im Fahrerblock steht jede Angabe auf **genau einer Zeile**: Beschriftung links,
Wert rechts in fester Spalte. Weil die zweisprachigen Beschriftungen je nach
Sprache unterschiedlich lang sind (russisch misst
"Регистрационный номер транпортного средства / KFZ-Kennzeichen" rund 75 mm),
wird die Schrift bei Bedarf verkleinert statt umbrochen.

Die Unterschrift wird unter Wahrung ihres Seitenverhältnisses eingepasst — das
Unterschriftenfeld ist je nach Gerät unterschiedlich breit.

### Warum eine eingebettete Schrift

jsPDF bringt nur WinAnsi-Standardschriften mit — Griechisch, Kyrillisch und ein
Teil der türkischen und osteuropäischen Zeichen kämen als leere Kästchen im PDF
an. Deshalb liegt in `fonts/dejavu.js` eine auf die benötigten Unicode-Blöcke
reduzierte Fassung von DejaVu Sans (Regular + Bold, je ~100 KB statt ~750 KB).

Neu erzeugen (nur nötig, wenn Sprachen mit anderen Schriftsystemen dazukommen):

```bash
pip install fonttools brotli && python scripts/make_font.py
```

## Mailversand

**Eingerichtet und aktiv** (seit 02.09.2026) — `MAIL_SCRIPT_URL` in `js/mail.js`
zeigt auf die deployte Web-App. Ohne Netz fällt die App weiter auf den
PDF-Download zurück (Protokollstatus "offen").

Neu aufsetzen ginge so:

1. [script.google.com](https://script.google.com) → neues Projekt → Inhalt von
   `apps-script/Code.gs` einfügen.
2. **Bereitstellen → Neue Bereitstellung → Web-App**,
   *Ausführen als* "Ich", *Zugriff* "Jeder" (der Fahrer ist nicht angemeldet).
3. Die `/exec`-URL in `js/mail.js` bei `MAIL_SCRIPT_URL` eintragen.

Das Skript verschickt nur an Adressen der Domain `wego-vti.de`
(`ALLOWED_RECIPIENT_DOMAIN`), damit die offen erreichbare URL nicht als
Mail-Relay missbraucht werden kann.

> Bei Code-Änderungen im Apps Script: **Bereitstellungen verwalten → Stift →
> neue Version**. Ohne neue Version läuft weiter der alte Code.

> Der Client kann den Erfolg nicht auslesen: die `/exec`-URL leitet auf
> `script.googleusercontent.com` um, das keine CORS-Header sendet, deshalb muss
> der Aufruf `mode: 'no-cors'` verwenden und bekommt eine undurchsichtige
> Antwort. Ob eine Mail rausging, zeigt nur das Ausführungsprotokoll des
> Apps-Script-Projekts oder das Postfach.

**SPF beachten:** Beim Schwesterprojekt Unfallaufnahme-App wurden Mails vom
Gmail-Absender an `logistik@wego-vti.de` zeitweise abgewiesen, an
`muenster@wego-vti.de` dagegen zugestellt. Vor dem Rollout auf alle 52
Standorte sollte der Versand an ein paar Adressen getestet werden.

## Standortliste pflegen

`js/locations.js` wird aus `data/niederlassungen.xlsx` erzeugt (Spalten
`NDL | Niederlassung | E-Mail`). Bei Änderungen die Excel-Datei ersetzen und:

```bash
pip install openpyxl && python scripts/make_locations.py
```

## Offline

Einweisung, PDF-Erzeugung und Protokoll funktionieren ohne Netz — nur der
Mailversand braucht eine Verbindung. Ohne Netz wird das PDF heruntergeladen und
der Eintrag im Protokoll als "offen" geführt; die Abschlussseite sagt dem Fahrer
in seiner Sprache, dass er das PDF im Büro abgeben soll.

Das Protokoll (`#/protokoll`, Link unten auf der Startseite) listet alle
Einweisungen des Geräts mit Status — als Nachweis, falls eine Mail nicht
ankommt. Unterschriftsbilder werden dort **nicht** gespeichert, nur im PDF.

**Nach jeder Änderung an den Dateien `CACHE_NAME` in `sw.js` hochzählen**, sonst
liefern bereits installierte Geräte weiter die alte Fassung aus.

## Entwicklung

```bash
python -m http.server 8422 --directory sicherheitseinweisung-pwa
```

Oder über die Vorschau-Konfiguration `sicherheitseinweisung-pwa` in
`.claude/launch.json`.

Icons neu bauen: `pip install pillow && python scripts/make_icons.py`

Logos neu einbetten (nach einem Logowechsel): `python scripts/make_logos.py` —
die Quellpfade stehen oben im Skript.

## Aufbau

```
index.html              App-Hülle
css/styles.css          Gestaltung (große Trefferflächen, kräftige Kontraste)
js/app.js               Hash-Router
js/i18n.js              alle Übersetzungen (offizielle Regeltexte!)
js/flags.js             Flaggen als Inline-SVG
js/logos.js             Firmenlogos als Base64-PNG fuer den PDF-Kopf (generiert)
js/locations.js         52 Niederlassungen + Mailadressen (generiert)
js/settings.js          gespeicherter Standort (localStorage)
js/session.js           Zustand der laufenden Einweisung (nur im Speicher)
js/db.js                Protokoll (IndexedDB)
js/pdf.js               PDF-Erzeugung (jsPDF + Unicode-Schrift)
js/signature.js         Unterschriftenfeld
js/mail.js              Versand über Apps-Script-Webhook
js/views/               die einzelnen Seiten
fonts/dejavu.js         eingebettete Unicode-Schrift (generiert)
apps-script/Code.gs     Google-Apps-Script-Webhook
scripts/                Generatoren für Schrift, Standorte, Icons, Logos
```

Flaggen sind bewusst **kein** Emoji: Windows stellt die Flaggen-Emojis nicht
dar, dort erschienen nur Buchstabenpaare.
