const { supabase } = require('../services/supabaseClient');

async function createTopup({ id, user_id, amount, payment_method, payment_url, qr_code }) {
  const { data, error } = await supabase
    .from('topups')
    .insert({
      id,
      user_id,
      amount,
      payment_method,
      payment_url,
      qr_code,
      status: 'pending'
    })
    .select('*')
    .single();

  if (error) {
    throw Object.assign(new Error('Gagal menyimpan data topup'), { statusCode: 500, details: error.message });
  }
  return data;
}

async function getTopupById(id) {
  const { data, error } = await supabase
    .from('topups')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw Object.assign(new Error('Gagal membaca topup'), { statusCode: 500, details: error.message });
  }
  return data;
}

async function updateTopupStatus(id, status) {
  const { data, error } = await supabase
    .from('topups')
    .update({ status })
    .eq('id', id)
    .select('*')
    .single();

  if (error) {
    throw Object.assign(new Error('Gagal update status topup'), { statusCode: 500, details: error.message });
  }
  return data;
}

async function getUserTopups(userId) {
  const { data, error } = await supabase
    .from('topups')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(20);

  if (error) {
    throw Object.assign(new Error('Gagal mengambil histori topup'), { statusCode: 500, details: error.message });
  }
  return data || [];
}

module.exports = {
  createTopup,
  getTopupById,
  updateTopupStatus,
  getUserTopups
};
