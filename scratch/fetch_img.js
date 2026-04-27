const https = require('https');
https.get('https://ibb.co.com/wNYtvcC2', (res) => {
  let data = '';
  res.on('data', d => data += d);
  res.on('end', () => {
    const match = data.match(/https:\/\/i\.ibb\.co\.com\/[^\/]+\/[^\'\"]+\.(jpg|png|jpeg)/);
    console.log(match ? match[0] : 'Not found');
  });
});
