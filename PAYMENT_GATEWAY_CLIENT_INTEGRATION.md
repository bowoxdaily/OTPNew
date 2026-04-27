# Payment Gateway Integration Guide (Client App)

Dokumen ini menjelaskan cara menghubungkan aplikasi client ke gateway settlement webhook.

## 0. Panduan Super Sederhana (Ikuti Ini Dulu)

Kalau masih bingung, cukup ikuti 5 langkah ini dulu.

### Langkah 1 - Pastikan gateway hidup

Buka URL ini di browser:

- https://gobiz.bowo-store.id/gateway/v1/health

Kalau benar, hasilnya ada nilai ok: true.

### Langkah 2 - Siapkan endpoint aplikasi lain

Kamu punya 2 opsi:

1. Opsi cepat tanpa coding (untuk test): pakai webhook.site dan ambil URL uniknya.
2. Opsi produksi: pakai endpoint milik aplikasi kamu, contoh:
  - https://app-kamu.com/webhooks/settlement

### Langkah 3 - Daftarkan endpoint aplikasi lain ke gateway

Kirim request ini dari terminal server/admin:

curl -X POST "https://gobiz.bowo-store.id/gateway/v1/subscribers" -H "Content-Type: application/json" -H "X-Gateway-Admin-Key: ISI_ADMIN_KEY_KAMU" -d "{\"name\":\"App A\",\"endpointUrl\":\"https://app-kamu.com/webhooks/settlement\",\"events\":[\"payment.settlement\"],\"token\":\"TOKEN_APP_A\",\"secret\":\"SECRET_APP_A\",\"active\":true}"

Kalau sukses, subscriber tersimpan.

### Langkah 4 - Pastikan scraper kirim ke gateway

Di .env scraper, nilai ini harus aktif:

- CALLBACK_ENABLED=true
- CALLBACK_MODE=payment_gateway
- CALLBACK_URL=https://gobiz.bowo-store.id/gateway/v1/inbound/gobiz-settlement

### Langkah 5 - Cek event masuk ke aplikasi lain

Saat ada settlement baru, alurnya otomatis:

1. Scraper kirim ke gateway.
2. Gateway kirim ke endpoint aplikasi lain.
3. Aplikasi lain menerima payload payment.settlement.

Untuk verifikasi cepat:

1. Cek log aplikasi penerima.
2. Cek file delivery di gateway_data/deliveries.json.

Kalau ada status 2xx, integrasi sudah jalan.

## 1. Arsitektur Flow

1. Scraper GoBiz mengirim event settlement ke gateway inbound.
2. Gateway menyimpan event secara idempotent (berdasarkan event id).
3. Gateway melakukan fan-out event ke aplikasi client yang sudah subscribe.
4. Aplikasi client menerima webhook dan mengubah status pembayaran/order.

## 2. Endpoint Gateway

Base URL produksi (contoh):

- `https://gobiz.bowo-store.id`

Endpoint:

- Health: `GET /gateway/v1/health`
- Register/Update subscriber: `POST /gateway/v1/subscribers`
- List subscriber: `GET /gateway/v1/subscribers`
- Replay event: `POST /gateway/v1/events/:eventId/replay`

## 3. Register Aplikasi Client Sebagai Subscriber

Kirim request dari server admin kamu:

```bash
curl -X POST "https://gobiz.bowo-store.id/gateway/v1/subscribers" \
  -H "Content-Type: application/json" \
  -H "X-Gateway-Admin-Key: <GATEWAY_ADMIN_KEY>" \
  -d '{
    "name": "My App Production",
    "endpointUrl": "https://app-kamu.com/webhooks/settlement",
    "events": ["payment.settlement"],
    "token": "SUBSCRIBER_BEARER_TOKEN",
    "secret": "SUBSCRIBER_SIGNING_SECRET",
    "active": true
  }'
```

## 4. Kontrak Data Webhook Settlement

Event utama:

- `payment.settlement`

Field penting pada payload:

- `id` (event id)
- `event`
- `created_at`
- `data.order_id`
- `data.transaction_status`
- `data.gross_amount`
- `data.settlement_time`

Header penting dari gateway:

- `X-Webhook-Id`
- `X-Webhook-Timestamp`
- `X-Idempotency-Key`
- `X-Gateway-Event`
- `Authorization: Bearer <token>` (jika token subscriber diisi)
- `X-Gateway-Signature: sha256=<hmac>` (jika secret subscriber diisi)

## 5. Implementasi Endpoint di Aplikasi Client (Express)

Contoh endpoint webhook yang aman dan idempotent:

```javascript
const express = require("express");
const crypto = require("crypto");

const app = express();
app.use("/webhooks/settlement", express.raw({ type: "application/json" }));

function verifyHmac(rawBody, signatureHeader, secret) {
  if (!signatureHeader || !signatureHeader.startsWith("sha256=")) return false;
  const received = signatureHeader.slice("sha256=".length);
  const expected = crypto.createHmac("sha256", secret).update(rawBody).digest("hex");
  try {
    return crypto.timingSafeEqual(Buffer.from(received), Buffer.from(expected));
  } catch {
    return false;
  }
}

app.post("/webhooks/settlement", async (req, res) => {
  const auth = req.headers.authorization || "";
  const signature = req.headers["x-gateway-signature"] || "";
  const idempotencyKey = req.headers["x-idempotency-key"] || "";

  const expectedToken = process.env.SUBSCRIBER_BEARER_TOKEN
    ? `Bearer ${process.env.SUBSCRIBER_BEARER_TOKEN}`
    : "";

  if (expectedToken && auth !== expectedToken) {
    return res.status(401).json({ ok: false, message: "Unauthorized" });
  }

  const secret = process.env.SUBSCRIBER_SIGNING_SECRET || "";
  if (secret && !verifyHmac(req.body, signature, secret)) {
    return res.status(401).json({ ok: false, message: "Invalid signature" });
  }

  const payload = JSON.parse(req.body.toString("utf8"));

  if (payload.event !== "payment.settlement") {
    return res.status(200).json({ ok: true, ignored: true });
  }

  // TODO: cek idempotencyKey sudah pernah diproses atau belum
  // TODO: jika sudah, return 200
  // TODO: update status payment/order berdasarkan payload.data.order_id
  // TODO: simpan audit log webhook

  return res.status(200).json({ ok: true });
});

app.listen(3000, () => {
  console.log("Webhook client listening on :3000");
});
```

## 6. Database Minimal di Aplikasi Client

### Tabel `payments`

- `order_id` (unique)
- `amount`
- `status` (`pending`, `settlement`, `failed`)
- `settled_at`
- `updated_at`

### Tabel `webhook_events`

- `idempotency_key` (unique)
- `event_id`
- `event_name`
- `payload_json`
- `processed_at`
- `status`

## 7. Replay Event Jika Gagal Proses

Jika aplikasi client sempat down, replay event dari gateway:

```bash
curl -X POST "https://gobiz.bowo-store.id/gateway/v1/events/<eventId>/replay" \
  -H "X-Gateway-Admin-Key: <GATEWAY_ADMIN_KEY>"
```

## 8. Checklist Go-Live

1. Endpoint webhook client sudah HTTPS publik.
2. Subscriber sudah `active: true`.
3. Token dan secret subscriber sudah cocok di kedua sisi.
4. Client selalu return 2xx cepat.
5. Idempotency sudah diterapkan.
6. Logging dan alerting webhook sudah aktif.
7. Uji replay event sudah sukses.

## 9. Troubleshooting Cepat

- `401 Unauthorized`:
  - Cek bearer token subscriber.
  - Cek signature HMAC.
- Event tidak masuk:
  - Cek `endpointUrl` subscriber.
  - Cek subscriber `active`.
  - Cek delivery log di gateway.
- Double update order:
  - Pastikan dedupe menggunakan `X-Idempotency-Key`.

## 10. Template Logic di Aplikasi Lain (Bahasa Sederhana)

Begitu webhook masuk ke aplikasi kamu, lakukan urutan ini:

1. Ambil header X-Idempotency-Key.
2. Cek di database apakah key ini sudah pernah diproses.
3. Kalau sudah, balas 200 dan selesai.
4. Kalau belum, baca payload data.order_id dan data.transaction_status.
5. Jika status settlement, ubah order jadi paid.
6. Simpan key idempotency ke database.
7. Balas HTTP 200.

Dengan urutan ini, aplikasi kamu aman dari webhook dobel.
