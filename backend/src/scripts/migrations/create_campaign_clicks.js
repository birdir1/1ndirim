const pool = require('../../config/database');

/**
 * Migration: campaign_clicks tablosu oluştur (sadeleştirilmiş)
 */
async function createCampaignClicks() {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // campaign_clicks tablosu oluştur (sadeleştirilmiş)
    await client.query(`
      CREATE TABLE IF NOT EXISTS campaign_clicks (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
        user_id VARCHAR(255),
        clicked_at TIMESTAMP DEFAULT NOW(),
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);

    // Indexes (sadece gerekli olanlar)
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_campaign_clicks_campaign_id 
      ON campaign_clicks(campaign_id);
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_campaign_clicks_clicked_at 
      ON campaign_clicks(clicked_at);
    `);

    // Comment
    await client.query(`
      COMMENT ON TABLE campaign_clicks IS 
      'Kampanya tıklama logları. Affiliate tracking için kullanılır.';
    `);

    await client.query('COMMIT');
    console.log('✅ campaign_clicks tablosu oluşturuldu');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Migration hatası:', error);
    throw error;
  } finally {
    client.release();
  }
}

// Run migration
createCampaignClicks()
  .then(() => {
    console.log('Migration tamamlandı');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Migration başarısız:', error);
    process.exit(1);
  });
