/**
 * Campaigns Discover Routes
 * Keşfet sayfası için kategori bazlı kampanya endpoint'leri
 */

const express = require('express');
const router = express.Router();
const Campaign = require('../models/Campaign');
const { cacheMiddleware } = require('../middleware/cache');
const CacheService = require('../services/cacheService');
const { fetchActiveCategories, findActiveByName } = require('../models/CampaignCategory');

// Fallback categories configuration (used only if DB categories are not available)
const FALLBACK_CATEGORIES = [
  {
    id: 'entertainment',
    name: 'Eğlence',
    icon: '🎬',
    sources: [
      'Netflix',
      'YouTube Premium',
      'Amazon Prime',
      'Exxen',
      'Gain',
      'Tivibu',
      'TV+',
      'BluTV',
      'Mubi',
      'Passo',
      'Biletix',
      'Müzekart',
    ],
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
    sources: [
      'Zara',
      'H&M',
      'Bershka',
      'Pull&Bear',
      'LCW',
      'Koton',
      'Mavi',
      'DeFacto',
      'Collins',
      'Beymen',
    ],
    minCampaigns: 10,
    fallbackMessage: 'Yakında giyim kampanyaları eklenecek',
  },
  {
    id: 'cosmetics',
    name: 'Kozmetik',
    icon: '💄',
    sources: ['Sephora', 'Gratis', 'Watsons', 'MAC Cosmetics', 'Flormar'],
    minCampaigns: 10,
    fallbackMessage: 'Yakında kozmetik kampanyaları eklenecek',
  },
  {
    id: 'travel',
    name: 'Seyahat',
    icon: '✈️',
    sources: [
      'THY',
      'Pegasus',
      'AJet',
      'Setur',
      'ETS',
      'Odamax',
      'Obilet',
      'Booking.com',
      'Hotels.com',
      'Airbnb',
      'Jolly',
      'Etstur',
    ],
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

function parseClampedInt(value, { min, max, defaultValue }) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return defaultValue;
  return Math.max(min, Math.min(max, Math.floor(parsed)));
}

function mapDbCategoryToContract(cat) {
  return {
    id: cat.name,
    name: cat.display_name || cat.name,
    icon: cat.icon || '🏷️',
    sources: Array.isArray(cat.fixed_sources) ? cat.fixed_sources : [],
    minCampaigns: cat.min_campaigns || 0,
    fallbackMessage: cat.description || null,
  };
}

async function getActiveCategoriesWithFallback() {
  try {
    const dbCategories = await fetchActiveCategories();
    if (dbCategories && dbCategories.length > 0) {
      return dbCategories.map(mapDbCategoryToContract);
    }
  } catch (e) {
    console.warn('⚠️ Discover categories DB fetch failed, using fallback:', e.message);
  }
  return FALLBACK_CATEGORIES;
}

async function getCategoryByIdWithFallback(categoryId) {
  try {
    const cat = await findActiveByName(categoryId);
    if (cat) return mapDbCategoryToContract(cat);
  } catch (e) {
    console.warn('⚠️ Discover category lookup failed, using fallback:', e.message);
  }
  return FALLBACK_CATEGORIES.find((c) => c.id === categoryId) || null;
}

/**
 * GET /campaigns/discover
 * Keşfet sayfası için kategori bazlı kampanyalar
 * Her kategori için kampanyaları döndürür (fallback stratejisi ile)
 * 
 * CACHED: 5 minutes
 */
router.get('/discover', cacheMiddleware(CacheService.TTL.CAMPAIGNS_LIST), async (req, res) => {
  try {
    const perCategoryLimit = parseClampedInt(req.query.limit, {
      min: 1,
      max: 50,
      defaultValue: 20,
    });
    const categories = await getActiveCategoriesWithFallback();
    const sort = (req.query.sort || 'latest').toString();
    const platform = req.query.platform || null;
    const lat = req.query.lat ? Number(req.query.lat) : undefined;
    const lng = req.query.lng ? Number(req.query.lng) : undefined;
    const radiusKm = req.query.radius ? Number(req.query.radius) : undefined;
    const result = [];

    for (const category of categories) {
      // Get campaigns for this category with fallback
      const { campaigns, isEmpty } = await Campaign.findByCategoryWithFallback(
        category.id,
        perCategoryLimit,
        0,
        { sort, platform, lat, lng, radiusKm },
      );
      const totalCount = await Campaign.countByCategory(category.id, {
        includeExpired: isEmpty,
      });

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
        discountPercentage: campaign.discount_percentage || campaign.discount_percent,
        platform: campaign.platform,
        contentType: campaign.content_type,
        startAt: campaign.start_at,
        endAt: campaign.end_at,
        isFree: campaign.is_free,
        city: campaign.city,
        district: campaign.district,
        lat: campaign.lat,
        lng: campaign.lng,
        sponsored: campaign.sponsored,
        sponsoredWeight: campaign.sponsored_weight,
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
        totalCount,
        hasMore: totalCount > formattedCampaigns.length,
        isEmpty,
        fallbackMessage: isEmpty ? category.fallbackMessage : null,
      });
    }

    res.json({
      success: true,
      data: result,
      totalCategories: result.length,
      pagination: {
        perCategoryLimit,
      },
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
    const limit = parseClampedInt(req.query.limit, {
      min: 1,
      max: 100,
      defaultValue: 20,
    });
    const offset = parseClampedInt(req.query.offset, {
      min: 0,
      max: 10000,
      defaultValue: 0,
    });

    const sort = (req.query.sort || 'latest').toString();
    const platform = req.query.platform || null;
    const lat = req.query.lat ? Number(req.query.lat) : undefined;
    const lng = req.query.lng ? Number(req.query.lng) : undefined;
    const radiusKm = req.query.radius ? Number(req.query.radius) : undefined;

    // Validate category
    const categoryConfig = await getCategoryByIdWithFallback(category);
    if (!categoryConfig) {
      return res.status(404).json({
        success: false,
        error: 'Kategori bulunamadı',
        message: `Geçersiz kategori: ${category}`,
      });
    }

    // Get campaigns with fallback
    const { campaigns, isEmpty } = await Campaign.findByCategoryWithFallback(
      category,
      limit,
      offset,
      { sort, platform, lat, lng, radiusKm },
    );
    const totalCount = await Campaign.countByCategory(category, {
      includeExpired: isEmpty,
    });
    const hasMore = offset + campaigns.length < totalCount;

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
      discountPercentage: campaign.discount_percentage || campaign.discount_percent,
      platform: campaign.platform,
      contentType: campaign.content_type,
      startAt: campaign.start_at,
      endAt: campaign.end_at,
      isFree: campaign.is_free,
      city: campaign.city,
      district: campaign.district,
      lat: campaign.lat,
      lng: campaign.lng,
      sponsored: campaign.sponsored,
      sponsoredWeight: campaign.sponsored_weight,
      isExpired: campaign.is_expired || false,
    }));

    res.json({
      success: true,
      data: {
        category: categoryConfig,
        campaigns: formattedCampaigns,
        count: formattedCampaigns.length,
        totalCount,
        hasMore,
        isEmpty,
        fallbackMessage: isEmpty ? categoryConfig.fallbackMessage : null,
        pagination: {
          limit,
          offset,
        },
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
    const categories = await getActiveCategoriesWithFallback();

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
    for (const category of categories) {
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
        categories: categories.map((c) => ({
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
