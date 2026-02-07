/**
 * Scheduler
 * Bot'u belirli aralıklarla çalıştırır
 */

const cron = require('node-cron');
const { acquireFsLock } = require('./utils/runLock');

let inMemoryRunActive = false;
let overlapSkipCount = 0;

async function runWithOverlapLock(label, runScrapersFn) {
  if (inMemoryRunActive) {
    overlapSkipCount += 1;
    console.warn(`⏭️ run skipped (in-memory overlap) label=${label} skips=${overlapSkipCount}`);
    return;
  }

  const lockPath = process.env.BOT_LOCK_PATH || '/tmp/1ndirim-bot.lock';
  const ttlMs = Math.max(60_000, parseInt(process.env.BOT_LOCK_TTL_MS || String(2 * 60 * 60 * 1000), 10) || (2 * 60 * 60 * 1000));

  const lock = acquireFsLock(lockPath, { ttlMs, log: console });
  if (!lock.acquired) {
    overlapSkipCount += 1;
    const pid = lock.info && lock.info.pid ? String(lock.info.pid) : 'n/a';
    const startedAt = lock.info && lock.info.started_at ? String(lock.info.started_at) : 'n/a';
    console.warn(`⏭️ run skipped (filesystem lock) label=${label} lock_path=${lockPath} pid=${pid} started_at=${startedAt} skips=${overlapSkipCount}`);
    return;
  }

  inMemoryRunActive = true;
  console.info(`RUN_LOCK_ACQUIRED label=${label} lock_path=${lockPath} ttl_ms=${ttlMs} pid=${process.pid}`);
  try {
    await runScrapersFn();
  } finally {
    inMemoryRunActive = false;
    try { lock.release && lock.release(); } catch (_) {}
    console.info(`RUN_LOCK_RELEASED label=${label} lock_path=${lockPath} pid=${process.pid}`);
  }
}

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
  console.log(`🔒 Overlap lock: path=${process.env.BOT_LOCK_PATH || '/tmp/1ndirim-bot.lock'} ttl_ms=${process.env.BOT_LOCK_TTL_MS || String(2 * 60 * 60 * 1000)}`);

  cron.schedule(cronExpression, async () => {
    console.log(`\n🔄 Scheduler tetiklendi: ${new Date().toISOString()}`);
    try {
      await runWithOverlapLock('cron', runScrapersFn);
    } catch (error) {
      console.error('❌ Scheduler hatası:', error);
    }
  });

  // İlk çalıştırmayı hemen yap
  console.log('🚀 İlk scraper çalıştırması başlatılıyor...');
  runWithOverlapLock('startup', runScrapersFn).catch((error) => {
    console.error('❌ İlk çalıştırma hatası:', error);
  });
}

module.exports = {
  startScheduler,
};
