const fetch = require('node-fetch');
const { telegramBotToken, telegramChatId } = require('../config/env');

function isTelegramConfigured() {
  return Boolean(telegramBotToken && telegramChatId);
}

function formatRupiah(amount) {
  const value = Number(amount) || 0;
  return `Rp ${value.toLocaleString('id-ID')}`;
}

async function sendTopupSuccessNotification({
  orderId,
  userId,
  username,
  amount,
  source,
}) {
  if (!isTelegramConfigured()) return false;

  const safeSource = source || 'system';
  const safeOrderId = orderId || '-';
  const safeUserId = userId || '-';
  const safeUsername = username || '-';
  const safeAmount = formatRupiah(amount);

  const message = [
    '✅ *Topup Berhasil*',
    '',
    `Order ID: \`${safeOrderId}\``,
    `User ID: \`${safeUserId}\``,
    `Username: *${safeUsername}*`,
    `Nominal: *${safeAmount}*`,
    `Sumber: \`${safeSource}\``,
    `Waktu: \`${new Date().toISOString()}\``,
  ].join('\n');

  try {
    const response = await fetch(`https://api.telegram.org/bot${telegramBotToken}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: telegramChatId,
        text: message,
        parse_mode: 'Markdown',
        disable_web_page_preview: true,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[Telegram] Failed to send topup notification:', response.status, errorText);
      return false;
    }
    return true;
  } catch (error) {
    console.error('[Telegram] Notification error:', error.message);
    return false;
  }
}

module.exports = {
  isTelegramConfigured,
  sendTopupSuccessNotification,
};
