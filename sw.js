self.addEventListener('install', (e) => self.skipWaiting());
self.addEventListener('activate', (e) => self.clients.claim());

self.addEventListener('push', (event) => {
  let data = {};
  try { data = event.data ? event.data.json() : {}; } catch {}
  const title = data.title || 'FedonApp';
  const body  = data.body  || 'Yeni bildirim';
  const icon  = data.icon  || '/icon-192.png';
  event.waitUntil(
    self.registration.showNotification(title, { body, icon })
  );
});
