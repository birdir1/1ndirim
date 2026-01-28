const pool = require('../../config/database');

/**
 * Migration: user_points tablosu.
 * REQUIRES: campaigns table, user_favorites, campaign_comments, campaign_ratings tables.
 * 
 * Kullanıcı puanlarını saklar. Her aktivite için puan kazanılır.
 */
async function createUserPoints() {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // user_points tablosu oluştur
    await client.query(`
      CREATE TABLE IF NOT EXISTS user_points (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id VARCHAR(255) NOT NULL,
        points INTEGER NOT NULL DEFAULT 0,
        total_points_earned INTEGER NOT NULL DEFAULT 0,
        level INTEGER NOT NULL DEFAULT 1,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW(),
        UNIQUE(user_id)
      );
    `);

    // Indexes
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_user_points_user_id 
      ON user_points(user_id);
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_user_points_points 
      ON user_points(points DESC);
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_user_points_level 
      ON user_points(level DESC);
    `);

    // Updated_at trigger function
    await client.query(`
      CREATE OR REPLACE FUNCTION update_user_points_updated_at()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = NOW();
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
    `);

    // Trigger
    await client.query(`
      DROP TRIGGER IF EXISTS trigger_update_user_points_updated_at ON user_points;
      CREATE TRIGGER trigger_update_user_points_updated_at
      BEFORE UPDATE ON user_points
      FOR EACH ROW
      EXECUTE FUNCTION update_user_points_updated_at();
    `);

    // Point history tablosu (puan geçmişi)
    await client.query(`
      CREATE TABLE IF NOT EXISTS user_point_history (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id VARCHAR(255) NOT NULL,
        points INTEGER NOT NULL,
        activity_type VARCHAR(50) NOT NULL, -- 'favorite', 'comment', 'rating', 'daily_login', etc.
        activity_id UUID, -- İlgili aktivitenin ID'si (favori_id, comment_id, rating_id, etc.)
        description TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_user_point_history_user_id 
      ON user_point_history(user_id);
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_user_point_history_created_at 
      ON user_point_history(created_at DESC);
    `);

    // Comment
    await client.query(`
      COMMENT ON TABLE user_points IS 
      'Kullanıcı puanları ve seviyeleri. Firebase UID ile kullanıcıları tanımlar.';
    `);

    await client.query(`
      COMMENT ON TABLE user_point_history IS 
      'Kullanıcı puan geçmişi. Her puan kazanma işlemini kaydeder.';
    `);

    await client.query('COMMIT');
    console.log('✅ user_points ve user_point_history tabloları oluşturuldu');
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
  createUserPoints()
    .then(() => {
      console.log('Migration tamamlandı');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Migration başarısız:', error);
      process.exit(1);
    });
}

module.exports = createUserPoints;
