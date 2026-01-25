/**
 * FAZ 10: Admin Overrides Migration
 * 
 * Admin override işlemleri için database schema'ları
 * - Campaign is_hidden kolonu
 * - Campaign pinned_at kolonu
 * - Index'ler
 */

const pool = require('../../config/database');

async function addAdminOverrides() {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    console.log('🔧 FAZ 10: Admin Overrides migration başlatılıyor...');
    
    // 1. Campaign is_hidden kolonu
    await client.query(`
      ALTER TABLE campaigns 
      ADD COLUMN IF NOT EXISTS is_hidden BOOLEAN DEFAULT false
    `);
    
    console.log('✅ Campaign is_hidden kolonu eklendi');
    
    // 2. Campaign pinned_at kolonu
    await client.query(`
      ALTER TABLE campaigns 
      ADD COLUMN IF NOT EXISTS pinned_at TIMESTAMP
    `);
    
    console.log('✅ Campaign pinned_at kolonu eklendi');
    
    // 3. Index'ler
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_campaigns_is_hidden ON campaigns(is_hidden) WHERE is_hidden = true
    `);
    
    console.log('✅ is_hidden index oluşturuldu');
    
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_campaigns_pinned_at ON campaigns(pinned_at) WHERE pinned_at IS NOT NULL
    `);
    
    console.log('✅ pinned_at index oluşturuldu');
    
    await client.query('COMMIT');
    console.log('✅ FAZ 10: Admin Overrides migration tamamlandı');
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
  addAdminOverrides()
    .then(() => {
      console.log('✅ Migration başarılı');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Migration başarısız:', error);
      process.exit(1);
    });
}

module.exports = addAdminOverrides;
