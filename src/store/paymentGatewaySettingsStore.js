const { supabase } = require('../services/supabaseClient');

const DEFAULT_SETTINGS = {
  id: 1,
  provider: 'tripay',
  is_enabled: false,
  mode: 'sandbox',
  api_key: '',
  private_key: '',
  merchant_code: '',
  callback_url: '',
  updated_at: null,
};

let settingsCache = { ...DEFAULT_SETTINGS };

async function getPaymentGatewaySettings() {
  try {
    const { data, error } = await supabase
      .from('payment_gateway_settings')
      .select('*')
      .eq('id', 1)
      .maybeSingle();

    if (error) {
      console.warn('Supabase error in getPaymentGatewaySettings:', error.message);
      return settingsCache;
    }

    if (data) {
      settingsCache = { ...DEFAULT_SETTINGS, ...data };
      return settingsCache;
    }

    return settingsCache;
  } catch (error) {
    console.error('Error in getPaymentGatewaySettings:', error.message);
    return settingsCache;
  }
}

async function updatePaymentGatewaySettings(payload = {}) {
  const merged = {
    ...settingsCache,
    ...payload,
    id: 1,
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from('payment_gateway_settings')
    .upsert([merged], { onConflict: 'id' })
    .select('*')
    .single();

  if (error) {
    const details = String(error.message || '');
    const lower = details.toLowerCase();
    const tableMissing =
      lower.includes('could not find the table') ||
      lower.includes('schema cache') ||
      lower.includes('does not exist') ||
      lower.includes('payment_gateway_settings');

    const safeMessage = tableMissing
      ? 'Tabel payment_gateway_settings belum dibuat di Supabase. Jalankan SQL setup terlebih dahulu.'
      : `Gagal menyimpan payment gateway: ${details}`;

    throw Object.assign(new Error(safeMessage), {
      statusCode: tableMissing ? 400 : 500,
      details,
    });
  }

  settingsCache = { ...DEFAULT_SETTINGS, ...data };
  return settingsCache;
}

module.exports = {
  getPaymentGatewaySettings,
  updatePaymentGatewaySettings,
};
