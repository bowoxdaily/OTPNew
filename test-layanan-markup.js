const axios = require('axios');
const { createToken } = require('./src/utils/token');

async function testLayananWithMarkup() {
  try {
    console.log('🔍 Testing /api/catalog/layanan with markup...\n');

    // Buat token untuk testing
    const token = createToken({
      sub: 'user_1',
      username: 'testuser',
      role: 'user',
    });

    console.log('✅ Token created:', token.substring(0, 50) + '...\n');

    // Fetch layanan
    const response = await axios.get('http://localhost:3000/api/catalog/layanan?negara=6', {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (response.data.success && response.data.data) {
      const layanan = response.data.data.slice(0, 5);
      console.log(`✅ Got ${response.data.data.length} services from VirtuSIM\n`);
      console.log('📊 Sample services with markup:\n');
      
      layanan.forEach((item, idx) => {
        console.log(`${idx + 1}. ${item.layanan} (${item.code})`);
        console.log(`   Provider Price: Rp ${Number(item.harga_provider).toLocaleString('id-ID')}`);
        console.log(`   Markup: ${item.markup_percentage}% + Rp ${item.markup_fixed}`);
        console.log(`   Final Price: Rp ${Number(item.harga).toLocaleString('id-ID')}`);
        console.log('');
      });

      console.log('✅ Markup system is working correctly!');
    } else {
      console.log('❌ Response not successful:', response.data);
    }
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
}

testLayananWithMarkup();
