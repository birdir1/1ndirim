const pool = require('../config/database');

/**
 * Database migration script
 * PostgreSQL tablolarını oluşturur
 */
async function migrate() {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Sources table
    await client.query(`
      CREATE TABLE IF NOT EXISTS sources (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(100) NOT NULL UNIQUE,
        type VARCHAR(20) NOT NULL CHECK (type IN ('bank', 'operator')),
        logo_url TEXT,
        website_url TEXT,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // Source Segments table (banka kartları, operatör hatları vb.)
    await client.query(`
      CREATE TABLE IF NOT EXISTS source_segments (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        source_id UUID NOT NULL REFERENCES sources(id) ON DELETE CASCADE,
        name VARCHAR(100) NOT NULL,
        created_at TIMESTAMP DEFAULT NOW(),
        UNIQUE(source_id, name)
      )
    `);

    // Campaigns table
    await client.query(`
      CREATE TABLE IF NOT EXISTS campaigns (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        source_id UUID NOT NULL REFERENCES sources(id) ON DELETE CASCADE,
        title VARCHAR(200) NOT NULL,
        description TEXT,
        detail_text TEXT,
        icon_name VARCHAR(50),
        icon_color VARCHAR(7), -- Hex color
        icon_bg_color VARCHAR(7), -- Hex color
        tags JSONB DEFAULT '[]'::jsonb,
        original_url TEXT NOT NULL,
        starts_at TIMESTAMP, -- Başlangıç tarihi (opsiyonel, duplicate kontrolü için)
        expires_at TIMESTAMP NOT NULL,
        how_to_use JSONB DEFAULT '[]'::jsonb, -- Array of step objects
        validity_channels JSONB DEFAULT '[]'::jsonb, -- Array of channel strings
        status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'expired', 'cancelled')),
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // Indexes
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_campaigns_source_id ON campaigns(source_id);
      CREATE INDEX IF NOT EXISTS idx_campaigns_is_active ON campaigns(is_active);
      CREATE INDEX IF NOT EXISTS idx_campaigns_expires_at ON campaigns(expires_at);
      CREATE INDEX IF NOT EXISTS idx_campaigns_starts_at ON campaigns(starts_at);
      CREATE INDEX IF NOT EXISTS idx_campaigns_created_at ON campaigns(created_at);
      CREATE INDEX IF NOT EXISTS idx_campaigns_title_lower ON campaigns(LOWER(TRIM(title)));
      CREATE INDEX IF NOT EXISTS idx_sources_type ON sources(type);
      CREATE INDEX IF NOT EXISTS idx_sources_name_lower ON sources(LOWER(TRIM(name)));
      CREATE INDEX IF NOT EXISTS idx_source_segments_source_id ON source_segments(source_id);
    `);

    await client.query('COMMIT');
    console.log('✅ Database migration başarılı');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Migration hatası:', error);
    throw error;
  } finally {
    client.release();
  }
}

// Run migration
migrate()
  .then(() => {
    console.log('Migration tamamlandı');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Migration başarısız:', error);
    process.exit(1);
  });
