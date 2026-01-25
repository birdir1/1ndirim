/**
 * Cron Worker - Standalone Process
 * Süresi biten kampanyaları pasifleştirir
 * Production'da ayrı container olarak çalışır
 */

require('dotenv').config();
const cron = require('node-cron');
const { deactivateExpiredCampaigns } = require('./deactivateExpiredCampaigns');
const { backupDatabase } = require('../scripts/backup');

console.log('⏰ Cron Worker başlatıldı');

// Kampanya pasifleştirme: Her saat başı
cron.schedule('0 * * * *', async () => {
  console.log(`\n⏰ [${new Date().toISOString()}] Cron job çalışıyor: Süresi bitmiş kampanyalar kontrol ediliyor...`);
  try {
    const count = await deactivateExpiredCampaigns();
    console.log(`✅ Cron job tamamlandı: ${count} kampanya pasifleştirildi`);
  } catch (error) {
    console.error('❌ Cron job hatası:', error);
  }
});

// Database backup: Her gün saat 02:00'de
cron.schedule('0 2 * * *', async () => {
  console.log(`\n💾 [${new Date().toISOString()}] Database backup başlatılıyor...`);
  try {
    await backupDatabase();
    console.log('✅ Database backup tamamlandı');
  } catch (error) {
    console.error('❌ Database backup hatası:', error);
  }
});

// Process'i canlı tut
console.log('✅ Cron worker hazır:');
console.log('  - Kampanya pasifleştirme: Her saat başı');
console.log('  - Database backup: Her gün 02:00');

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('⏹️ SIGTERM alındı, cron worker kapatılıyor...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('⏹️ SIGINT alındı, cron worker kapatılıyor...');
  process.exit(0);
});

// Keep process alive
setInterval(() => {
  // Heartbeat (opsiyonel)
}, 60000);
