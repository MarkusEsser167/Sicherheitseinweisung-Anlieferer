/**
 * WeGoVTI-Sicherheitseinweisung – Google Apps Script Web App.
 *
 * Nimmt einen POST der Einweisungs-PWA entgegen und verschickt das
 * mitgeschickte Bestätigungs-PDF per GmailApp an die Mailadresse der
 * Niederlassung. Gleiches Muster wie die Skripte "WeGoVTI-Unfallmail" und
 * "Lager-Artikelapp".
 *
 * EINRICHTUNG
 *   1. script.google.com -> Neues Projekt -> diesen Code einfügen
 *      -> Projekt z. B. "WeGoVTI-Sicherheitseinweisung" nennen.
 *   2. "Bereitstellen" -> "Neue Bereitstellung" -> Typ "Web-App"
 *      -> Ausführen als: "Ich"
 *      -> Zugriff:       "Jeder"  (der Fahrer ist nicht angemeldet)
 *      -> Bereitstellen, Berechtigungen bestätigen.
 *   3. Die /exec-URL kopieren und in js/mail.js bei MAIL_SCRIPT_URL eintragen.
 *
 * ACHTUNG bei Code-Änderungen: "Bereitstellungen verwalten" -> Stift ->
 * NEUE VERSION -> Bereitstellen. Ohne neue Version läuft weiterhin der alte Code.
 *
 * Der Empfänger kommt aus dem Request (Standort-Mailadresse aus der App).
 * ALLOWED_RECIPIENT_DOMAIN begrenzt den Versand auf die eigene Domain, damit
 * die offen erreichbare URL nicht als Mail-Relay missbraucht werden kann.
 */

var ALLOWED_RECIPIENT_DOMAIN = 'wego-vti.de';
var SENDER_NAME = 'WeGo VTI Sicherheitseinweisung';

function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents);

    if (!data.to || String(data.to).indexOf('@' + ALLOWED_RECIPIENT_DOMAIN) === -1) {
      return json({ status: 'rejected', reason: 'recipient not allowed' });
    }

    var attachments = [];
    if (data.file_base64) {
      attachments.push(Utilities.newBlob(
        Utilities.base64Decode(data.file_base64),
        data.mime_type || 'application/pdf',
        data.filename || 'Sicherheitseinweisung.pdf'
      ));
    }

    GmailApp.sendEmail(
      data.to,
      data.subject || 'Sicherheitseinweisung',
      data.message || '',
      {
        attachments: attachments,
        name: SENDER_NAME
      }
    );

    return json({ status: 'ok' });
  } catch (err) {
    // Der Client kann die Antwort wegen no-cors ohnehin nicht lesen; der
    // Fehlertext landet im Ausführungsprotokoll des Projekts.
    console.error(err);
    return json({ status: 'error', message: String(err) });
  }
}

function json(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
