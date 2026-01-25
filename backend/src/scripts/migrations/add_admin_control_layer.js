/**
 * FAZ 10: Admin & Control Layer Migration
 *
 * REQUIRES: campaigns table (run 000_init_core_schema.js first).
 *
 * - Admin audit logs tablosu
 * - Campaign is_pinned kolonu
 */

const pool = require('../../config/database');

async function addAdminControlLayer() {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    console.log('🔧 FAZ 10: Admin & Control Layer migration başlatılıyor...');
    
    // 1. Admin audit logs tablosu
    await client.query(`
      CREATE TABLE IF NOT EXISTS admin_audit_logs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        admin_id VARCHAR(255) NOT NULL,
        action VARCHAR(100) NOT NULL,
        entity_type VARCHAR(50) NOT NULL,
        entity_id UUID NOT NULL,
        old_value JSONB,
        new_value JSONB,
        reason TEXT,
        metadata JSONB,
        created_at TIMESTAMP DEFAULT NOW(),
        ip_address VARCHAR(45),
        user_agent TEXT
      )
    `);
    
    console.log('✅ Admin audit logs tablosu oluşturuldu');
    
    // 2. Audit logs index'leri
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_audit_logs_admin_id ON admin_audit_logs(admin_id);
      CREATE INDEX IF NOT EXISTS idx_audit_logs_entity ON admin_audit_logs(entity_type, entity_id);
      CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON admin_audit_logs(action);
      CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON admin_audit_logs(created_at);
    `);
    
    console.log('✅ Audit logs index\'leri oluşturuldu');
    
    // 3. Campaign is_pinned kolonu
    await client.query(`
      ALTER TABLE campaigns 
      ADD COLUMN IF NOT EXISTS is_pinned BOOLEAN DEFAULT false
    `);
    
    console.log('✅ Campaign is_pinned kolonu eklendi');
    
    // 4. is_pinned index
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_campaigns_is_pinned ON campaigns(is_pinned) WHERE is_pinned = true
    `);
    
    console.log('✅ is_pinned index oluşturuldu');
    
    await client.query('COMMIT');
    console.log('✅ FAZ 10: Admin & Control Layer migration tamamlandı');
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
  addAdminControlLayer()
    .then(() => {
      console.log('✅ Migration başarılı');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Migration başarısız:', error);
      process.exit(1);
    });
}

module.exports = addAdminControlLayer;
