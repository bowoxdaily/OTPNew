-- Create layanan_cache table to store services locally
CREATE TABLE IF NOT EXISTS layanan_cache (
  id SERIAL PRIMARY KEY,
  country_id INT NOT NULL,
  country_name VARCHAR(100) NOT NULL,
  service_code VARCHAR(100) NOT NULL,
  service_name VARCHAR(255) NOT NULL,
  provider_price NUMERIC(12, 2) NOT NULL,
  stock INT DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(country_id, service_code)
);

-- Index untuk search cepat
CREATE INDEX IF NOT EXISTS idx_layanan_cache_country ON layanan_cache(country_id);
CREATE INDEX IF NOT EXISTS idx_layanan_cache_country_active ON layanan_cache(country_id, is_active);
CREATE INDEX IF NOT EXISTS idx_layanan_cache_service_code ON layanan_cache(service_code);

-- Add column untuk track cache status
CREATE TABLE IF NOT EXISTS cache_sync_status (
  id SERIAL PRIMARY KEY,
  cache_type VARCHAR(50) NOT NULL, -- 'layanan', 'countries', etc
  country_id INT,
  last_sync_at TIMESTAMP,
  total_records INT DEFAULT 0,
  sync_status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'syncing', 'completed', 'failed'
  error_message TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
