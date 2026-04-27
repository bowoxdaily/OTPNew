/**
 * GoBiz Integration Service
 * 
 * Dual-mode auto-approve untuk topup:
 *   1. POLLING: Baca transactions_latest.json dari gobiz-grab scraper (selalu jalan)
 *   2. GATEWAY: Jika PUBLIC_URL dikonfigurasi, daftarkan sebagai subscriber di gateway
 *      sehingga gateway bisa push webhook settlement langsung ke endpoint kita
 * 
 * Webhook handler ada di paymentController.gobizWebhook
 * Service ini fokus pada polling sebagai "jaring pengaman"
 */

const fs = require('fs');
const path = require('path');
const fetch = require('node-fetch');
const { supabase } = require('./supabaseClient');
const { updateTopupStatus } = require('../store/topupStore');
const { atomicRefundBalance, findById } = require('../store/usersStore');
const { sendTopupSuccessNotification } = require('./telegramNotificationService');

// ── Config ──────────────────────────────────────────────
const POLLING_INTERVAL = Number(process.env.GOBIZ_POLLING_INTERVAL || 30000);

// Path ke file transaksi dari gobiz-grab scraper
const SCRAPER_TRANSACTIONS_FILE = process.env.SCRAPER_TRANSACTIONS_FILE 
  || path.resolve('d:/projectt/gobiz-grab/transactions_latest.json');

// Gateway config (untuk auto-register subscriber)
const GATEWAY_URL = process.env.GATEWAY_URL || 'https://gobiz.bowo-store.id';
const GATEWAY_ADMIN_KEY = process.env.GATEWAY_ADMIN_KEY || 'change-this-admin-key';
const PUBLIC_URL = process.env.PUBLIC_URL || ''; // e.g. https://otp.bowo-store.id
const SUBSCRIBER_TOKEN = process.env.SUBSCRIBER_TOKEN || '';
const SUBSCRIBER_SECRET = process.env.SUBSCRIBER_SECRET || '';

let pollingTimer = null;
let isPolling = false;
const processedTransactionIds = new Set();

// ── File-based Polling ──────────────────────────────────

/**
 * Baca transaksi settlement dari file lokal
 */
function readTransactionsFromFile() {
  try {
    if (!fs.existsSync(SCRAPER_TRANSACTIONS_FILE)) {
      return null;
    }

    const raw = fs.readFileSync(SCRAPER_TRANSACTIONS_FILE, 'utf8');
    const data = JSON.parse(raw);

    if (!data.transactions || !Array.isArray(data.transactions)) {
      return null;
    }

    return data.transactions.filter(t => {
      const status = (t.status || '').toLowerCase();
      return status.includes('settlement');
    });
  } catch (error) {
    return null;
  }
}

/**
 * Ambil semua topup pending
 */
async function getPendingTopups() {
  const { data, error } = await supabase
    .from('topups')
    .select('*')
    .eq('status', 'pending')
    .order('created_at', { ascending: true });

  if (error) throw new Error(`Failed to fetch pending topups: ${error.message}`);
  return data || [];
}

/**
 * Cocokkan transaksi dari file dengan topup pending & auto-approve
 */
async function matchAndApproveTopups() {
  if (isPolling) return;
  isPolling = true;

  try {
    const pendingTopups = await getPendingTopups();
    if (pendingTopups.length === 0) return;

    const settlements = readTransactionsFromFile();
    if (!settlements || settlements.length === 0) return;

    console.log(`[GoBiz Poll] Checking ${settlements.length} settlements vs ${pendingTopups.length} pending topups`);

    let approvedCount = 0;
    for (const settlement of settlements) {
      const txId = settlement.transaction_id || settlement.idPesanan || settlement.id_pesanan || '';
      if (processedTransactionIds.has(txId)) continue;

      const settlementAmount = Number(settlement.jumlah);
      if (!settlementAmount || settlementAmount <= 0) continue;

      const matchingTopup = pendingTopups.find(topup => {
        return Number(topup.amount) === settlementAmount && topup.status === 'pending';
      });

      if (matchingTopup) {
        console.log(`[GoBiz Poll] ✅ MATCH! Tx: ${txId}, Amount: Rp ${settlementAmount.toLocaleString('id-ID')}`);
        console.log(`  → Topup: ${matchingTopup.id}, User: ${matchingTopup.user_id}`);

        try {
          await updateTopupStatus(matchingTopup.id, 'success');
          await atomicRefundBalance(matchingTopup.user_id, Number(matchingTopup.amount));
          const user = await findById(matchingTopup.user_id);
          await sendTopupSuccessNotification({
            orderId: matchingTopup.id,
            userId: matchingTopup.user_id,
            username: user?.username,
            amount: matchingTopup.amount,
            source: 'gobiz-polling',
          });

          processedTransactionIds.add(txId);
          const idx = pendingTopups.indexOf(matchingTopup);
          if (idx > -1) pendingTopups.splice(idx, 1);

          approvedCount++;
          console.log(`[GoBiz Poll] ✅ Topup ${matchingTopup.id} approved! Saldo +Rp ${matchingTopup.amount.toLocaleString('id-ID')}`);
        } catch (err) {
          console.error(`[GoBiz Poll] ❌ Failed to approve ${matchingTopup.id}:`, err.message);
        }
      }
    }

    if (approvedCount > 0) {
      console.log(`[GoBiz Poll] 🎉 Total approved: ${approvedCount}`);
    }
  } catch (error) {
    console.error('[GoBiz Poll] ❌ Error:', error.message);
  } finally {
    isPolling = false;
  }
}

// ── Gateway Subscriber Registration ─────────────────────

/**
 * Daftarkan OTP backend sebagai subscriber di gateway
 * Sehingga gateway otomatis push settlement events ke webhook kita
 */
async function registerAsGatewaySubscriber() {
  if (!PUBLIC_URL) {
    console.log('[GoBiz Gateway] ⚠️  PUBLIC_URL not set, skipping gateway subscriber registration');
    console.log('[GoBiz Gateway]   Set PUBLIC_URL in .env to enable gateway webhook delivery');
    return;
  }

  const webhookEndpoint = `${PUBLIC_URL}/webhooks/gobiz-transactions`;

  try {
    console.log(`[GoBiz Gateway] Registering subscriber: ${webhookEndpoint}`);

    const response = await fetch(`${GATEWAY_URL}/gateway/v1/subscribers`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Gateway-Admin-Key': GATEWAY_ADMIN_KEY,
      },
      body: JSON.stringify({
        name: 'OTP Reseller Backend',
        endpointUrl: webhookEndpoint,
        events: ['payment.settlement'],
        token: SUBSCRIBER_TOKEN,
        secret: SUBSCRIBER_SECRET,
        active: true,
      }),
    });

    if (response.ok) {
      const data = await response.json();
      console.log(`[GoBiz Gateway] ✅ Subscriber registered!`);
      console.log(`  → ID: ${data.subscriber?.id}`);
      console.log(`  → Endpoint: ${webhookEndpoint}`);
    } else {
      const errorText = await response.text();
      console.error(`[GoBiz Gateway] ❌ Registration failed: ${response.status} - ${errorText}`);
    }
  } catch (error) {
    console.error(`[GoBiz Gateway] ❌ Registration error: ${error.message}`);
  }
}

// ── Start/Stop ──────────────────────────────────────────

function startPolling() {
  console.log(`[GoBiz Integration] 🚀 Starting...`);
  console.log(`[GoBiz Integration]   Polling interval: ${POLLING_INTERVAL / 1000}s`);
  console.log(`[GoBiz Integration]   Transactions file: ${SCRAPER_TRANSACTIONS_FILE}`);

  if (fs.existsSync(SCRAPER_TRANSACTIONS_FILE)) {
    console.log(`[GoBiz Integration]   ✅ File found`);
  } else {
    console.log(`[GoBiz Integration]   ⚠️  File not found yet, will retry on each poll`);
  }

  // Register sebagai gateway subscriber jika PUBLIC_URL tersedia
  registerAsGatewaySubscriber();

  // Start file polling setelah 5 detik
  setTimeout(() => matchAndApproveTopups(), 5000);
  pollingTimer = setInterval(matchAndApproveTopups, POLLING_INTERVAL);
}

function stopPolling() {
  if (pollingTimer) {
    clearInterval(pollingTimer);
    pollingTimer = null;
    console.log('[GoBiz Integration] 🛑 Stopped');
  }
}

module.exports = {
  startPolling,
  stopPolling,
  matchAndApproveTopups,
};
