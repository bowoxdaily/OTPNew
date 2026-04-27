const {
  getPaymentGatewaySettings,
  updatePaymentGatewaySettings,
} = require('../store/paymentGatewaySettingsStore');

async function getSettings(req, res, next) {
  try {
    const data = await getPaymentGatewaySettings();
    return res.status(200).json({ success: true, data });
  } catch (error) {
    return next(error);
  }
}

async function saveSettings(req, res, next) {
  try {
    const {
      mode,
      api_key,
      private_key,
      merchant_code,
      callback_url,
      is_enabled,
    } = req.body || {};

    if (mode && !['sandbox', 'production'].includes(mode)) {
      return res.status(400).json({ success: false, message: 'Mode harus sandbox atau production' });
    }

    const data = await updatePaymentGatewaySettings({
      provider: 'tripay',
      mode: mode || 'sandbox',
      api_key: String(api_key || '').trim(),
      private_key: String(private_key || '').trim(),
      merchant_code: String(merchant_code || '').trim(),
      callback_url: String(callback_url || '').trim(),
      is_enabled: Boolean(is_enabled),
    });

    return res.status(200).json({
      success: true,
      message: 'Pengaturan Tripay berhasil disimpan',
      data,
    });
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  getSettings,
  saveSettings,
};
