const pool = require('../../config/database');

/**
 * Migration: sources tablosuna konum bilgisi ekler.
 * Kaynakların (bankalar, operatörler) genel konumlarını saklar.
 */
async function addSourceLocation() {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Sources tablosuna konum kolonları ekle
    await client.query(`
      ALTER TABLE sources
      ADD COLUMN IF NOT EXISTS latitude DECIMAL(10, 8),
      ADD COLUMN IF NOT EXISTS longitude DECIMAL(11, 8),
      ADD COLUMN IF NOT EXISTS address TEXT,
      ADD COLUMN IF NOT EXISTS city VARCHAR(100),
      ADD COLUMN IF NOT EXISTS country VARCHAR(100) DEFAULT 'Turkey'
    `);

    // Index ekle (konum bazlı sorgular için)
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_sources_location 
      ON sources(latitude, longitude) 
      WHERE latitude IS NOT NULL AND longitude IS NOT NULL
    `);

    // Türkiye'deki bazı büyük şehirlerin koordinatları (varsayılan konumlar)
    // Bu değerler admin panelden güncellenebilir
    const defaultLocations = {
      'Akbank': { lat: 41.0082, lng: 28.9784, city: 'Istanbul' },
      'Yapı Kredi': { lat: 41.0082, lng: 28.9784, city: 'Istanbul' },
      'Garanti BBVA': { lat: 41.0082, lng: 28.9784, city: 'Istanbul' },
      'İş Bankası': { lat: 41.0082, lng: 28.9784, city: 'Istanbul' },
      'Turkcell': { lat: 41.0082, lng: 28.9784, city: 'Istanbul' },
      'Vodafone': { lat: 41.0082, lng: 28.9784, city: 'Istanbul' },
      'Türk Telekom': { lat: 39.9334, lng: 32.8597, city: 'Ankara' },
    };

    // Varsayılan konumları güncelle (sadece NULL olanlar için)
    for (const [sourceName, location] of Object.entries(defaultLocations)) {
      await client.query(`
        UPDATE sources
        SET latitude = $1, longitude = $2, city = $3
        WHERE LOWER(TRIM(name)) = LOWER($4)
          AND (latitude IS NULL OR longitude IS NULL)
      `, [location.lat, location.lng, location.city, sourceName]);
    }

    // Comment
    await client.query(`
      COMMENT ON COLUMN sources.latitude IS 
      'Kaynağın genel konumu - enlem (latitude)';
    `);

    await client.query(`
      COMMENT ON COLUMN sources.longitude IS 
      'Kaynağın genel konumu - boylam (longitude)';
    `);

    await client.query('COMMIT');
    console.log('✅ Sources tablosuna konum bilgisi eklendi');
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
  addSourceLocation()
    .then(() => {
      console.log('Migration tamamlandı');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Migration başarısız:', error);
      process.exit(1);
    });
}

module.exports = addSourceLocation;
