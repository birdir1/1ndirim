const pool = require('../config/database');

class ReferralService {
  /**
   * Kullanıcının referral kodunu getir veya oluştur
   */
  static async getOrCreateReferralCode(userId) {
    const client = await pool.connect();
    
    try {
      // PostgreSQL function kullan
      const result = await client.query(
        'SELECT get_or_create_referral_code($1) as code',
        [userId]
      );
      
      return result.rows[0].code;
    } finally {
      client.release();
    }
  }

  /**
   * Referral kodunu işle ve ödülleri ver
   */
  static async processReferral(userId, referralCode) {
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');

      // 1. Referral code'un sahibini bul
      const codeResult = await client.query(
        'SELECT user_id FROM referral_codes WHERE code = $1',
        [referralCode.toUpperCase()]
      );

      if (codeResult.rows.length === 0) {
        throw new Error('Geçersiz referral kodu');
      }

      const referrerId = codeResult.rows[0].user_id;

      // 2. Kendini davet edemez
      if (referrerId === userId) {
        throw new Error('Kendi referral kodunu kullanamazsın');
      }

      // 3. Daha önce referral kullanmış mı kontrol et
      const existingResult = await client.query(
        'SELECT id FROM user_referrals WHERE referred_id = $1',
        [userId]
      );

      if (existingResult.rows.length > 0) {
        throw new Error('Zaten bir referral kodu kullandın');
      }

      // 4. Referral kaydı oluştur
      const referralResult = await client.query(`
        INSERT INTO user_referrals (referrer_id, referred_id, referral_code, status, completed_at)
        VALUES ($1, $2, $3, 'completed', NOW())
        RETURNING id
      `, [referrerId, userId, referralCode.toUpperCase()]);

      const referralId = referralResult.rows[0].id;

      // 5. Ödülleri oluştur (şimdilik sadece kayıt)
      // Referrer (davet eden) için ödül
      await client.query(`
        INSERT INTO referral_rewards (user_id, referral_id, reward_type, reward_value, status)
        VALUES ($1, $2, 'points', 100, 'pending')
      `, [referrerId, referralId]);

      // Referee (davet edilen) için ödül
      await client.query(`
        INSERT INTO referral_rewards (user_id, referral_id, reward_type, reward_value, status)
        VALUES ($1, $2, 'points', 50, 'pending')
      `, [userId, referralId]);

      await client.query('COMMIT');

      return {
        referralId,
        referrerId,
        message: 'Referral kodu başarıyla uygulandı',
        rewards: {
          referrer: { type: 'points', value: 100 },
          referee: { type: 'points', value: 50 },
        },
      };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Kullanıcının referral istatistiklerini getir
   */
  static async getReferralStats(userId) {
    const client = await pool.connect();
    
    try {
      // Toplam referral sayısı
      const totalResult = await client.query(
        'SELECT COUNT(*) as count FROM user_referrals WHERE referrer_id = $1',
        [userId]
      );

      // Tamamlanan referral sayısı
      const completedResult = await client.query(
        'SELECT COUNT(*) as count FROM user_referrals WHERE referrer_id = $1 AND status = $2',
        [userId, 'completed']
      );

      // Bekleyen referral sayısı
      const pendingResult = await client.query(
        'SELECT COUNT(*) as count FROM user_referrals WHERE referrer_id = $1 AND status = $2',
        [userId, 'pending']
      );

      // Toplam ödüller
      const rewardsResult = await client.query(
        'SELECT SUM(reward_value) as total FROM referral_rewards WHERE user_id = $1',
        [userId]
      );

      return {
        totalReferrals: parseInt(totalResult.rows[0].count) || 0,
        completedReferrals: parseInt(completedResult.rows[0].count) || 0,
        pendingReferrals: parseInt(pendingResult.rows[0].count) || 0,
        totalRewards: parseInt(rewardsResult.rows[0].total) || 0,
      };
    } finally {
      client.release();
    }
  }

  /**
   * Referral kodunu validate et
   */
  static async validateReferralCode(code) {
    const client = await pool.connect();
    
    try {
      const result = await client.query(
        'SELECT user_id FROM referral_codes WHERE code = $1',
        [code.toUpperCase()]
      );

      return {
        valid: result.rows.length > 0,
        code: code.toUpperCase(),
      };
    } finally {
      client.release();
    }
  }

  /**
   * Kullanıcının referral geçmişini getir
   */
  static async getReferralHistory(userId) {
    const client = await pool.connect();
    
    try {
      const result = await client.query(`
        SELECT 
          ur.id,
          ur.referred_id,
          ur.status,
          ur.created_at,
          ur.completed_at,
          COALESCE(SUM(rr.reward_value), 0) as total_reward
        FROM user_referrals ur
        LEFT JOIN referral_rewards rr ON ur.id = rr.referral_id AND rr.user_id = $1
        WHERE ur.referrer_id = $1
        GROUP BY ur.id, ur.referred_id, ur.status, ur.created_at, ur.completed_at
        ORDER BY ur.created_at DESC
      `, [userId]);

      return result.rows.map(row => ({
        id: row.id,
        referredUserId: row.referred_id,
        status: row.status,
        createdAt: row.created_at,
        completedAt: row.completed_at,
        totalReward: parseInt(row.total_reward) || 0,
      }));
    } finally {
      client.release();
    }
  }
}

module.exports = ReferralService;
