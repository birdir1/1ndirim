/**
 * Migration 003: Enhance Campaign and Source Models
 * Adds source_type, priority_score, and auto-calculated campaign_count
 * 
 * Date: 31 Ocak 2026
 * Purpose: Backend enhancement for campaign ingestion system
 */

-- 1. Add source_type to sources table
ALTER TABLE sources 
ADD COLUMN IF NOT EXISTS source_type VARCHAR(20) DEFAULT 'brand' CHECK (source_type IN ('brand', 'aggregator', 'affiliate'));

-- 2. Add priority_score to campaigns table (0-100)
ALTER TABLE campaigns 
ADD COLUMN IF NOT EXISTS priority_score INTEGER DEFAULT 50 CHECK (priority_score >= 0 AND priority_score <= 100);

-- 3. Add discount_type to campaigns table
ALTER TABLE campaigns 
ADD COLUMN IF NOT EXISTS discount_type VARCHAR(20) CHECK (discount_type IN ('percentage', 'fixed', 'cashback', 'coupon', 'free', 'gift'));

-- 4. Add discount_value to campaigns table (nullable, for percentage or fixed amount)
ALTER TABLE campaigns 
ADD COLUMN IF NOT EXISTS discount_value DECIMAL(10, 2);

-- 5. Update existing sources to set source_type based on name
-- Aggregators
UPDATE sources 
SET source_type = 'aggregator' 
WHERE LOWER(name) IN ('obilet', 'ucuzabilet', 'enuygun', 'biletall', 'neredennereye', 'yemeksepeti', 'getir', 'trendyol');

-- Banks and wallets remain 'brand' (default)
-- Affiliate sources can be marked manually

-- 6. Create function to auto-calculate campaign_count
CREATE OR REPLACE FUNCTION update_source_campaign_count()
RETURNS TRIGGER AS $$
BEGIN
  -- Update campaign_count for the affected source
  UPDATE sources
  SET campaign_count = (
    SELECT COUNT(*)
    FROM campaigns
    WHERE source_id = COALESCE(NEW.source_id, OLD.source_id)
      AND is_active = true
      AND expires_at > NOW()
  )
  WHERE id = COALESCE(NEW.source_id, OLD.source_id);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 7. Create trigger for campaign INSERT/UPDATE/DELETE
DROP TRIGGER IF EXISTS trigger_update_campaign_count ON campaigns;
CREATE TRIGGER trigger_update_campaign_count
AFTER INSERT OR UPDATE OR DELETE ON campaigns
FOR EACH ROW
EXECUTE FUNCTION update_source_campaign_count();

-- 8. Initial calculation of campaign_count for all sources
UPDATE sources s
SET campaign_count = (
  SELECT COUNT(*)
  FROM campaigns c
  WHERE c.source_id = s.id
    AND c.is_active = true
    AND c.expires_at > NOW()
);

-- 9. Add index on priority_score for faster sorting
CREATE INDEX IF NOT EXISTS idx_campaigns_priority_score ON campaigns(priority_score DESC);

-- 10. Add index on source_type for faster filtering
CREATE INDEX IF NOT EXISTS idx_sources_source_type ON sources(source_type);

-- 11. Add index on discount_type for analytics
CREATE INDEX IF NOT EXISTS idx_campaigns_discount_type ON campaigns(discount_type);

-- 12. Update priority_score based on existing data (heuristic)
-- High priority: campaigns with affiliate_url, high discount, or pinned
UPDATE campaigns
SET priority_score = CASE
  WHEN is_pinned = true THEN 90
  WHEN affiliate_url IS NOT NULL THEN 75
  WHEN discount_percentage > 50 THEN 70
  WHEN discount_percentage > 30 THEN 60
  WHEN discount_percentage > 10 THEN 55
  ELSE 50
END
WHERE priority_score = 50; -- Only update default values

COMMENT ON COLUMN sources.source_type IS 'Type of source: brand (individual company), aggregator (multi-brand platform), affiliate (affiliate network)';
COMMENT ON COLUMN campaigns.priority_score IS 'Campaign priority score (0-100). Higher = more prominent display. Auto-calculated based on discount, affiliate status, and admin overrides.';
COMMENT ON COLUMN campaigns.discount_type IS 'Type of discount: percentage, fixed, cashback, coupon, free, gift';
COMMENT ON COLUMN campaigns.discount_value IS 'Discount value (percentage or fixed amount in TL)';
COMMENT ON COLUMN sources.campaign_count IS 'Auto-calculated count of active campaigns for this source';
