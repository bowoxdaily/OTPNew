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

const raw = '00020101021126610014COM.GO-JEK.WWW01189360091434239246540210G4239246540303UMI51440014ID.CO.QRIS.WWW0215ID10243667705670303UMI5204541153033605802ID5910Bowo Store6009INDRAMAYU61054521162070703A0163049461';
const base = raw.slice(0, -4);
console.log('Base:', base);
const calculatedCrc = crc16(base);
console.log('Original CRC:', raw.slice(-4));
console.log('Calculated CRC:', calculatedCrc);

// Test injection
const amount = "10021";
const amountStr = "54" + amount.length.toString().padStart(2, '0') + amount;
let newBase = raw.slice(0, -8);

// Ubah tipe Static (010211) menjadi Dynamic (010212)
newBase = newBase.replace("010211", "010212");

newBase = newBase + amountStr + "6304";
const newCrc = crc16(newBase);
const finalQris = newBase + newCrc;
console.log('New QRIS:', finalQris);
