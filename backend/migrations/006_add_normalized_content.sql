/**
 * Migration 006: Normalized campaign content + quality flags
 *
 * Adds raw_content, normalized_content, source_url, is_valid, needs_review, invalid_reason
 */

ALTER TABLE campaigns
ADD COLUMN IF NOT EXISTS source_url TEXT,
ADD COLUMN IF NOT EXISTS raw_content TEXT,
ADD COLUMN IF NOT EXISTS normalized_content JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS is_valid BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS needs_review BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS invalid_reason TEXT;

CREATE INDEX IF NOT EXISTS idx_campaigns_needs_review ON campaigns(needs_review);
CREATE INDEX IF NOT EXISTS idx_campaigns_is_valid ON campaigns(is_valid);
