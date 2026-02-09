/**
 * Bu script yanlışlıkla "operator" olarak işaretlenmiş kaynakları "bank" tipine çevirir
 * ve ana operatörlerin tipini operator olarak sabitler.
 *
 * Çalıştırma:
 *   node src/scripts/fix_operator_sources.js
 */

const pool = require('../config/database');

const WRONG_OPERATORS = [
  'Papara',
  'Paycell',
  'Tosla',
  'BKM Express',
];

const MAIN_OPERATORS = [
  'Turkcell',
  'Vodafone',
  'Türk Telekom',
  'BİMcell',
  'PTTcell',
];

async function run() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Yanlış operatörleri bank yap
    await client.query(
      `UPDATE sources
       SET type = 'bank', updated_at = NOW()
       WHERE LOWER(name) = ANY($1)`,
      [WRONG_OPERATORS.map((n) => n.toLowerCase())],
    );

    // Ana operatörleri operator olarak sabitle
    await client.query(
      `UPDATE sources
       SET type = 'operator', updated_at = NOW()
       WHERE LOWER(name) = ANY($1)`,
      [MAIN_OPERATORS.map((n) => n.toLowerCase())],
    );

    await client.query('COMMIT');
    console.log('✅ Operator tip düzeltme tamamlandı');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ Düzeltme hatası:', err);
  } finally {
    client.release();
    await pool.end();
  }
}

run();
