// FedonApp push backend adresi:
const workerURL = "https://fedonpush.fedaiustunol.workers.dev";

function setStatus(msg) {
  const el = document.getElementById("status");
  if (el) el.textContent = msg;
}

// VAPID public key'i Uint8Array'e çevirme yardımcı fonksiyonu
function urlBase64ToUint8Array(base64String) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, "+")
    .replace(/_/g, "/");
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

async function enablePush() {
  try {
    if (!("Notification" in window)) {
      setStatus("Tarayıcı bildirim desteklemiyor ❌");
      return;
    }
    if (!("serviceWorker" in navigator)) {
      setStatus("Service worker desteklenmiyor ❌");
      return;
    }

    setStatus("İzin isteniyor...");

    // Bildirim izni iste
    const perm = await Notification.requestPermission();
    if (perm !== "granted") {
      setStatus("Bildirim izni reddedildi ❌");
      return;
    }

    // Worker'dan VAPID public key al
    const res = await fetch(`${workerURL}/vapid-public`);
    const vapidPublic = (await res.text()).trim();

    if (!vapidPublic) {
      setStatus("Sunucudan VAPID anahtarı alınamadı ❌");
      return;
    }

    // Service worker kaydı
    const reg = await navigator.serviceWorker.register("/sw.js", {
      scope: "/",
    });

    // Push aboneliği oluştur
    const sub = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(vapidPublic),
    });

    // Aboneliği backend'e gönder
    await fetch(`${workerURL}/subscribe`, {
      method: "POST",
      body: JSON.stringify(sub),
    });

    setStatus("Push aktif! 🚀");
  } catch (err) {
    console.error(err);
    setStatus("Hata: " + (err && err.message ? err.message : String(err)));
  }
}

// Sayfa yüklendiğinde butonu bağla
document.addEventListener("DOMContentLoaded", () => {
  const btn = document.getElementById("enablePush");
  if (!btn) {
    console.error("enablePush butonu bulunamadı");
    return;
  }
  btn.addEventListener("click", enablePush);
  setStatus("Hazır");
});
