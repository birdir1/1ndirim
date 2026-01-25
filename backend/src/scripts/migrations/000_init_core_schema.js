/**
 * Core Schema Migration
 * Initial database schema: sources, campaigns, source_segments
 * 
 * This migration must run FIRST before any other migrations
 */

const pool = require('../../config/database');

async function initCoreSchema() {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    console.log('🔧 Core Schema migration başlatılıyor...');
    
    // 1. Sources table
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
    
    console.log('✅ Sources tablosu oluşturuldu');
    
    // 2. Source Segments table
    await client.query(`
      CREATE TABLE IF NOT EXISTS source_segments (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        source_id UUID NOT NULL REFERENCES sources(id) ON DELETE CASCADE,
        name VARCHAR(100) NOT NULL,
        created_at TIMESTAMP DEFAULT NOW(),
        UNIQUE(source_id, name)
      )
    `);
    
    console.log('✅ Source segments tablosu oluşturuldu');
    
    // 3. Campaigns table (core columns only)
    await client.query(`
      CREATE TABLE IF NOT EXISTS campaigns (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        source_id UUID NOT NULL REFERENCES sources(id) ON DELETE CASCADE,
        title VARCHAR(200) NOT NULL,
        description TEXT,
        detail_text TEXT,
        icon_name VARCHAR(50),
        icon_color VARCHAR(7),
        icon_bg_color VARCHAR(7),
        tags JSONB DEFAULT '[]'::jsonb,
        original_url TEXT NOT NULL,
        affiliate_url TEXT,
        starts_at TIMESTAMP,
        expires_at TIMESTAMP NOT NULL,
        how_to_use JSONB DEFAULT '[]'::jsonb,
        validity_channels JSONB DEFAULT '[]'::jsonb,
        status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'expired', 'cancelled')),
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);
    
    console.log('✅ Campaigns tablosu oluşturuldu');
    
    // 4. Core indexes
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_campaigns_source_id ON campaigns(source_id);
      CREATE INDEX IF NOT EXISTS idx_campaigns_is_active ON campaigns(is_active);
      CREATE INDEX IF NOT EXISTS idx_campaigns_expires_at ON campaigns(expires_at);
      CREATE INDEX IF NOT EXISTS idx_campaigns_starts_at ON campaigns(starts_at);
      CREATE INDEX IF NOT EXISTS idx_campaigns_created_at ON campaigns(created_at);
      CREATE INDEX IF NOT EXISTS idx_campaigns_title_lower ON campaigns(LOWER(TRIM(title)));
      CREATE INDEX IF NOT EXISTS idx_sources_type ON sources(type);
      CREATE INDEX IF NOT EXISTS idx_sources_name_lower ON sources(LOWER(TRIM(name)));
      CREATE INDEX IF NOT EXISTS idx_sources_is_active ON sources(is_active);
      CREATE INDEX IF NOT EXISTS idx_source_segments_source_id ON source_segments(source_id);
    `);
    
    console.log('✅ Core index\'ler oluşturuldu');
    
    await client.query('COMMIT');
    console.log('✅ Core Schema migration tamamlandı');
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
  initCoreSchema()
    .then(() => {
      console.log('✅ Migration başarılı');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Migration başarısız:', error);
      process.exit(1);
    });
}

module.exports = initCoreSchema;
