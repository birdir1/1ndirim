/**
 * Migration: Light Campaign Mode
 * FAZ 7.3: campaign_type ve show_in_light_feed kolonları ekle
 */

const pool = require('../../config/database');

async function addLightCampaignMode() {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // campaign_type ENUM oluştur
    await client.query(`
      DO $$ BEGIN
        CREATE TYPE campaign_type_enum AS ENUM ('main', 'light', 'category');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    // Eğer ENUM zaten varsa, 'low' değerini ekle
    // NOT: ALTER TYPE ... ADD VALUE transaction dışında çalışmalı, bu yüzden ayrı bir blokta
    try {
      await client.query(`ALTER TYPE campaign_type_enum ADD VALUE 'low'`);
    } catch (error) {
      // 'low' değeri zaten varsa veya başka bir hata varsa ignore et
      if (!error.message.includes('already exists')) {
        console.warn('⚠️ campaign_type_enum\'a \'low\' değeri eklenirken uyarı:', error.message);
      }
    }

    // campaign_type kolonu ekle (varsa hata vermez)
    await client.query(`
      ALTER TABLE campaigns
      ADD COLUMN IF NOT EXISTS campaign_type campaign_type_enum DEFAULT 'main';
    `);

    // show_in_light_feed kolonu ekle
    await client.query(`
      ALTER TABLE campaigns
      ADD COLUMN IF NOT EXISTS show_in_light_feed BOOLEAN DEFAULT false;
    `);

    // Index'ler ekle
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_campaigns_campaign_type 
      ON campaigns(campaign_type);
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_campaigns_show_in_light_feed 
      ON campaigns(show_in_light_feed) 
      WHERE show_in_light_feed = true;
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_campaigns_type_and_feed 
      ON campaigns(campaign_type, show_in_light_feed);
    `);

    await client.query('COMMIT');
    console.log('✅ Light Campaign Mode migration başarılı');
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
  addLightCampaignMode()
    .then(() => {
      console.log('Migration tamamlandı');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Migration başarısız:', error);
      process.exit(1);
    });
}

module.exports = addLightCampaignMode;
