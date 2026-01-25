const pool = require('../config/database');

/**
 * CampaignClick Model
 * Kampanya tıklama loglarını yönetir
 */
class CampaignClick {
  /**
   * Yeni click kaydı oluşturur
   * @param {Object} clickData
   * @param {string} clickData.campaignId - Campaign UUID
   * @param {string|null} clickData.userId - Firebase Auth user ID (nullable)
   * @returns {Promise<Object>}
   */
  static async create({ campaignId, userId }) {
    const query = `
      INSERT INTO campaign_clicks 
        (campaign_id, user_id, clicked_at)
      VALUES ($1, $2, NOW())
      RETURNING *
    `;
    
    const result = await pool.query(query, [
      campaignId,
      userId,
    ]);
    
    return result.rows[0];
  }
}

module.exports = CampaignClick;
