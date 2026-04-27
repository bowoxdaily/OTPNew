const { syncLayananCache } = require('./src/services/cacheService');

syncLayananCache(7)
  .then(() => console.log('Sync success!'))
  .catch(err => console.error('Sync failed:', err));
