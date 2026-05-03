const {
  orderNumber,
  checkSms,
  checkBalance,
  getCountries,
  getOperatorsByCountry,
  getLayananByCountry,
  cancelOrder,
  setOrderReady,
  resendOrder,
  reactiveOrder,
} = require('../services/providerService');
const { findById, listUsers, atomicDeductBalance, atomicRefundBalance } = require('../store/usersStore');
const { createOrder, getAllOrders, getUserOrders, getOrderByProviderId, updateOrderStatus } = require('../store/ordersStore');
const { getMarkupForService, calculateResellerPrice, getAllMarkupsAsMap, getMarkupFromMap } = require('./markupController');
const { getLayananFromCache, syncLayananCache } = require('../services/cacheService');
const { decrementActiveOrder } = require('../middlewares/securityMiddleware');

async function buyNumber(req, res, next) {
  const { user_id, negara, layanan, operator } = req.body;

  if (!user_id || !negara || !layanan || !operator) {
    return res.status(400).json({
      success: false,
      message: 'Parameter wajib: user_id, negara, layanan, operator',
    });
  }

  // SECURITY: Validate that the authenticated user matches user_id
  if (req.user?.sub !== user_id) {
    return res.status(403).json({
      success: false,
      message: 'Tidak boleh membuat order untuk user lain',
    });
  }

  // Validate input types
  if (typeof layanan !== 'string' || typeof operator !== 'string') {
    return res.status(400).json({
      success: false,
      message: 'Parameter layanan dan operator harus string',
    });
  }

  const user = await findById(user_id);
  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User tidak ditemukan',
    });
  }

  try {
    // SECURITY: Pre-check user balance BEFORE hitting provider API to prevent provider drain
    // Get service price from cache/catalog first
    let estimatedPrice = 10000;
    const layananList = await getLayananFromCache(negara);
    const serviceInfo = layananList.find(s => String(s.code || s.service_code) === String(layanan));
    
    const providerPriceCache = serviceInfo ? (serviceInfo.provider_price || serviceInfo.harga) : null;
    
    if (providerPriceCache) {
      const markup = await getMarkupForService(layanan);
      const pricing = calculateResellerPrice(Number(providerPriceCache), markup);
      estimatedPrice = pricing.reseller_price;
    }

    if (Number(user.balance) < estimatedPrice) {
      return res.status(400).json({ success: false, message: `Saldo lokal tidak cukup. Harga: Rp ${estimatedPrice}` });
    }

    const providerResult = await orderNumber({ negara, layanan, operator });

    // Handle explicit provider errors
    if (providerResult?.status === false || providerResult?.status === 'false') {
      const errorMsg = providerResult?.data?.msg || providerResult?.data || 'Gagal memesan nomor dari provider';
      console.error('[BUY_NUMBER] Provider rejected order:', JSON.stringify(providerResult));
      return res.status(400).json({
        success: false,
        message: typeof errorMsg === 'string' ? `Provider: ${errorMsg}` : 'Provider menolak pesanan',
      });
    }

    const payload = providerResult?.data || providerResult; // Fallback in case it's flat

    const orderId = payload?.order_id || payload?.id || payload?.orderId || null;
    const number = payload?.number || payload?.nomor || payload?.phone_number || null;

    if (!orderId || !number) {
      console.error('[BUY_NUMBER] Invalid provider response:', JSON.stringify(providerResult));
      return res.status(502).json({
        success: false,
        message: 'Response provider tidak valid (Nomor tidak didapatkan)',
      });
    }

    // Get real provider price
    const providerPrice = Number(payload?.price || serviceInfo?.provider_price || serviceInfo?.harga || 10000);
    const markup = await getMarkupForService(layanan);
    const pricing = calculateResellerPrice(providerPrice, markup);
    const resellerPrice = pricing.reseller_price;

    // SECURITY: Atomic balance deduction — prevents double-spending race condition
    const deductResult = await atomicDeductBalance(user.id, resellerPrice);
    if (!deductResult) {
      // IF DEDUCT FAILS (e.g. race condition), WE MUST CANCEL THE ORDER AT PROVIDER!
      await cancelOrder({ id: orderId }).catch(e => console.error('Failed to cancel order after balance deduct fail', e));
      return res.status(400).json({
        success: false,
        message: 'Saldo tidak cukup',
      });
    }

    // Create order with pricing info
    await createOrder({
      user_id,
      provider_order_id: String(orderId),
      number,
      layanan,
      operator,
      negara,
      price: resellerPrice,
      provider_price: providerPrice,
      markup_amount: pricing.markup_amount,
      reseller_price: resellerPrice,
    });

    return res.status(200).json({
      success: true,
      message: 'Order nomor berhasil',
      data: {
        order_id: orderId,
        number,
        reseller_price: resellerPrice,
        remaining_balance: deductResult.balance,
      },
    });
  } catch (error) {
    return next(error);
  }
}

async function getAdminSummary(req, res, next) {
  try {
  const users = await listUsers();
  const allOrders = await getAllOrders();
  
  // Filter: hanya hitung order yang BUKAN canceled
  const validOrders = allOrders.filter(item => item.status !== 'canceled');
  
  const totalResellerAktif = users.filter((item) => item.role === 'user').length;
  const totalOrderHariIni = validOrders.length;
  const omzetPlatform = validOrders.reduce((sum, item) => sum + Number(item.price || 0), 0);
  const estimasiProfit = Math.round(omzetPlatform * 0.15);

  const byUser = validOrders.reduce((acc, item) => {
    if (!acc[item.user_id]) {
      const username = item.users?.username || item.user_id;
      acc[item.user_id] = { username, order: 0, omzet: 0 };
    }
    acc[item.user_id].order += 1;
    acc[item.user_id].omzet += Number(item.price || 0);
    return acc;
  }, {});

  const topReseller = Object.values(byUser)
    .sort((a, b) => b.order - a.order)
    .slice(0, 5);

  let upstreamBalance = 0;
  try {
    const balanceRes = await checkBalance();
    // Virtusim balance might be in data.balance, or top-level balance depending on their v2 JSON structure
    upstreamBalance = Number(balanceRes?.data?.balance || balanceRes?.balance || 0);
  } catch (err) {
    console.error('[Admin] Gagal cek saldo upstream:', err.message);
    upstreamBalance = 'Offline';
  }

  return res.status(200).json({
    success: true,
    data: {
      totalResellerAktif,
      totalOrderHariIni,
      omzetPlatform,
      estimasiProfit,
      upstreamBalance,
      topReseller,
      providerStatus: [
        { name: 'VirtuSIM (Upstream)', status: upstreamBalance !== 'Offline' ? 'Online' : 'Offline', response: upstreamBalance !== 'Offline' ? 'Active' : '-' },
      ],
    },
  });
  } catch (error) {
    return next(error);
  }
}

async function checkOtp(req, res, next) {
  const { id } = req.params;

  const userId = req.user?.sub;

  if (!id || !/^[a-zA-Z0-9_-]+$/.test(id)) {
    return res.status(400).json({
      success: false,
      message: 'Parameter id tidak valid',
    });
  }

  try {
    // SECURITY: Validate ownership before checking with provider
    const order = await getOrderByProviderId(id);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order tidak ditemukan' });
    }
    if (order.user_id !== userId) {
      return res.status(403).json({ success: false, message: 'Akses ditolak' });
    }

    const providerResult = await checkSms({ id });
    
    // Parse response dari VirtuSIM
    let smsStatus = 'PENDING';
    let smsText = '';

    if (providerResult?.data && Array.isArray(providerResult.data) && providerResult.data.length > 0) {
      const smsData = providerResult.data[0];
      smsStatus = String(smsData.status || 'PENDING').toUpperCase();
      smsText = smsData.sms || smsData.otp || '';
    } else if (providerResult?.status && typeof providerResult.status === 'string') {
      smsStatus = providerResult.status.toUpperCase();
      smsText = providerResult.sms || providerResult.otp || '';
    } else if (providerResult?.sms || providerResult?.otp) {
      smsStatus = 'SUCCESS';
      smsText = providerResult.sms || providerResult.otp;
    }

    const isFinished = smsStatus === 'SUCCESS' || smsStatus === 'COMPLETED' || (smsText && smsStatus !== 'PENDING' && smsStatus !== 'READY' && smsStatus !== 'WAITING');

    if (isFinished && order.status === 'pending') {
      await updateOrderStatus(id, 'completed');
    }

    if (smsStatus === 'READY' && order.status === 'pending') {
       await updateOrderStatus(id, 'waiting');
    }

    return res.status(200).json({
      success: true,
      data: {
        status: smsStatus,
        sms: smsText,
        raw: providerResult // disertakan untuk keperluan debugging jika perlu
      },
    });
  } catch (error) {
    return next(error);
  }
}

async function getNegaraCatalog(req, res, next) {
  try {
    const result = await getCountries();
    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    return next(error);
  }
}

async function getOperatorCatalog(req, res, next) {
  const negara = Number(req.query.negara);
  if (!Number.isFinite(negara)) {
    return res.status(400).json({ success: false, message: 'Parameter negara wajib angka' });
  }
  try {
    const result = await getOperatorsByCountry(negara);
    return res.status(200).json({ success: true, data: result });
  } catch (error) {
    return next(error);
  }
}

async function getLayananCatalog(req, res, next) {
  const negara = Number(req.query.negara);
  if (!Number.isFinite(negara)) {
    return res.status(400).json({ success: false, message: 'Parameter negara wajib angka' });
  }
  try {
    // Try cache first
    let layananList = await getLayananFromCache(negara);
    
    // If cache is empty, fetch from provider and sync
    if (!layananList || layananList.length === 0) {
      console.log(`Cache miss for country ${negara}, fetching from provider...`);
      layananList = await getLayananByCountry(negara);
      
      // Sync to cache asynchronously (don't wait)
      if (layananList.length > 0) {
        syncLayananCache(negara).catch((err) => {
          console.error('Background sync error:', err.message);
        });
      }
    }
    
    if (!layananList || layananList.length === 0) {
      return res.status(200).json({ success: true, data: [] });
    }
    
    // OPTIMIZATION: Load ALL markups ONCE instead of per-service
    const markupMap = await getAllMarkupsAsMap();
    
    // Apply markup untuk setiap layanan (O(1) lookup dari map)
    const layananDenganMarkup = layananList.map((layanan) => {
      try {
        // Map cache structure to expected format
        const serviceCode = layanan.service_code || layanan.code;
        const providerPrice = Number(layanan.provider_price || layanan.harga || 0);
        
        // O(1) lookup dari map instead of database query
        const markup = getMarkupFromMap(serviceCode, markupMap);
        const pricing = calculateResellerPrice(providerPrice, markup);
        
        return {
          code: serviceCode,
          layanan: layanan.service_name || layanan.layanan,
          harga_provider: providerPrice,
          harga: pricing.reseller_price,
          markup_percentage: markup.markup_percentage || 0,
          markup_fixed: markup.markup_fixed || 0,
          stok: layanan.stock || layanan.stok || 0,
        };
      } catch (err) {
        console.error(`Error processing markup for ${layanan.service_code}:`, err.message);
        // Return with default (no markup)
        return {
          code: layanan.service_code || layanan.code,
          layanan: layanan.service_name || layanan.layanan,
          harga_provider: layanan.provider_price || layanan.harga,
          harga: layanan.provider_price || layanan.harga,
          markup_percentage: 0,
          markup_fixed: 0,
          stok: layanan.stock || layanan.stok || 0,
        };
      }
    });
    
    // Group services by name to show all available routes/variants
    const grouped = {};
    layananDenganMarkup.forEach((item) => {
      const key = (item.layanan || '').toLowerCase();
      if (!grouped[key]) {
        grouped[key] = {
          layanan: item.layanan,
          variants: [],
        };
      }
      grouped[key].variants.push({
        code: item.code,
        harga_provider: item.harga_provider,
        harga: item.harga,
        markup_percentage: item.markup_percentage,
        markup_fixed: item.markup_fixed,
        stok: item.stok,
      });
    });

    // Convert to array, sort variants by price (cheapest first), set primary from cheapest
    const groupedData = Object.values(grouped).map((group) => {
      group.variants.sort((a, b) => a.harga - b.harga);
      const primary = group.variants[0];
      return {
        code: primary.code,
        layanan: group.layanan,
        harga_provider: primary.harga_provider,
        harga: primary.harga,
        markup_percentage: primary.markup_percentage,
        markup_fixed: primary.markup_fixed,
        stok: primary.stok,
        variants: group.variants.length > 1 ? group.variants : undefined,
      };
    });

    return res.status(200).json({ success: true, data: groupedData });
  } catch (error) {
    return next(error);
  }
}

async function getUserOrdersHandler(req, res, next) {
  try {
    const userId = req.user?.sub;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }
    const orders = await getUserOrders(userId);
    return res.status(200).json({ success: true, data: orders });
  } catch (error) {
    return next(error);
  }
}

async function getAllOrdersHandler(req, res, next) {
  try {
    const orders = await getAllOrders();
    // Return sorted by created_at DESC (assuming getAllOrders doesn't sort, we sort it here)
    orders.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    return res.status(200).json({ success: true, data: orders });
  } catch (error) {
    return next(error);
  }
}

async function cancelOrderHandler(req, res, next) {
  const { id } = req.params; // ini provider_order_id
  const userId = req.user?.sub;

  if (!id || !/^[a-zA-Z0-9_-]+$/.test(id)) {
    return res.status(400).json({ success: false, message: 'ID tidak valid' });
  }

  try {
    // 1. Dapatkan order dari database
    const order = await getOrderByProviderId(id);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order tidak ditemukan' });
    }

    if (order.user_id !== userId) {
      return res.status(403).json({ success: false, message: 'Akses ditolak' });
    }

    if (order.status === 'canceled' || order.status === 'completed') {
      return res.status(400).json({ success: false, message: `Order sudah dalam status ${order.status}` });
    }

    // 2. Hubungi VirtuSIM API untuk set status 2 (Cancel)
    const providerResult = await cancelOrder({ id });
    
    // Periksa status dari provider (VirtuSIM mengembalikan status: true/false)
    if (providerResult?.status === false || providerResult?.status === 'false') {
      const errorMsg = providerResult?.data?.msg || providerResult?.data || 'Gagal membatalkan dari provider';
      return res.status(400).json({ success: false, message: `Gagal cancel di provider: ${errorMsg}` });
    }

    // 3. Jika berhasil di provider, refund saldo lokal user
    const refundAmount = Number(order.price || order.reseller_price);
    const refundResult = await atomicRefundBalance(userId, refundAmount);
    
    if (!refundResult) {
      console.error(`[CANCEL] Gagal refund saldo untuk user ${userId} sebesar ${refundAmount}`);
      // Lanjutkan update status walaupun refund gagal, agar tidak stuck (but log strictly)
    }

    // 4. Update status order menjadi canceled
    await updateOrderStatus(id, 'canceled');
    
    // 5. Kurangi counter pesanan aktif
    decrementActiveOrder(userId);

    return res.status(200).json({
      success: true,
      message: 'Order berhasil dibatalkan dan saldo telah dikembalikan',
      data: {
        order_id: id,
        refund_amount: refundAmount,
        new_balance: refundResult?.balance
      }
    });
  } catch (error) {
    return next(error);
  }
}

async function setOrderReadyHandler(req, res, next) {
  const { id } = req.params;
  const userId = req.user?.sub;

  if (!id || !/^[a-zA-Z0-9_-]+$/.test(id)) {
    return res.status(400).json({ success: false, message: 'ID tidak valid' });
  }

  try {
    const order = await getOrderByProviderId(id);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order tidak ditemukan' });
    }
    if (order.user_id !== userId) {
      return res.status(403).json({ success: false, message: 'Akses ditolak' });
    }

    const providerResult = await setOrderReady({ id });

    if (providerResult?.status === false || providerResult?.status === 'false') {
      const errorMsg = providerResult?.data?.msg || providerResult?.data || 'Gagal set status ke provider';
      return res.status(400).json({ success: false, message: `Gagal: ${errorMsg}` });
    }

    // Optional: we can update our local DB if we have a field for 'is_ready', but for now simply returning success
    await updateOrderStatus(id, 'waiting');

    return res.status(200).json({
      success: true,
      message: 'Status berhasil diubah menjadi Ready. Menunggu OTP...',
    });
  } catch (error) {
    return next(error);
  }
}

async function resendOrderHandler(req, res, next) {
  const { id } = req.params;
  const userId = req.user?.sub;

  if (!id || !/^[a-zA-Z0-9_-]+$/.test(id)) {
    return res.status(400).json({ success: false, message: 'ID tidak valid' });
  }

  try {
    const order = await getOrderByProviderId(id);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order tidak ditemukan' });
    }
    if (order.user_id !== userId) {
      return res.status(403).json({ success: false, message: 'Akses ditolak' });
    }

    // 1. Send resend request to provider (status=3 = Resend SMS)
    const resendResult = await resendOrder({ id });

    // Check if provider accepted the resend request
    if (resendResult?.status === false || resendResult?.status === 'false') {
      const errorMsg = resendResult?.data?.msg || resendResult?.data || 'Gagal resend di provider';
      return res.status(400).json({ success: false, message: `Gagal resend: ${errorMsg}` });
    }

    // 2. Wait a moment for provider to process the resend
    await new Promise(resolve => setTimeout(resolve, 2000));

    // 3. Fetch the latest SMS from provider
    const providerResult = await checkSms({ id });

    // Parse response dari VirtuSIM
    let smsStatus = 'PENDING';
    let smsText = '';

    if (providerResult?.data && Array.isArray(providerResult.data) && providerResult.data.length > 0) {
      const smsData = providerResult.data[0];
      smsStatus = String(smsData.status || 'PENDING').toUpperCase();
      smsText = smsData.sms || smsData.otp || '';
    } else if (providerResult?.status && typeof providerResult.status === 'string') {
      smsStatus = providerResult.status.toUpperCase();
      smsText = providerResult.sms || providerResult.otp || '';
    } else if (providerResult?.sms || providerResult?.otp) {
      smsStatus = 'SUCCESS';
      smsText = providerResult.sms || providerResult.otp;
    }

    return res.status(200).json({
      success: true,
      message: smsText ? 'SMS berhasil diambil ulang' : 'SMS belum tersedia',
      data: {
        status: smsStatus,
        sms: smsText,
      },
    });
  } catch (error) {
    return next(error);
  }
}

async function reactiveOrderHandler(req, res, next) {
  const { id } = req.params;
  const userId = req.user?.sub;

  if (!id || !/^[a-zA-Z0-9_-]+$/.test(id)) {
    return res.status(400).json({ success: false, message: 'ID tidak valid' });
  }

  try {
    const order = await getOrderByProviderId(id);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order tidak ditemukan' });
    }
    if (order.user_id !== userId) {
      return res.status(403).json({ success: false, message: 'Akses ditolak' });
    }

    // Send reactive request to provider
    const providerResult = await reactiveOrder({ id });

    // Check if provider accepted the reactive request
    if (providerResult?.status === false || providerResult?.status === 'false') {
      const errorMsg = providerResult?.data?.msg || providerResult?.data || 'Gagal reaktivasi di provider';
      return res.status(400).json({ success: false, message: `Gagal reaktivasi: ${errorMsg}` });
    }

    // Update order status back to waiting/pending
    await updateOrderStatus(id, 'waiting');

    return res.status(200).json({
      success: true,
      message: 'Nomor berhasil diaktifkan kembali. Menunggu OTP...',
      data: providerResult,
    });
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  buyNumber,
  checkOtp,
  getAdminSummary,
  getNegaraCatalog,
  getOperatorCatalog,
  getLayananCatalog,
  getUserOrdersHandler,
  getAllOrdersHandler,
  cancelOrderHandler,
  setOrderReadyHandler,
  resendOrderHandler,
  reactiveOrderHandler,
};
