const { createTopup, getTopupById, updateTopupStatus, getUserTopups } = require('../store/topupStore');
const { findById, atomicRefundBalance } = require('../store/usersStore');
const { supabase } = require('../services/supabaseClient');
const { generateManualTransaction } = require('../services/paymentService');
const { sendTopupSuccessNotification } = require('../services/telegramNotificationService');
const crypto = require('crypto');
const { webhookSecret, isProduction } = require('../config/env');

async function requestTopup(req, res, next) {
  try {
    const userId = req.user?.sub;
    const { amount } = req.body;

    if (!amount || Number(amount) < 5000) {
      return res.status(400).json({ success: false, message: 'Minimal topup adalah Rp 5.000' });
    }

    // BATASAN: Cek apakah user memiliki tagihan pending
    const existingTopups = await getUserTopups(userId);
    const pendingTopup = existingTopups.find(t => t.status === 'pending');
    if (pendingTopup) {
      return res.status(400).json({ 
        success: false, 
        message: 'Anda masih memiliki tagihan top up yang belum dibayar. Silakan bayar tagihan tersebut terlebih dahulu atau tunggu hingga kadaluarsa.' 
      });
    }

    const user = await findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User tidak ditemukan' });
    }

    // Generate Manual Transaction with unique code
    const transaction = generateManualTransaction(amount, userId);

    // Simpan ke database
    await createTopup({
      id: transaction.order_id,
      user_id: userId,
      amount: transaction.amount, // Include unique code
      payment_method: 'qris_manual',
      payment_url: null,
      qr_code: transaction.qr_url,
    });

    return res.status(200).json({
      success: true,
      message: 'Berhasil membuat tagihan.',
      data: {
        order_id: transaction.order_id,
        amount: transaction.amount,
        unique_code: transaction.unique_code,
        qr_url: transaction.qr_url,
        actions: [
          { name: 'generate-qr-code', url: transaction.qr_url },
        ],
      },
    });

  } catch (error) {
    return next(error);
  }
}

async function getTopupHistory(req, res, next) {
  try {
    const userId = req.user?.sub;
    const history = await getUserTopups(userId);
    return res.status(200).json({ success: true, data: history });
  } catch (error) {
    return next(error);
  }
}

// KHUSUS ADMIN: Mengambil semua topup pending
async function getPendingTopups(req, res, next) {
  try {
    const { data, error } = await supabase
      .from('topups')
      .select('*, users!inner(username)')
      .eq('status', 'pending')
      .order('created_at', { ascending: false });

    if (error) throw error;
    
    return res.status(200).json({ success: true, data: data });
  } catch (error) {
    return next(error);
  }
}

// KHUSUS ADMIN: Menyetujui topup manual
async function approveTopup(req, res, next) {
  try {
    const { id } = req.params;
    
    const topup = await getTopupById(id);
    if (!topup) {
      return res.status(404).json({ success: false, message: 'Topup tidak ditemukan' });
    }

    if (topup.status === 'success') {
      return res.status(400).json({ success: false, message: 'Topup sudah disetujui sebelumnya' });
    }

    // Update status
    await updateTopupStatus(id, 'success');
    
    // Tambah saldo ke user
    await atomicRefundBalance(topup.user_id, Number(topup.amount));
    const user = await findById(topup.user_id);
    await sendTopupSuccessNotification({
      orderId: topup.id,
      userId: topup.user_id,
      username: user?.username,
      amount: topup.amount,
      source: 'admin-approve',
    });

    return res.status(200).json({ success: true, message: 'Topup berhasil disetujui, saldo user bertambah!' });
  } catch (error) {
    return next(error);
  }
}

// KHUSUS ADMIN: Menolak topup manual
async function rejectTopup(req, res, next) {
  try {
    const { id } = req.params;
    
    const topup = await getTopupById(id);
    if (!topup) {
      return res.status(404).json({ success: false, message: 'Topup tidak ditemukan' });
    }

    await updateTopupStatus(id, 'failed');
    
    return res.status(200).json({ success: true, message: 'Topup berhasil ditolak' });
  } catch (error) {
    return next(error);
  }
}

/**
 * Extract amount (dalam Rupiah) dari berbagai format payload webhook.
 * Mendukung:
 *   - Scraper payment_gateway mode: payload.data.gross_amount ("10853.00")
 *   - Scraper payment_gateway mode: payload.data.amount.value ("10853.00")
 *   - Gateway fan-out: sama dengan di atas (payload diteruskan utuh)
 *   - Scraper flat: payload.amount (10853)
 *   - Fallback: payload.nominal / payload.mutasi
 */
function extractAmount(payload) {
  // 1. Cek format payment_gateway (data.gross_amount atau data.amount.value)
  let amountStr = payload?.data?.gross_amount || payload?.data?.amount?.value;

  // 2. Fallback: flat payload (amount, nominal, mutasi)
  if (!amountStr) amountStr = payload?.amount || payload?.nominal || payload?.mutasi;
  if (!amountStr && payload?.data) amountStr = payload.data.nominal || payload.data.mutasi;

  if (!amountStr) return null;

  // Bersihkan format: "10853.00" → 10853
  const cleanStr = String(amountStr).split('.')[0].replace(/[^0-9]/g, '');
  const amount = Number(cleanStr);

  return amount > 0 ? amount : null;
}

const localProcessedWebhookIds = new Map();
const LOCAL_WEBHOOK_TTL_MS = 24 * 60 * 60 * 1000;

function cleanupLocalWebhookKeys(now = Date.now()) {
  for (const [key, expiresAt] of localProcessedWebhookIds.entries()) {
    if (expiresAt <= now) localProcessedWebhookIds.delete(key);
  }
}

async function checkWebhookAlreadyProcessed(idempotencyKey) {
  if (!idempotencyKey) return false;

  const now = Date.now();
  cleanupLocalWebhookKeys(now);
  const localExpireAt = localProcessedWebhookIds.get(idempotencyKey);
  if (localExpireAt && localExpireAt > now) return true;

  const { data, error } = await supabase
    .from('webhook_events')
    .select('idempotency_key')
    .eq('idempotency_key', idempotencyKey)
    .maybeSingle();

  if (error) {
    // Jika tabel belum ada / DB error, fallback ke in-memory agar tetap idempotent per instance.
    return false;
  }

  return Boolean(data);
}

async function markWebhookProcessed(idempotencyKey, eventType) {
  if (!idempotencyKey) return;

  const now = Date.now();
  cleanupLocalWebhookKeys(now);
  localProcessedWebhookIds.set(idempotencyKey, now + LOCAL_WEBHOOK_TTL_MS);

  const { error } = await supabase
    .from('webhook_events')
    .upsert({
      idempotency_key: idempotencyKey,
      event_type: eventType || null,
      processed_at: new Date(now).toISOString(),
    }, { onConflict: 'idempotency_key' });

  if (error) {
    console.warn('[GoBiz Webhook] Failed to persist idempotency key:', error.message);
  }
}

function safeCompareHex(a, b) {
  const aBuffer = Buffer.from(String(a || ''), 'utf8');
  const bBuffer = Buffer.from(String(b || ''), 'utf8');
  if (aBuffer.length !== bBuffer.length) return false;
  return crypto.timingSafeEqual(aBuffer, bBuffer);
}

function verifyWebhookSignature(req, payload) {
  const signature = req.headers['x-webhook-signature'] || req.headers['x-signature'];
  const timestampHeader = req.headers['x-webhook-timestamp'] || req.headers['x-timestamp'];

  // Untuk production, signature wajib ada jika WEBHOOK_SECRET diset.
  if (!webhookSecret) {
    return { ok: !isProduction, reason: 'WEBHOOK_SECRET is not configured' };
  }
  if (!signature || !timestampHeader) {
    return { ok: false, reason: 'Missing webhook signature headers' };
  }

  let timestamp = Number(timestampHeader);
  if (!Number.isFinite(timestamp)) {
    return { ok: false, reason: 'Invalid webhook timestamp' };
  }
  // Support timestamp dalam detik maupun milidetik.
  if (timestamp < 1e12) timestamp *= 1000;

  const ageMs = Math.abs(Date.now() - timestamp);
  const maxAgeMs = 5 * 60 * 1000; // 5 menit replay window
  if (ageMs > maxAgeMs) {
    return { ok: false, reason: 'Webhook timestamp outside allowed window' };
  }

  const payloadBody = req.rawBody || JSON.stringify(payload || {});
  const signedPayload = `${timestamp}.${payloadBody}`;
  const expected = crypto
    .createHmac('sha256', webhookSecret)
    .update(signedPayload)
    .digest('hex');

  const normalizedSignature = String(signature).replace(/^sha256=/i, '');
  if (!safeCompareHex(normalizedSignature, expected)) {
    return { ok: false, reason: 'Invalid webhook signature' };
  }

  return { ok: true };
}

function extractOrderId(payload) {
  return payload?.order_id
    || payload?.data?.order_id
    || payload?.data?.merchant_ref
    || payload?.merchant_ref
    || payload?.data?.reference
    || payload?.reference
    || null;
}

/**
 * Webhook handler untuk menerima settlement dari:
 *   1. GoBiz Scraper langsung (CALLBACK_MODE=payment_gateway)
 *   2. Gateway fan-out (gobiz.bowo-store.id)
 *   3. Flat scraper payload (legacy)
 */
async function gobizWebhook(req, res, next) {
  try {
    const payload = req.body;
    console.log('[GoBiz Webhook] Received:', JSON.stringify(payload));

    const signatureValidation = verifyWebhookSignature(req, payload);
    if (!signatureValidation.ok) {
      console.warn('[GoBiz Webhook] Rejected:', signatureValidation.reason);
      return res.status(401).json({ success: false, message: 'Invalid webhook signature' });
    }

    // ─── Idempotency Check ──────────────────────────────────
    const idempotencyKey = req.headers['x-idempotency-key'] 
      || req.headers['x-webhook-id'] 
      || payload?.id 
      || '';

    const alreadyProcessed = await checkWebhookAlreadyProcessed(idempotencyKey);
    if (alreadyProcessed) {
      console.log(`[GoBiz Webhook] Duplicate event ignored: ${idempotencyKey}`);
      return res.status(200).json({ success: true, message: 'Duplicate event, already processed.' });
    }

    // ─── Event Validation ───────────────────────────────────
    const eventType = payload?.event 
      || req.headers['x-gateway-event'] 
      || req.headers['x-gobiz-event'] 
      || '';
    
    const transactionStatus = payload?.data?.transaction_status || '';

    // Hanya tolak jika secara eksplisit event bukan settlement
    if (eventType && eventType !== 'payment.settlement' && transactionStatus !== 'settlement') {
      return res.status(200).json({ success: true, message: 'Not a settlement event, ignored.' });
    }

    const orderId = extractOrderId(payload);
    // ─── Extract Amount ─────────────────────────────────────
    const amount = extractAmount(payload);

    if (!amount && !orderId) {
      console.log('[GoBiz Webhook] Amount and order_id not found in payload');
      return res.status(200).json({ success: true, message: 'Amount or order_id not found in payload' });
    }

    if (amount) {
      console.log(`[GoBiz Webhook] Extracted amount: Rp ${amount.toLocaleString('id-ID')}`);
    }

    // ─── Match dengan topup pending ─────────────────────────
    let topup = null;
    if (orderId) {
      const { data, error } = await supabase
        .from('topups')
        .select('*')
        .eq('status', 'pending')
        .eq('id', orderId)
        .maybeSingle();

      if (error) throw error;
      topup = data || null;
    }

    // Fallback ke amount hanya jika order_id tidak ada atau tidak match.
    if (!topup && amount) {
      const { data, error } = await supabase
        .from('topups')
        .select('*')
        .eq('status', 'pending')
        .eq('amount', amount)
        .order('created_at', { ascending: true })
        .limit(2);

      if (error) throw error;

      if (data && data.length === 1) {
        topup = data[0];
      } else if (data && data.length > 1) {
        console.warn(`[GoBiz Webhook] Ambiguous pending topup for amount ${amount}, skipping auto-approve`);
        return res.status(200).json({
          success: true,
          message: `Ambiguous pending topups for amount ${amount}, skipped`,
        });
      }
    }

    if (!topup) {
      console.log(`[GoBiz Webhook] No pending topup match for order_id=${orderId || '-'} amount=${amount || '-'}`);
      return res.status(200).json({ success: true, message: 'No matching pending topup found' });
    }

    // Auto approve the matching topup
    await updateTopupStatus(topup.id, 'success');
    await atomicRefundBalance(topup.user_id, Number(topup.amount));
    const user = await findById(topup.user_id);
    await sendTopupSuccessNotification({
      orderId: topup.id,
      userId: topup.user_id,
      username: user?.username,
      amount: topup.amount,
      source: 'gobiz-webhook',
    });

    // Tandai idempotency key sudah diproses
    await markWebhookProcessed(idempotencyKey, eventType || 'payment.settlement');

    const approvedAmount = Number(topup.amount) || amount || 0;
    console.log(`[GoBiz Webhook] ✅ Topup ${topup.id} approved! User: ${topup.user_id}, Amount: Rp ${approvedAmount.toLocaleString('id-ID')}`);

    return res.status(200).json({ success: true, message: 'Topup approved automatically via GoBiz' });
  } catch (error) {
    console.error('[GoBiz Webhook Error]:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
}

async function getMutationHistory(req, res, next) {
  try {
    const userId = req.user?.sub;
    const { getUserOrders } = require('../store/ordersStore');
    
    const topups = await getUserTopups(userId);
    const orders = await getUserOrders(userId);

    const mutations = [];

    // Map topups
    topups.forEach(t => {
      if (t.status === 'success') {
        mutations.push({
          id: `topup-${t.id}`,
          type: 'CREDIT',
          amount: Number(t.amount),
          description: `Top-up Saldo via ${t.payment_method || 'QRIS'}`,
          created_at: t.created_at,
          reference: t.id
        });
      }
    });

    // Map orders
    orders.forEach(o => {
      // Pembelian
      mutations.push({
        id: `order-debit-${o.id}`,
        type: 'DEBIT',
        amount: Number(o.price || o.reseller_price || 0),
        description: `Beli Nomor (${o.layanan})`,
        created_at: o.created_at,
        reference: o.provider_order_id
      });

      // Jika dibatalkan, tambahkan entry refund
      if (o.status === 'canceled') {
        // Tambahkan 1 detik agar tampil setelah debit
        const refundTime = new Date(new Date(o.created_at).getTime() + 1000).toISOString();
        mutations.push({
          id: `order-refund-${o.id}`,
          type: 'CREDIT',
          amount: Number(o.price || o.reseller_price || 0),
          description: `Refund Batal Order (${o.layanan})`,
          created_at: refundTime,
          reference: o.provider_order_id
        });
      }
    });

    // Sort by created_at DESC
    mutations.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    return res.status(200).json({ success: true, data: mutations });
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  requestTopup,
  getTopupHistory,
  getPendingTopups,
  approveTopup,
  rejectTopup,
  gobizWebhook,
  getMutationHistory
};
