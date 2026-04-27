const axios = require('axios');
const { createToken } = require('./src/utils/token');

async function test() {
  try {
    const token = createToken({
      sub: 'admin_1',
      username: 'admin',
      role: 'admin',
    });

    console.log('Testing POST /api/admin/cache/sync/7...\n');
    
    const res = await axios.post(
      'http://localhost:3000/api/admin/cache/sync/7',
      {},
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        validateStatus: () => true, // Don't throw on any status
      }
    );

    console.log('Status:', res.status);
    console.log('Data:', res.data);
  } catch (error) {
    console.error('Error:', error.message);
  }
}

test();
