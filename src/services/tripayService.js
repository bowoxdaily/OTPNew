const axios = require('axios');
const crypto = require('crypto');
const { getPaymentGatewaySettings } = require('../store/paymentGatewaySettingsStore');

function getBaseUrl(mode = 'sandbox') {
  return mode === 'production' ? 'https://tripay.co.id/api' : 'https://tripay.co.id/api-sandbox';
}

function makeSignature(privateKey, merchantCode, merchantRef, amount) {
  return crypto
    .createHmac('sha256', String(privateKey))
    .update(String(merchantCode) + String(merchantRef) + String(amount))
    .digest('hex');
}

async function getTripayRuntimeConfig() {
  const settings = await getPaymentGatewaySettings();
  if (!settings?.is_enabled) {
    throw Object.assign(new Error('Payment gateway belum diaktifkan admin'), { statusCode: 400 });
  }

  const apiKey = settings.api_key || '';
  const privateKey = settings.private_key || '';
  const merchantCode = settings.merchant_code || '';

  if (!apiKey || !privateKey || !merchantCode) {
    throw Object.assign(new Error('Konfigurasi Tripay belum lengkap'), { statusCode: 400 });
  }

  return {
    mode: settings.mode === 'production' ? 'production' : 'sandbox',
    apiKey,
    privateKey,
    merchantCode,
  };
}

async function createTripayTransaction(payload) {
  const cfg = await getTripayRuntimeConfig();
  const endpoint = `${getBaseUrl(cfg.mode)}/transaction/create`;
  const candidateMethods = payload.method === 'QRIS2' ? ['QRIS2', 'QRIS', 'QRISC'] : [payload.method];

  let lastError = null;
  for (const method of candidateMethods) {
    const requestPayload = { ...payload, method };
    const signature = makeSignature(cfg.privateKey, cfg.merchantCode, requestPayload.merchant_ref, requestPayload.amount);

    const { data } = await axios.post(
      endpoint,
      { ...requestPayload, signature },
      {
        headers: { Authorization: `Bearer ${cfg.apiKey}` },
        timeout: 15000,
        validateStatus: () => true,
      }
    );

    if (data?.success) {
      return data.data;
    }

    const msg = String(data?.message || 'Tripay create transaksi gagal');
    const channelDisabled = msg.toLowerCase().includes('payment channel is not enabled');
    lastError = Object.assign(new Error(msg), {
      statusCode: channelDisabled ? 400 : 502,
      details: data,
    });

    if (!channelDisabled) {
      throw lastError;
    }
  }

  throw lastError || Object.assign(new Error('Tripay create transaksi gagal'), { statusCode: 502 });
}

async function verifyTripayCallbackSignature(rawJson, callbackSignature) {
  const cfg = await getTripayRuntimeConfig();
  const expected = crypto.createHmac('sha256', cfg.privateKey).update(rawJson).digest('hex');
  return expected === String(callbackSignature || '');
}

module.exports = {
  createTripayTransaction,
  verifyTripayCallbackSignature,
};
