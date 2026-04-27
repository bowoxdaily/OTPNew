const axios = require('axios');
const { createToken } = require('./src/utils/token');
const { syncLayananCache } = require('./src/services/cacheService');

async function testCacheSystem() {
  try {
    console.log('🔄 Testing Layanan Cache System\n');

    // Create admin token
    const token = createToken({
      sub: 'admin_1',
      username: 'admin',
      role: 'admin',
    });

    console.log('📥 Step 1: Sync layanan cache for Indonesia (country_id=7)...\n');
    
    // Trigger sync
    const syncRes = await axios.post(
      'http://localhost:3000/api/admin/cache/sync/7',
      {},
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      }
    );

    console.log('Response:', syncRes.data.message);
    console.log('\n');

    // Wait a bit for sync to complete
    await new Promise((resolve) => setTimeout(resolve, 2000));

    console.log('✅ Step 2: Check cache status\n');

    const statusRes = await axios.get(
      'http://localhost:3000/api/admin/cache/status/7',
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    console.log('Cache Status:', statusRes.data.data);
    console.log('\n');

    // Create user token
    const userToken = createToken({
      sub: 'user_1',
      username: 'testuser',
      role: 'user',
    });

    console.log('🍽️ Step 3: Fetch layanan from cache (with markup)\n');

    const layananRes = await axios.get(
      'http://localhost:3000/api/catalog/layanan?negara=7',
      {
        headers: {
          Authorization: `Bearer ${userToken}`,
        },
      }
    );

    console.log(`✅ Got ${layananRes.data.data.length} layanan from cache\n`);
    
    if (layananRes.data.data.length > 0) {
      console.log('First 3 services:');
      layananRes.data.data.slice(0, 3).forEach((item, idx) => {
        console.log(`${idx + 1}. ${item.layanan} (${item.code})`);
        console.log(`   Provider: Rp ${Number(item.harga_provider).toLocaleString('id-ID')} → Final: Rp ${Number(item.harga).toLocaleString('id-ID')} (+${item.markup_percentage}%)`);
      });
    }

    console.log('\n✨ Cache system test complete!');
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
}

testCacheSystem();
