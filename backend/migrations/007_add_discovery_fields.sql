-- Add discovery-related fields to campaigns table
ALTER TABLE campaigns
  ADD COLUMN IF NOT EXISTS platform TEXT,
  ADD COLUMN IF NOT EXISTS content_type TEXT,
  ADD COLUMN IF NOT EXISTS start_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS end_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS is_free BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS discount_percent NUMERIC,
  ADD COLUMN IF NOT EXISTS city TEXT,
  ADD COLUMN IF NOT EXISTS district TEXT,
  ADD COLUMN IF NOT EXISTS lat DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS lng DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS sponsored BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS sponsored_weight INTEGER DEFAULT 0;

-- Optional helper index for geo queries
CREATE INDEX IF NOT EXISTS idx_campaigns_lat_lng ON campaigns USING btree(lat, lng);

-- Popularity placeholder: keep existing order by pinned/created_at; no additional column added here.
