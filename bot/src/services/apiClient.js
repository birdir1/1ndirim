/**
 * API Client
 * Bot'tan Backend'e kampanya gönderme servisi
 * Retry + backoff + dead-letter desteği
 */

const axios = require('axios');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const BACKEND_API_URL = process.env.BACKEND_API_URL || 'http://localhost:3000/api';
const DEAD_LETTER_DIR = path.join(__dirname, '../../dead-letters');
const INTERNAL_BOT_TOKEN = process.env.INTERNAL_BOT_TOKEN;

// Dead-letter dizinini oluştur
if (!fs.existsSync(DEAD_LETTER_DIR)) {
  fs.mkdirSync(DEAD_LETTER_DIR, { recursive: true });
}

class ApiClient {
  constructor() {
    this.tokenMissing = !INTERNAL_BOT_TOKEN;
    if (this.tokenMissing) {
      // Fail fast (log only). Do not crash the bot process.
      console.error('BOT TOKEN MISSING');
    }
    this.client = axios.create({
      baseURL: BACKEND_API_URL,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
        'x-internal-bot': '1',
        ...(INTERNAL_BOT_TOKEN
          ? {
              'x-bot-token': INTERNAL_BOT_TOKEN,
              // legacy header kept for compatibility
              'x-internal-bot-token': INTERNAL_BOT_TOKEN,
            }
          : {}),
      },
    });
  }

  /**
   * Kampanyayı backend'e gönderir (retry + backoff ile)
   * @param {Object} campaign - Normalize edilmiş kampanya objesi
   * @param {number} maxRetries - Maksimum deneme sayısı
   * @returns {Promise<Object>} - Backend yanıtı
   */
  async createCampaign(campaign, maxRetries = 3) {
    if (this.tokenMissing) {
      return {
        success: false,
        error: 'BOT TOKEN MISSING',
        message: 'INTERNAL_BOT_TOKEN env var is required for backend writes.',
        tokenMissing: true,
      };
    }

    let lastError = null;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(
          `➡️  POST /campaigns headers: x-bot-token=${INTERNAL_BOT_TOKEN ? 'present' : 'absent'} attempt=${attempt}/${maxRetries}`
        );
        const response = await this.client.post('/campaigns', campaign);
        console.log(`⬅️  POST /campaigns status=${response && response.status}`);
        return {
          success: true,
          data: response.data,
          isUpdate: response.data.isUpdate || false,
          low_confidence: response.data.low_confidence || false,
          applied_action: response.data.applied_action || 'allow',
          freeze_learning: !!response.data.freeze_learning, // FAZ 14.5
        };
      } catch (error) {
        lastError = error;

        // 4xx hatalar (client error) retry edilmez (429 hariç: rate-limit geçici bir durum)
        if (error.response && error.response.status >= 400 && error.response.status < 500) {
          try {
            const status = error.response.status;
            const errMsg = (error.response.data && (error.response.data.error || error.response.data.message)) || error.message;
            if (status === 429 && attempt < maxRetries) {
              const retryAfterRaw = (error.response.headers && (error.response.headers['retry-after'] || error.response.headers['Retry-After'])) || '';
              const retryAfterSec = Number.parseInt(String(retryAfterRaw || '').trim(), 10);
              const fallback = Math.pow(2, attempt) * 5000;
              const maxWaitMs = parseInt(process.env.BOT_MAX_429_WAIT_MS || '900000', 10); // 15dk
              const waitMsBase = Number.isFinite(retryAfterSec) && retryAfterSec > 0 ? retryAfterSec * 1000 : fallback;
              const jitter = 0.8 + Math.random() * 0.4;
              const waitMs = Math.min(maxWaitMs, Math.floor(waitMsBase * jitter));
              console.warn(`⬅️  POST /campaigns status=429 (retry) waitMs=${waitMs} error=${errMsg}`);
              await new Promise((resolve) => setTimeout(resolve, waitMs));
              continue;
            }
            console.warn(`⬅️  POST /campaigns status=${status} (no-retry) error=${errMsg}`);
          } catch (_) {}
          return {
            success: false,
            error: error.response.data.error || 'Backend hatası',
            message: error.response.data.message || error.message,
            status: error.response.status,
          };
        }

        // Son deneme değilse, exponential backoff ile bekle
        if (attempt < maxRetries) {
          const backoffDelay = Math.pow(2, attempt) * 1000; // 2s, 4s, 8s
          console.log(`⏳ Backend hatası (deneme ${attempt}/${maxRetries}), ${backoffDelay}ms sonra tekrar denenecek...`);
          await new Promise((resolve) => setTimeout(resolve, backoffDelay));
        }
      }
    }

    // Tüm denemeler başarısız: dead-letter'a kaydet
    await this._saveToDeadLetter(campaign, lastError);

    return {
      success: false,
      error: 'Network hatası',
      message: lastError ? lastError.message : 'Tüm denemeler başarısız',
      retriesExhausted: true,
    };
  }

  /**
   * Başarısız kampanyayı dead-letter'a kaydeder
   * @private
   */
  async _saveToDeadLetter(campaign, error) {
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `campaign-${timestamp}-${campaign.title?.substring(0, 20).replace(/[^a-z0-9]/gi, '-') || 'unknown'}.json`;
      const filepath = path.join(DEAD_LETTER_DIR, filename);

      const deadLetter = {
        campaign,
        error: {
          message: error?.message || 'Unknown error',
          code: error?.code,
          status: error?.response?.status,
        },
        timestamp: new Date().toISOString(),
        retriesExhausted: true,
      };

      fs.writeFileSync(filepath, JSON.stringify(deadLetter, null, 2), 'utf8');
      console.error(`💀 Kampanya dead-letter'a kaydedildi: ${filename}`);
    } catch (saveError) {
      console.error('❌ Dead-letter kaydetme hatası:', saveError);
    }
  }

  /**
   * Dead-letter'daki kampanyaları tekrar dener
   * @returns {Promise<Array>} - Sonuçlar
   */
  async retryDeadLetters({
    maxFiles = 50,
    ttlHours = 24,
    backoffBaseMs = 2000,
  } = {}) {
    const now = Date.now();
    const files = fs
      .readdirSync(DEAD_LETTER_DIR)
      .filter((f) => f.endsWith('.json'))
      .slice(0, maxFiles);
    const results = [];

    for (const file of files) {
      try {
        const filepath = path.join(DEAD_LETTER_DIR, file);
        const stat = fs.statSync(filepath);
        const ageHours = (now - stat.mtimeMs) / (1000 * 60 * 60);
        if (ageHours > ttlHours) {
          fs.unlinkSync(filepath);
          results.push({ file, success: false, skipped: true, reason: 'expired' });
          continue;
        }

        const deadLetter = JSON.parse(fs.readFileSync(filepath, 'utf8'));

        console.log(`🔄 Dead-letter tekrar deneniyor: ${file}`);
        const result = await this.createCampaign(deadLetter.campaign, 3);

        if (result.success) {
          // Başarılı olursa dosyayı sil
          fs.unlinkSync(filepath);
          results.push({ file, success: true });
        } else {
          results.push({ file, success: false, error: result.error });
          // minimal backoff to avoid hammering backend
          await new Promise((resolve) => setTimeout(resolve, backoffBaseMs));
        }
      } catch (error) {
        results.push({ file, success: false, error: error.message });
      }
    }

    return results;
  }

  /**
   * Source status listesi alır (bot routing: hangi kaynaklar scrape edilebilir).
   * Backend GET /sources/status. Hata durumunda boş obje döner (mevcut davranış korunur).
   * @returns {Promise<Object<string,string>>} - name -> source_status map
   */
  async getSourceStatusList() {
    if (this.tokenMissing) {
      return {};
    }
    try {
      const response = await this.client.get('/sources/status');
      if (!response.data || !response.data.success || !Array.isArray(response.data.data)) {
        return {};
      }
      const map = {};
      for (const row of response.data.data) {
        if (row && row.name != null) {
          map[String(row.name).trim()] = (row.source_status || 'active').toLowerCase();
        }
      }
      return map;
    } catch (error) {
      console.warn('⚠️ Source status alınamadı, tüm kaynaklar active kabul edilecek:', error.message || error);
      return {};
    }
  }

  /**
   * Birden fazla kampanyayı gönderir
   * @param {Array<Object>} campaigns
   * @returns {Promise<Array>} - Sonuçlar
   */
  async createCampaigns(campaigns) {
    if (this.tokenMissing) {
      return (Array.isArray(campaigns) ? campaigns : []).map((c) => ({
        campaign: c && c.title,
        success: false,
        error: 'BOT TOKEN MISSING',
        message: 'INTERNAL_BOT_TOKEN env var is required for backend writes.',
        tokenMissing: true,
      }));
    }

    const results = [];
    // Defaults tuned to avoid backend rate limits (429) on production.
    // Can be overridden via env for faster backfills.
    const batchSize = parseInt(process.env.BOT_BATCH_SIZE || '1', 10);
    const batchDelayMs = parseInt(process.env.BOT_BATCH_DELAY_MS || '2500', 10);
    for (let i = 0; i < campaigns.length; i += batchSize) {
      const batch = campaigns.slice(i, i + batchSize);
      const batchResults = await Promise.all(batch.map((campaign) => this.createCampaign(campaign, 3)));
      batchResults.forEach((result, idx) => {
        results.push({
          campaign: batch[idx].title,
          ...result,
        });
      });
      if (i + batchSize < campaigns.length) {
        await new Promise((resolve) => setTimeout(resolve, batchDelayMs));
      }
    }

    return results;
  }
}

module.exports = ApiClient;
