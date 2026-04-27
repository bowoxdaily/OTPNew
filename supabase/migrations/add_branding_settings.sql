-- Create branding_settings table
CREATE TABLE IF NOT EXISTS branding_settings (
  id INT PRIMARY KEY DEFAULT 1,
  brand_name VARCHAR(255) DEFAULT 'OTP Reseller',
  brand_tagline VARCHAR(255) DEFAULT 'Platform Jual OTP Reseller',
  primary_color VARCHAR(7) DEFAULT '#1976d2',
  secondary_color VARCHAR(7) DEFAULT '#dc004e',
  company_email VARCHAR(255) DEFAULT 'support@otpreseller.com',
  company_phone VARCHAR(20) DEFAULT '+62-xxx-xxx-xxxx',
  company_address TEXT DEFAULT 'Jakarta, Indonesia',
  logo_url TEXT,
  favicon_url TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Ensure only one row exists
INSERT INTO branding_settings (id) VALUES (1) ON CONFLICT DO NOTHING;
