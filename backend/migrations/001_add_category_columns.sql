-- Migration: Add category columns to campaigns table
-- Date: 2026-01-31
-- Purpose: Support campaign categorization for Keşfet page and data quality

-- Add new columns
ALTER TABLE campaigns 
ADD COLUMN IF NOT EXISTS category TEXT,
ADD COLUMN IF NOT EXISTS sub_category TEXT,
ADD COLUMN IF NOT EXISTS discount_percentage INTEGER,
ADD COLUMN IF NOT EXISTS is_personalized BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS scraped_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS data_hash TEXT;

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_campaigns_category ON campaigns(category);
CREATE INDEX IF NOT EXISTS idx_campaigns_sub_category ON campaigns(sub_category);
CREATE INDEX IF NOT EXISTS idx_campaigns_scraped_at ON campaigns(scraped_at);
CREATE INDEX IF NOT EXISTS idx_campaigns_data_hash ON campaigns(data_hash);

-- Add constraints (will be enforced for new campaigns only)
-- Note: We use CHECK constraints that allow NULL for backward compatibility
ALTER TABLE campaigns 
ADD CONSTRAINT chk_title_not_empty CHECK (
  title IS NULL OR LENGTH(TRIM(title)) >= 10
);

ALTER TABLE campaigns 
ADD CONSTRAINT chk_description_not_empty CHECK (
  description IS NULL OR LENGTH(TRIM(description)) >= 20
);

-- Note: We don't add NOT NULL constraint on category yet
-- This will be enforced at application level for new campaigns
-- Existing campaigns without category will be updated by bot

-- Add comment for documentation
COMMENT ON COLUMN campaigns.category IS 'Campaign category: entertainment, gaming, fashion, travel, food, finance, music, shopping, telecom';
COMMENT ON COLUMN campaigns.sub_category IS 'Sub-category: Netflix, Steam, Zara, etc.';
COMMENT ON COLUMN campaigns.discount_percentage IS 'Discount percentage if applicable (e.g., 50 for 50% off)';
COMMENT ON COLUMN campaigns.is_personalized IS 'Whether this is a personalized campaign (requires login)';
COMMENT ON COLUMN campaigns.scraped_at IS 'Timestamp when campaign was scraped by bot';
COMMENT ON COLUMN campaigns.data_hash IS 'MD5 hash for duplicate detection: md5(sourceName|title|startDate|endDate)';
