/**
 * Migration: Low Value Campaign Mode
 * FAZ 7.5: value_level kolonu ekle
 */

const pool = require('../../config/database');

async function addLowValueCampaignMode() {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // value_level ENUM oluştur
    await client.query(`
      DO $$ BEGIN
        CREATE TYPE value_level_enum AS ENUM ('high', 'low');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    // value_level kolonu ekle
    await client.query(`
      ALTER TABLE campaigns
      ADD COLUMN IF NOT EXISTS value_level value_level_enum DEFAULT 'high';
    `);

    // Index ekle
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_campaigns_value_level 
      ON campaigns(value_level) 
      WHERE value_level = 'low';
    `);

    await client.query('COMMIT');
    console.log('✅ Low Value Campaign Mode migration başarılı');
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
  addLowValueCampaignMode()
    .then(() => {
      console.log('Migration tamamlandı');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Migration başarısız:', error);
      process.exit(1);
    });
}

module.exports = addLowValueCampaignMode;
