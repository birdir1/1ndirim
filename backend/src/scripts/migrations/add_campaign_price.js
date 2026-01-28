const pool = require('../../config/database');

/**
 * Migration: campaigns tablosuna fiyat alanları ve fiyat geçmişi tablosu ekler.
 * Fiyat takibi özelliği için gerekli.
 */
async function addCampaignPrice() {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Campaigns tablosuna fiyat kolonları ekle
    await client.query(`
      ALTER TABLE campaigns
      ADD COLUMN IF NOT EXISTS current_price DECIMAL(10, 2),
      ADD COLUMN IF NOT EXISTS original_price DECIMAL(10, 2),
      ADD COLUMN IF NOT EXISTS discount_percentage DECIMAL(5, 2),
      ADD COLUMN IF NOT EXISTS price_currency VARCHAR(10) DEFAULT 'TRY'
    `);

    // Index ekle
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_campaigns_current_price 
      ON campaigns(current_price) 
      WHERE current_price IS NOT NULL
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_campaigns_discount_percentage 
      ON campaigns(discount_percentage DESC) 
      WHERE discount_percentage IS NOT NULL
    `);

    // Fiyat geçmişi tablosu
    await client.query(`
      CREATE TABLE IF NOT EXISTS campaign_price_history (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
        price DECIMAL(10, 2) NOT NULL,
        discount_percentage DECIMAL(5, 2),
        currency VARCHAR(10) DEFAULT 'TRY',
        recorded_at TIMESTAMP DEFAULT NOW(),
        source VARCHAR(50) DEFAULT 'system' -- 'system', 'bot', 'admin', 'user'
      );
    `);

    // Indexes
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_campaign_price_history_campaign_id 
      ON campaign_price_history(campaign_id);
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_campaign_price_history_recorded_at 
      ON campaign_price_history(recorded_at DESC);
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_campaign_price_history_campaign_recorded 
      ON campaign_price_history(campaign_id, recorded_at DESC);
    `);

    // Kullanıcı fiyat takibi tablosu
    await client.query(`
      CREATE TABLE IF NOT EXISTS user_price_tracking (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id VARCHAR(255) NOT NULL,
        campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
        target_price DECIMAL(10, 2), -- Hedef fiyat (opsiyonel)
        notify_on_drop BOOLEAN DEFAULT true, -- Fiyat düşünce bildir
        notify_on_increase BOOLEAN DEFAULT false, -- Fiyat artınca bildir
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW(),
        UNIQUE(user_id, campaign_id)
      );
    `);

    // Indexes
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_user_price_tracking_user_id 
      ON user_price_tracking(user_id);
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_user_price_tracking_campaign_id 
      ON user_price_tracking(campaign_id);
    `);

    // Updated_at trigger
    await client.query(`
      CREATE OR REPLACE FUNCTION update_user_price_tracking_updated_at()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = NOW();
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
    `);

    await client.query(`
      DROP TRIGGER IF EXISTS trigger_update_user_price_tracking_updated_at ON user_price_tracking;
      CREATE TRIGGER trigger_update_user_price_tracking_updated_at
      BEFORE UPDATE ON user_price_tracking
      FOR EACH ROW
      EXECUTE FUNCTION update_user_price_tracking_updated_at();
    `);

    // Comment
    await client.query(`
      COMMENT ON COLUMN campaigns.current_price IS 
      'Kampanyanın güncel fiyatı';
    `);

    await client.query(`
      COMMENT ON COLUMN campaigns.original_price IS 
      'Kampanyanın orijinal fiyatı (indirim öncesi)';
    `);

    await client.query(`
      COMMENT ON COLUMN campaigns.discount_percentage IS 
      'İndirim yüzdesi';
    `);

    await client.query(`
      COMMENT ON TABLE campaign_price_history IS 
      'Kampanya fiyat geçmişi. Fiyat değişikliklerini kaydeder.';
    `);

    await client.query(`
      COMMENT ON TABLE user_price_tracking IS 
      'Kullanıcıların takip ettiği kampanyalar ve fiyat bildirim tercihleri.';
    `);

    await client.query('COMMIT');
    console.log('✅ Campaigns tablosuna fiyat alanları ve fiyat takibi tabloları eklendi');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Migration hatası:', error);
    throw error;
  } finally {
    client.release();
  }
}

// Run migration
if (require.main === module) {
  addCampaignPrice()
    .then(() => {
      console.log('Migration tamamlandı');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Migration başarısız:', error);
      process.exit(1);
    });
}

module.exports = addCampaignPrice;
