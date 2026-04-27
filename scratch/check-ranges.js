require('dotenv').config();
const axios = require('axios');

const key = process.env.PROVIDER_API_KEY;
const url = process.env.PROVIDER_BASE_URL;

async function main() {
  const r = await axios.get(url, { params: { api_key: key, action: 'services', country: 'indonesia' } });
  const data = r.data.data;

  // Group by name
  const nameMap = {};
  data.forEach(item => {
    const n = item.name.toLowerCase();
    if (!nameMap[n]) nameMap[n] = [];
    nameMap[n].push({ id: item.id, name: item.name, price: Number(item.price), tersedia: item.tersedia });
  });

  // Find duplicates where prices actually differ
  const diffPriceDuplicates = Object.entries(nameMap).filter(([k, v]) => {
    if (v.length <= 1) return false;
    const prices = [...new Set(v.map(i => i.price))];
    return prices.length > 1; // Has different prices
  });

  console.log('Services with DIFFERENT price ranges:', diffPriceDuplicates.length);
  console.log('');
  
  diffPriceDuplicates.slice(0, 20).forEach(([name, items]) => {
    console.log(`${name} (${items.length} ranges):`);
    items.forEach(i => console.log(`  ID: ${i.id}, Price: Rp ${i.price}, Stock: ${i.tersedia}`));
    console.log('');
  });

  // Same price duplicates
  const samePriceDuplicates = Object.entries(nameMap).filter(([k, v]) => {
    if (v.length <= 1) return false;
    const prices = [...new Set(v.map(i => i.price))];
    return prices.length === 1; // Same price
  });
  console.log('Services with SAME price (duplicate IDs):', samePriceDuplicates.length);
}

main().catch(e => console.error('Error:', e.message));
