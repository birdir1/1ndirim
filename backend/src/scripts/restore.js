#!/usr/bin/env node

/**
 * PostgreSQL Database Restore Script
 * 
 * Bu script PostgreSQL veritabanını backup dosyasından geri yükler.
 * 
 * Kullanım:
 * - node src/scripts/restore.js <backup-file>
 * - node src/scripts/restore.js backups/backup_indirim_db_2026-01-30T12-00-00.sql.gz
 * 
 * Gereksinimler:
 * - psql kurulu olmalı
 * - gunzip kurulu olmalı (compressed backups için)
 * - .env dosyasında DB bilgileri olmalı
 */

const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const readline = require('readline');
require('dotenv').config();

// Configuration
const DB_HOST = process.env.DB_HOST || 'localhost';
const DB_PORT = process.env.DB_PORT || '5432';
const DB_NAME = process.env.DB_NAME || 'indirim_db';
const DB_USER = process.env.DB_USER || 'postgres';
const DB_PASSWORD = process.env.DB_PASSWORD;

/**
 * Ask for user confirmation
 */
function askConfirmation(question) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes' || answer.toLowerCase() === 'evet');
    });
  });
}

/**
 * Decompress backup file if needed
 */
function decompressBackup(filepath) {
  return new Promise((resolve, reject) => {
    if (!filepath.endsWith('.gz')) {
      resolve(filepath);
      return;
    }

    const decompressedPath = filepath.replace(/\.gz$/, '');
    const command = `gunzip -c "${filepath}" > "${decompressedPath}"`;
    
    console.log(`🔄 Dosya açılıyor...`);
    
    exec(command, (error, stdout, stderr) => {
      if (error) {
        console.error(`❌ Açma hatası: ${error.message}`);
        reject(error);
        return;
      }
      
      console.log(`✅ Dosya açıldı: ${path.basename(decompressedPath)}`);
      resolve(decompressedPath);
    });
  });
}

/**
 * Restore database from backup file
 */
function restoreDatabase(filepath) {
  return new Promise((resolve, reject) => {
    console.log(`🔄 Restore başlatılıyor...`);
    console.log(`📁 Kaynak: ${filepath}`);
    
    const startTime = Date.now();
    
    // psql command
    const command = `PGPASSWORD="${DB_PASSWORD}" psql -h ${DB_HOST} -p ${DB_PORT} -U ${DB_USER} -d ${DB_NAME} -f "${filepath}"`;
    
    exec(command, (error, stdout, stderr) => {
      const duration = ((Date.now() - startTime) / 1000).toFixed(2);
      
      if (error) {
        console.error(`❌ Restore hatası: ${error.message}`);
        console.error(`stderr: ${stderr}`);
        reject(error);
        return;
      }
      
      console.log(`✅ Restore tamamlandı`);
      console.log(`⏱️  Süre: ${duration} saniye`);
      
      resolve({ duration });
    });
  });
}

/**
 * Main restore process
 */
async function main() {
  console.log('='.repeat(60));
  console.log('🗄️  PostgreSQL Database Restore');
  console.log('='.repeat(60));
  
  // Get backup file from command line
  const backupFile = process.argv[2];
  
  if (!backupFile) {
    console.error('❌ Hata: Backup dosyası belirtilmedi');
    console.log('');
    console.log('Kullanım:');
    console.log('  node src/scripts/restore.js <backup-file>');
    console.log('');
    console.log('Örnek:');
    console.log('  node src/scripts/restore.js backups/backup_indirim_db_2026-01-30T12-00-00.sql.gz');
    process.exit(1);
  }
  
  // Check if file exists
  if (!fs.existsSync(backupFile)) {
    console.error(`❌ Hata: Backup dosyası bulunamadı: ${backupFile}`);
    process.exit(1);
  }
  
  // Get file info
  const stats = fs.statSync(backupFile);
  const fileSizeMB = (stats.size / (1024 * 1024)).toFixed(2);
  
  console.log(`📅 Tarih: ${new Date().toLocaleString('tr-TR')}`);
  console.log(`📁 Backup dosyası: ${backupFile}`);
  console.log(`📊 Dosya boyutu: ${fileSizeMB} MB`);
  console.log(`🗄️  Hedef veritabanı: ${DB_NAME}`);
  console.log(`🖥️  Host: ${DB_HOST}:${DB_PORT}`);
  console.log(`👤 Kullanıcı: ${DB_USER}`);
  console.log('='.repeat(60));
  console.log('');
  console.log('⚠️  UYARI: Bu işlem mevcut veritabanını değiştirecektir!');
  console.log('');
  
  // Ask for confirmation
  const confirmed = await askConfirmation('Devam etmek istiyor musunuz? (y/n): ');
  
  if (!confirmed) {
    console.log('❌ İşlem iptal edildi');
    process.exit(0);
  }
  
  console.log('');
  console.log('='.repeat(60));
  
  try {
    // Decompress if needed
    const decompressedFile = await decompressBackup(backupFile);
    
    // Restore database
    await restoreDatabase(decompressedFile);
    
    // Clean up decompressed file if it was created
    if (decompressedFile !== backupFile && fs.existsSync(decompressedFile)) {
      fs.unlinkSync(decompressedFile);
      console.log(`🧹 Geçici dosya temizlendi`);
    }
    
    console.log('='.repeat(60));
    console.log('✅ Restore işlemi başarıyla tamamlandı');
    console.log('='.repeat(60));
    
    process.exit(0);
  } catch (error) {
    console.error('='.repeat(60));
    console.error('❌ Restore işlemi başarısız');
    console.error('='.repeat(60));
    console.error(error);
    process.exit(1);
  }
}

// Run restore
main();
