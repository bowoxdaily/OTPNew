require('dotenv').config();
const fetch = require('node-fetch');

const D1_ACCOUNT_ID = '9faa5ca2c55227c310cded927a2619c1';
const D1_DATABASE_ID = '67ba9a69-8701-4d2a-bf69-b6cb8f928e9f';
const D1_API_TOKEN = 'cfut_dAifotUeQzDlFXmxBDeFlKwXVDJ7ztDOpgPiJHIW26d07de5';

async function queryD1(sql) {
  const r = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${D1_ACCOUNT_ID}/d1/database/${D1_DATABASE_ID}/query`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${D1_API_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ sql })
    }
  );
  return await r.json();
}

(async () => {
  // 1. List tables
  console.log('=== D1 TABLES ===');
  const tables = await queryD1("SELECT name FROM sqlite_master WHERE type='table'");
  console.log(JSON.stringify(tables, null, 2));

  // 2. If transactions table exists, get recent data
  if (tables.success && tables.result?.[0]?.results?.length > 0) {
    const tableNames = tables.result[0].results.map(r => r.name);
    console.log('\nTables found:', tableNames);

    if (tableNames.includes('transactions')) {
      console.log('\n=== RECENT TRANSACTIONS ===');
      const txs = await queryD1('SELECT * FROM transactions ORDER BY scraped_at DESC LIMIT 5');
      if (txs.success) {
        txs.result[0].results.forEach(t => {
          console.log(`  Amount: ${t.jumlah} | Status: ${t.status} | ID: ${t.transaction_id} | Time: ${t.scraped_at}`);
        });
      }

      console.log('\n=== TODAY SETTLEMENTS ===');
      const today = new Date().toISOString().split('T')[0];
      const todayTx = await queryD1(`SELECT * FROM transactions WHERE status='Settlement' AND DATE(scraped_at) >= '${today}' ORDER BY scraped_at DESC LIMIT 10`);
      if (todayTx.success) {
        console.log(`Found: ${todayTx.result[0].results.length} transactions today`);
        todayTx.result[0].results.forEach(t => {
          console.log(`  Amount: ${t.jumlah} | ID: ${t.transaction_id} | Time: ${t.scraped_at}`);
        });
      } else {
        console.log('Error:', JSON.stringify(todayTx.errors));
      }
    }
  }

  // 3. Also check gateway events
  console.log('\n=== GATEWAY HEALTH ===');
  const health = await fetch('https://gobiz.bowo-store.id/gateway/v1/health');
  const healthData = await health.json();
  console.log(JSON.stringify(healthData));
})();
