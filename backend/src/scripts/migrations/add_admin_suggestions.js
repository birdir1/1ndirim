/**
 * FAZ 18.4: Admin Suggestions Table (passive storage).
 *
 * REQUIRES: core schema (run 000_init_core_schema.js first).
 *
 * - admin_suggestions tablosu
 * - NO triggers, NO automation
 * - Apply/reject sadece timestamp günceller; gerçek etkiler mevcut admin endpoint'leriyle
 */

const pool = require('../../config/database');

async function addAdminSuggestions() {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    console.log('🔧 FAZ 18.4: Admin suggestions migration başlatılıyor...');

    await client.query(`
      CREATE TABLE IF NOT EXISTS admin_suggestions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        scope VARCHAR(50) NOT NULL,
        target_id VARCHAR(255) NOT NULL,
        suggestion_type VARCHAR(100) NOT NULL,
        suggested_action VARCHAR(100) NOT NULL,
        confidence INTEGER NOT NULL,
        reason TEXT NOT NULL,
        signals JSONB DEFAULT '{}',
        run_id VARCHAR(255),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
        applied_at TIMESTAMP WITH TIME ZONE,
        applied_by VARCHAR(255),
        rejected_at TIMESTAMP WITH TIME ZONE
      )
    `);

    console.log('✅ admin_suggestions tablosu oluşturuldu');

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_admin_suggestions_scope ON admin_suggestions(scope);
      CREATE INDEX IF NOT EXISTS idx_admin_suggestions_target_id ON admin_suggestions(target_id);
      CREATE INDEX IF NOT EXISTS idx_admin_suggestions_expires_at ON admin_suggestions(expires_at);
      CREATE INDEX IF NOT EXISTS idx_admin_suggestions_created_at ON admin_suggestions(created_at);
    `);

    console.log('✅ admin_suggestions index\'leri oluşturuldu');

    await client.query('COMMIT');
    console.log('✅ FAZ 18.4: Admin suggestions migration tamamlandı');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Migration hatası:', error);
    throw error;
  } finally {
    client.release();
  }
}

if (require.main === module) {
  addAdminSuggestions()
    .then(() => {
      console.log('✅ Migration başarılı');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Migration başarısız', error);
      process.exit(1);
    });
}

module.exports = addAdminSuggestions;
