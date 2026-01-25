/**
 * FAZ 20.4–20.5: Admin suggestion execution tracking.
 *
 * REQUIRES: admin_suggestions table (add_admin_suggestions.js).
 *
 * - executed_at, executed_by on admin_suggestions
 * - EXECUTED state = executed_at IS NOT NULL
 */

const pool = require('../../config/database');

async function addAdminSuggestionsExecution() {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    console.log('🔧 FAZ 20: Admin suggestions execution columns...');

    await client.query(`
      ALTER TABLE admin_suggestions
        ADD COLUMN IF NOT EXISTS executed_at TIMESTAMP WITH TIME ZONE,
        ADD COLUMN IF NOT EXISTS executed_by VARCHAR(255)
    `);

    console.log('✅ executed_at, executed_by eklendi');

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_admin_suggestions_executed_at
        ON admin_suggestions(executed_at) WHERE executed_at IS NOT NULL
    `);

    console.log('✅ execution index oluşturuldu');

    await client.query('COMMIT');
    console.log('✅ FAZ 20: Admin suggestions execution migration tamamlandı');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Migration hatası:', error);
    throw error;
  } finally {
    client.release();
  }
}

if (require.main === module) {
  addAdminSuggestionsExecution()
    .then(() => {
      console.log('✅ Migration başarılı');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Migration başarısız', error);
      process.exit(1);
    });
}

module.exports = addAdminSuggestionsExecution;
