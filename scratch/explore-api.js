require('dotenv').config();
const axios = require('axios');

const key = process.env.PROVIDER_API_KEY;
const baseUrl = process.env.PROVIDER_BASE_URL;

async function getServices(params = {}) {
  const r = await axios.get(baseUrl, { 
    params: { api_key: key, action: 'services', ...params },
    timeout: 15000 
  });
  return r.data.data || [];
}

async function main() {
  const operators = ['any', 'indosat', 'telkomsel', 'axis', 'three', 'smartfren', 'byu'];
  
  // Check WhatsApp (ID: 716) price across different operators
  console.log('=== WhatsApp price per operator ===\n');
  
  for (const op of operators) {
    const services = await getServices({ country: 'indonesia', operator: op });
    const wa = services.find(s => s.id === '716');
    if (wa) {
      console.log(`Operator: ${op.padEnd(12)} | Price: ${wa.price} | Stock: ${wa.tersedia}`);
    } else {
      console.log(`Operator: ${op.padEnd(12)} | NOT FOUND`);
    }
  }

  console.log('\n=== Other APP (ID: 1 and 6165) price per operator ===\n');
  
  for (const op of operators) {
    const services = await getServices({ country: 'indonesia', operator: op });
    const items = services.filter(s => s.name.toLowerCase() === 'other app');
    if (items.length > 0) {
      items.forEach(item => {
        console.log(`Operator: ${op.padEnd(12)} | ID: ${item.id.padEnd(6)} | Price: ${item.price} | Stock: ${item.tersedia}`);
      });
    }
  }

  // Check if different operators give different total count or prices
  console.log('\n=== Service count and unique prices per operator ===\n');
  
  for (const op of operators) {
    const services = await getServices({ country: 'indonesia', operator: op });
    const uniquePrices = [...new Set(services.map(s => s.price))];
    console.log(`Operator: ${op.padEnd(12)} | Total services: ${services.length} | Unique prices: ${uniquePrices.length}`);
  }
}

main().catch(e => console.error('Fatal:', e.message));
