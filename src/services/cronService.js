const { supabase } = require('./supabaseClient');
const { cancelOrder } = require('./providerService');
const { atomicRefundBalance } = require('../store/usersStore');
const { updateOrderStatus } = require('../store/ordersStore');

let autoCancelInterval = null;

// Ambil order yang statusnya pending/waiting dan umurnya > 20 menit
async function getExpiredPendingOrders() {
  const twentyMinutesAgo = new Date(Date.now() - 20 * 60 * 1000).toISOString();

  const { data, error } = await supabase
    .from('orders')
    .select('*')
    .in('status', ['pending', 'waiting'])
    .lt('created_at', twentyMinutesAgo);

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
  console.log('[CRON] 🕒 Cron jobs started (Auto-cancel pending orders setiap 5 menit)');
  
  // Run immediately on start
  setTimeout(processAutoCancel, 10000); // Tunggu 10 detik setelah start

  // Jalankan setiap 5 menit (300.000 ms)
  autoCancelInterval = setInterval(processAutoCancel, 5 * 60 * 1000);
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
