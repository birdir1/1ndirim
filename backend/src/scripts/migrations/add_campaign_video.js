const pool = require('../../config/database');

/**
 * Migration: campaigns tablosuna video URL alanı ekler.
 * Kampanyalar için video desteği sağlar.
 */
async function addCampaignVideo() {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Campaigns tablosuna video URL kolonları ekle
    await client.query(`
      ALTER TABLE campaigns
      ADD COLUMN IF NOT EXISTS video_url TEXT,
      ADD COLUMN IF NOT EXISTS video_thumbnail_url TEXT,
      ADD COLUMN IF NOT EXISTS video_duration INTEGER -- Saniye cinsinden
    `);

    // Index ekle (video URL'si olan kampanyalar için)
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_campaigns_video_url 
      ON campaigns(video_url) 
      WHERE video_url IS NOT NULL
    `);

    // Comment
    await client.query(`
      COMMENT ON COLUMN campaigns.video_url IS 
      'Kampanya video URL''si (YouTube, Vimeo, veya direkt video linki)';
    `);

    await client.query(`
      COMMENT ON COLUMN campaigns.video_thumbnail_url IS 
      'Video thumbnail URL''si (opsiyonel)';
    `);

    await client.query(`
      COMMENT ON COLUMN campaigns.video_duration IS 
      'Video süresi (saniye cinsinden)';
    `);

    await client.query('COMMIT');
    console.log('✅ Campaigns tablosuna video alanları eklendi');
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
  addCampaignVideo()
    .then(() => {
      console.log('Migration tamamlandı');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Migration başarısız:', error);
      process.exit(1);
    });
}

module.exports = addCampaignVideo;
