#!/usr/bin/env node

/**
 * PostgreSQL Database Backup Script
 * 
 * Bu script PostgreSQL veritabanının yedeğini alır ve belirtilen konuma kaydeder.
 * 
 * Kullanım:
 * - Manuel: node src/scripts/backup.js
 * - Cron: 0 2 * * * cd /path/to/backend && node src/scripts/backup.js
 * 
 * Gereksinimler:
 * - pg_dump kurulu olmalı
 * - .env dosyasında DB bilgileri olmalı
 */

const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Configuration
const BACKUP_DIR = process.env.BACKUP_DIR || path.join(__dirname, '../../backups');
const RETENTION_DAYS = parseInt(process.env.BACKUP_RETENTION_DAYS || '30');
const DB_HOST = process.env.DB_HOST || 'localhost';
const DB_PORT = process.env.DB_PORT || '5432';
const DB_NAME = process.env.DB_NAME || 'indirim_db';
const DB_USER = process.env.DB_USER || 'postgres';
const DB_PASSWORD = process.env.DB_PASSWORD;

// Ensure backup directory exists
if (!fs.existsSync(BACKUP_DIR)) {
  fs.mkdirSync(BACKUP_DIR, { recursive: true });
  console.log(`✅ Backup dizini oluşturuldu: ${BACKUP_DIR}`);
}

/**
 * Generate backup filename with timestamp
 */
function getBackupFilename() {
  const now = new Date();
  const timestamp = now.toISOString().replace(/[:.]/g, '-').slice(0, -5);
  return `backup_${DB_NAME}_${timestamp}.sql`;
}

/**
 * Execute pg_dump command
 */
function createBackup() {
  return new Promise((resolve, reject) => {
    const filename = getBackupFilename();
    const filepath = path.join(BACKUP_DIR, filename);
    
    // pg_dump command
    const command = `PGPASSWORD="${DB_PASSWORD}" pg_dump -h ${DB_HOST} -p ${DB_PORT} -U ${DB_USER} -d ${DB_NAME} -F p -f "${filepath}"`;
    
    console.log(`🔄 Backup başlatılıyor: ${filename}`);
    console.log(`📁 Hedef: ${filepath}`);
    
    const startTime = Date.now();
    
    exec(command, (error, stdout, stderr) => {
      const duration = ((Date.now() - startTime) / 1000).toFixed(2);
      
      if (error) {
        console.error(`❌ Backup hatası: ${error.message}`);
        console.error(`stderr: ${stderr}`);
        reject(error);
        return;
      }
      
      // Check if file was created
      if (!fs.existsSync(filepath)) {
        const err = new Error('Backup dosyası oluşturulamadı');
        console.error(`❌ ${err.message}`);
        reject(err);
        return;
      }
      
      // Get file size
      const stats = fs.statSync(filepath);
      const fileSizeMB = (stats.size / (1024 * 1024)).toFixed(2);
      
      console.log(`✅ Backup tamamlandı: ${filename}`);
      console.log(`📊 Dosya boyutu: ${fileSizeMB} MB`);
      console.log(`⏱️  Süre: ${duration} saniye`);
      
      resolve({ filename, filepath, size: stats.size, duration });
    });
  });
}

/**
 * Compress backup file (optional)
 */
function compressBackup(filepath) {
  return new Promise((resolve, reject) => {
    const gzipPath = `${filepath}.gz`;
    const command = `gzip -f "${filepath}"`;
    
    console.log(`🔄 Sıkıştırma başlatılıyor...`);
    
    exec(command, (error, stdout, stderr) => {
      if (error) {
        console.error(`⚠️  Sıkıştırma hatası (devam ediliyor): ${error.message}`);
        resolve(filepath); // Continue without compression
        return;
      }
      
      if (fs.existsSync(gzipPath)) {
        const stats = fs.statSync(gzipPath);
        const fileSizeMB = (stats.size / (1024 * 1024)).toFixed(2);
        console.log(`✅ Sıkıştırma tamamlandı: ${fileSizeMB} MB`);
        resolve(gzipPath);
      } else {
        resolve(filepath);
      }
    });
  });
}

/**
 * Delete old backups based on retention policy
 */
function cleanOldBackups() {
  console.log(`🧹 Eski backup'lar temizleniyor (${RETENTION_DAYS} günden eski)...`);
  
  const now = Date.now();
  const retentionMs = RETENTION_DAYS * 24 * 60 * 60 * 1000;
  
  const files = fs.readdirSync(BACKUP_DIR);
  let deletedCount = 0;
  
  files.forEach(file => {
    if (!file.startsWith('backup_')) return;
    
    const filepath = path.join(BACKUP_DIR, file);
    const stats = fs.statSync(filepath);
    const age = now - stats.mtimeMs;
    
    if (age > retentionMs) {
      fs.unlinkSync(filepath);
      deletedCount++;
      console.log(`  🗑️  Silindi: ${file}`);
    }
  });
  
  if (deletedCount === 0) {
    console.log(`  ℹ️  Silinecek eski backup bulunamadı`);
  } else {
    console.log(`✅ ${deletedCount} eski backup silindi`);
  }
}

/**
 * Main backup process
 */
async function main() {
  console.log('='.repeat(60));
  console.log('🗄️  PostgreSQL Database Backup');
  console.log('='.repeat(60));
  console.log(`📅 Tarih: ${new Date().toLocaleString('tr-TR')}`);
  console.log(`🗄️  Veritabanı: ${DB_NAME}`);
  console.log(`🖥️  Host: ${DB_HOST}:${DB_PORT}`);
  console.log(`👤 Kullanıcı: ${DB_USER}`);
  console.log('='.repeat(60));
  
  try {
    // Create backup
    const result = await createBackup();
    
    // Compress backup (optional)
    const finalPath = await compressBackup(result.filepath);
    
    // Clean old backups
    cleanOldBackups();
    
    console.log('='.repeat(60));
    console.log('✅ Backup işlemi başarıyla tamamlandı');
    console.log('='.repeat(60));
    
    process.exit(0);
  } catch (error) {
    console.error('='.repeat(60));
    console.error('❌ Backup işlemi başarısız');
    console.error('='.repeat(60));
    console.error(error);
    process.exit(1);
  }
}

// Run backup
main();
