-- ============================================
-- PRICE TRACKING TABLES SCHEMA
-- ============================================

-- User Price Tracking Table
-- Kullanıcıların takip ettiği kampanyalar
CREATE TABLE IF NOT EXISTS user_price_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id VARCHAR(255) NOT NULL, -- Firebase UID
  campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  target_price DECIMAL(10, 2), -- Hedef fiyat (opsiyonel)
  notify_on_drop BOOLEAN DEFAULT true, -- Fiyat düştüğünde bildirim gönder
  notify_on_increase BOOLEAN DEFAULT false, -- Fiyat arttığında bildirim gönder
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, campaign_id) -- Bir kullanıcı bir kampanyayı sadece bir kez takip edebilir
);

-- Campaign Price History Table
-- Kampanyaların fiyat geçmişi
CREATE TABLE IF NOT EXISTS campaign_price_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  price DECIMAL(10, 2) NOT NULL,
  discount_percentage DECIMAL(5, 2),
  currency VARCHAR(10) DEFAULT 'TRY',
  recorded_at TIMESTAMP DEFAULT NOW(),
  source VARCHAR(50) DEFAULT 'system', -- 'system', 'scraper', 'manual'
  CONSTRAINT check_price_positive CHECK (price >= 0),
  CONSTRAINT check_discount_range CHECK (discount_percentage >= 0 AND discount_percentage <= 100)
);

-- Indexes for Performance
CREATE INDEX IF NOT EXISTS idx_user_price_tracking_user_id ON user_price_tracking(user_id);
CREATE INDEX IF NOT EXISTS idx_user_price_tracking_campaign_id ON user_price_tracking(campaign_id);
CREATE INDEX IF NOT EXISTS idx_user_price_tracking_created_at ON user_price_tracking(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_campaign_price_history_campaign_id ON campaign_price_history(campaign_id);
CREATE INDEX IF NOT EXISTS idx_campaign_price_history_recorded_at ON campaign_price_history(recorded_at DESC);
CREATE INDEX IF NOT EXISTS idx_campaign_price_history_campaign_recorded ON campaign_price_history(campaign_id, recorded_at DESC);

-- Update timestamps trigger
CREATE OR REPLACE FUNCTION update_price_tracking_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER user_price_tracking_updated_at
  BEFORE UPDATE ON user_price_tracking
  FOR EACH ROW
  EXECUTE FUNCTION update_price_tracking_updated_at();

-- Function to record price history automatically
-- Bu fonksiyon campaigns tablosunda fiyat değiştiğinde otomatik çalışır
CREATE OR REPLACE FUNCTION record_campaign_price_change()
RETURNS TRIGGER AS $$
BEGIN
  -- Sadece fiyat değiştiyse kaydet
  IF (OLD.current_price IS DISTINCT FROM NEW.current_price) OR
     (OLD.discount_percentage IS DISTINCT FROM NEW.discount_percentage) THEN
    
    INSERT INTO campaign_price_history (
      campaign_id,
      price,
      discount_percentage,
      currency,
      source
    ) VALUES (
      NEW.id,
      NEW.current_price,
      NEW.discount_percentage,
      NEW.price_currency,
      'system'
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger: campaigns tablosunda fiyat değiştiğinde otomatik kaydet
CREATE TRIGGER campaign_price_change_trigger
  AFTER UPDATE ON campaigns
  FOR EACH ROW
  WHEN (OLD.current_price IS DISTINCT FROM NEW.current_price OR
        OLD.discount_percentage IS DISTINCT FROM NEW.discount_percentage)
  EXECUTE FUNCTION record_campaign_price_change();

-- Sample Data: Mevcut kampanyalar için ilk fiyat kaydı
-- Bu sadece setup sırasında çalışır, sonrasında trigger otomatik yapar
INSERT INTO campaign_price_history (campaign_id, price, discount_percentage, currency, source)
SELECT 
  id,
  current_price,
  discount_percentage,
  price_currency,
  'system'
FROM campaigns
WHERE current_price IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM campaign_price_history WHERE campaign_id = campaigns.id
  )
LIMIT 100; -- İlk 100 kampanya için

-- Comments
COMMENT ON TABLE user_price_tracking IS 'Kullanıcıların fiyat takibi yaptığı kampanyalar';
COMMENT ON TABLE campaign_price_history IS 'Kampanyaların fiyat geçmişi';
COMMENT ON COLUMN user_price_tracking.target_price IS 'Kullanıcının hedef fiyatı (opsiyonel)';
COMMENT ON COLUMN user_price_tracking.notify_on_drop IS 'Fiyat düştüğünde bildirim gönder';
COMMENT ON COLUMN user_price_tracking.notify_on_increase IS 'Fiyat arttığında bildirim gönder';
COMMENT ON COLUMN campaign_price_history.source IS 'Fiyat kaydının kaynağı: system, scraper, manual';
