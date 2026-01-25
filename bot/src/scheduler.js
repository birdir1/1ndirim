/**
 * Scheduler
 * Bot'u belirli aralıklarla çalıştırır
 */

const cron = require('node-cron');

/**
 * Scheduler'ı başlatır
 * @param {number} intervalMinutes - Çalışma aralığı (dakika)
 * @param {Function} runScrapersFn - runScrapers fonksiyonu (circular dependency önlemek için)
 */
function startScheduler(intervalMinutes = 30, runScrapersFn) {
  // Cron expression: Her X dakikada bir
  // Örnek: 30 dakika = '*/30 * * * *'
  const cronExpression = `*/${intervalMinutes} * * * *`;

  console.log(`⏰ Scheduler başlatıldı: Her ${intervalMinutes} dakikada bir çalışacak`);

  cron.schedule(cronExpression, async () => {
    console.log(`\n🔄 Scheduler tetiklendi: ${new Date().toISOString()}`);
    try {
      await runScrapersFn();
    } catch (error) {
      console.error('❌ Scheduler hatası:', error);
    }
  });

  // İlk çalıştırmayı hemen yap
  console.log('🚀 İlk scraper çalıştırması başlatılıyor...');
  runScrapersFn().catch((error) => {
    console.error('❌ İlk çalıştırma hatası:', error);
  });
}

module.exports = {
  startScheduler,
};
