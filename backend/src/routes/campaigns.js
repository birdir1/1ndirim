const express = require('express');
const router = express.Router();
const Campaign = require('../models/Campaign');
const CampaignClick = require('../models/CampaignClick');
const { validateCampaignQuality } = require('../middleware/campaignQualityFilter');
const { assertBotPipelineUntouched, assertFetchPipelineIsolated } = require('../utils/safetyGuards');
const AuditLogService = require('../services/auditLogService');
const { validateCampaignId, validateSearch } = require('../middleware/validation');
const { cacheMiddleware, invalidateCacheMiddleware } = require('../middleware/cache');
const CacheService = require('../services/cacheService');

/**
 * GET /campaigns
 * Tüm aktif kampanyaları getirir
 * Query params: 
 *   - ?sourceIds=uuid1,uuid2 (opsiyonel)
 *   - ?sourceNames=Akbank,Yapı Kredi (opsiyonel, Flutter için)
 * 
 * CACHED: 5 minutes
 */
router.get('/', cacheMiddleware(CacheService.TTL.CAMPAIGNS_LIST), async (req, res) => {
  try {
    let sourceIds = null;

    // sourceNames parametresi varsa (Flutter'dan geliyor)
    if (req.query.sourceNames) {
      try {
        const sourceNames = req.query.sourceNames
          .split(',')
          .map((name) => name.trim().toLowerCase())
          .filter((name) => name.length > 0);
        
        if (sourceNames.length > 0) {
          const Source = require('../models/Source');
          const allSources = await Source.findAll();
          sourceIds = allSources
            .filter((source) => {
              const normalizedSourceName = (source.name || '').trim().toLowerCase();
              return sourceNames.includes(normalizedSourceName);
            })
            .map((source) => source.id);
        }
      } catch (sourceErr) {
        console.warn('Campaigns/: sourceNames filter failed, falling back to all', sourceErr.message);
        sourceIds = null;
      }
    } else if (req.query.sourceIds) {
      sourceIds = req.query.sourceIds.split(',').filter((id) => id.trim());
    }

    const campaigns = await Campaign.findAll(sourceIds);

    // Flutter uygulaması için format
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
      sourceLatitude: campaign.source_latitude,
      sourceLongitude: campaign.source_longitude,
      sourceCity: campaign.source_city,
      videoUrl: campaign.video_url,
      videoThumbnailUrl: campaign.video_thumbnail_url,
      videoDuration: campaign.video_duration,
      currentPrice: campaign.current_price,
      originalPrice: campaign.original_price,
      discountPercentage: campaign.discount_percentage,
      priceCurrency: campaign.price_currency,
    }));

    res.json({
      success: true,
      data: formattedCampaigns,
      count: formattedCampaigns.length,
    });
  } catch (error) {
    console.error('Campaigns list error:', error);
    res.status(500).json({
      success: false,
      error: 'Kampanyalar yüklenirken bir hata oluştu',
      message: error.message,
    });
  }
});

/**
 * GET /campaigns/search
 * Kampanyaları arama terimine göre arar
 * Query params:
 *   - ?q=arama terimi (zorunlu)
 *   - ?sourceNames=Akbank,Yapı Kredi (opsiyonel)
 *   - ?category=main|light|category (opsiyonel)
 *   - ?startDate=2026-01-01 (opsiyonel)
 *   - ?endDate=2026-12-31 (opsiyonel)
 */
router.get('/search', async (req, res) => {
  try {
    const searchTerm = req.query.q;
    
    if (!searchTerm || searchTerm.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Arama terimi gerekli',
        message: 'q parametresi boş olamaz',
      });
    }

    let sourceIds = null;

    // sourceNames parametresi varsa (Flutter'dan geliyor)
    if (req.query.sourceNames) {
      try {
        const sourceNames = req.query.sourceNames
          .split(',')
          .map((name) => name.trim().toLowerCase())
          .filter((name) => name.length > 0);
        
        if (sourceNames.length > 0) {
          const Source = require('../models/Source');
          const allSources = await Source.findAll();
          sourceIds = allSources
            .filter((source) => {
              const normalizedSourceName = (source.name || '').trim().toLowerCase();
              return sourceNames.includes(normalizedSourceName);
            })
            .map((source) => source.id);
        }
      } catch (sourceErr) {
        console.warn('Campaigns/search: sourceNames filter failed, falling back to all', sourceErr.message);
        sourceIds = null;
      }
    } else if (req.query.sourceIds) {
      sourceIds = req.query.sourceIds.split(',').filter((id) => id.trim());
    }

    // Filtreler
    const filters = {};
    if (req.query.category) {
      filters.category = req.query.category;
    }
    if (req.query.startDate) {
      filters.startDate = req.query.startDate;
    }
    if (req.query.endDate) {
      filters.endDate = req.query.endDate;
    }

    const campaigns = await Campaign.search(searchTerm, sourceIds, filters);

    // Flutter uygulaması için format
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
      sourceLatitude: campaign.source_latitude,
      sourceLongitude: campaign.source_longitude,
      sourceCity: campaign.source_city,
      videoUrl: campaign.video_url,
      videoThumbnailUrl: campaign.video_thumbnail_url,
      videoDuration: campaign.video_duration,
      currentPrice: campaign.current_price,
      originalPrice: campaign.original_price,
      discountPercentage: campaign.discount_percentage,
      priceCurrency: campaign.price_currency,
    }));

    res.json({
      success: true,
      data: formattedCampaigns,
      count: formattedCampaigns.length,
      searchTerm: searchTerm,
    });
  } catch (error) {
    console.error('Campaigns/search error:', error.message);
    console.error('Campaigns/search stack:', error.stack);
    res.status(500).json({
      success: false,
      error: 'Arama yapılırken bir hata oluştu',
      message: error.message,
    });
  }
});

/**
 * GET /campaigns/all
 * TÜM aktif kampanyaları getirir (feed type'a bakmaz)
 * Main feed guard'ı bypass eder
 * Sadece is_active = true ve expires_at > NOW() kontrol eder
 */
router.get('/all', async (req, res) => {
  try {
    let sourceIds = null;

    // sourceNames parametresi varsa (Flutter'dan geliyor)
    if (req.query.sourceNames) {
      try {
        const sourceNames = req.query.sourceNames
          .split(',')
          .map((name) => name.trim().toLowerCase())
          .filter((name) => name.length > 0);
        
        if (sourceNames.length > 0) {
          const Source = require('../models/Source');
          const allSources = await Source.findAll();
          sourceIds = allSources
            .filter((source) => {
              const normalizedSourceName = (source.name || '').trim().toLowerCase();
              return sourceNames.includes(normalizedSourceName);
            })
            .map((source) => source.id);
        }
      } catch (sourceErr) {
        console.warn('Campaigns/all: sourceNames filter failed, falling back to all campaigns', sourceErr.message);
        sourceIds = null;
      }
    } else if (req.query.sourceIds) {
      sourceIds = req.query.sourceIds.split(',').filter((id) => id.trim());
    }

    // Tüm aktif kampanyaları getir (feed type'a bakmaz)
    const campaigns = await Campaign.findAllActive(sourceIds);

    // Flutter uygulaması için format
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
      campaignType: campaign.campaign_type, // Feed type bilgisi
      valueLevel: campaign.value_level, // Value level bilgisi
    }));

    res.json({
      success: true,
      data: formattedCampaigns,
      count: formattedCampaigns.length,
    });
  } catch (error) {
    console.error('Campaigns/all list error:', error.message);
    console.error('Campaigns/all stack:', error.stack);
    res.status(500).json({
      success: false,
      error: 'Kampanyalar yüklenirken bir hata oluştu',
      message: error.message,
    });
  }
});

/**
 * GET /campaigns/low-value
 * FAZ 7.5: Low value feed kampanyalarını getirir
 * Sadece value_level = 'low' olanları döndürür
 * NOT: Varsayılan olarak kapalı, kullanıcı açıkça istemeden gösterilmez
 */
router.get('/low-value', async (req, res) => {
  try {
    let sourceIds = null;

    // sourceNames parametresi varsa (Flutter'dan geliyor)
    if (req.query.sourceNames) {
      const sourceNames = req.query.sourceNames
        .split(',')
        .map((name) => name.trim().toLowerCase())
        .filter((name) => name.length > 0);
      
      // Source name'lerden ID'lere çevir (case-insensitive)
      const Source = require('../models/Source');
      const allSources = await Source.findAll();
      sourceIds = allSources
        .filter((source) => {
          const normalizedSourceName = (source.name || '').trim().toLowerCase();
          return sourceNames.includes(normalizedSourceName);
        })
        .map((source) => source.id);
    } else if (req.query.sourceIds) {
      // sourceIds parametresi varsa
      sourceIds = req.query.sourceIds.split(',').filter((id) => id.trim());
    }

    const campaigns = await Campaign.findAllLowValue(sourceIds);

    // Flutter uygulaması için format
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
      campaignType: campaign.campaign_type || 'main',
      valueLevel: campaign.value_level || 'high',
    }));

    res.json({
      success: true,
      data: formattedCampaigns,
      count: formattedCampaigns.length,
      warning: 'Bu kampanyalar düşük değerli olarak işaretlenmiştir. Varsayılan olarak gösterilmezler.',
    });
  } catch (error) {
    console.error('Low value campaigns list error:', error);
    res.status(500).json({
      success: false,
      error: 'Low value kampanyalar yüklenirken bir hata oluştu',
      message: error.message,
    });
  }
});

/**
 * GET /campaigns/category
 * FAZ 7.2: Category feed kampanyalarını getirir
 * Sadece campaign_type = 'category' ve show_in_category_feed = true olanları döndürür
 */
router.get('/category', async (req, res) => {
  try {
    let sourceIds = null;

    // sourceNames parametresi varsa (Flutter'dan geliyor)
    if (req.query.sourceNames) {
      const sourceNames = req.query.sourceNames
        .split(',')
        .map((name) => name.trim().toLowerCase())
        .filter((name) => name.length > 0);
      
      // Source name'lerden ID'lere çevir (case-insensitive)
      const Source = require('../models/Source');
      const allSources = await Source.findAll();
      sourceIds = allSources
        .filter((source) => {
          const normalizedSourceName = (source.name || '').trim().toLowerCase();
          return sourceNames.includes(normalizedSourceName);
        })
        .map((source) => source.id);
    } else if (req.query.sourceIds) {
      // sourceIds parametresi varsa
      sourceIds = req.query.sourceIds.split(',').filter((id) => id.trim());
    }

    const campaigns = await Campaign.findAllCategory(sourceIds);

    // Flutter uygulaması için format
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
      campaignType: campaign.campaign_type || 'main',
    }));

    res.json({
      success: true,
      data: formattedCampaigns,
      count: formattedCampaigns.length,
    });
  } catch (error) {
    console.error('Category campaigns list error:', error);
    res.status(500).json({
      success: false,
      error: 'Category kampanyalar yüklenirken bir hata oluştu',
      message: error.message,
    });
  }
});

/**
 * GET /campaigns/light
 * FAZ 7.3: Light feed kampanyalarını getirir
 * Sadece campaign_type = 'light' ve show_in_light_feed = true olanları döndürür
 */
router.get('/light', async (req, res) => {
  try {
    let sourceIds = null;

    // sourceNames parametresi varsa (Flutter'dan geliyor)
    if (req.query.sourceNames) {
      const sourceNames = req.query.sourceNames
        .split(',')
        .map((name) => name.trim().toLowerCase())
        .filter((name) => name.length > 0);
      
      // Source name'lerden ID'lere çevir (case-insensitive)
      const Source = require('../models/Source');
      const allSources = await Source.findAll();
      sourceIds = allSources
        .filter((source) => {
          const normalizedSourceName = (source.name || '').trim().toLowerCase();
          return sourceNames.includes(normalizedSourceName);
        })
        .map((source) => source.id);
    } else if (req.query.sourceIds) {
      // sourceIds parametresi varsa
      sourceIds = req.query.sourceIds.split(',').filter((id) => id.trim());
    }

    const campaigns = await Campaign.findAllLight(sourceIds);

    // Flutter uygulaması için format
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
      campaignType: campaign.campaign_type || 'main',
    }));

    res.json({
      success: true,
      data: formattedCampaigns,
      count: formattedCampaigns.length,
    });
  } catch (error) {
    console.error('Light campaigns list error:', error);
    res.status(500).json({
      success: false,
      error: 'Light kampanyalar yüklenirken bir hata oluştu',
      message: error.message,
    });
  }
});

/**
 * GET /campaigns/expiring-soon
 * Yakında bitecek kampanyaları getirir
 * Query params: ?days=7 (varsayılan: 7 gün), ?sourceNames=Akbank,Yapı Kredi (opsiyonel)
 */
router.get('/expiring-soon', async (req, res) => {
  try {
    const days = parseInt(req.query.days) || 7;
    let sourceIds = null;

    // sourceNames parametresi varsa
    if (req.query.sourceNames) {
      const sourceNames = req.query.sourceNames
        .split(',')
        .map((name) => name.trim().toLowerCase())
        .filter((name) => name.length > 0);
      
      const Source = require('../models/Source');
      const allSources = await Source.findAll();
      sourceIds = allSources
        .filter((source) => {
          const normalizedSourceName = (source.name || '').trim().toLowerCase();
          return sourceNames.includes(normalizedSourceName);
        })
        .map((source) => source.id);
    }

    const campaigns = await Campaign.findExpiringSoon(days, sourceIds);

    // Flutter uygulaması için format
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
      sourceLatitude: campaign.source_latitude,
      sourceLongitude: campaign.source_longitude,
      sourceCity: campaign.source_city,
      videoUrl: campaign.video_url,
      videoThumbnailUrl: campaign.video_thumbnail_url,
      videoDuration: campaign.video_duration,
      currentPrice: campaign.current_price,
      originalPrice: campaign.original_price,
      discountPercentage: campaign.discount_percentage,
      priceCurrency: campaign.price_currency,
    }));

    res.json({
      success: true,
      data: formattedCampaigns,
      count: formattedCampaigns.length,
      days,
    });
  } catch (error) {
    console.error('Expiring soon campaigns error:', error);
    res.status(500).json({
      success: false,
      error: 'Yakında bitecek kampanyalar yüklenirken bir hata oluştu',
      message: error.message,
    });
  }
});

/**
 * GET /campaigns/:id
 * Tek bir kampanyanın detayını getirir
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const campaign = await Campaign.findById(id);

    if (!campaign) {
      return res.status(404).json({
        success: false,
        error: 'Kampanya bulunamadı',
      });
    }

    // Flutter uygulaması için format
    const formattedCampaign = {
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
      logoColor: campaign.icon_color || '#DC2626',
    };

    res.json({
      success: true,
      data: formattedCampaign,
    });
  } catch (error) {
    console.error('Campaign detail error:', error);
    res.status(500).json({
      success: false,
      error: 'Kampanya detayı yüklenirken bir hata oluştu',
      message: error.message,
    });
  }
});

/**
 * POST /campaigns/:id/click
 * Kampanya tıklama event'ini kaydeder
 * 
 * Body: {} (boş, sadece click kaydı için)
 * 
 * Response:
 * {
 *   "success": true,
 *   "data": {
 *     "clickId": "uuid",
 *     "redirectUrl": "https://..." (affiliate_url veya original_url)
 *   }
 * }
 */
router.post('/:id/click', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Campaign var mı kontrol et
    const campaign = await Campaign.findById(id);
    if (!campaign) {
      return res.status(404).json({
        success: false,
        error: 'Kampanya bulunamadı',
      });
    }
    
    // User ID (Firebase Auth'dan gelecek, şimdilik null olabilir)
    const userId = req.user?.uid || null; // Auth middleware eklendikten sonra
    
    // Click kaydı oluştur (sadeleştirilmiş, IP/user-agent YOK)
    const clickRecord = await CampaignClick.create({
      campaignId: id,
      userId,
    });
    
    // Redirect URL belirle (affiliate_url varsa onu kullan, yoksa original_url)
    const redirectUrl = campaign.affiliate_url || campaign.original_url;
    
    res.json({
      success: true,
      data: {
        clickId: clickRecord.id,
        redirectUrl,
      },
    });
  } catch (error) {
    console.error('Campaign click error:', error);
    res.status(500).json({
      success: false,
      error: 'Tıklama kaydedilirken bir hata oluştu',
      message: error.message,
    });
  }
});

/**
 * POST /campaigns
 * Yeni kampanya oluşturur veya duplicate ise günceller
 * Bot tarafından kullanılır
 */
router.post('/', validateCampaignQuality, async (req, res) => {
  try {
    const {
      sourceName,
      title,
      description,
      detailText,
      campaignUrl,
      affiliateUrl, // YENİ
      startDate,
      endDate,
      howToUse,
      category,
      tags,
      channel,
      campaignType, // FAZ 7.3: 'main' | 'light' | 'category'
      showInLightFeed, // FAZ 7.3: boolean
      showInCategoryFeed, // FAZ 7.2: boolean
      valueLevel, // FAZ 7.5: 'high' | 'low'
      confidence_score: bodyConfidence,
      confidence_reasons: bodyReasons,
    } = req.body;
    const confidence_score = bodyConfidence != null ? Number(bodyConfidence) : 50;
    const confidence_reasons = Array.isArray(bodyReasons) ? bodyReasons : ['fallback_default'];

    // Validasyon: Zorunlu alanlar
    if (!sourceName || !title || !campaignUrl || !endDate) {
      return res.status(400).json({
        success: false,
        error: 'Eksik alanlar',
        message: 'sourceName, title, campaignUrl ve endDate zorunludur',
      });
    }

    // Validasyon: title trim + min length
    const trimmedTitle = (title || '').trim();
    if (trimmedTitle.length < 3) {
      return res.status(400).json({
        success: false,
        error: 'Geçersiz başlık',
        message: 'Başlık en az 3 karakter olmalıdır',
      });
    }

    // Validasyon: campaignUrl gerçek URL
    let parsedUrl;
    try {
      parsedUrl = new URL(campaignUrl);
      if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
        throw new Error('Invalid protocol');
      }
    } catch (urlError) {
      return res.status(400).json({
        success: false,
        error: 'Geçersiz URL',
        message: 'campaignUrl geçerli bir HTTP/HTTPS URL olmalıdır',
      });
    }

    // Validasyon: endDate ISO date parse
    const expiresAt = new Date(endDate);
    if (isNaN(expiresAt.getTime())) {
      return res.status(400).json({
        success: false,
        error: 'Geçersiz tarih',
        message: 'endDate geçerli bir ISO tarih formatı olmalıdır',
      });
    }

    // Validasyon: startDate (opsiyonel ama geçerli olmalı)
    let startsAt = null;
    if (startDate) {
      startsAt = new Date(startDate);
      if (isNaN(startsAt.getTime())) {
        return res.status(400).json({
          success: false,
          error: 'Geçersiz tarih',
          message: 'startDate geçerli bir ISO tarih formatı olmalıdır',
        });
      }
    }

    // Validasyon: category allowlist (opsiyonel)
    const allowedCategories = ['discount', 'cashback', 'points', 'gift', 'other'];
    if (category && !allowedCategories.includes(category)) {
      return res.status(400).json({
        success: false,
        error: 'Geçersiz kategori',
        message: `category şunlardan biri olmalıdır: ${allowedCategories.join(', ')}`,
      });
    }

    // Validasyon: channel allowlist (opsiyonel)
    const allowedChannels = ['online', 'offline', 'both'];
    if (channel && !allowedChannels.includes(channel)) {
      return res.status(400).json({
        success: false,
        error: 'Geçersiz kanal',
        message: `channel şunlardan biri olmalıdır: ${allowedChannels.join(', ')}`,
      });
    }

    // Source name'den source ID'ye çevir (case-insensitive)
    const sourceId = await Campaign.getSourceIdByName(sourceName);
    if (!sourceId) {
      return res.status(400).json({
        success: false,
        error: 'Geçersiz kaynak',
        message: `Kaynak bulunamadı: ${sourceName}`,
      });
    }

    // Duplicate kontrolü (startDate dahil)
    const duplicate = await Campaign.findDuplicate(campaignUrl, sourceId, trimmedTitle, startsAt, expiresAt);

    if (duplicate) {
      // Duplicate varsa güncelle (PUT davranışı)
      // Canonical field names (DB kolon isimleri)
      const updates = {
        title: trimmedTitle,
        description: (description || '').trim() || duplicate.description || '',
        detail_text: (detailText || '').trim() || duplicate.detail_text || '',
        original_url: campaignUrl,
        affiliate_url: affiliateUrl || null, // YENİ
        expires_at: expiresAt,
        status: 'active',
        is_active: true,
      };

      // JSONB alanlar: explicit stringify
      if (howToUse && Array.isArray(howToUse)) {
        updates.how_to_use = howToUse;
      } else if (duplicate.how_to_use) {
        updates.how_to_use = duplicate.how_to_use;
      }

      if (channel && allowedChannels.includes(channel)) {
        updates.validity_channels = [channel];
      } else if (duplicate.validity_channels) {
        updates.validity_channels = duplicate.validity_channels;
      }

      if (tags && Array.isArray(tags)) {
        updates.tags = tags;
      } else if (duplicate.tags) {
        updates.tags = duplicate.tags;
      }

      if (startsAt) {
        updates.starts_at = startsAt;
      }

      let applied_action = 'allow';
      if (confidence_score < 40) {
        updates.value_level = 'low';
        applied_action = 'downgrade';
      } else if (confidence_score >= 40 && confidence_score <= 70) {
        console.log('low confidence campaign accepted (40–70):', { title: trimmedTitle, score: confidence_score });
      }

      const updated = await Campaign.update(duplicate.id, updates);

      if (applied_action === 'downgrade') {
        try {
          await AuditLogService.logAdminAction({
            adminId: 'system_confidence_guard',
            action: 'confidence_downgrade',
            entityType: 'campaign',
            entityId: duplicate.id,
            newValue: { original_confidence_score: confidence_score, applied_action: 'downgrade' },
            reason: 'low_confidence',
            metadata: { original_confidence_score: confidence_score, applied_action: 'downgrade' },
          });
        } catch (_) {}
      }

      return res.json({
        success: true,
        data: updated,
        message: 'Kampanya güncellendi (duplicate)',
        isUpdate: true,
        low_confidence: applied_action === 'downgrade' || applied_action === 'hide',
        applied_action,
      });
    }

    let applied_action = 'allow';
    if (confidence_score < 40) {
      applied_action = 'downgrade';
    } else if (confidence_score >= 40 && confidence_score <= 70) {
      console.log('low confidence campaign accepted (40–70):', { title: trimmedTitle, score: confidence_score });
    }

    const campaignData = {
      sourceId,
      title: trimmedTitle,
      description: (description || '').trim(),
      detailText: (detailText || '').trim(),
      iconName: 'local_offer',
      iconColor: '#DC2626',
      iconBgColor: '#FEE2E2',
      tags: Array.isArray(tags) ? tags : [],
      originalUrl: campaignUrl,
      affiliateUrl: affiliateUrl || null, // YENİ
      expiresAt,
      howToUse: Array.isArray(howToUse) ? howToUse : [],
      validityChannels: channel && allowedChannels.includes(channel) ? [channel] : [],
      status: 'active',
      campaignType: campaignType || 'main', // FAZ 7.3: default 'main'
      showInLightFeed: showInLightFeed || false, // FAZ 7.3: default false
      showInCategoryFeed: showInCategoryFeed || false, // FAZ 7.2: default false
      valueLevel: applied_action === 'downgrade' ? 'low' : (valueLevel || 'high'), // FAZ 13.3: confidence < 40 → low
    };

    if (startsAt) {
      campaignData.startsAt = startsAt;
    }

    // Runtime safety check (FAZ 10: Final Safety Validation)
    // Bot pipeline should not send invalid states
    try {
      assertBotPipelineUntouched(campaignData, 'POST /campaigns');
      
      // If this is a fetch pipeline campaign (light/category), check isolation
      if (campaignData.campaignType === 'light' || campaignData.campaignType === 'category') {
        assertFetchPipelineIsolated([campaignData], 'POST /campaigns');
      }
    } catch (error) {
      console.error('❌ SAFETY CHECK FAILED:', error.message);
      return res.status(400).json({
        success: false,
        error: 'Bot pipeline safety check failed',
        message: error.message,
      });
    }

    const newCampaign = await Campaign.create(campaignData);

    if (applied_action === 'downgrade') {
      try {
        await AuditLogService.logAdminAction({
          adminId: 'system_confidence_guard',
          action: 'confidence_downgrade',
          entityType: 'campaign',
          entityId: newCampaign.id,
          newValue: { original_confidence_score: confidence_score, applied_action: 'downgrade' },
          reason: 'low_confidence',
          metadata: { original_confidence_score: confidence_score, applied_action: 'downgrade' },
        });
      } catch (_) {}
    }

    res.status(201).json({
      success: true,
      data: newCampaign,
      message: 'Kampanya oluşturuldu',
      isUpdate: false,
      low_confidence: applied_action === 'downgrade' || applied_action === 'hide',
      applied_action,
    });
  } catch (error) {
    console.error('Campaign create error:', error);
    res.status(500).json({
      success: false,
      error: 'Kampanya oluşturulurken bir hata oluştu',
      message: error.message,
    });
  }
});

/**
 * PUT /campaigns/:id
 * Mevcut kampanyayı günceller
 */
router.put('/:id', validateCampaignQuality, async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    // Kampanya var mı kontrol et
    const existing = await Campaign.findById(id);
    if (!existing) {
      return res.status(404).json({
        success: false,
        error: 'Kampanya bulunamadı',
      });
    }

    // Güncelleme verilerini hazırla
    const updateData = {};
    if (updates.title) updateData.title = updates.title;
    if (updates.description) updateData.description = updates.description;
    if (updates.detailText) updateData.detail_text = updates.detailText;
    if (updates.campaignUrl) updateData.original_url = updates.campaignUrl;
    if (updates.endDate) updateData.expires_at = new Date(updates.endDate);
    if (updates.howToUse) updateData.how_to_use = updates.howToUse;
    if (updates.tags) updateData.tags = updates.tags;
    if (updates.channel) updateData.validity_channels = [updates.channel];

    const updated = await Campaign.update(id, updateData);

    res.json({
      success: true,
      data: updated,
      message: 'Kampanya güncellendi',
    });
  } catch (error) {
    console.error('Campaign update error:', error);
    res.status(500).json({
      success: false,
      error: 'Kampanya güncellenirken bir hata oluştu',
      message: error.message,
    });
  }
});

module.exports = router;
