const pool = require('../../config/database');

/**
 * Migration: user_fcm_tokens tablosu.
 * REQUIRES: None (standalone table).
 * 
 * Kullanıcıların FCM (Firebase Cloud Messaging) token'larını saklar.
 * Firebase UID kullanarak kullanıcıları tanımlar.
 * Bir kullanıcının birden fazla cihazı olabilir (her cihaz için ayrı token).
 */
async function createUserFcmTokens() {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // user_fcm_tokens tablosu oluştur
    await client.query(`
      CREATE TABLE IF NOT EXISTS user_fcm_tokens (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id VARCHAR(255) NOT NULL,
        fcm_token TEXT NOT NULL,
        device_info JSONB,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW(),
        UNIQUE(user_id, fcm_token)
      );
    `);

    // Indexes
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_user_fcm_tokens_user_id 
      ON user_fcm_tokens(user_id);
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_user_fcm_tokens_fcm_token 
      ON user_fcm_tokens(fcm_token);
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_user_fcm_tokens_updated_at 
      ON user_fcm_tokens(updated_at DESC);
    `);

    // Composite index for user token lookup
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_user_fcm_tokens_user_token 
      ON user_fcm_tokens(user_id, fcm_token);
    `);

    // Updated_at trigger function
    await client.query(`
      CREATE OR REPLACE FUNCTION update_user_fcm_tokens_updated_at()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = NOW();
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
    `);

    // Trigger
    await client.query(`
      DROP TRIGGER IF EXISTS trigger_update_user_fcm_tokens_updated_at ON user_fcm_tokens;
      CREATE TRIGGER trigger_update_user_fcm_tokens_updated_at
        BEFORE UPDATE ON user_fcm_tokens
        FOR EACH ROW
        EXECUTE FUNCTION update_user_fcm_tokens_updated_at();
    `);

    // Comment
    await client.query(`
      COMMENT ON TABLE user_fcm_tokens IS 'Kullanıcı FCM token''ları - Push notification için';
    `);

    await client.query('COMMIT');
    console.log('✅ user_fcm_tokens tablosu oluşturuldu');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ user_fcm_tokens migration hatası:', error);
    throw error;
  } finally {
    client.release();
  }
}

// Eğer doğrudan çalıştırılıyorsa
if (require.main === module) {
  createUserFcmTokens()
    .then(() => {
      console.log('✅ Migration tamamlandı');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Migration başarısız:', error);
      process.exit(1);
    });
}

module.exports = createUserFcmTokens;
