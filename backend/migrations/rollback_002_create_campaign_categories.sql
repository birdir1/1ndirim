-- Rollback Migration: Drop campaign_categories table
-- Date: 2026-01-31
-- Purpose: Rollback 002_create_campaign_categories.sql if needed

-- Drop indexes
DROP INDEX IF EXISTS idx_campaign_categories_name;
DROP INDEX IF EXISTS idx_campaign_categories_is_active;

-- Drop table
DROP TABLE IF EXISTS campaign_categories;
