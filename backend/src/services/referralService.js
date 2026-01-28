const pool = require('../config/database');
const GamificationService = require('./gamificationService');

/**
 * Referans Sistemi Servisi
 */
class ReferralService {
  // Referans ödül puanları
  static REWARDS = {
    REFERRER_POINTS: 50, // Davet eden kullanıcıya
    REFERRED_POINTS: 25, // Davet edilen kullanıcıya
  };

  /**
   * Kullanıcı için benzersiz referans kodu oluşturur veya mevcut kodu döner
   */
  static async getOrCreateReferralCode(userId) {
    const client = await pool.connect();

    try {
      // Mevcut kodu kontrol et
      const existingResult = await client.query(
        'SELECT referral_code FROM user_referral_codes WHERE user_id = $1',
        [userId]
      );

      if (existingResult.rows.length > 0) {
        return existingResult.rows[0].referral_code;
      }

      // Yeni kod oluştur
      const referralCode = await this._generateUniqueCode(client);

      await client.query(
        'INSERT INTO user_referral_codes (user_id, referral_code) VALUES ($1, $2)',
        [userId, referralCode]
      );

      return referralCode;
    } catch (error) {
      console.error('❌ Referans kodu oluşturma hatası:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Benzersiz referans kodu üretir
   */
  static async _generateUniqueCode(client, attempts = 0) {
    if (attempts > 10) {
      throw new Error('Benzersiz kod oluşturulamadı');
    }

    // 8 karakterlik kod: 4 harf + 4 rakam
    const letters = 'ABCDEFGHJKLMNPQRSTUVWXYZ'; // I, O harfleri çıkarıldı
    const numbers = '23456789'; // 0, 1 rakamları çıkarıldı

    let code = '';
    for (let i = 0; i < 4; i++) {
      code += letters.charAt(Math.floor(Math.random() * letters.length));
    }
    for (let i = 0; i < 4; i++) {
      code += numbers.charAt(Math.floor(Math.random() * numbers.length));
    }

    // Benzersizlik kontrolü
    const checkResult = await client.query(
      'SELECT id FROM user_referral_codes WHERE referral_code = $1',
      [code]
    );

    if (checkResult.rows.length > 0) {
      return this._generateUniqueCode(client, attempts + 1);
    }

    return code;
  }

  /**
   * Referans kodunu doğrular ve kayıt oluşturur
   */
  static async processReferral(referredUserId, referralCode) {
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      // Referans kodunun sahibini bul
      const codeResult = await client.query(
        'SELECT user_id FROM user_referral_codes WHERE referral_code = $1',
        [referralCode]
      );

      if (codeResult.rows.length === 0) {
        throw new Error('Geçersiz referans kodu');
      }

      const referrerUserId = codeResult.rows[0].user_id;

      // Kendi kodunu kullanamaz
      if (referrerUserId === referredUserId) {
        throw new Error('Kendi referans kodunuzu kullanamazsınız');
      }

      // Daha önce kayıt var mı kontrol et
      const existingResult = await client.query(
        'SELECT id FROM referral_records WHERE referred_user_id = $1',
        [referredUserId]
      );

      if (existingResult.rows.length > 0) {
        throw new Error('Bu kullanıcı zaten bir referans kodu kullanmış');
      }

      // Referans kaydı oluştur
      const insertResult = await client.query(
        `INSERT INTO referral_records 
         (referrer_user_id, referred_user_id, referral_code, status, reward_points)
         VALUES ($1, $2, $3, 'completed', $4)
         RETURNING id`,
        [
          referrerUserId,
          referredUserId,
          referralCode,
          this.REWARDS.REFERRER_POINTS,
        ]
      );

      const recordId = insertResult.rows[0].id;

      // Ödülleri ver
      // Davet eden kullanıcıya puan
      await GamificationService.addPoints(
        referrerUserId,
        this.REWARDS.REFERRER_POINTS,
        'referral',
        recordId,
        'Arkadaşınızı davet ettiniz'
      ).catch((err) => console.error('Referans ödülü hatası (referrer):', err));

      // Davet edilen kullanıcıya puan
      await GamificationService.addPoints(
        referredUserId,
        this.REWARDS.REFERRED_POINTS,
        'referral',
        recordId,
        'Referans kodu ile kayıt oldunuz'
      ).catch((err) => console.error('Referans ödülü hatası (referred):', err));

      await client.query('COMMIT');

      return {
        success: true,
        referrerUserId,
        rewardPoints: this.REWARDS.REFERRER_POINTS,
      };
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('❌ Referans işleme hatası:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Kullanıcının referans istatistiklerini getirir
   */
  static async getReferralStats(userId) {
    const client = await pool.connect();

    try {
      // Referans kodu
      const codeResult = await client.query(
        'SELECT referral_code FROM user_referral_codes WHERE user_id = $1',
        [userId]
      );

      const referralCode = codeResult.rows.length > 0
        ? codeResult.rows[0].referral_code
        : null;

      // Toplam davet sayısı
      const countResult = await client.query(
        'SELECT COUNT(*) as total FROM referral_records WHERE referrer_user_id = $1',
        [userId]
      );

      const totalReferrals = parseInt(countResult.rows[0].total) || 0;

      // Toplam kazanılan puan
      const pointsResult = await client.query(
        `SELECT SUM(reward_points) as total_points 
         FROM referral_records 
         WHERE referrer_user_id = $1 AND reward_claimed = true`,
        [userId]
      );

      const totalPoints = parseInt(pointsResult.rows[0].total_points) || 0;

      // Son referanslar
      const recentResult = await client.query(
        `SELECT 
          referred_user_id,
          created_at,
          reward_points
         FROM referral_records
         WHERE referrer_user_id = $1
         ORDER BY created_at DESC
         LIMIT 10`,
        [userId]
      );

      const recentReferrals = recentResult.rows.map((row) => ({
        referredUserId: row.referred_user_id,
        createdAt: row.created_at,
        rewardPoints: parseInt(row.reward_points) || 0,
      }));

      return {
        referralCode,
        totalReferrals,
        totalPoints,
        recentReferrals,
      };
    } catch (error) {
      console.error('❌ Referans istatistikleri getirme hatası:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Referans kodunu doğrular (kayıt olmadan önce kontrol için)
   */
  static async validateReferralCode(referralCode) {
    const client = await pool.connect();

    try {
      const result = await client.query(
        'SELECT user_id FROM user_referral_codes WHERE referral_code = $1',
        [referralCode]
      );

      return {
        valid: result.rows.length > 0,
        exists: result.rows.length > 0,
      };
    } catch (error) {
      console.error('❌ Referans kodu doğrulama hatası:', error);
      return { valid: false, exists: false };
    } finally {
      client.release();
    }
  }
}

module.exports = ReferralService;
