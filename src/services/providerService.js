const axios = require('axios');
const { providerApiKey, providerBaseUrl } = require('../config/env');

const providerClient = axios.create({
  baseURL: providerBaseUrl,
  timeout: 15000,
  headers: {
    'Accept': 'application/json, text/plain, */*',
    'Content-Type': 'application/json',
    'User-Agent': 'OTP-Reseller/1.0',
    'X-Requested-With': 'XMLHttpRequest',
    'Cache-Control': 'no-cache',
    'Pragma': 'no-cache',
  },
});

// Cache countries mapping ID -> name
let countriesCache = null;

async function sendRequest(action, params = {}) {
  if (!providerApiKey) {
    throw Object.assign(new Error('PROVIDER_API_KEY belum diatur di .env'), { statusCode: 500 });
  }

  try {
    const response = await providerClient.get('', {
      params: {
        api_key: providerApiKey,
        action,
        ...params,
      },
    });

    return response.data;
  } catch (error) {
    const statusCode = error.response?.status || 502;
    const details = error.response?.data || error.message;

    console.error('[PROVIDER_API_ERROR]', {
      action,
      statusCode,
      code: error.code,
      message: error.message,
      responseData: error.response?.data,
      responseHeaders: error.response?.headers,
      requestUrl: error.config?.url,
      requestMethod: error.config?.method,
      requestBaseURL: error.config?.baseURL,
    });

    throw Object.assign(new Error('Gagal menghubungi API provider'), {
      statusCode,
      details,
    });
  }
}

function checkBalance() {
  return sendRequest('balance');
}

// VirtuSIM: action=order&service=743&operator=any
async function orderNumber({ negara, layanan, operator }) {
  const countryName = await resolveCountryName(negara);
  return sendRequest('order', { 
    service: layanan, 
    operator, 
    country: countryName 
  });
}

// VirtuSIM: action=detail_order&id=123
function checkSms({ id }) {
  return sendRequest('detail_order', { id });
}

// VirtuSIM: action=set_status&id=123&status=2 (2 = Cancel)
function cancelOrder({ id }) {
  return sendRequest('set_status', { id, status: 2 });
}

// VirtuSIM: action=set_status&id=123&status=1 (1 = Ready)
function setOrderReady({ id }) {
  return sendRequest('set_status', { id, status: 1 });
}

// VirtuSIM: action=list_country
async function getCountries() {
  const raw = await sendRequest('list_country');
  const list = Array.isArray(raw?.data) ? raw.data : [];
  
  const countries = list.map((item) => ({
    id: Number(item.id),
    name: String(item.country_name || '').toLowerCase(),
  })).filter((item) => Number.isFinite(item.id) && item.id > 0 && item.name);
  
  // Cache for ID -> name mapping
  countriesCache = {};
  countries.forEach((c) => {
    countriesCache[c.id] = c.name;
  });
  
  return countries;
}

// Helper: resolve country name from ID
async function resolveCountryName(negaraIdOrName) {
  // Check if it's a number or a string representing a number
  const id = Number(negaraIdOrName);
  
  if (Number.isFinite(id)) {
    // Try cache first
    if (countriesCache && countriesCache[id]) {
      return countriesCache[id];
    }

    // Fetch countries if not cached
    if (!countriesCache) {
      await getCountries();
    }

    // Return from cache or default
    return countriesCache?.[id] || 'Indonesia';
  }

  // If it's already a non-numeric string, assume it's the name
  if (typeof negaraIdOrName === 'string' && negaraIdOrName.length > 0) {
    return negaraIdOrName;
  }

  return 'Indonesia';
}

// VirtuSIM: action=list_operator&country=Russia
async function getOperatorsByCountry(negaraId) {
  const countryName = await resolveCountryName(negaraId);
  
  const raw = await sendRequest('list_operator', { country: countryName });
  const list = Array.isArray(raw?.data) ? raw.data : (typeof raw?.data === 'object' ? Object.values(raw.data) : []);
  
  return list.map((item) => String(item.name || item.operator || item).toLowerCase()).filter(Boolean);
}

// VirtuSIM: action=services&country=Russia&service=
async function getLayananByCountry(negaraId) {
  const countryName = await resolveCountryName(negaraId);
  
  const raw = await sendRequest('services', { country: countryName, service: '' });
  const list = Array.isArray(raw?.data) ? raw.data : (typeof raw?.data === 'object' ? Object.values(raw.data) : []);
  
  return list.map((item) => ({
    code: String(item.id || item.service_id || item.code || '').toLowerCase(),
    layanan: String(item.name || item.service || item.layanan || '').toLowerCase(),
    harga: Number(item.price || item.harga || 0),
    stok: Number(item.tersedia || item.stock || item.stok || 0),
  })).filter((item) => item.code && item.layanan);
}

module.exports = {
  checkBalance,
  orderNumber,
  checkSms,
  cancelOrder,
  setOrderReady,
  getCountries,
  getOperatorsByCountry,
  getLayananByCountry,
  resolveCountryName,
};
