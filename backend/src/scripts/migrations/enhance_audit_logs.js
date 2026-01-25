/**
 * FAZ 10: Enhance Admin Audit Logs
 * 
 * Audit log tablosunu immutable ve read-only yap
 * - before_state ve after_state field'ları ekle
 * - Immutable constraints ekle
 * - Read-only protection
 */

const pool = require('../../config/database');

async function enhanceAuditLogs() {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    console.log('🔧 FAZ 10: Audit logs enhancement başlatılıyor...');
    
    // 1. before_state ve after_state kolonları ekle (old_value ve new_value'ya ek olarak)
    await client.query(`
      ALTER TABLE admin_audit_logs 
      ADD COLUMN IF NOT EXISTS before_state JSONB
    `);
    
    await client.query(`
      ALTER TABLE admin_audit_logs 
      ADD COLUMN IF NOT EXISTS after_state JSONB
    `);
    
    console.log('✅ before_state ve after_state kolonları eklendi');
    
    // 2. Mevcut old_value ve new_value'ları before_state ve after_state'ye kopyala
    await client.query(`
      UPDATE admin_audit_logs
      SET before_state = old_value,
          after_state = new_value
      WHERE before_state IS NULL AND old_value IS NOT NULL
    `);
    
    console.log('✅ Mevcut değerler kopyalandı');
    
    // 3. Immutable constraint: created_at değiştirilemez
    // PostgreSQL'de bu trigger ile yapılır
    await client.query(`
      CREATE OR REPLACE FUNCTION prevent_audit_log_update()
      RETURNS TRIGGER AS $$
      BEGIN
        -- UPDATE ve DELETE işlemlerini engelle
        IF TG_OP = 'UPDATE' THEN
          RAISE EXCEPTION 'Audit logs are immutable. Cannot update audit log with id: %', OLD.id;
        END IF;
        IF TG_OP = 'DELETE' THEN
          RAISE EXCEPTION 'Audit logs are immutable. Cannot delete audit log with id: %', OLD.id;
        END IF;
        RETURN NULL;
      END;
      $$ LANGUAGE plpgsql;
    `);
    
    await client.query(`
      DROP TRIGGER IF EXISTS trigger_prevent_audit_log_update ON admin_audit_logs;
      CREATE TRIGGER trigger_prevent_audit_log_update
        BEFORE UPDATE OR DELETE ON admin_audit_logs
        FOR EACH ROW
        EXECUTE FUNCTION prevent_audit_log_update();
    `);
    
    console.log('✅ Immutable constraint eklendi (UPDATE ve DELETE engellendi)');
    
    // 4. Index'ler (zaten varsa hata vermez)
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_audit_logs_before_state ON admin_audit_logs USING GIN (before_state);
      CREATE INDEX IF NOT EXISTS idx_audit_logs_after_state ON admin_audit_logs USING GIN (after_state);
    `);
    
    console.log('✅ before_state ve after_state index\'leri oluşturuldu');
    
    await client.query('COMMIT');
    console.log('✅ FAZ 10: Audit logs enhancement tamamlandı');
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
  enhanceAuditLogs()
    .then(() => {
      console.log('✅ Migration başarılı');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Migration başarısız:', error);
      process.exit(1);
    });
}

module.exports = enhanceAuditLogs;
