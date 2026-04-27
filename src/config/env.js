const dotenv = require('dotenv');

dotenv.config();

const nodeEnv = process.env.NODE_ENV || 'development';
const isProduction = nodeEnv === 'production';

const authSecret = process.env.AUTH_SECRET || 'change-this-secret';
const webhookSecret = process.env.WEBHOOK_SECRET || '';
const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (isProduction) {
  const missingVars = [];
  if (!supabaseUrl) missingVars.push('SUPABASE_URL');
  if (!supabaseServiceRoleKey) missingVars.push('SUPABASE_SERVICE_ROLE_KEY');
  if (!webhookSecret) missingVars.push('WEBHOOK_SECRET');
  if (!authSecret || authSecret === 'change-this-secret') missingVars.push('AUTH_SECRET');

  if (missingVars.length > 0) {
    throw new Error(`Missing required environment variables for production: ${missingVars.join(', ')}`);
  }
}

module.exports = {
  port: Number(process.env.PORT || 3000),
  nodeEnv,
  isProduction,
  providerApiKey: process.env.PROVIDER_API_KEY || '',
  providerBaseUrl: process.env.PROVIDER_BASE_URL || 'https://virtusim.com/api/v2/json.php',
  authSecret,
  webhookSecret,
  supabaseUrl,
  supabaseServiceRoleKey,
  scraperEndpoint: process.env.SCRAPER_ENDPOINT || 'https://gobiz.bowo-store.id',
  rawQrisString: process.env.RAW_QRIS_STRING || '00020101021126610014COM.GO-JEK.WWW01189360091434239246540210G4239246540303UMI51440014ID.CO.QRIS.WWW0215ID10243667705670303UMI5204541153033605802ID5910Bowo Store6009INDRAMAYU61054521162070703A0163049461',
};
