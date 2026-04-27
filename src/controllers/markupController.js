const { supabase } = require('../services/supabaseClient');

// In-memory markup cache as fallback
const markupCache = new Map();

/**
 * Get all markup settings
 */
async function getAllMarkupSettings() {
  try {
    const { data, error } = await Promise.race([
      supabase
        .from('markup_settings')
        .select('*')
        .order('service_name', { ascending: true }),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Supabase query timeout')), 5000)
      )
    ]);

    if (error) {
      console.warn('Supabase error in getAllMarkupSettings:', error);
      // Return cache fallback
      return Array.from(markupCache.values());
    }
    
    if (data) {
      // Update cache
      data.forEach(item => markupCache.set(item.id, item));
      return data;
    }
    
    return Array.from(markupCache.values());
  } catch (error) {
    console.error('Error in getAllMarkupSettings:', error.message);
    return Array.from(markupCache.values());
  }
}

/**
 * Get markup for specific service
 * Falls back to global markup if no service-specific markup found
 */
async function getMarkupForService(serviceId) {
  try {
    // Check memory cache first
    const cached = Array.from(markupCache.values()).find(
      item => item.service_id === serviceId && item.is_active
    );
    if (cached) return cached;

    // Try to get service-specific markup
    const { data, error } = await Promise.race([
      supabase
        .from('markup_settings')
        .select('*')
        .eq('service_id', serviceId)
        .eq('is_active', true)
        .single(),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Supabase query timeout')), 3000)
      )
    ]);

    if (data) {
      markupCache.set(data.id, data);
      return data;
    }
    if (error && error.code !== 'PGRST116') {
      console.warn('Supabase error looking for service markup:', error);
    }

    // Fall back to global markup
    const { data: globalMarkup, error: globalError } = await Promise.race([
      supabase
        .from('markup_settings')
        .select('*')
        .is('service_id', null)
        .eq('is_active', true)
        .single(),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Supabase query timeout')), 3000)
      )
    ]);

    if (globalMarkup) {
      markupCache.set(globalMarkup.id, globalMarkup);
      return globalMarkup;
    }
    if (globalError && globalError.code !== 'PGRST116') {
      console.warn('Supabase error looking for global markup:', globalError);
    }

    return { markup_percentage: 0, markup_fixed: 0 };
  } catch (error) {
    console.error('Error getting markup for service:', error.message);
    return { markup_percentage: 0, markup_fixed: 0 };
  }
}

/**
 * Calculate reseller price from provider price
 * formula: provider_price + (provider_price * markup_percentage/100) + markup_fixed
 */
function calculateResellerPrice(providerPrice, markup = {}) {
  const percentage = markup.markup_percentage || 0;
  const fixed = markup.markup_fixed || 0;
  
  const markupFromPercentage = providerPrice * (percentage / 100);
  const totalMarkup = markupFromPercentage + fixed;
  const resellerPrice = providerPrice + totalMarkup;
  
  return {
    provider_price: providerPrice,
    markup_amount: totalMarkup,
    reseller_price: Math.round(resellerPrice),
  };
}

/**
 * Create or update markup setting
 */
async function upsertMarkupSetting(req, res, next) {
  const { service_id, service_name, markup_percentage, markup_fixed } = req.body;

  try {
    // Validate input
    if (markup_percentage === undefined || markup_fixed === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Parameter markup_percentage dan markup_fixed wajib diisi',
      });
    }

    if (typeof markup_percentage !== 'number' || typeof markup_fixed !== 'number') {
      return res.status(400).json({
        success: false,
        message: 'markup_percentage dan markup_fixed harus angka',
      });
    }

    const { data, error } = await Promise.race([
      supabase
        .from('markup_settings')
        .upsert({
          service_id: service_id || null,
          service_name: service_name || 'GLOBAL',
          markup_percentage,
          markup_fixed,
          is_active: true,
        }, {
          onConflict: 'service_id',
        })
        .select(),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Supabase query timeout')), 5000)
      )
    ]);

    if (error) {
      console.error('Supabase error in upsertMarkupSetting:', error);
      return res.status(500).json({
        success: false,
        message: 'Gagal menyimpan markup: ' + (error.message || 'Database error'),
      });
    }

    if (data && data[0]) {
      markupCache.set(data[0].id, data[0]);
      return res.status(200).json({
        success: true,
        message: 'Markup setting berhasil disimpan',
        data: data[0],
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Gagal menyimpan markup: tidak ada response dari database',
    });
  } catch (error) {
    console.error('Error in upsertMarkupSetting:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Gagal menyimpan markup: ' + error.message,
    });
  }
}

/**
 * Get all markup settings (admin view)
 */
async function getMarkupSettings(req, res, next) {
  try {
    const settings = await getAllMarkupSettings();
    
    return res.status(200).json({
      success: true,
      data: settings || [],
    });
  } catch (error) {
    console.error('Error in getMarkupSettings:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Gagal mengambil markup settings: ' + error.message,
    });
  }
}

/**
 * Delete markup setting
 */
async function deleteMarkupSetting(req, res, next) {
  const { id } = req.params;

  try {
    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'Parameter id wajib diisi',
      });
    }

    const { error } = await Promise.race([
      supabase
        .from('markup_settings')
        .delete()
        .eq('id', id),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Supabase query timeout')), 5000)
      )
    ]);

    if (error) {
      console.error('Supabase error in deleteMarkupSetting:', error);
      return res.status(500).json({
        success: false,
        message: 'Gagal menghapus markup: ' + (error.message || 'Database error'),
      });
    }

    markupCache.delete(id);
    return res.status(200).json({
      success: true,
      message: 'Markup setting berhasil dihapus',
    });
  } catch (error) {
    console.error('Error in deleteMarkupSetting:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Gagal menghapus markup: ' + error.message,
    });
  }
}

/**
 * Toggle active status
 */
async function toggleMarkupActive(req, res, next) {
  const { id } = req.params;
  const { is_active } = req.body;

  try {
    if (!id || typeof is_active !== 'boolean') {
      return res.status(400).json({
        success: false,
        message: 'Parameter id dan is_active (boolean) wajib',
      });
    }

    const { data, error } = await Promise.race([
      supabase
        .from('markup_settings')
        .update({ is_active })
        .eq('id', id)
        .select(),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Supabase query timeout')), 5000)
      )
    ]);

    if (error) {
      console.error('Supabase error in toggleMarkupActive:', error);
      return res.status(500).json({
        success: false,
        message: 'Gagal update status: ' + (error.message || 'Database error'),
      });
    }

    if (data && data[0]) {
      markupCache.set(data[0].id, data[0]);
      return res.status(200).json({
        success: true,
        message: `Markup setting berhasil di-${is_active ? 'aktifkan' : 'nonaktifkan'}`,
        data: data[0],
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Gagal update status: tidak ada response dari database',
    });
  } catch (error) {
    console.error('Error in toggleMarkupActive:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Gagal update status: ' + error.message,
    });
  }
}

/**
 * Get all markups as a Map for fast O(1) lookup
 * Returns: Map { service_id => markup_data, 'GLOBAL' => global_markup }
 */
async function getAllMarkupsAsMap() {
  try {
    const settings = await getAllMarkupSettings();
    const markupMap = new Map();
    
    // Build map with service_id as key
    settings.forEach(markup => {
      if (markup.is_active) {
        const key = markup.service_id || 'GLOBAL';
        markupMap.set(key, {
          markup_percentage: markup.markup_percentage || 0,
          markup_fixed: markup.markup_fixed || 0,
        });
      }
    });
    
    return markupMap;
  } catch (error) {
    console.error('Error in getAllMarkupsAsMap:', error.message);
    return new Map();
  }
}

/**
 * Get markup from map with fallback to global
 */
function getMarkupFromMap(serviceId, markupMap) {
  // Try service-specific first
  if (markupMap.has(serviceId)) {
    return markupMap.get(serviceId);
  }
  
  // Fall back to global
  if (markupMap.has('GLOBAL')) {
    return markupMap.get('GLOBAL');
  }
  
  // Default
  return { markup_percentage: 0, markup_fixed: 0 };
}

module.exports = {
  getMarkupForService,
  calculateResellerPrice,
  upsertMarkupSetting,
  getMarkupSettings,
  deleteMarkupSetting,
  toggleMarkupActive,
  getAllMarkupsAsMap,
  getMarkupFromMap,
};
