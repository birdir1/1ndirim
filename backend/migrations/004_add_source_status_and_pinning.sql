-- Migration: Add source_status to sources + pinning fields to campaigns
-- Date: 2026-02-08
-- Purpose: Align DB schema with current backend code expectations (bot routing + feed ordering)

-- 1) Bot/admin routing expects sources.source_status
ALTER TABLE sources
ADD COLUMN IF NOT EXISTS source_status VARCHAR(20) DEFAULT 'active';

-- Restrict values (NULL allowed for backwards compatibility)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'chk_sources_source_status'
  ) THEN
    ALTER TABLE sources
    ADD CONSTRAINT chk_sources_source_status CHECK (
      source_status IS NULL OR source_status IN ('active', 'hard_backlog', 'paused')
    );
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_sources_source_status ON sources(source_status);

-- 2) Feed queries order by campaigns.is_pinned + campaigns.pinned_at
ALTER TABLE campaigns
ADD COLUMN IF NOT EXISTS is_pinned BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS pinned_at TIMESTAMP;

CREATE INDEX IF NOT EXISTS idx_campaigns_is_pinned ON campaigns(is_pinned) WHERE is_pinned = true;
CREATE INDEX IF NOT EXISTS idx_campaigns_pinned_at ON campaigns(pinned_at);

