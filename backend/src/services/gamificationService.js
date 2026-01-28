const pool = require('../config/database');

/**
 * Gamification Service
 * Kullanıcı puanları ve rozetlerini yönetir
 */
class GamificationService {
  // Puan değerleri
  static POINTS = {
    FAVORITE: 10,
    COMMENT: 15,
    RATING: 5,
    DAILY_LOGIN: 5,
  };

  /**
   * Kullanıcıya puan ekler ve seviyeyi günceller
   * @param {string} userId - Firebase UID
   * @param {number} points - Eklenecek puan
   * @param {string} activityType - Aktivite tipi ('favorite', 'comment', 'rating', etc.)
   * @param {string} activityId - Aktivite ID'si (opsiyonel)
   * @param {string} description - Açıklama (opsiyonel)
   */
  static async addPoints(userId, points, activityType, activityId = null, description = null) {
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      // Kullanıcı puan kaydı yoksa oluştur
      await client.query(`
        INSERT INTO user_points (user_id, points, total_points_earned, level)
        VALUES ($1, $2, $2, 1)
        ON CONFLICT (user_id) DO UPDATE
        SET points = user_points.points + $2,
            total_points_earned = user_points.total_points_earned + $2,
            updated_at = NOW()
      `, [userId, points]);

      // Puan geçmişine ekle
      await client.query(`
        INSERT INTO user_point_history (user_id, points, activity_type, activity_id, description)
        VALUES ($1, $2, $3, $4, $5)
      `, [userId, points, activityType, activityId, description]);

      // Seviyeyi güncelle (her 100 puan = 1 seviye)
      await client.query(`
        UPDATE user_points
        SET level = FLOOR(total_points_earned / 100) + 1
        WHERE user_id = $1
      `, [userId]);

      await client.query('COMMIT');

      // Rozet kontrolü yap
      await this.checkAndAwardBadges(userId);
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('❌ Puan ekleme hatası:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Kullanıcının puanlarını getirir
   * @param {string} userId - Firebase UID
   * @returns {Promise<Object>}
   */
  static async getUserPoints(userId) {
    const client = await pool.connect();

    try {
      const result = await client.query(`
        SELECT 
          points,
          total_points_earned,
          level,
          created_at,
          updated_at
        FROM user_points
        WHERE user_id = $1
      `, [userId]);

      if (result.rows.length === 0) {
        // Kullanıcı puan kaydı yoksa varsayılan değerlerle oluştur
        await client.query(`
          INSERT INTO user_points (user_id, points, total_points_earned, level)
          VALUES ($1, 0, 0, 1)
          ON CONFLICT (user_id) DO NOTHING
        `, [userId]);

        return {
          points: 0,
          totalPointsEarned: 0,
          level: 1,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
      }

      const row = result.rows[0];
      return {
        points: row.points,
        totalPointsEarned: row.total_points_earned,
        level: row.level,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      };
    } catch (error) {
      console.error('❌ Puan getirme hatası:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Kullanıcının rozetlerini getirir
   * @param {string} userId - Firebase UID
   * @returns {Promise<Array>}
   */
  static async getUserBadges(userId) {
    const client = await pool.connect();

    try {
      const result = await client.query(`
        SELECT 
          bd.id,
          bd.badge_key,
          bd.name,
          bd.description,
          bd.icon_name,
          bd.icon_color,
          bd.rarity,
          ub.earned_at
        FROM user_badges ub
        INNER JOIN badge_definitions bd ON ub.badge_id = bd.id
        WHERE ub.user_id = $1
        ORDER BY ub.earned_at DESC
      `, [userId]);

      return result.rows.map(row => ({
        id: row.id,
        badgeKey: row.badge_key,
        name: row.name,
        description: row.description,
        iconName: row.icon_name,
        iconColor: row.icon_color,
        rarity: row.rarity,
        earnedAt: row.earned_at,
      }));
    } catch (error) {
      console.error('❌ Rozet getirme hatası:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Kullanıcının istatistiklerine göre rozet kontrolü yapar ve kazandıysa verir
   * @param {string} userId - Firebase UID
   */
  static async checkAndAwardBadges(userId) {
    const client = await pool.connect();

    try {
      // Kullanıcı istatistiklerini al
      const statsResult = await client.query(`
        SELECT 
          (SELECT COUNT(*) FROM user_favorites WHERE user_id = $1) as favorites_count,
          (SELECT COUNT(*) FROM campaign_comments WHERE user_id = $1 AND is_deleted = false) as comments_count,
          (SELECT COUNT(*) FROM campaign_ratings WHERE user_id = $1) as ratings_count,
          (SELECT COALESCE(total_points_earned, 0) FROM user_points WHERE user_id = $1) as points
      `, [userId]);

      const stats = statsResult.rows[0];
      const favoritesCount = parseInt(stats.favorites_count) || 0;
      const commentsCount = parseInt(stats.comments_count) || 0;
      const ratingsCount = parseInt(stats.ratings_count) || 0;
      const points = parseInt(stats.points) || 0;

      // Tüm rozet tanımlarını al
      const badgesResult = await client.query(`
        SELECT id, badge_key, requirement_type, requirement_value
        FROM badge_definitions
      `);

      // Kullanıcının zaten kazandığı rozetleri al
      const userBadgesResult = await client.query(`
        SELECT badge_id FROM user_badges WHERE user_id = $1
      `, [userId]);
      const earnedBadgeIds = new Set(userBadgesResult.rows.map(row => row.badge_id.toString()));

      // Her rozet için kontrol yap
      for (const badge of badgesResult.rows) {
        // Zaten kazanılmışsa atla
        if (earnedBadgeIds.has(badge.id.toString())) {
          continue;
        }

        let shouldAward = false;
        let requirementValue = parseInt(badge.requirement_value);

        switch (badge.requirement_type) {
          case 'favorites':
            shouldAward = favoritesCount >= requirementValue;
            break;
          case 'comments':
            shouldAward = commentsCount >= requirementValue;
            break;
          case 'ratings':
            shouldAward = ratingsCount >= requirementValue;
            break;
          case 'points':
            shouldAward = points >= requirementValue;
            break;
        }

        // Rozet kazanıldıysa ver
        if (shouldAward) {
          await client.query(`
            INSERT INTO user_badges (user_id, badge_id)
            VALUES ($1, $2)
            ON CONFLICT (user_id, badge_id) DO NOTHING
          `, [userId, badge.id]);

          console.log(`✅ Rozet kazanıldı: ${badge.badge_key} - User: ${userId}`);
        }
      }
    } catch (error) {
      console.error('❌ Rozet kontrolü hatası:', error);
      // Hata olsa bile devam et (rozet kontrolü kritik değil)
    } finally {
      client.release();
    }
  }
}

module.exports = GamificationService;
