-- Rollback Migration: Remove category columns from campaigns table
-- Date: 2026-01-31
-- Purpose: Rollback 001_add_category_columns.sql if needed

-- Drop constraints
ALTER TABLE campaigns DROP CONSTRAINT IF EXISTS chk_title_not_empty;
ALTER TABLE campaigns DROP CONSTRAINT IF EXISTS chk_description_not_empty;

-- Drop indexes
DROP INDEX IF EXISTS idx_campaigns_category;
DROP INDEX IF EXISTS idx_campaigns_sub_category;
DROP INDEX IF EXISTS idx_campaigns_scraped_at;
DROP INDEX IF EXISTS idx_campaigns_data_hash;

-- Drop columns
ALTER TABLE campaigns DROP COLUMN IF EXISTS category;
ALTER TABLE campaigns DROP COLUMN IF EXISTS sub_category;
ALTER TABLE campaigns DROP COLUMN IF EXISTS discount_percentage;
ALTER TABLE campaigns DROP COLUMN IF EXISTS is_personalized;
ALTER TABLE campaigns DROP COLUMN IF EXISTS scraped_at;
ALTER TABLE campaigns DROP COLUMN IF EXISTS data_hash;
