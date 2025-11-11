async function getPublicKey() {
  const r = await fetch(`${WORKER}/keys`, { mode: 'cors' });
  if (!r.ok) throw new Error('Public key alınamadı');
  const { publicKey } = await r.json();
  return publicKey; // base64url
}

function urlBase64ToUint8Array(b64) {
  const pad = '='.repeat((4 - (b64.length % 4)) % 4);
  const base64 = (b64 + pad).replace(/-/g, '+').replace(/_/g, '/');
  const raw = atob(base64);
  const output = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; ++i) output[i] = raw.charCodeAt(i);
  return output;
}

async function registerSW() {
  if (!('serviceWorker' in navigator)) throw new Error('Service Worker yok');
  const reg = await navigator.serviceWorker.register('/sw.js', { scope: '/' });
  await navigator.serviceWorker.ready;
  return reg;
}

async function enablePush() {
  const status = document.getElementById('status');
  try {
    // iOS: mutlaka tıklamayla tetiklenir
    const perm = await Notification.requestPermission();
    if (perm !== 'granted') throw new Error('Bildirim izni verilmedi');

    const reg = await registerSW();
    const publicKey = await getPublicKey();

    const sub = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(publicKey),
    });

    // Sunucuya (CF Worker) kaydet
    const resp = await fetch(`${WORKER}/subscribe`, {
      method: 'POST',
      mode: 'cors',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(sub),
    });
    if (!resp.ok) throw new Error('Subscribe kaydı başarısız');

    status.textContent = '✅ Bildirimlere abone olundu';
  } catch (e) {
    status.textContent = '❌ ' + e.message;
    console.error(e);
  }
}

window.addEventListener('load', () => {
  const btn = document.getElementById('enablePush');
  btn?.addEventListener('click', enablePush);
});
