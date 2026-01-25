/**
 * Cron Job: Süresi Bitmiş Kampanyaları Pasifleştir
 * Her saat başı çalışır
 * Advisory lock ile tek instance garantisi
 */

const Campaign = require('../models/Campaign');
const { acquireLock, releaseLock, LOCK_IDS } = require('../utils/advisoryLock');

/**
 * Süresi bitmiş kampanyaları pasifleştirir (advisory lock ile)
 */
async function deactivateExpiredCampaigns() {
  const lockId = LOCK_IDS.DEACTIVATE_EXPIRED_CAMPAIGNS;
  const hasLock = await acquireLock(lockId);

  if (!hasLock) {
    console.log('⚠️ Advisory lock alınamadı, başka bir instance çalışıyor olabilir');
    return 0;
  }

  try {
    const count = await Campaign.deactivateExpired();
    console.log(`✅ ${count} kampanya pasifleştirildi (süresi doldu)`);
    return count;
  } catch (error) {
    console.error('❌ Kampanya pasifleştirme hatası:', error);
    throw error;
  } finally {
    await releaseLock(lockId);
  }
}

module.exports = {
  deactivateExpiredCampaigns,
};
