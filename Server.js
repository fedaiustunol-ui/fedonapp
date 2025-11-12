import express from 'express';
import cors from 'cors';
import webpush from 'web-push';
import 'dotenv/config';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '.')));

webpush.setVapidDetails(
  'mailto:support@fedon.app',
  process.env.PUBLIC_VAPID_KEY,
  process.env.PRIVATE_VAPID_KEY
);

const subs = new Set();

app.post('/api/subscribe', (req, res) => {
  const sub = req.body;
  if (!sub?.endpoint) return res.status(400).json({ ok: false });
  subs.add(sub);
  res.json({ ok: true });
});

app.post('/api/send', async (req, res) => {
  const payload = JSON.stringify({
    title: req.body?.title || 'fedon.app',
    body: req.body?.body || '🚀 Test bildirimi',
    data: { url: req.body?.url || '/' },
  });

  let ok = 0, fail = 0;
  await Promise.all([...subs].map(async s => {
    try { await webpush.sendNotification(s, payload); ok++; }
    catch { fail++; subs.delete(s); }
  }));
  res.json({ ok, fail });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log('Push server ready on :' + PORT));
