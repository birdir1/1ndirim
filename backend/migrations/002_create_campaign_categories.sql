-- Migration: Create campaign_categories table
-- Date: 2026-01-31
-- Purpose: Define fixed categories for Keşfet page with source mapping

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create campaign_categories table
CREATE TABLE IF NOT EXISTS campaign_categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  icon TEXT,
  description TEXT,
  min_campaigns INTEGER DEFAULT 10,
  fixed_sources JSONB,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Add comment for documentation
COMMENT ON TABLE campaign_categories IS 'Fixed categories for Keşfet page with source mapping';
COMMENT ON COLUMN campaign_categories.name IS 'Category identifier (lowercase, used in code)';
COMMENT ON COLUMN campaign_categories.display_name IS 'Display name in Turkish';
COMMENT ON COLUMN campaign_categories.icon IS 'Emoji icon for category';
COMMENT ON COLUMN campaign_categories.min_campaigns IS 'Minimum campaigns required for category to show';
COMMENT ON COLUMN campaign_categories.fixed_sources IS 'Array of source names to track for this category';

-- Seed categories
INSERT INTO campaign_categories (name, display_name, icon, description, min_campaigns, fixed_sources) VALUES
(
  'entertainment', 
  'Eğlence', 
  '🎬',
  'Netflix, YouTube, Amazon Prime ve diğer eğlence platformları',
  10,
  '["Netflix", "YouTube Premium", "Amazon Prime", "Exxen", "Gain", "Tivibu", "TV+", "BluTV", "Mubi"]'::jsonb
),
(
  'gaming', 
  'Oyun', 
  '🎮',
  'Steam, Epic Games, PlayStation ve diğer oyun platformları',
  10,
  '["Steam", "Epic Games", "Nvidia", "PlayStation", "Xbox", "Game Pass", "EA Play", "Ubisoft"]'::jsonb
),
(
  'fashion', 
  'Giyim', 
  '👕',
  'Zara, H&M, LC Waikiki ve diğer giyim markaları',
  10,
  '["Zara", "H&M", "LCW", "Mavi", "Koton", "DeFacto", "Trendyol", "Nike", "Adidas"]'::jsonb
),
(
  'travel', 
  'Seyahat', 
  '✈️',
  'THY, Pegasus, Obilet ve diğer seyahat hizmetleri',
  10,
  '["THY", "Pegasus", "Obilet", "Booking.com", "Hotels.com", "Airbnb", "Jolly", "Etstur"]'::jsonb
),
(
  'food', 
  'Yemek', 
  '🍔',
  'Yemeksepeti, Getir, Migros ve diğer yemek servisleri',
  10,
  '["Yemeksepeti", "Getir", "Migros", "Trendyol Yemek", "Banabi", "Dominos", "McDonalds", "Burger King"]'::jsonb
),
(
  'finance', 
  'Finans', 
  '💳',
  'Papara, Tosla, bankalar ve diğer finans hizmetleri',
  10,
  '["Papara", "Tosla", "Enpara", "Akbank", "Garanti", "İş Bankası", "Yapı Kredi", "QNB Finansbank"]'::jsonb
)
ON CONFLICT (name) DO NOTHING;

-- Create index on name for fast lookups
CREATE INDEX IF NOT EXISTS idx_campaign_categories_name ON campaign_categories(name);
CREATE INDEX IF NOT EXISTS idx_campaign_categories_is_active ON campaign_categories(is_active);
