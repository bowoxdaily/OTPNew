const { syncLayananCache, syncAllCountriesLayanan, getCacheStatus } = require('../services/cacheService');

/**
 * Endpoint untuk manual trigger sync layanan cache untuk 1 country
 */
async function syncLayananByCountry(req, res, next) {
  const countryId = Number(req.params.countryId);
  
  if (!Number.isFinite(countryId)) {
    return res.status(400).json({
      success: false,
      message: 'Country ID harus angka',
    });
  }

  try {
    await syncLayananCache(countryId);
    
    return res.status(200).json({
      success: true,
      message: `Layanan cache synced for country ${countryId}`,
    });
  } catch (error) {
    return next(error);
  }
}

/**
 * Endpoint untuk trigger sync semua countries
 */
async function syncAllLayanan(req, res, next) {
  try {
    const result = await syncAllCountriesLayanan();
    
    return res.status(200).json({
      success: true,
      message: 'Sync all countries triggered',
      data: result,
    });
  } catch (error) {
    return next(error);
  }
}

/**
 * Endpoint untuk check cache status
 */
async function getCacheStatusByCountry(req, res, next) {
  const countryId = Number(req.params.countryId);
  
  if (!Number.isFinite(countryId)) {
    return res.status(400).json({
      success: false,
      message: 'Country ID harus angka',
    });
  }

  try {
    const status = await getCacheStatus(countryId);
    
    return res.status(200).json({
      success: true,
      data: status,
    });
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  syncLayananByCountry,
  syncAllLayanan,
  getCacheStatusByCountry,
};
