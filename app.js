const workerURL = "https://fedonpush.fedaiustunol.workers.dev";

async function enablePush() {
  const statusEl = document.getElementById("status");
  statusEl.textContent = "İzin isteniyor...";

  const perm = await Notification.requestPermission();
  if (perm !== "granted") {
    statusEl.textContent = "Bildirim izni reddedildi ❌";
    return;
  }

  // VAPID public key'i worker'dan çek
  const vapidRes = await fetch(`${workerURL}/vapid-public`);
  const vapidPublic = await vapidRes.text();

  const reg = await navigator.serviceWorker.register("/sw.js");
  const sub = await reg.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(vapidPublic)
  });

  // Aboneliği Worker’a gönder
  await fetch(`${workerURL}/subscribe`, {
    method: "POST",
    body: JSON.stringify(sub),
  });

  statusEl.textContent = "Push aktif! 🚀";
}

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

document.getElementById("enablePush").onclick = enablePush;
