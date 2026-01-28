const pool = require('../../config/database');

/**
 * Migration: user_favorites tablosu.
 * REQUIRES: campaigns table (run 000_init_core_schema.js first).
 * 
 * Kullanıcı favori kampanyalarını saklar.
 * Firebase UID kullanarak kullanıcıları tanımlar.
 */
async function createUserFavorites() {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // user_favorites tablosu oluştur
    await client.query(`
      CREATE TABLE IF NOT EXISTS user_favorites (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id VARCHAR(255) NOT NULL,
        campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
        created_at TIMESTAMP DEFAULT NOW(),
        UNIQUE(user_id, campaign_id)
      );
    `);

    // Indexes
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_user_favorites_user_id 
      ON user_favorites(user_id);
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_user_favorites_campaign_id 
      ON user_favorites(campaign_id);
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_user_favorites_created_at 
      ON user_favorites(created_at DESC);
    `);

    // Composite index for user favorites lookup
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_user_favorites_user_campaign 
      ON user_favorites(user_id, campaign_id);
    `);

    // Comment
    await client.query(`
      COMMENT ON TABLE user_favorites IS 
      'Kullanıcı favori kampanyaları. Firebase UID ile kullanıcıları tanımlar.';
    `);

    await client.query('COMMIT');
    console.log('✅ user_favorites tablosu oluşturuldu');
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
  createUserFavorites()
    .then(() => {
      console.log('Migration tamamlandı');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Migration başarısız:', error);
      process.exit(1);
    });
}

module.exports = createUserFavorites;
