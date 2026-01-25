/**
 * Migration: Category Campaign Mode
 * FAZ 7.2: show_in_category_feed kolonu ekle
 */

const pool = require('../../config/database');

async function addCategoryCampaignMode() {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // show_in_category_feed kolonu ekle
    await client.query(`
      ALTER TABLE campaigns
      ADD COLUMN IF NOT EXISTS show_in_category_feed BOOLEAN DEFAULT false;
    `);

    // Index'ler ekle
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_campaigns_show_in_category_feed 
      ON campaigns(show_in_category_feed) 
      WHERE show_in_category_feed = true;
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_campaigns_type_category 
      ON campaigns(campaign_type, show_in_category_feed) 
      WHERE campaign_type = 'category';
    `);

    await client.query('COMMIT');
    console.log('✅ Category Campaign Mode migration başarılı');
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
  addCategoryCampaignMode()
    .then(() => {
      console.log('Migration tamamlandı');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Migration başarısız:', error);
      process.exit(1);
    });
}

module.exports = addCategoryCampaignMode;
