const pool = require('../../config/database');

/**
 * Migration: campaigns tablosuna affiliate_url kolonu ekle
 */
async function addAffiliateUrl() {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // campaigns tablosuna affiliate_url kolonu ekle
    await client.query(`
      ALTER TABLE campaigns 
      ADD COLUMN IF NOT EXISTS affiliate_url TEXT;
    `);

    // Comment ekle
    await client.query(`
      COMMENT ON COLUMN campaigns.affiliate_url IS 
      'Affiliate/partner URL. Eğer varsa, kullanıcı bu URL''ye yönlendirilir. Yoksa original_url kullanılır.';
    `);

    await client.query('COMMIT');
    console.log('✅ affiliate_url kolonu eklendi');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Migration hatası:', error);
    throw error;
  } finally {
    client.release();
  }
}

// Run migration
addAffiliateUrl()
  .then(() => {
    console.log('Migration tamamlandı');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Migration başarısız:', error);
    process.exit(1);
  });
