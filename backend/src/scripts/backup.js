/**
 * Database Backup Script
 * PostgreSQL database'i yedekler
 * Production'da cron job ile çalıştırılmalı
 */

const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const { acquireLock, releaseLock, LOCK_IDS } = require('../utils/advisoryLock');
require('dotenv').config();

const DB_HOST = process.env.DB_HOST || 'localhost';
const DB_PORT = process.env.DB_PORT || 5432;
const DB_NAME = process.env.DB_NAME || 'indirim_db';
const DB_USER = process.env.DB_USER || 'postgres';
const DB_PASSWORD = process.env.DB_PASSWORD;

const BACKUP_DIR = process.env.BACKUP_DIR || path.join(__dirname, '../../backups');

// Backup dizinini oluştur
if (!fs.existsSync(BACKUP_DIR)) {
  fs.mkdirSync(BACKUP_DIR, { recursive: true });
}

/**
 * Database backup oluşturur (advisory lock ile)
 */
async function backupDatabase() {
  const lockId = LOCK_IDS.BACKUP_DATABASE;
  const hasLock = await acquireLock(lockId);

  if (!hasLock) {
    console.log('⚠️ Advisory lock alınamadı, başka bir instance backup yapıyor olabilir');
    return null;
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0];
  const backupFile = path.join(BACKUP_DIR, `backup-${timestamp}.sql`);

  // Eski backup'ları temizle (30 günden eski)
  const maxAge = 30 * 24 * 60 * 60 * 1000; // 30 gün
  const files = fs.readdirSync(BACKUP_DIR);
  files.forEach((file) => {
    const filePath = path.join(BACKUP_DIR, file);
    const stats = fs.statSync(filePath);
    if (Date.now() - stats.mtimeMs > maxAge) {
      fs.unlinkSync(filePath);
      console.log(`🗑️ Eski backup silindi: ${file}`);
    }
  });

  // pg_dump komutu
  const pgDumpCommand = `PGPASSWORD="${DB_PASSWORD}" pg_dump -h ${DB_HOST} -p ${DB_PORT} -U ${DB_USER} -d ${DB_NAME} -F c -f ${backupFile}`;

  return new Promise((resolve, reject) => {
    exec(pgDumpCommand, (error, stdout, stderr) => {
      if (error) {
        console.error('❌ Backup hatası:', error);
        reject(error);
        return;
      }

      if (stderr && !stderr.includes('WARNING')) {
        console.error('⚠️ Backup uyarısı:', stderr);
      }

      const stats = fs.statSync(backupFile);
      const sizeMB = (stats.size / 1024 / 1024).toFixed(2);
      console.log(`✅ Backup oluşturuldu: ${backupFile} (${sizeMB} MB)`);
      resolve(backupFile);
    });
  }).finally(() => {
    releaseLock(lockId);
  });
}

// Script direkt çalıştırılırsa
if (require.main === module) {
  backupDatabase()
    .then(() => {
      console.log('✅ Backup tamamlandı');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Backup başarısız:', error);
      process.exit(1);
    });
}

module.exports = { backupDatabase };
