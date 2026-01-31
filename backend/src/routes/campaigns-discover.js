/**
 * Campaigns Discover Routes
 * Keşfet sayfası için kategori bazlı kampanya endpoint'leri
 */

const express = require('express');
const router = express.Router();
const Campaign = require('../models/Campaign');
const { cacheMiddleware } = require('../middleware/cache');
const CacheService = require('../services/cacheService');

// Discover categories configuration
const DISCOVER_CATEGORIES = [
  {
    id: 'entertainment',
    name: 'Eğlence',
    icon: '🎬',
    sources: ['Netflix', 'YouTube Premium', 'Amazon Prime', 'Exxen', 'Gain', 'Tivibu', 'TV+', 'BluTV', 'Mubi'],
    minCampaigns: 10,
    fallbackMessage: 'Yakında eğlence kampanyaları eklenecek',
  },
  {
    id: 'gaming',
    name: 'Oyun',
    icon: '🎮',
    sources: ['Steam', 'Epic Games', 'Nvidia', 'PlayStation', 'Xbox', 'Game Pass', 'EA Play', 'Ubisoft'],
    minCampaigns: 10,
    fallbackMessage: 'Yakında oyun kampanyaları eklenecek',
  },
  {
    id: 'fashion',
    name: 'Giyim',
    icon: '👕',
    sources: ['Zara', 'H&M', 'LCW', 'Mavi', 'Koton', 'DeFacto', 'Trendyol', 'Nike', 'Adidas'],
    minCampaigns: 10,
    fallbackMessage: 'Yakında giyim kampanyaları eklenecek',
  },
  {
    id: 'travel',
    name: 'Seyahat',
    icon: '✈️',
    sources: ['THY', 'Pegasus', 'Obilet', 'Booking.com', 'Hotels.com', 'Airbnb', 'Jolly', 'Etstur'],
    minCampaigns: 10,
    fallbackMessage: 'Yakında seyahat kampanyaları eklenecek',
  },
  {
    id: 'food',
    name: 'Yemek',
    icon: '🍔',
    sources: ['Yemeksepeti', 'Getir', 'Migros', 'Trendyol Yemek', 'Banabi', 'Dominos', 'McDonalds', 'Burger King'],
    minCampaigns: 10,
    fallbackMessage: 'Yakında yemek kampanyaları eklenecek',
  },
  {
    id: 'finance',
    name: 'Finans',
    icon: '💳',
    sources: ['Papara', 'Tosla', 'Enpara', 'Akbank', 'Garanti', 'İş Bankası', 'Yapı Kredi', 'QNB Finansbank'],
    minCampaigns: 10,
    fallbackMessage: 'Yakında finans kampanyaları eklenecek',
  },
];

/**
 * GET /campaigns/discover
 * Keşfet sayfası için kategori bazlı kampanyalar
 * Her kategori için kampanyaları döndürür (fallback stratejisi ile)
 * 
 * CACHED: 5 minutes
 */
router.get('/discover', cacheMiddleware(CacheService.TTL.CAMPAIGNS_LIST), async (req, res) => {
  try {
    const result = [];

    for (const category of DISCOVER_CATEGORIES) {
      // Get campaigns for this category with fallback
      const { campaigns, isEmpty } = await Campaign.findByCategoryWithFallback(category.id, 20);

      // Format campaigns for Flutter
      const formattedCampaigns = campaigns.map((campaign) => ({
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
        category: campaign.category,
        subCategory: campaign.sub_category,
        discountPercentage: campaign.discount_percentage,
        isExpired: campaign.is_expired || false,
      }));

      result.push({
        id: category.id,
        name: category.name,
        icon: category.icon,
        sources: category.sources,
        minCampaigns: category.minCampaigns,
        campaigns: formattedCampaigns,
        count: formattedCampaigns.length,
        isEmpty,
        fallbackMessage: isEmpty ? category.fallbackMessage : null,
      });
    }

    res.json({
      success: true,
      data: result,
      totalCategories: result.length,
    });
  } catch (error) {
    console.error('Discover campaigns error:', error);
    res.status(500).json({
      success: false,
      error: 'Keşfet kampanyaları yüklenirken bir hata oluştu',
      message: error.message,
    });
  }
});

/**
 * GET /campaigns/discover/:category
 * Belirli bir kategori için kampanyalar
 * 
 * CACHED: 5 minutes
 */
router.get('/discover/:category', cacheMiddleware(CacheService.TTL.CAMPAIGNS_LIST), async (req, res) => {
  try {
    const { category } = req.params;

    // Validate category
    const categoryConfig = DISCOVER_CATEGORIES.find((c) => c.id === category);
    if (!categoryConfig) {
      return res.status(404).json({
        success: false,
        error: 'Kategori bulunamadı',
        message: `Geçersiz kategori: ${category}`,
      });
    }

    // Get campaigns with fallback
    const { campaigns, isEmpty } = await Campaign.findByCategoryWithFallback(category, 50);

    // Format campaigns for Flutter
    const formattedCampaigns = campaigns.map((campaign) => ({
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
      category: campaign.category,
      subCategory: campaign.sub_category,
      discountPercentage: campaign.discount_percentage,
      isExpired: campaign.is_expired || false,
    }));

    res.json({
      success: true,
      data: {
        category: categoryConfig,
        campaigns: formattedCampaigns,
        count: formattedCampaigns.length,
        isEmpty,
        fallbackMessage: isEmpty ? categoryConfig.fallbackMessage : null,
      },
    });
  } catch (error) {
    console.error(`Discover category ${req.params.category} error:`, error);
    res.status(500).json({
      success: false,
      error: 'Kategori kampanyaları yüklenirken bir hata oluştu',
      message: error.message,
    });
  }
});

/**
 * GET /campaigns/stats
 * Kampanya istatistikleri
 * - Toplam kampanya sayısı
 * - Kategori bazlı sayılar
 * - Kaynak bazlı sayılar
 * - Son 24 saatte eklenen sayısı
 * 
 * CACHED: 10 minutes
 */
router.get('/stats', cacheMiddleware(600), async (req, res) => {
  try {
    const pool = require('../config/database');
    const Source = require('../models/Source');

    // Total active campaigns
    const totalResult = await pool.query(`
      SELECT COUNT(*) as count
      FROM campaigns
      WHERE is_active = true
        AND expires_at > NOW()
        AND (is_hidden = false OR is_hidden IS NULL)
    `);
    const total = parseInt(totalResult.rows[0].count);

    // By category
    const byCategory = {};
    for (const category of DISCOVER_CATEGORIES) {
      const categoryResult = await pool.query(`
        SELECT COUNT(*) as count
        FROM campaigns
        WHERE is_active = true
          AND expires_at > NOW()
          AND (is_hidden = false OR is_hidden IS NULL)
          AND category = $1
      `, [category.id]);
      byCategory[category.id] = parseInt(categoryResult.rows[0].count);
    }

    // By source (top 10)
    const bySourceResult = await pool.query(`
      SELECT s.name, COUNT(c.id) as count
      FROM campaigns c
      INNER JOIN sources s ON c.source_id = s.id
      WHERE c.is_active = true
        AND c.expires_at > NOW()
        AND (c.is_hidden = false OR c.is_hidden IS NULL)
      GROUP BY s.name
      ORDER BY count DESC
      LIMIT 10
    `);
    const bySource = {};
    bySourceResult.rows.forEach((row) => {
      bySource[row.name] = parseInt(row.count);
    });

    // Recently added (last 24 hours)
    const recentlyAddedResult = await pool.query(`
      SELECT COUNT(*) as count
      FROM campaigns
      WHERE is_active = true
        AND created_at > NOW() - INTERVAL '24 hours'
    `);
    const recentlyAdded = parseInt(recentlyAddedResult.rows[0].count);

    // Recently scraped (last 24 hours)
    const recentlyScrapedResult = await pool.query(`
      SELECT COUNT(*) as count
      FROM campaigns
      WHERE is_active = true
        AND scraped_at > NOW() - INTERVAL '24 hours'
    `);
    const recentlyScraped = parseInt(recentlyScrapedResult.rows[0].count);

    res.json({
      success: true,
      data: {
        total,
        byCategory,
        bySource,
        recentlyAdded,
        recentlyScraped,
        categories: DISCOVER_CATEGORIES.map((c) => ({
          id: c.id,
          name: c.name,
          icon: c.icon,
          count: byCategory[c.id] || 0,
          minCampaigns: c.minCampaigns,
          isFull: (byCategory[c.id] || 0) >= c.minCampaigns,
        })),
      },
    });
  } catch (error) {
    console.error('Campaign stats error:', error);
    res.status(500).json({
      success: false,
      error: 'İstatistikler yüklenirken bir hata oluştu',
      message: error.message,
    });
  }
});

module.exports = router;
