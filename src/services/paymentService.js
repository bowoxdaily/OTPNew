const { rawQrisString } = require('../config/env');
// Raw QRIS Text dari pengguna (Bisa diatur di .env)
const RAW_QRIS_STRING = rawQrisString;

/**
 * Fungsi Algoritma Checksum CRC-16 (CCITT-FALSE)
 */
function crc16(data) {
  let crc = 0xFFFF;
  for (let i = 0; i < data.length; i++) {
    crc ^= data.charCodeAt(i) << 8;
    for (let j = 0; j < 8; j++) {
      if ((crc & 0x8000) !== 0) {
        crc = (crc << 1) ^ 0x1021;
      } else {
        crc = crc << 1;
      }
    }
  }
  return (crc & 0xFFFF).toString(16).toUpperCase().padStart(4, '0');
}

/**
 * Mengubah QRIS Statis menjadi QRIS Dinamis
 */
function generateDynamicQris(amount) {
  const amountStr = String(amount);
  const tag54 = "54" + amountStr.length.toString().padStart(2, '0') + amountStr;
  
  // Buang 8 karakter terakhir (tag 63 + panjang 04 + CRC lama)
  let baseQris = RAW_QRIS_STRING.slice(0, -8);
  
  // Wajib mengubah "Point of Initiation Method" dari Statis (11) menjadi Dinamis (12)
  // Tag 01, length 02, value 11 -> 010211
  // Jika dibiarkan 11 namun memiliki nominal (tag 54), aplikasi e-wallet akan memproses lambat/error
  baseQris = baseQris.replace('010211', '010212');
  
  // Sisipkan tag 54 (Nominal), lalu tambahkan penutup "6304"
  const newBaseQris = baseQris + tag54 + "6304";
  
  // Hitung CRC baru
  const newCrc = crc16(newBaseQris);
  
  return newBaseQris + newCrc;
}

/**
 * Generate Topup Tagihan dengan Kode Unik
 * Contoh: Topup 10.000 -> Tagihan 10.023
 */
function generateManualTransaction(amount, userId) {
  // Generate kode unik 1-999
  const uniqueCode = Math.floor(Math.random() * 900) + 10; 
  const totalAmount = Number(amount) + uniqueCode;
  const orderId = `TOPUP-MANUAL-${Date.now()}`;

  // Hasilkan QRIS Teks Dinamis
  const dynamicQrisText = generateDynamicQris(totalAmount);

  // Buat URL Gambar QR Code dari teks tersebut
  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=400x400&margin=15&data=${encodeURIComponent(dynamicQrisText)}`;

  return {
    order_id: orderId,
    amount: totalAmount,
    unique_code: uniqueCode,
    qr_url: qrImageUrl
  };
}

module.exports = {
  generateManualTransaction
};
