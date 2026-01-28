const pool = require('../config/database');

/**
 * Premium Üyelik Servisi
 */
class PremiumService {
  /**
   * Kullanıcının premium durumunu kontrol eder
   */
  static async isPremium(userId) {
    const client = await pool.connect();

    try {
      const result = await client.query(
        `SELECT 
          id,
          status,
          expires_at
        FROM premium_subscriptions
        WHERE user_id = $1 
        AND status = 'active'
        AND (expires_at IS NULL OR expires_at > NOW())`,
        [userId]
      );

      return result.rows.length > 0;
    } catch (error) {
      console.error('❌ Premium durum kontrolü hatası:', error);
      return false;
    } finally {
      client.release();
    }
  }

  /**
   * Kullanıcının premium abonelik bilgilerini getirir
   */
  static async getSubscription(userId) {
    const client = await pool.connect();

    try {
      const result = await client.query(
        `SELECT 
          id,
          plan_type,
          status,
          started_at,
          expires_at,
          auto_renew,
          payment_provider,
          created_at
        FROM premium_subscriptions
        WHERE user_id = $1
        ORDER BY created_at DESC
        LIMIT 1`,
        [userId]
      );

      if (result.rows.length === 0) {
        return null;
      }

      const row = result.rows[0];
      return {
        id: row.id,
        planType: row.plan_type,
        status: row.status,
        startedAt: row.started_at,
        expiresAt: row.expires_at,
        autoRenew: row.auto_renew,
        paymentProvider: row.payment_provider,
        createdAt: row.created_at,
        isActive: row.status === 'active' && (!row.expires_at || row.expires_at > new Date()),
      };
    } catch (error) {
      console.error('❌ Premium abonelik getirme hatası:', error);
      return null;
    } finally {
      client.release();
    }
  }

  /**
   * Premium abonelik oluşturur (test/manuel için)
   */
  static async createSubscription(userId, planType = 'monthly', durationDays = 30) {
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      // Mevcut aboneliği kontrol et
      const existingResult = await client.query(
        'SELECT id FROM premium_subscriptions WHERE user_id = $1 AND status = $2',
        [userId, 'active']
      );

      if (existingResult.rows.length > 0) {
        throw new Error('Kullanıcının zaten aktif bir premium aboneliği var');
      }

      // Yeni abonelik oluştur
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + durationDays);

      const insertResult = await client.query(
        `INSERT INTO premium_subscriptions 
         (user_id, plan_type, status, expires_at, auto_renew)
         VALUES ($1, $2, 'active', $3, true)
         RETURNING id, started_at, expires_at`,
        [userId, planType, expiresAt]
      );

      await client.query('COMMIT');

      return {
        id: insertResult.rows[0].id,
        startedAt: insertResult.rows[0].started_at,
        expiresAt: insertResult.rows[0].expires_at,
      };
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('❌ Premium abonelik oluşturma hatası:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Premium aboneliği iptal eder
   */
  static async cancelSubscription(userId) {
    const client = await pool.connect();

    try {
      const result = await client.query(
        `UPDATE premium_subscriptions
         SET status = 'cancelled', auto_renew = false
         WHERE user_id = $1 AND status = 'active'
         RETURNING id`,
        [userId]
      );

      return result.rows.length > 0;
    } catch (error) {
      console.error('❌ Premium abonelik iptal hatası:', error);
      return false;
    } finally {
      client.release();
    }
  }

  /**
   * Tüm premium planları getirir
   */
  static async getPlans() {
    const client = await pool.connect();

    try {
      const result = await client.query(
        `SELECT 
          id,
          plan_key,
          plan_name,
          description,
          price_monthly,
          price_yearly,
          currency,
          features,
          display_order
        FROM premium_plans
        WHERE is_active = true
        ORDER BY display_order ASC`
      );

      return result.rows.map((row) => ({
        id: row.id,
        planKey: row.plan_key,
        planName: row.plan_name,
        description: row.description,
        priceMonthly: parseFloat(row.price_monthly) || null,
        priceYearly: parseFloat(row.price_yearly) || null,
        currency: row.currency,
        features: row.features || [],
        displayOrder: row.display_order,
      }));
    } catch (error) {
      console.error('❌ Premium planlar getirme hatası:', error);
      return [];
    } finally {
      client.release();
    }
  }

  /**
   * Premium özellikleri getirir
   */
  static async getFeatures() {
    const client = await pool.connect();

    try {
      const result = await client.query(
        `SELECT 
          id,
          feature_key,
          feature_name,
          description
        FROM premium_features
        WHERE is_active = true
        ORDER BY feature_key ASC`
      );

      return result.rows.map((row) => ({
        id: row.id,
        featureKey: row.feature_key,
        featureName: row.feature_name,
        description: row.description,
      }));
    } catch (error) {
      console.error('❌ Premium özellikler getirme hatası:', error);
      return [];
    } finally {
      client.release();
    }
  }

  /**
   * Süresi dolmuş abonelikleri kontrol eder ve günceller
   */
  static async checkExpiredSubscriptions() {
    const client = await pool.connect();

    try {
      const result = await client.query(
        `UPDATE premium_subscriptions
         SET status = 'expired'
         WHERE status = 'active'
         AND expires_at IS NOT NULL
         AND expires_at < NOW()
         RETURNING user_id`
      );

      return result.rows.length;
    } catch (error) {
      console.error('❌ Süresi dolmuş abonelikler kontrolü hatası:', error);
      return 0;
    } finally {
      client.release();
    }
  }
}

module.exports = PremiumService;
