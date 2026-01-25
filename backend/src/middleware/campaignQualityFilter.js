/**
 * Campaign Quality Filter Middleware
 * Backend tarafında tek otorite kalite kontrolü
 * Bot'tan bağımsız, self-contained
 */

const { isHighQualityCampaign } = require('../utils/campaignQualityFilter');

/**
 * Kampanya kalite kontrolü middleware
 * POST /api/campaigns endpoint'inde kullanılır
 */
function validateCampaignQuality(req, res, next) {
  const campaign = req.body;

  // Kalite kontrolü
  if (!isHighQualityCampaign(campaign)) {
    return res.status(400).json({
      success: false,
      error: 'Kampanya kalite kontrolünden geçemedi',
      message: 'Bu kampanya düşük değerli veya PR kampanyası olarak işaretlendi',
    });
  }

  next();
}

module.exports = {
  validateCampaignQuality,
};
