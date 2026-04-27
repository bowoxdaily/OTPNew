const axios = require('axios');
const { createToken } = require('./src/utils/token');

async function test() {
  try {
    const token = createToken({
      sub: 'user_1',
      username: 'testuser',
      role: 'user',
    });

    console.log('1. Testing /health endpoint...');
    const health = await axios.get('http://localhost:3000/health');
    console.log('✅ Health:', health.data);

    console.log('\n2. Testing /api/catalog/layanan endpoint...');
    const layanan = await axios.get('http://localhost:3000/api/catalog/layanan?negara=7', {
      headers: { Authorization: `Bearer ${token}` },
      validateStatus: () => true,
    });
    console.log('Status:', layanan.status);
    console.log('Data:', layanan.data);
  } catch (error) {
    console.error('Error:', error.message);
  }
}

test();
