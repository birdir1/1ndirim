-- Migration: Create admin_users table and seed initial admin
-- Date: 2026-02-08
-- Purpose: Support admin authentication (email + api key) as implemented in backend/src/middleware/adminAuth.js

-- Extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Table
CREATE TABLE IF NOT EXISTS admin_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  role TEXT NOT NULL CHECK (role IN ('super_admin', 'editor', 'viewer')),
  admin_api_key TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_admin_users_email ON admin_users (email);

-- Seed default admin (idempotent)
INSERT INTO admin_users (email, role, admin_api_key, is_active)
VALUES ('umitgulcuk680@gmail.com', 'super_admin', '741e8347033aac0528da553a147fc9415161d6d627f189fe256adc9209cfe120', true)
ON CONFLICT (email) DO UPDATE
SET role = EXCLUDED.role,
    admin_api_key = EXCLUDED.admin_api_key,
    is_active = EXCLUDED.is_active,
    updated_at = NOW();

COMMENT ON TABLE admin_users IS 'Admin users for backend/admin-panel authentication';
COMMENT ON COLUMN admin_users.admin_api_key IS 'Shared secret per admin, compared as plain text in adminAuth middleware';
