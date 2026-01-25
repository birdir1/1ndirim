/**
 * FAZ 10: Source Status Migration
 * 
 * Hard backlog metadata for sources
 * - source_status enum: active, backlog, hard_backlog
 * - reason field for explaining why blocked
 * - Admin-only edit
 */

const pool = require('../../config/database');

async function addSourceStatus() {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    console.log('🔧 FAZ 10: Source Status migration başlatılıyor...');
    
    // 1. Source status ENUM oluştur
    await client.query(`
      DO $$ BEGIN
        CREATE TYPE source_status_enum AS ENUM ('active', 'backlog', 'hard_backlog');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);
    
    console.log('✅ Source status ENUM oluşturuldu');
    
    // 2. Source status kolonu ekle
    await client.query(`
      ALTER TABLE sources 
      ADD COLUMN IF NOT EXISTS source_status source_status_enum DEFAULT 'active'
    `);
    
    console.log('✅ Source status kolonu eklendi');
    
    // 3. Reason kolonu ekle
    await client.query(`
      ALTER TABLE sources 
      ADD COLUMN IF NOT EXISTS status_reason TEXT
    `);
    
    console.log('✅ Status reason kolonu eklendi');
    
    // 4. Index'ler
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_sources_status ON sources(source_status);
      CREATE INDEX IF NOT EXISTS idx_sources_status_active ON sources(source_status) WHERE source_status = 'active';
      CREATE INDEX IF NOT EXISTS idx_sources_status_hard_backlog ON sources(source_status) WHERE source_status = 'hard_backlog';
    `);
    
    console.log('✅ Source status index\'leri oluşturuldu');
    
    // 5. Mevcut kaynakları 'active' olarak işaretle (eğer NULL ise)
    await client.query(`
      UPDATE sources 
      SET source_status = 'active' 
      WHERE source_status IS NULL
    `);
    
    console.log('✅ Mevcut kaynaklar active olarak işaretlendi');
    
    await client.query('COMMIT');
    console.log('✅ FAZ 10: Source Status migration tamamlandı');
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
  addSourceStatus()
    .then(() => {
      console.log('✅ Migration başarılı');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Migration başarısız:', error);
      process.exit(1);
    });
}

module.exports = addSourceStatus;
