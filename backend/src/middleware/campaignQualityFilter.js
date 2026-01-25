/**
 * Campaign Quality Filter Middleware
 * Backend tarafında tek otorite kalite kontrolü
 * Bot'tan bağımsız, self-contained
 */

const { isHighQualityCampaign } = require('../utils/campaignQualityFilter');

/**
 * Kampanya kalite kontrolü middleware
 * POST /api/campaigns endpoint'inde kullanılır.
 * FAZ 13: Bot confidence_score/confidence_reasons gönderdiyse kalite reddini atla; route confidence guard uygular.
 */
function validateCampaignQuality(req, res, next) {
  const campaign = req.body;
  const hasConfidence = campaign && (campaign.confidence_score != null || (Array.isArray(campaign.confidence_reasons) && campaign.confidence_reasons.length > 0));
  if (hasConfidence) {
    return next();
  }
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
