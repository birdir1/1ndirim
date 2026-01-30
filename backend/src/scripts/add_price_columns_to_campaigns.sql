-- ============================================
-- ADD PRICE COLUMNS TO CAMPAIGNS TABLE
-- ============================================

-- Add price-related columns to campaigns table
ALTER TABLE campaigns 
  ADD COLUMN IF NOT EXISTS current_price DECIMAL(10, 2),
  ADD COLUMN IF NOT EXISTS original_price DECIMAL(10, 2),
  ADD COLUMN IF NOT EXISTS discount_percentage DECIMAL(5, 2),
  ADD COLUMN IF NOT EXISTS price_currency VARCHAR(10) DEFAULT 'TRY';

-- Add constraints (drop if exists first)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'check_current_price_positive'
  ) THEN
    ALTER TABLE campaigns
      ADD CONSTRAINT check_current_price_positive 
        CHECK (current_price IS NULL OR current_price >= 0);
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'check_original_price_positive'
  ) THEN
    ALTER TABLE campaigns
      ADD CONSTRAINT check_original_price_positive 
        CHECK (original_price IS NULL OR original_price >= 0);
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'check_campaigns_discount_range'
  ) THEN
    ALTER TABLE campaigns
      ADD CONSTRAINT check_campaigns_discount_range 
        CHECK (discount_percentage IS NULL OR (discount_percentage >= 0 AND discount_percentage <= 100));
  END IF;
END $$;

-- Add indexes for price queries
CREATE INDEX IF NOT EXISTS idx_campaigns_current_price ON campaigns(current_price) 
  WHERE current_price IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_campaigns_discount_percentage ON campaigns(discount_percentage DESC) 
  WHERE discount_percentage IS NOT NULL;

-- Comments
COMMENT ON COLUMN campaigns.current_price IS 'Kampanyanın güncel fiyatı (indirimli fiyat)';
COMMENT ON COLUMN campaigns.original_price IS 'Kampanyanın orijinal fiyatı (indirim öncesi)';
COMMENT ON COLUMN campaigns.discount_percentage IS 'İndirim yüzdesi (0-100 arası)';
COMMENT ON COLUMN campaigns.price_currency IS 'Fiyat para birimi (TRY, USD, EUR, vb.)';

COMMENT ON TABLE campaigns IS 'Kampanyalar tablosu - fiyat bilgileri eklendi';
