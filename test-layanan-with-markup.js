const axios = require('axios');
const { createToken } = require('./src/utils/token');

async function testMarkupIntegration() {
  try {
    console.log('🔍 Testing /api/catalog/layanan with markup (ID: 7 = Indonesia)...\n');

    // Buat token
    const token = createToken({
      sub: 'user_1',
      username: 'testuser',
      role: 'user',
    });

    // Fetch layanan dengan markup
    const response = await axios.get('http://localhost:3000/api/catalog/layanan?negara=7', {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (response.data.success && response.data.data) {
      const layanan = response.data.data.slice(0, 5);
      console.log(`✅ Got ${response.data.data.length} services from VirtuSIM Indonesia\n`);
      console.log('📊 First 5 services with markup:\n');
      
      layanan.forEach((item, idx) => {
        console.log(`${idx + 1}. ${item.layanan} (${item.code})`);
        console.log(`   Provider Price: Rp ${Number(item.harga_provider || 0).toLocaleString('id-ID')}`);
        console.log(`   Markup: ${item.markup_percentage}% + Rp ${item.markup_fixed}`);
        console.log(`   Final Price: Rp ${Number(item.harga).toLocaleString('id-ID')}`);
        console.log('');
      });

      console.log('✅ Markup system is working!');
    } else {
      console.log('❌ Response not successful:', response.data);
    }
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
}

testMarkupIntegration();
