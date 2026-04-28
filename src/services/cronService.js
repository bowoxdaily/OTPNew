const { supabase } = require('./supabaseClient');
const { cancelOrder } = require('./providerService');
const { atomicRefundBalance } = require('../store/usersStore');
const { updateOrderStatus } = require('../store/ordersStore');
const { updateTopupStatus } = require('../store/topupStore');

// ── Konstanta waktu ──────────────────────────────────────
const TOPUP_EXPIRY_MS   = 20 * 60 * 1000; // 20 menit
const ORDER_EXPIRY_MS   = 20 * 60 * 1000; // 20 menit (sama)

let autoCancelInterval = null;

// ── Topup: Ambil pending > 20 menit ──────────────────────
async function getExpiredPendingTopups() {
  const cutoff = new Date(Date.now() - TOPUP_EXPIRY_MS).toISOString();
  const { data, error } = await supabase
    .from('topups')
    .select('id, user_id, amount, created_at')
    .eq('status', 'pending')
    .lt('created_at', cutoff);

  if (error) {
    console.error('[CRON] Failed to fetch expired topups:', error.message);
    return [];
  }
  return data || [];
}

// ── Topup: Auto-cancel expired ───────────────────────────
async function cancelExpiredTopups() {
  try {
    const expired = await getExpiredPendingTopups();
    if (!expired.length) return;

    console.log(`[CRON] 🔴 Ditemukan ${expired.length} topup expired (> 20 menit). Auto-cancel...`);

    for (const topup of expired) {
      try {
        await updateTopupStatus(topup.id, 'expired');
        console.log(`[CRON] ✅ Topup ${topup.id} (User: ${topup.user_id}, Rp ${Number(topup.amount).toLocaleString('id-ID')}) → expired`);
      } catch (err) {
        console.error(`[CRON] ❌ Gagal expire topup ${topup.id}:`, err.message);
      }
    }
  } catch (err) {
    console.error('[CRON] Error in cancelExpiredTopups:', err.message);
  }
}

// ── Orders: Ambil pending > 20 menit ─────────────────────
async function getExpiredPendingOrders() {
  const cutoff = new Date(Date.now() - ORDER_EXPIRY_MS).toISOString();

  const { data, error } = await supabase
    .from('orders')
    .select('*')
    .in('status', ['pending', 'waiting'])
    .lt('created_at', cutoff);

  if (error) {
    console.error('[CRON] Failed to fetch expired orders:', error.message);
    return [];
  }
  return data || [];
}

async function processAutoCancel() {
  try {
    const expiredOrders = await getExpiredPendingOrders();
    if (!expiredOrders || expiredOrders.length === 0) return;

    console.log(`[CRON] Ditemukan ${expiredOrders.length} order expired (> 20 menit). Memproses auto-cancel...`);

    for (const order of expiredOrders) {
      try {
        console.log(`[CRON] Canceling order ${order.provider_order_id} (User: ${order.user_id})`);

        // 1. Hubungi provider untuk cancel
        const providerResult = await cancelOrder({ id: order.provider_order_id });
        
        // 2. Apabila gagal dari provider (karena mungkin OTP sudah masuk atau error lain), abaikan?
        // Tapi kita akan paksa batalkan jika provider mengizinkan ATAU jika statusnya kadaluarsa di provider
        if (providerResult?.status === false || providerResult?.status === 'false') {
           const rawMsg = providerResult?.data?.msg || providerResult?.data || '';
           const msg = typeof rawMsg === 'string' ? rawMsg : JSON.stringify(rawMsg);
           if (!msg.toLowerCase().includes('kadaluarsa') && !msg.toLowerCase().includes('cancel') && !msg.toLowerCase().includes('sudah dibatalkan')) {
              console.log(`[CRON] Gagal cancel di provider untuk ${order.provider_order_id}, reason: ${msg}`);
              continue; // Jika gagal dan bukan karena sudah expired, lewati
           }
        }

        // 3. Refund Saldo
        const refundAmount = Number(order.price || order.reseller_price);
        const refundResult = await atomicRefundBalance(order.user_id, refundAmount);
        
        if (refundResult) {
          // 4. Update status ke canceled
          await updateOrderStatus(order.provider_order_id, 'canceled');
          console.log(`[CRON] ✅ Berhasil auto-cancel & refund Rp ${refundAmount} untuk order ${order.provider_order_id}`);
        } else {
          console.error(`[CRON] ❌ Gagal refund saldo untuk order ${order.provider_order_id}`);
        }

      } catch (err) {
        console.error(`[CRON] Error processing auto-cancel for order ${order.provider_order_id}:`, err.message);
      }
    }
  } catch (error) {
    console.error('[CRON] Error in processAutoCancel loop:', error.message);
  }
}

function startCronJobs() {
  console.log('[CRON] 🕒 Cron jobs started:');
  console.log('       - Auto-cancel pending ORDERS  > 20 menit (setiap 5 menit)');
  console.log('       - Auto-cancel pending TOPUPS  > 20 menit (setiap 5 menit)');

  // Jalankan setelah 10 detik warm-up
  setTimeout(() => {
    processAutoCancel();
    cancelExpiredTopups();
  }, 10_000);

  // Setiap 5 menit
  autoCancelInterval = setInterval(() => {
    processAutoCancel();
    cancelExpiredTopups();
  }, 5 * 60 * 1000);
}

function stopCronJobs() {
  if (autoCancelInterval) {
    clearInterval(autoCancelInterval);
    autoCancelInterval = null;
    console.log('[CRON] 🛑 Cron jobs stopped');
  }
}

module.exports = {
  startCronJobs,
  stopCronJobs
};
