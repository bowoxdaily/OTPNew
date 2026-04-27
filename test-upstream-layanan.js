const { getLayananByCountry } = require('./src/services/providerService');

async function test() {
  try {
    console.log('Testing getLayananByCountry(6)...\n');
    const result = await getLayananByCountry(6);
    console.log('Result:', result.length, 'services');
    if (result.length > 0) {
      console.log('Sample:', result.slice(0, 3));
    }
  } catch (error) {
    console.error('Error:', error.message);
  }
}

test();
