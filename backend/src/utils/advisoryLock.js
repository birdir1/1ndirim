/**
 * Advisory Lock Utility
 * PostgreSQL advisory lock kullanarak tek instance garantisi
 * Cron job'ların aynı anda birden fazla instance'da çalışmasını önler
 */

const pool = require('../config/database');

/**
 * Advisory lock alır
 * @param {number} lockId - Lock ID (her job için unique)
 * @returns {Promise<boolean>} - true = lock alındı, false = alınamadı
 */
async function acquireLock(lockId) {
  try {
    const result = await pool.query('SELECT pg_try_advisory_lock($1)', [lockId]);
    return result.rows[0].pg_try_advisory_lock;
  } catch (error) {
    console.error('Advisory lock hatası:', error);
    return false;
  }
}

/**
 * Advisory lock'u serbest bırakır
 * @param {number} lockId - Lock ID
 */
async function releaseLock(lockId) {
  try {
    await pool.query('SELECT pg_advisory_unlock($1)', [lockId]);
  } catch (error) {
    console.error('Advisory lock release hatası:', error);
  }
}

/**
 * Lock ID'ler (her job için unique)
 */
const LOCK_IDS = {
  DEACTIVATE_EXPIRED_CAMPAIGNS: 1001,
  BACKUP_DATABASE: 1002,
};

module.exports = {
  acquireLock,
  releaseLock,
  LOCK_IDS,
};
