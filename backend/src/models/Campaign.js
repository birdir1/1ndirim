const pool = require('../config/database');
const { 
  buildMainFeedQuery, 
  assertMainFeedIntegrity,
  validateMainFeedResults 
} = require('../utils/mainFeedGuard');
const { runSafetyChecks } = require('../utils/safetyGuards');

class Campaign {
  /**
   * Tüm aktif kampanyaları getirir (SADECE campaign_type = 'main')
   * FAZ 7.3: Ana akış sadece main kampanyaları gösterir
   * 
   * PROTECTED BY MAIN FEED GUARD:
   * - campaign_type = 'main' OR NULL (enforced)
   * - value_level = 'high' OR NULL (enforced)
   * - is_hidden = false OR NULL (enforced)
   * 
   * These rules CANNOT be bypassed, even by admin actions
   * 
   * @param {Array<string>} sourceIds - Filtreleme için source ID'leri (opsiyonel)
   * @returns {Promise<Array>}
   */
  static async findAll(sourceIds = null) {
    // Base query (SELECT and JOIN)
    const baseQuery = `
      SELECT 
        c.*,
        s.name as source_name,
        s.type as source_type,
        s.logo_url as source_logo_url
      FROM campaigns c
      INNER JOIN sources s ON c.source_id = s.id
    `;

    // Build query with guard (ensures main feed rules are ALWAYS enforced)
    const { query, params } = buildMainFeedQuery(baseQuery, [], sourceIds);

    // Execute query
    const result = await pool.query(query, params);
    const campaigns = result.rows;

    // Validate results (assertion - throws error if pollution detected)
    // In production, this ensures main feed integrity
    const validation = validateMainFeedResults(campaigns);
    if (!validation.valid) {
      // Log error for monitoring
      console.error('❌ MAIN FEED POLLUTION DETECTED:', validation.errors);
      // Assert integrity (throws error in development, logs in production)
      if (process.env.NODE_ENV === 'development') {
        assertMainFeedIntegrity(campaigns);
      }
      // In production, return empty array as fail-safe
      // This prevents polluted campaigns from reaching users
      return [];
    }
    
    // Runtime safety check (FAZ 10: Final Safety Validation)
    try {
      runSafetyChecks({
        campaigns,
        feedType: 'main',
        context: 'Campaign.findAll()',
      });
    } catch (error) {
      console.error('❌ SAFETY CHECK FAILED:', error.message);
      // In production, return empty array as fail-safe
      if (process.env.NODE_ENV === 'production') {
        return [];
      }
      // In development, throw error to fail fast
      throw error;
    }

    return campaigns;
  }

  /**
   * TÜM aktif kampanyaları getirir (feed type'a bakmaz)
   * Main feed guard'ı bypass eder
   * Sadece is_active = true ve expires_at > NOW() kontrol eder
   * 
   * @param {Array<string>} sourceIds - Filtreleme için source ID'leri (opsiyonel)
   * @returns {Promise<Array>}
   */
  static async findAllActive(sourceIds = null) {
    let query = `
      SELECT 
        c.*,
        s.name as source_name,
        s.type as source_type,
        s.logo_url as source_logo_url
      FROM campaigns c
      INNER JOIN sources s ON c.source_id = s.id
      WHERE c.is_active = true
        AND c.expires_at > NOW()
        AND (c.is_hidden = false OR c.is_hidden IS NULL)
    `;

    const params = [];

    if (sourceIds && sourceIds.length > 0) {
      query += ` AND c.source_id = ANY($${params.length + 1}::uuid[])`;
      params.push(sourceIds);
    }

    query += ` ORDER BY c.is_pinned DESC, c.pinned_at DESC NULLS LAST, c.created_at DESC`;

    const result = await pool.query(query, params);
    return result.rows;
  }

  /**
   * Light feed kampanyalarını getirir (FAZ 7.3)
   * @param {Array<string>} sourceIds - Filtreleme için source ID'leri (opsiyonel)
   * @returns {Promise<Array>}
   */
  static async findAllLight(sourceIds = null) {
    let query = `
      SELECT 
        c.*,
        s.name as source_name,
        s.type as source_type,
        s.logo_url as source_logo_url
      FROM campaigns c
      INNER JOIN sources s ON c.source_id = s.id
      WHERE c.is_active = true
        AND c.expires_at > NOW()
        AND c.campaign_type = 'light'
        AND c.show_in_light_feed = true
    `;

    const params = [];

    if (sourceIds && sourceIds.length > 0) {
      query += ` AND c.source_id = ANY($1::uuid[])`;
      params.push(sourceIds);
    }

    query += ` ORDER BY c.is_pinned DESC, c.pinned_at DESC NULLS LAST, c.created_at DESC`;

    const result = await pool.query(query, params);
    const campaigns = result.rows;
    
    // Runtime safety check (FAZ 10: Final Safety Validation)
    try {
      runSafetyChecks({
        campaigns,
        feedType: 'light',
        context: 'Campaign.findAllLight()',
      });
    } catch (error) {
      console.error('❌ SAFETY CHECK FAILED:', error.message);
      // In production, return empty array as fail-safe
      if (process.env.NODE_ENV === 'production') {
        return [];
      }
      // In development, throw error to fail fast
      throw error;
    }
    
    return campaigns;
  }

  /**
   * Category feed kampanyalarını getirir (FAZ 7.2)
   * @param {Array<string>} sourceIds - Filtreleme için source ID'leri (opsiyonel)
   * @returns {Promise<Array>}
   */
  static async findAllCategory(sourceIds = null) {
    let query = `
      SELECT 
        c.*,
        s.name as source_name,
        s.type as source_type,
        s.logo_url as source_logo_url
      FROM campaigns c
      INNER JOIN sources s ON c.source_id = s.id
      WHERE c.is_active = true
        AND c.expires_at > NOW()
        AND (c.is_hidden = false OR c.is_hidden IS NULL)
        AND (c.campaign_type != 'hidden' OR c.campaign_type IS NULL)
        AND c.campaign_type = 'category'
        AND c.show_in_category_feed = true
    `;

    const params = [];

    if (sourceIds && sourceIds.length > 0) {
      query += ` AND c.source_id = ANY($1::uuid[])`;
      params.push(sourceIds);
    }

    query += ` ORDER BY c.is_pinned DESC, c.pinned_at DESC NULLS LAST, c.created_at DESC`;

    const result = await pool.query(query, params);
    const campaigns = result.rows;
    
    // Runtime safety check (FAZ 10: Final Safety Validation)
    try {
      runSafetyChecks({
        campaigns,
        feedType: 'category',
        context: 'Campaign.findAllCategory()',
      });
    } catch (error) {
      console.error('❌ SAFETY CHECK FAILED:', error.message);
      // In production, return empty array as fail-safe
      if (process.env.NODE_ENV === 'production') {
        return [];
      }
      // In development, throw error to fail fast
      throw error;
    }
    
    return campaigns;
  }

  /**
   * Low value feed kampanyalarını getirir (FAZ 7.5)
   * @param {Array<string>} sourceIds - Filtreleme için source ID'leri (opsiyonel)
   * @returns {Promise<Array>}
   */
  static async findAllLowValue(sourceIds = null) {
    let query = `
      SELECT 
        c.*,
        s.name as source_name,
        s.type as source_type,
        s.logo_url as source_logo_url
      FROM campaigns c
      INNER JOIN sources s ON c.source_id = s.id
      WHERE c.is_active = true
        AND c.expires_at > NOW()
        AND (c.is_hidden = false OR c.is_hidden IS NULL)
        AND (c.campaign_type != 'hidden' OR c.campaign_type IS NULL)
        AND c.value_level = 'low'
    `;

    const params = [];

    if (sourceIds && sourceIds.length > 0) {
      query += ` AND c.source_id = ANY($1::uuid[])`;
      params.push(sourceIds);
    }

    query += ` ORDER BY c.is_pinned DESC, c.pinned_at DESC NULLS LAST, c.created_at DESC`;

    const result = await pool.query(query, params);
    const campaigns = result.rows;
    
    // Runtime safety check (FAZ 10: Final Safety Validation)
    try {
      runSafetyChecks({
        campaigns,
        feedType: 'low',
        context: 'Campaign.findAllLowValue()',
      });
    } catch (error) {
      console.error('❌ SAFETY CHECK FAILED:', error.message);
      // In production, return empty array as fail-safe
      if (process.env.NODE_ENV === 'production') {
        return [];
      }
      // In development, throw error to fail fast
      throw error;
    }
    
    return campaigns;
  }

  /**
   * ID'ye göre kampanya getirir
   * @param {string} id - Campaign UUID
   * @returns {Promise<Object|null>}
   */
  static async findById(id) {
    const query = `
      SELECT 
        c.*,
        s.name as source_name,
        s.type as source_type,
        s.logo_url as source_logo_url
      FROM campaigns c
      INNER JOIN sources s ON c.source_id = s.id
      WHERE c.id = $1
    `;

    const result = await pool.query(query, [id]);
    return result.rows[0] || null;
  }

  /**
   * Yeni kampanya oluşturur
   * @param {Object} campaignData
   * @returns {Promise<Object>}
   */
  static async create(campaignData) {
    const {
      sourceId,
      title,
      description,
      detailText,
      iconName,
      iconColor,
      iconBgColor,
      tags,
      originalUrl,
      affiliateUrl, // YENİ
      expiresAt,
      startsAt, // startDate support
      howToUse,
      validityChannels,
      status,
      campaignType, // FAZ 7.3: 'main' | 'light' | 'category'
      showInLightFeed, // FAZ 7.3: boolean
      showInCategoryFeed, // FAZ 7.2: boolean
      valueLevel, // FAZ 7.5: 'high' | 'low'
    } = campaignData;

    // JSONB alanlar: explicit stringify
    const tagsJson = JSON.stringify(Array.isArray(tags) ? tags : []);
    const howToUseJson = JSON.stringify(Array.isArray(howToUse) ? howToUse : []);
    const validityChannelsJson = JSON.stringify(Array.isArray(validityChannels) ? validityChannels : []);

    // starts_at kolonu varsa ekle, yoksa sadece expires_at
    const hasStartsAt = startsAt && !isNaN(new Date(startsAt).getTime());
    
    const fields = [
      'source_id', 'title', 'description', 'detail_text', 'icon_name',
      'icon_color', 'icon_bg_color', 'tags', 'original_url', 'affiliate_url', 'expires_at',
      'how_to_use', 'validity_channels', 'status', 'is_active',
      'campaign_type', 'show_in_light_feed', 'show_in_category_feed', 'value_level' // FAZ 7.3, FAZ 7.2, FAZ 7.5
      // created_at ve updated_at DEFAULT NOW() ile otomatik set ediliyor
    ];
    
    const values = [
      sourceId,
      title,
      description || '',
      detailText || '',
      iconName || 'local_offer',
      iconColor || '#DC2626',
      iconBgColor || '#FEE2E2',
      tagsJson,
      originalUrl,
      affiliateUrl || null, // YENİ
      expiresAt,
      howToUseJson,
      validityChannelsJson,
      status || 'active',
      true,
      campaignType || 'main', // FAZ 7.3: default 'main'
      showInLightFeed || false, // FAZ 7.3: default false
      showInCategoryFeed || false, // FAZ 7.2: default false
      valueLevel || 'high', // FAZ 7.5: default 'high'
    ];

    if (hasStartsAt) {
      const expiresAtIndex = fields.indexOf('expires_at');
      fields.splice(expiresAtIndex, 0, 'starts_at');
      values.splice(expiresAtIndex, 0, startsAt);
    }

    const placeholders = values.map((_, i) => `$${i + 1}`).join(', ');
    const fieldNames = fields.join(', ');

    const query = `
      INSERT INTO campaigns (${fieldNames})
      VALUES (${placeholders})
      RETURNING *
    `;

    const result = await pool.query(query, values);
    return result.rows[0];
  }

  /**
   * Kampanyayı günceller
   * @param {string} id
   * @param {Object} updates
   * @returns {Promise<Object|null>}
   */
  static async update(id, updates) {
    const fields = [];
    const values = [];
    let paramIndex = 1;

    // Canonical field mapping: camelCase -> snake_case (DB kolon isimleri)
    const fieldMapping = {
      howToUse: 'how_to_use',
      validityChannels: 'validity_channels',
      detailText: 'detail_text',
      originalUrl: 'original_url',
      expiresAt: 'expires_at',
      startsAt: 'starts_at',
      iconName: 'icon_name',
      iconColor: 'icon_color',
      iconBgColor: 'icon_bg_color',
      isActive: 'is_active',
    };

    // JSONB alanlar: explicit stringify
    const jsonbFields = ['tags', 'how_to_use', 'validity_channels'];

    Object.keys(updates).forEach((key) => {
      // Canonical field name (DB kolon ismi)
      const dbFieldName = fieldMapping[key] || key;

      if (jsonbFields.includes(dbFieldName)) {
        // JSONB alanlar: explicit stringify
        fields.push(`${dbFieldName} = $${paramIndex}::jsonb`);
        values.push(JSON.stringify(updates[key]));
      } else {
        fields.push(`${dbFieldName} = $${paramIndex}`);
        values.push(updates[key]);
      }
      paramIndex++;
    });

    fields.push(`updated_at = NOW()`);
    values.push(id);

    const query = `
      UPDATE campaigns
      SET ${fields.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING *
    `;

    const result = await pool.query(query, values);
    return result.rows[0] || null;
  }

  /**
   * Süresi dolmuş kampanyaları pasif yapar
   * @returns {Promise<number>} - Güncellenen kayıt sayısı
   */
  static async deactivateExpired() {
    const query = `
      UPDATE campaigns
      SET is_active = false, updated_at = NOW()
      WHERE expires_at <= NOW() AND is_active = true
      RETURNING id
    `;

    const result = await pool.query(query);
    return result.rowCount;
  }

  /**
   * Duplicate kampanya kontrolü
   * @param {string} originalUrl - Kampanya URL'i (öncelikli)
   * @param {string} sourceId - Kaynak ID
   * @param {string} title - Başlık (normalize edilmiş)
   * @param {Date} startDate - Başlangıç tarihi
   * @param {Date} expiresAt - Bitiş tarihi
   * @returns {Promise<Object|null>} - Varsa mevcut kampanya, yoksa null
   */
  static async findDuplicate(originalUrl, sourceId, title, startDate, expiresAt) {
    // Normalize title (trim + lower for comparison)
    const normalizedTitle = (title || '').trim().toLowerCase();

    // Öncelik 1: originalUrl ile kontrol
    if (originalUrl) {
      const urlQuery = `
        SELECT * FROM campaigns
        WHERE original_url = $1 AND source_id = $2
        ORDER BY created_at DESC
        LIMIT 1
      `;
      const urlResult = await pool.query(urlQuery, [originalUrl, sourceId]);
      if (urlResult.rows.length > 0) {
        return urlResult.rows[0];
      }
    }

    // Öncelik 2: sourceId + normalizedTitle + startDate + expiresAt kontrolü
    // startDate null-safe: eğer startDate null ise, sadece title + expiresAt kontrol et
    if (startDate) {
      const hashQuery = `
        SELECT * FROM campaigns
        WHERE source_id = $1 
          AND LOWER(TRIM(title)) = $2
          AND starts_at = $3
          AND expires_at = $4
        ORDER BY created_at DESC
        LIMIT 1
      `;
      const hashResult = await pool.query(hashQuery, [sourceId, normalizedTitle, startDate, expiresAt]);
      if (hashResult.rows.length > 0) {
        return hashResult.rows[0];
      }
    } else {
      // startDate yoksa: sourceId + normalizedTitle + expiresAt
      const hashQuery = `
        SELECT * FROM campaigns
        WHERE source_id = $1 
          AND LOWER(TRIM(title)) = $2
          AND expires_at = $3
        ORDER BY created_at DESC
        LIMIT 1
      `;
      const hashResult = await pool.query(hashQuery, [sourceId, normalizedTitle, expiresAt]);
      if (hashResult.rows.length > 0) {
        return hashResult.rows[0];
      }
    }

    return null;
  }

  /**
   * Source name'den source ID'ye çevirir (case-insensitive)
   * @param {string} sourceName
   * @returns {Promise<string|null>} - Source ID veya null
   */
  static async getSourceIdByName(sourceName) {
    if (!sourceName || typeof sourceName !== 'string') {
      return null;
    }

    const Source = require('./Source');
    const sources = await Source.findAll();
    const normalizedInput = sourceName.trim().toLowerCase();
    
    const source = sources.find((s) => {
      const normalizedSourceName = (s.name || '').trim().toLowerCase();
      return normalizedSourceName === normalizedInput;
    });
    
    return source ? source.id : null;
  }
}

module.exports = Campaign;
