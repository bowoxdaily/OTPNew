-- Add email, phone, and updated_at columns to users table
-- Run this in Supabase SQL Editor (Dashboard > SQL Editor > New Query)

ALTER TABLE users ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Optional: add unique constraint if you want to prevent duplicate emails
-- ALTER TABLE users ADD CONSTRAINT users_email_unique UNIQUE (email);
