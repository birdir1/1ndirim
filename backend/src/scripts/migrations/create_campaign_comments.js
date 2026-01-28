const pool = require('../../config/database');

/**
 * Migration: campaign_comments tablosu.
 * REQUIRES: campaigns table (run 000_init_core_schema.js first).
 * 
 * Kullanıcıların kampanyalara yaptığı yorumları saklar.
 * Firebase UID kullanarak kullanıcıları tanımlar.
 */
async function createCampaignComments() {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // campaign_comments tablosu oluştur
    await client.query(`
      CREATE TABLE IF NOT EXISTS campaign_comments (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
        user_id VARCHAR(255) NOT NULL,
        comment_text TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW(),
        is_edited BOOLEAN DEFAULT false,
        is_deleted BOOLEAN DEFAULT false
      );
    `);

    // Indexes
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_campaign_comments_campaign_id 
      ON campaign_comments(campaign_id);
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_campaign_comments_user_id 
      ON campaign_comments(user_id);
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_campaign_comments_created_at 
      ON campaign_comments(created_at DESC);
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_campaign_comments_campaign_active 
      ON campaign_comments(campaign_id, is_deleted) 
      WHERE is_deleted = false;
    `);

    // Updated_at trigger function
    await client.query(`
      CREATE OR REPLACE FUNCTION update_campaign_comments_updated_at()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = NOW();
        NEW.is_edited = true;
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
    `);

    // Trigger
    await client.query(`
      DROP TRIGGER IF EXISTS trigger_update_campaign_comments_updated_at ON campaign_comments;
      CREATE TRIGGER trigger_update_campaign_comments_updated_at
        BEFORE UPDATE ON campaign_comments
        FOR EACH ROW
        EXECUTE FUNCTION update_campaign_comments_updated_at();
    `);

    // Comment
    await client.query(`
      COMMENT ON TABLE campaign_comments IS 'Kampanya yorumları - Kullanıcıların kampanyalara yaptığı yorumlar';
    `);

    await client.query('COMMIT');
    console.log('✅ campaign_comments tablosu oluşturuldu');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ campaign_comments migration hatası:', error);
    throw error;
  } finally {
    client.release();
  }
}

// Eğer doğrudan çalıştırılıyorsa
if (require.main === module) {
  createCampaignComments()
    .then(() => {
      console.log('✅ Migration tamamlandı');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Migration başarısız:', error);
      process.exit(1);
    });
}

module.exports = createCampaignComments;
