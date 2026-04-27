const { supabase } = require('./supabaseClient');
const {
  getCountries,
  getLayananByCountry,
  resolveCountryName,
} = require('./providerService');

// In-memory cache
const layananMemoryCache = {};
const cacheExpiryMs = 3600000; // 1 hour

/**
 * Get layanan dari memory cache atau Supabase
 */
async function getLayananFromCache(countryId) {
  try {
    // Check memory cache first
    const cacheKey = `layanan_${countryId}`;
    if (layananMemoryCache[cacheKey]) {
      const cached = layananMemoryCache[cacheKey];
      if (Date.now() - cached.timestamp < cacheExpiryMs) {
        console.log(`✅ Cache hit for country ${countryId}`);
        return cached.data;
      }
    }

    // Try Supabase
    console.log(`📥 Fetching from Supabase for country ${countryId}...`);
    const { data, error } = await supabase
      .from('layanan_cache')
      .select('*')
      .eq('country_id', countryId)
      .eq('is_active', true)
      .order('service_name');

    if (error && error.code !== 'PGRST116') {
      console.warn('Supabase error:', error.message);
      return [];
    }

    if (data && data.length > 0) {
      // Store in memory cache
      layananMemoryCache[cacheKey] = {
        data: data,
        timestamp: Date.now(),
      };
      return data;
    }

    return [];
  } catch (error) {
    console.error('Error fetching layanan from cache:', error.message);
    return [];
  }
}

/**
 * Sync layanan dari provider ke cache (both memory + Supabase)
 */
async function syncLayananCache(countryId) {
  try {
    const countryName = await resolveCountryName(countryId);

    console.log(`📥 Syncing layanan for country ${countryId} (${countryName})...`);

    // Fetch from provider
    const layanan = await getLayananByCountry(countryId);
    console.log(`   Got ${layanan.length} services from provider`);

    if (layanan.length === 0) {
      throw new Error('No services returned from provider');
    }

    // Store in memory cache
    const cacheKey = `layanan_${countryId}`;
    layananMemoryCache[cacheKey] = {
      data: layanan.map((item) => ({
        country_id: countryId,
        country_name: countryName,
        service_code: item.code,
        service_name: item.layanan,
        provider_price: Number(item.harga || 0),
        stock: Number(item.stok || 0),
        is_active: true,
      })),
      timestamp: Date.now(),
    };

    // Try to sync to Supabase asynchronously (don't wait for it)
    const cacheData = layananMemoryCache[cacheKey].data;
    supabase
      .from('layanan_cache')
      .upsert(cacheData, { onConflict: 'country_id,service_code' })
      .then(() => {
        console.log(`   ✅ Synced ${layanan.length} services to database`);
      })
      .catch((err) => {
        console.error(`   ⚠️  Failed to sync to database:`, err.message);
      });

    return cacheData;
  } catch (error) {
    console.error(`❌ Sync error for country ${countryId}:`, error.message);
    throw error;
  }
}

/**
 * Update sync status
 */
async function updateSyncStatus(countryId, status, totalRecords = 0, errorMessage = null) {
  // For now, just log (Supabase might be down)
  console.log(`[Sync Status] Country ${countryId}: ${status} (${totalRecords} records)${errorMessage ? ` - Error: ${errorMessage}` : ''}`);
}

/**
 * Get cache status
 */
async function getCacheStatus(countryId) {
  const cacheKey = `layanan_${countryId}`;
  if (layananMemoryCache[cacheKey]) {
    return {
      country_id: countryId,
      cache_type: 'layanan',
      sync_status: 'completed',
      total_records: layananMemoryCache[cacheKey].data.length,
      last_sync_at: new Date(layananMemoryCache[cacheKey].timestamp).toISOString(),
    };
  }
  return null;
}

/**
 * Sync all countries layanan (for periodic refresh)
 */
async function syncAllCountriesLayanan() {
  try {
    console.log('🔄 Starting full sync of all countries layanan...\n');

    const countries = await getCountries();
    console.log(`Found ${countries.length} countries\n`);

    let synced = 0;
    let failed = 0;

    // Sync first 10 countries to avoid long execution
    for (const country of countries.slice(0, 10)) {
      try {
        await syncLayananCache(country.id);
        synced++;
      } catch (error) {
        console.error(`Failed to sync ${country.name}:`, error.message);
        failed++;
      }
    }

    console.log(`\n✅ Sync complete! Synced: ${synced}, Failed: ${failed}`);
    return { synced, failed };
  } catch (error) {
    console.error('Fatal error during sync:', error.message);
    throw error;
  }
}

/**
 * Clear memory cache for testing
 */
function clearCache() {
  const keys = Object.keys(layananMemoryCache);
  keys.forEach((key) => delete layananMemoryCache[key]);
  console.log(`✅ Cleared ${keys.length} cache entries`);
}

module.exports = {
  syncLayananCache,
  getLayananFromCache,
  updateSyncStatus,
  getCacheStatus,
  syncAllCountriesLayanan,
  clearCache,
};
