const pool = require('../../config/database');

/**
 * Migration: campaign_ratings tablosu.
 * REQUIRES: campaigns table (run 000_init_core_schema.js first).
 * 
 * Kullanıcıların kampanyalara verdiği puanları saklar (1-5 yıldız).
 * Firebase UID kullanarak kullanıcıları tanımlar.
 * Bir kullanıcı bir kampanyaya sadece bir kez puan verebilir.
 */
async function createCampaignRatings() {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // campaign_ratings tablosu oluştur
    await client.query(`
      CREATE TABLE IF NOT EXISTS campaign_ratings (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
        user_id VARCHAR(255) NOT NULL,
        rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW(),
        UNIQUE(campaign_id, user_id)
      );
    `);

    // Indexes
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_campaign_ratings_campaign_id 
      ON campaign_ratings(campaign_id);
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_campaign_ratings_user_id 
      ON campaign_ratings(user_id);
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_campaign_ratings_rating 
      ON campaign_ratings(rating);
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_campaign_ratings_campaign_user 
      ON campaign_ratings(campaign_id, user_id);
    `);

    // Updated_at trigger function
    await client.query(`
      CREATE OR REPLACE FUNCTION update_campaign_ratings_updated_at()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = NOW();
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
    `);

    // Trigger
    await client.query(`
      DROP TRIGGER IF EXISTS trigger_update_campaign_ratings_updated_at ON campaign_ratings;
      CREATE TRIGGER trigger_update_campaign_ratings_updated_at
        BEFORE UPDATE ON campaign_ratings
        FOR EACH ROW
        EXECUTE FUNCTION update_campaign_ratings_updated_at();
    `);

    // Comment
    await client.query(`
      COMMENT ON TABLE campaign_ratings IS 'Kampanya puanları - Kullanıcıların kampanyalara verdiği 1-5 yıldız puanları';
    `);

    await client.query('COMMIT');
    console.log('✅ campaign_ratings tablosu oluşturuldu');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ campaign_ratings migration hatası:', error);
    throw error;
  } finally {
    client.release();
  }
}

// Eğer doğrudan çalıştırılıyorsa
if (require.main === module) {
  createCampaignRatings()
    .then(() => {
      console.log('✅ Migration tamamlandı');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Migration başarısız:', error);
      process.exit(1);
    });
}

module.exports = createCampaignRatings;
