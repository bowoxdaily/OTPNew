const { getCountries, getLayananByCountry } = require('./src/services/providerService');

async function test() {
  try {
    console.log('Fetching countries...\n');
    const countries = await getCountries();
    
    console.log('Country ID 6:', countries.find(c => c.id === 6));
    console.log('Country ID 7 (Indonesia):', countries.find(c => c.id === 7));
    
    console.log('\n\nFetching services for ID 7 (Indonesia)...\n');
    const services = await getLayananByCountry(7);
    console.log(`✅ Got ${services.length} services for Indonesia`);
    if (services.length > 0) {
      console.log('\nFirst 5 services:');
      services.slice(0, 5).forEach((s, i) => {
        console.log(`${i+1}. ${s.layanan} (${s.code}) - Rp ${Number(s.harga).toLocaleString('id-ID')}`);
      });
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

test();
