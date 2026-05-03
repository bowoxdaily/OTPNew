const { supabase } = require('../services/supabaseClient');

async function createOrder({
  user_id,
  provider_order_id,
  number,
  layanan,
  operator,
  negara,
  price,
  provider_price = price,
  markup_amount = 0,
  reseller_price = price,
}) {
  const { data, error } = await supabase
    .from('orders')
    .insert({
      user_id,
      provider_order_id,
      number,
      layanan,
      operator,
      negara,
      price: reseller_price, // harga jual ke reseller
      provider_price,
      markup_amount,
      reseller_price,
      status: 'pending',
    })
    .select('*')
    .single();

  if (error) {
    throw Object.assign(new Error('Gagal menyimpan order'), { statusCode: 500, details: error.message });
  }
  return data;
}

async function getAllOrders() {
  const { data, error } = await supabase
    .from('orders')
    .select('*,users(username)')
    .order('created_at', { ascending: false });

  if (error) {
    throw Object.assign(new Error('Gagal membaca order'), { statusCode: 500, details: error.message });
  }
  return data || [];
}

async function getUserOrders(userId) {
  const { data, error } = await supabase
    .from('orders')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(50); // Get latest 50 orders

  if (error) {
    throw Object.assign(new Error('Gagal membaca riwayat order'), { statusCode: 500, details: error.message });
  }
  return data || [];
}

async function getUserOrdersPaginated(userId, limit = 10, offset = 0) {
  const { data, error } = await supabase
    .from('orders')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    throw Object.assign(new Error('Gagal membaca riwayat order'), { statusCode: 500, details: error.message });
  }
  return data || [];
}

async function countUserOrders(userId) {
  const { count, error } = await supabase
    .from('orders')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId);

  if (error) {
    throw Object.assign(new Error('Gagal menghitung order'), { statusCode: 500, details: error.message });
  }
  return count || 0;
}

async function getOrderByProviderId(provider_order_id) {
  const { data, error } = await supabase
    .from('orders')
    .select('*')
    .eq('provider_order_id', provider_order_id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null; // Not found
    throw Object.assign(new Error('Gagal membaca order by id'), { statusCode: 500, details: error.message });
  }
  return data || null;
}

async function updateOrderStatus(provider_order_id, status) {
  const { data, error } = await supabase
    .from('orders')
    .update({ status: status })
    .eq('provider_order_id', provider_order_id)
    .select('*')
    .single();

  if (error) {
    throw Object.assign(new Error('Gagal update status order'), { statusCode: 500, details: error.message });
  }
  return data;
}

module.exports = {
  createOrder,
  getAllOrders,
  getUserOrders,
  getUserOrdersPaginated,
  countUserOrders,
  getOrderByProviderId,
  updateOrderStatus,
};
