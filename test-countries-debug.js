const { getCountries, getLayananByCountry } = require('./src/services/providerService');

async function test() {
  try {
    console.log('Step 1: Fetch countries...\n');
    const countries = await getCountries();
    console.log(`✅ Got ${countries.length} countries`);
    console.log('Indonesia entry:', countries.find(c => c.name.includes('indonesia') || c.name.includes('ind')));
    
    console.log('\n\nStep 2: Get services for country ID 6...\n');
    const services = await getLayananByCountry(6);
    console.log(`✅ Got ${services.length} services`);
    if (services.length > 0) {
      console.log('First 3 services:', services.slice(0, 3));
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Details:', error.details);
  }
}

test();
