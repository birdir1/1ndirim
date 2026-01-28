const pool = require('../../config/database');

/**
 * Migration: Referans sistemi tabloları.
 * Kullanıcılar arkadaşlarını davet edip ödül kazanabilir.
 */
async function createReferralSystem() {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Referans kodları tablosu
    await client.query(`
      CREATE TABLE IF NOT EXISTS user_referral_codes (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id VARCHAR(255) NOT NULL UNIQUE,
        referral_code VARCHAR(20) NOT NULL UNIQUE,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);

    // Referans kayıtları tablosu
    await client.query(`
      CREATE TABLE IF NOT EXISTS referral_records (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        referrer_user_id VARCHAR(255) NOT NULL,
        referred_user_id VARCHAR(255) NOT NULL UNIQUE,
        referral_code VARCHAR(20) NOT NULL,
        status VARCHAR(20) DEFAULT 'pending',
        reward_points INTEGER DEFAULT 0,
        reward_claimed BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW(),
        CONSTRAINT fk_referrer FOREIGN KEY (referrer_user_id) REFERENCES users(firebase_uid) ON DELETE CASCADE,
        CONSTRAINT fk_referred FOREIGN KEY (referred_user_id) REFERENCES users(firebase_uid) ON DELETE CASCADE
      );
    `);

    // Referans ödül tanımları tablosu
    await client.query(`
      CREATE TABLE IF NOT EXISTS referral_rewards (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        reward_type VARCHAR(50) NOT NULL,
        reward_value INTEGER NOT NULL,
        description TEXT,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);

    // Indexes
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_user_referral_codes_user_id 
      ON user_referral_codes(user_id);
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_user_referral_codes_code 
      ON user_referral_codes(referral_code);
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_referral_records_referrer 
      ON referral_records(referrer_user_id);
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_referral_records_referred 
      ON referral_records(referred_user_id);
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_referral_records_code 
      ON referral_records(referral_code);
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_referral_records_status 
      ON referral_records(status);
    `);

    // Updated_at triggers
    await client.query(`
      CREATE OR REPLACE FUNCTION update_referral_updated_at()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = NOW();
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
    `);

    await client.query(`
      DROP TRIGGER IF EXISTS trigger_update_user_referral_codes_updated_at ON user_referral_codes;
      CREATE TRIGGER trigger_update_user_referral_codes_updated_at
      BEFORE UPDATE ON user_referral_codes
      FOR EACH ROW
      EXECUTE FUNCTION update_referral_updated_at();
    `);

    await client.query(`
      DROP TRIGGER IF EXISTS trigger_update_referral_records_updated_at ON referral_records;
      CREATE TRIGGER trigger_update_referral_records_updated_at
      BEFORE UPDATE ON referral_records
      FOR EACH ROW
      EXECUTE FUNCTION update_referral_updated_at();
    `);

    // Varsayılan referans ödülleri
    await client.query(`
      INSERT INTO referral_rewards (reward_type, reward_value, description, is_active)
      VALUES 
        ('points', 50, 'Davet eden kullanıcıya 50 puan', true),
        ('points', 25, 'Davet edilen kullanıcıya 25 puan', true)
      ON CONFLICT DO NOTHING;
    `);

    // Mevcut kullanıcılar için referans kodu oluştur (opsiyonel)
    // Bu migration çalıştırıldığında mevcut kullanıcılar için otomatik kod oluşturulmaz
    // Kodlar ilk erişimde oluşturulacak

    // Comment
    await client.query(`
      COMMENT ON TABLE user_referral_codes IS 
      'Kullanıcıların benzersiz referans kodları';
    `);

    await client.query(`
      COMMENT ON TABLE referral_records IS 
      'Referans kayıtları ve ödül durumları';
    `);

    await client.query(`
      COMMENT ON TABLE referral_rewards IS 
      'Referans ödül tanımları';
    `);

    await client.query('COMMIT');
    console.log('✅ Referans sistemi tabloları oluşturuldu');
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
  createReferralSystem()
    .then(() => {
      console.log('Migration tamamlandı');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Migration başarısız:', error);
      process.exit(1);
    });
}

module.exports = createReferralSystem;
