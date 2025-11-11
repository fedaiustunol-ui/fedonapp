// VAPID public key'i Worker'dan çekiyoruz (anahtarı HTML'e gömmen gerekmiyor)
async function getPublicKey() {
  const res = await fetch('/keys');
  const data = await res.json();
  return data.publicKey; // base64url string
}

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

async function registerSW() {
  if (!('serviceWorker' in navigator)) throw new Error('Service Worker desteklenmiyor');
  const reg = await navigator.serviceWorker.register('/sw.js', { scope: '/' });
  await navigator.serviceWorker.ready;
  return reg;
}

async function enablePush() {
  try {
    // iOS’ta mutlaka kullanıcı tıklaması ile tetiklenmeli
    const perm = await Notification.requestPermission();
    if (perm !== 'granted') throw new Error('Bildirim izni verilmedi');

    const reg = await registerSW();
    const vapidPublicKey = await getPublicKey();
    if (!vapidPublicKey) throw new Error('VAPID public key bulunamadı');

    const sub = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
    });

    // Aboneliği Cloudflare Worker’a kaydet
    const resp = await fetch('/subscribe', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(sub),
    });

    if (!resp.ok) throw new Error('Subscribe kaydı başarısız');
    document.getElementById('status').textContent = '✅ Bildirimlere abone olundu';
  } catch (err) {
    document.getElementById('status').textContent = '❌ ' + err.message;
  }
}

// Sayfa yüklendiğinde butonu bağla
window.addEventListener('load', () => {
  const btn = document.getElementById('enablePush');
  if (btn) btn.addEventListener('click', enablePush);
});
