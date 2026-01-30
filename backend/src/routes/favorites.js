const express = require('express');
const router = express.Router();
const UserFavorite = require('../models/UserFavorite');
const Campaign = require('../models/Campaign');
const { firebaseAuth, optionalFirebaseAuth } = require('../middleware/firebaseAuth');
const { validateFavoriteAdd } = require('../middleware/validation');

/**
 * GET /favorites
 * Kullanıcının favori kampanyalarını getirir
 * Query params: ?limit=20&offset=0
 */
router.get('/', firebaseAuth, async (req, res) => {
  try {
    const userId = req.user.uid;
    const limit = parseInt(req.query.limit) || 100;
    const offset = parseInt(req.query.offset) || 0;

    const favorites = await UserFavorite.findByUserId(userId, limit, offset);
    const totalCount = await UserFavorite.countByUserId(userId);

    // Flutter uygulaması için format
    const formattedFavorites = favorites.map((campaign) => ({
      id: campaign.id,
      title: campaign.title,
      subtitle: campaign.description || `${campaign.source_name}`,
      sourceName: campaign.source_name,
      sourceId: campaign.source_id,
      icon: campaign.icon_name || 'local_offer',
      iconColor: campaign.icon_color || '#DC2626',
      iconBgColor: campaign.icon_bg_color || '#FEE2E2',
      tags: campaign.tags || [],
      description: campaign.description,
      detailText: campaign.detail_text,
      originalUrl: campaign.original_url,
      affiliateUrl: campaign.affiliate_url || null,
      expiresAt: campaign.expires_at,
      howToUse: campaign.how_to_use || [],
      validityChannels: campaign.validity_channels || [],
      status: campaign.status,
      favoritedAt: campaign.favorited_at,
    }));

    res.json({
      success: true,
      data: formattedFavorites,
      count: formattedFavorites.length,
      total: totalCount,
      limit,
      offset,
    });
  } catch (error) {
    console.error('Favorites list error:', error);
    res.status(500).json({
      success: false,
      error: 'Favoriler yüklenirken bir hata oluştu',
      message: error.message,
    });
  }
});

/**
 * POST /favorites/:campaignId
 * Kampanyayı favorilere ekler
 */
router.post('/:campaignId', firebaseAuth, validateFavoriteAdd, async (req, res) => {
  try {
    const userId = req.user.uid;
    const { campaignId } = req.params;

    // Kampanya var mı kontrol et
    const campaign = await Campaign.findById(campaignId);
    if (!campaign) {
      return res.status(404).json({
        success: false,
        error: 'Kampanya bulunamadı',
      });
    }

    // Favoriye ekle
    const favorite = await UserFavorite.create(userId, campaignId);

    // Puan ekle (async, hata olsa bile devam et)
    GamificationService.addPoints(
      userId,
      GamificationService.POINTS.FAVORITE,
      'favorite',
      favorite.id,
      'Favori kampanya eklendi'
    ).catch(err => console.error('Puan ekleme hatası (favori):', err));

    res.status(201).json({
      success: true,
      data: {
        id: favorite.id,
        campaignId: favorite.campaign_id,
        favoritedAt: favorite.created_at,
      },
      message: 'Kampanya favorilere eklendi',
    });
  } catch (error) {
    if (error.message === 'Kampanya zaten favorilerinizde') {
      return res.status(409).json({
        success: false,
        error: error.message,
      });
    }

    if (error.message === 'Kampanya bulunamadı veya aktif değil') {
      return res.status(404).json({
        success: false,
        error: error.message,
      });
    }

    console.error('Add favorite error:', error);
    res.status(500).json({
      success: false,
      error: 'Favoriye eklenirken bir hata oluştu',
      message: error.message,
    });
  }
});

/**
 * DELETE /favorites/:campaignId
 * Kampanyayı favorilerden çıkarır
 */
router.delete('/:campaignId', firebaseAuth, validateFavoriteAdd, async (req, res) => {
  try {
    const userId = req.user.uid;
    const { campaignId } = req.params;

    const deleted = await UserFavorite.delete(userId, campaignId);

    if (!deleted) {
      return res.status(404).json({
        success: false,
        error: 'Favori bulunamadı',
      });
    }

    res.json({
      success: true,
      message: 'Kampanya favorilerden çıkarıldı',
    });
  } catch (error) {
    console.error('Remove favorite error:', error);
    res.status(500).json({
      success: false,
      error: 'Favoriden çıkarılırken bir hata oluştu',
      message: error.message,
    });
  }
});

/**
 * GET /favorites/check/:campaignId
 * Kampanyanın favori olup olmadığını kontrol eder
 */
router.get('/check/:campaignId', firebaseAuth, validateFavoriteAdd, async (req, res) => {
  try {
    const userId = req.user.uid;
    const { campaignId } = req.params;

    const isFavorite = await UserFavorite.isFavorite(userId, campaignId);

    res.json({
      success: true,
      data: {
        campaignId,
        isFavorite,
      },
    });
  } catch (error) {
    console.error('Check favorite error:', error);
    res.status(500).json({
      success: false,
      error: 'Favori kontrolü yapılırken bir hata oluştu',
      message: error.message,
    });
  }
});

/**
 * POST /favorites/batch-check
 * Birden fazla kampanyanın favori durumunu kontrol eder
 * Body: { campaignIds: ["uuid1", "uuid2", ...] }
 */
router.post('/batch-check', firebaseAuth, async (req, res) => {
  try {
    const userId = req.user.uid;
    const { campaignIds } = req.body;

    if (!Array.isArray(campaignIds)) {
      return res.status(400).json({
        success: false,
        error: 'campaignIds bir array olmalıdır',
      });
    }

    const favoriteIds = await UserFavorite.getFavoriteCampaignIds(userId, campaignIds);
    
    // Map formatında döndür
    const favoriteMap = {};
    campaignIds.forEach(id => {
      favoriteMap[id] = favoriteIds.has(id);
    });

    res.json({
      success: true,
      data: favoriteMap,
    });
  } catch (error) {
    console.error('Batch check favorite error:', error);
    res.status(500).json({
      success: false,
      error: 'Toplu favori kontrolü yapılırken bir hata oluştu',
      message: error.message,
    });
  }
});

module.exports = router;
