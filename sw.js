/**
 * Service Worker - macht die App installierbar und offlinefaehig.
 *
 * Wichtig fuer den Einsatzort: An der Einfahrt oder in der Halle ist das WLAN
 * oft schwach. Einweisung, PDF-Erzeugung und Protokoll funktionieren deshalb
 * komplett offline; nur der Mailversand braucht Netz und faellt sonst auf den
 * PDF-Download zurueck.
 *
 * Bei Aenderungen an den Dateien CACHE_NAME hochzaehlen, sonst liefern bereits
 * installierte Geraete weiter die alte Fassung aus.
 */

const CACHE_NAME = 'sicherheitseinweisung-v9';
const PRECACHE = [
  './',
  './index.html',
  './manifest.webmanifest',
  './css/styles.css',
  './js/app.js',
  './js/i18n.js',
  './js/flags.js',
  './js/logos.js',
  './js/locations.js',
  './js/settings.js',
  './js/session.js',
  './js/db.js',
  './js/pdf.js',
  './js/mail.js',
  './js/translit.js',
  './js/signature.js',
  './js/views/home.js',
  './js/views/location.js',
  './js/views/briefing.js',
  './js/views/confirm.js',
  './js/views/done.js',
  './js/views/log.js',
  './fonts/dejavu.js',
  './vendor/jspdf.umd.min.js',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-512-maskable.png',
];

self.addEventListener('install', (event) => {
  // { cache: 'reload' } statt cache.addAll(): umgeht den normalen HTTP-Cache des
  // Browsers, der sonst beim Precachen eine veraltete Datei einfrieren kann.
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => Promise.all(
        PRECACHE.map((url) => fetch(url, { cache: 'reload' }).then((res) => cache.put(url, res)))
      ))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  const url = new URL(req.url);

  // POSTs an den Mail-Webhook und fremde Origins nie abfangen.
  if (req.method !== 'GET' || url.origin !== self.location.origin) return;

  event.respondWith(
    caches.match(req).then((cached) => {
      const network = fetch(req)
        .then((res) => {
          if (res && res.ok) {
            const clone = res.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(req, clone));
          }
          return res;
        })
        .catch(() => cached || caches.match('./index.html'));
      return cached || network;
    })
  );
});
