const pool = require('../config/database');

/**
 * UserFavorite Model
 * Kullanıcı favori kampanyalarını yönetir
 */
class UserFavorite {
  /**
   * Kullanıcının favori kampanyalarını getirir
   * @param {string} userId - Firebase UID
   * @param {number} limit - Limit (opsiyonel, default: 100)
   * @param {number} offset - Offset (opsiyonel, default: 0)
   * @returns {Promise<Array>}
   */
  static async findByUserId(userId, limit = 100, offset = 0) {
    const query = `
      SELECT 
        uf.id,
        uf.campaign_id,
        uf.created_at as favorited_at,
        c.*,
        s.name as source_name,
        s.type as source_type,
        s.logo_url as source_logo_url
      FROM user_favorites uf
      INNER JOIN campaigns c ON uf.campaign_id = c.id
      INNER JOIN sources s ON c.source_id = s.id
      WHERE uf.user_id = $1
        AND c.is_active = true
        AND c.expires_at > NOW()
      ORDER BY uf.created_at DESC
      LIMIT $2 OFFSET $3
    `;

    const result = await pool.query(query, [userId, limit, offset]);
    return result.rows;
  }

  /**
   * Kullanıcının favori sayısını getirir
   * @param {string} userId - Firebase UID
   * @returns {Promise<number>}
   */
  static async countByUserId(userId) {
    const query = `
      SELECT COUNT(*) as count
      FROM user_favorites uf
      INNER JOIN campaigns c ON uf.campaign_id = c.id
      WHERE uf.user_id = $1
        AND c.is_active = true
        AND c.expires_at > NOW()
    `;

    const result = await pool.query(query, [userId]);
    return parseInt(result.rows[0].count, 10);
  }

  /**
   * Kampanyanın favori olup olmadığını kontrol eder
   * @param {string} userId - Firebase UID
   * @param {string} campaignId - Kampanya ID
   * @returns {Promise<boolean>}
   */
  static async isFavorite(userId, campaignId) {
    const query = `
      SELECT id
      FROM user_favorites
      WHERE user_id = $1 AND campaign_id = $2
      LIMIT 1
    `;

    const result = await pool.query(query, [userId, campaignId]);
    return result.rows.length > 0;
  }

  /**
   * Favoriye ekler
   * @param {string} userId - Firebase UID
   * @param {string} campaignId - Kampanya ID
   * @returns {Promise<Object>}
   */
  static async create(userId, campaignId) {
    // Önce kampanya var mı kontrol et
    const campaignCheck = await pool.query(
      'SELECT id FROM campaigns WHERE id = $1 AND is_active = true',
      [campaignId]
    );

    if (campaignCheck.rows.length === 0) {
      throw new Error('Kampanya bulunamadı veya aktif değil');
    }

    // Favoriye ekle (UNIQUE constraint sayesinde duplicate hatası olursa ignore edilir)
    const query = `
      INSERT INTO user_favorites (user_id, campaign_id)
      VALUES ($1, $2)
      ON CONFLICT (user_id, campaign_id) DO NOTHING
      RETURNING *
    `;

    const result = await pool.query(query, [userId, campaignId]);
    
    if (result.rows.length === 0) {
      // Zaten favori
      throw new Error('Kampanya zaten favorilerinizde');
    }

    return result.rows[0];
  }

  /**
   * Favorilerden çıkarır
   * @param {string} userId - Firebase UID
   * @param {string} campaignId - Kampanya ID
   * @returns {Promise<boolean>}
   */
  static async delete(userId, campaignId) {
    const query = `
      DELETE FROM user_favorites
      WHERE user_id = $1 AND campaign_id = $2
      RETURNING id
    `;

    const result = await pool.query(query, [userId, campaignId]);
    return result.rows.length > 0;
  }

  /**
   * Kullanıcının tüm favorilerini siler (hesap silme durumu için)
   * @param {string} userId - Firebase UID
   * @returns {Promise<number>} - Silinen kayıt sayısı
   */
  static async deleteAllByUserId(userId) {
    const result = await pool.query(
      'DELETE FROM user_favorites WHERE user_id = $1',
      [userId]
    );
    return result.rowCount;
  }

  /**
   * Birden fazla kampanyanın favori durumunu kontrol eder
   * @param {string} userId - Firebase UID
   * @param {Array<string>} campaignIds - Kampanya ID'leri
   * @returns {Promise<Set<string>>} - Favori olan kampanya ID'leri
   */
  static async getFavoriteCampaignIds(userId, campaignIds) {
    if (!campaignIds || campaignIds.length === 0) {
      return new Set();
    }

    const query = `
      SELECT campaign_id
      FROM user_favorites
      WHERE user_id = $1 AND campaign_id = ANY($2::uuid[])
    `;

    const result = await pool.query(query, [userId, campaignIds]);
    return new Set(result.rows.map(row => row.campaign_id));
  }
}

module.exports = UserFavorite;
