/**
 * Admin Dashboard Service
 * FAZ 10: Admin & Control Layer
 * 
 * Dashboard metrics and statistics
 * Read-only, optimized queries
 * No mutations
 */

const pool = require('../config/database');

class AdminDashboardService {
  /**
   * Gets dashboard overview
   * High-level metrics for admin dashboard
   * 
   * @returns {Promise<Object>} Overview data
   */
  static async getOverview() {
    const client = await pool.connect();
    
    try {
      // Single query for all counts (optimized)
      const result = await client.query(`
        SELECT 
          -- Total counts
          COUNT(*) FILTER (WHERE is_active = true) as total_active,
          COUNT(*) FILTER (WHERE is_active = false) as total_inactive,
          COUNT(*) as total_campaigns,
          
          -- Feed counts
          COUNT(*) FILTER (
            WHERE is_active = true 
            AND expires_at > NOW()
            AND (campaign_type = 'main' OR campaign_type IS NULL)
            AND (campaign_type != 'category' OR campaign_type IS NULL)
            AND (campaign_type != 'light' OR campaign_type IS NULL)
            AND (campaign_type != 'hidden' OR campaign_type IS NULL)
            AND (value_level = 'high' OR value_level IS NULL)
            AND (is_hidden = false OR is_hidden IS NULL)
          ) as main_feed_count,
          
          COUNT(*) FILTER (
            WHERE is_active = true 
            AND expires_at > NOW()
            AND campaign_type = 'light'
            AND show_in_light_feed = true
            AND (is_hidden = false OR is_hidden IS NULL)
            AND (campaign_type != 'hidden' OR campaign_type IS NULL)
          ) as light_feed_count,
          
          COUNT(*) FILTER (
            WHERE is_active = true 
            AND expires_at > NOW()
            AND campaign_type = 'category'
            AND show_in_category_feed = true
            AND (is_hidden = false OR is_hidden IS NULL)
            AND (campaign_type != 'hidden' OR campaign_type IS NULL)
          ) as category_feed_count,
          
          COUNT(*) FILTER (
            WHERE is_active = true 
            AND expires_at > NOW()
            AND value_level = 'low'
            AND (is_hidden = false OR is_hidden IS NULL)
            AND (campaign_type != 'hidden' OR campaign_type IS NULL)
          ) as low_value_feed_count,
          
          -- Special states
          COUNT(*) FILTER (WHERE is_hidden = true OR campaign_type = 'hidden') as hidden_count,
          COUNT(*) FILTER (WHERE is_pinned = true) as pinned_count,
          
          -- Expiring soon (next 7 days)
          COUNT(*) FILTER (
            WHERE is_active = true 
            AND expires_at > NOW()
            AND expires_at <= NOW() + INTERVAL '7 days'
          ) as expiring_soon_count,
          
          -- Expired
          COUNT(*) FILTER (
            WHERE is_active = true 
            AND expires_at <= NOW()
          ) as expired_count
        FROM campaigns
      `);
      
      const stats = result.rows[0];
      
      // Source status counts
      const sourceStats = await client.query(`
        SELECT 
          COUNT(*) FILTER (WHERE source_status = 'active' OR source_status IS NULL) as active_sources,
          COUNT(*) FILTER (WHERE source_status = 'backlog') as backlog_sources,
          COUNT(*) FILTER (WHERE source_status = 'hard_backlog') as hard_backlog_sources,
          COUNT(*) as total_sources
        FROM sources
        WHERE is_active = true
      `);
      
      const sourceCounts = sourceStats.rows[0];
      
      return {
        totals: {
          active: parseInt(stats.total_active) || 0,
          inactive: parseInt(stats.total_inactive) || 0,
          total: parseInt(stats.total_campaigns) || 0,
        },
        feeds: {
          main: parseInt(stats.main_feed_count) || 0,
          light: parseInt(stats.light_feed_count) || 0,
          category: parseInt(stats.category_feed_count) || 0,
          low_value: parseInt(stats.low_value_feed_count) || 0,
        },
        states: {
          hidden: parseInt(stats.hidden_count) || 0,
          pinned: parseInt(stats.pinned_count) || 0,
          expiring_soon: parseInt(stats.expiring_soon_count) || 0,
          expired: parseInt(stats.expired_count) || 0,
        },
        sources: {
          active: parseInt(sourceCounts.active_sources) || 0,
          backlog: parseInt(sourceCounts.backlog_sources) || 0,
          hard_backlog: parseInt(sourceCounts.hard_backlog_sources) || 0,
          total: parseInt(sourceCounts.total_sources) || 0,
        },
      };
    } finally {
      client.release();
    }
  }
  
  /**
   * Gets campaign statistics
   * Detailed statistics for admin dashboard
   * 
   * @returns {Promise<Object>} Statistics data
   */
  static async getStats() {
    const client = await pool.connect();
    
    try {
      // Campaign count per feed (detailed)
      const feedStats = await client.query(`
        SELECT 
          campaign_type,
          value_level,
          COUNT(*) as count
        FROM campaigns
        WHERE is_active = true
          AND expires_at > NOW()
          AND (is_hidden = false OR is_hidden IS NULL)
          AND (campaign_type != 'hidden' OR campaign_type IS NULL)
        GROUP BY campaign_type, value_level
        ORDER BY campaign_type, value_level
      `);
      
      // Hidden campaigns breakdown
      const hiddenStats = await client.query(`
        SELECT 
          campaign_type,
          COUNT(*) as count
        FROM campaigns
        WHERE is_hidden = true OR campaign_type = 'hidden'
        GROUP BY campaign_type
        ORDER BY campaign_type
      `);
      
      // Pinned campaigns breakdown
      const pinnedStats = await client.query(`
        SELECT 
          campaign_type,
          COUNT(*) as count
        FROM campaigns
        WHERE is_pinned = true
          AND is_active = true
          AND expires_at > NOW()
        GROUP BY campaign_type
        ORDER BY campaign_type
      `);
      
      // Expiring soon breakdown (next 7 days)
      const expiringStats = await client.query(`
        SELECT 
          campaign_type,
          COUNT(*) as count
        FROM campaigns
        WHERE is_active = true 
          AND expires_at > NOW()
          AND expires_at <= NOW() + INTERVAL '7 days'
          AND (is_hidden = false OR is_hidden IS NULL)
        GROUP BY campaign_type
        ORDER BY campaign_type
      `);
      
      // Source distribution (campaigns per source)
      const sourceStats = await client.query(`
        SELECT 
          s.name as source_name,
          COUNT(*) as count
        FROM campaigns c
        INNER JOIN sources s ON c.source_id = s.id
        WHERE c.is_active = true
          AND c.expires_at > NOW()
          AND (c.is_hidden = false OR c.is_hidden IS NULL)
        GROUP BY s.name
        ORDER BY count DESC
        LIMIT 10
      `);
      
      // Source status breakdown
      const sourceStatusStats = await client.query(`
        SELECT 
          source_status,
          COUNT(*) as count
        FROM sources
        WHERE is_active = true
        GROUP BY source_status
        ORDER BY source_status
      `);
      
      // Hard backlog sources with reasons
      const hardBacklogSources = await client.query(`
        SELECT 
          id,
          name,
          type,
          status_reason
        FROM sources
        WHERE source_status = 'hard_backlog'
          AND is_active = true
        ORDER BY name
      `);
      
      return {
        feed_distribution: feedStats.rows.map(row => ({
          campaign_type: row.campaign_type || 'null',
          value_level: row.value_level || 'null',
          count: parseInt(row.count) || 0,
        })),
        hidden_breakdown: hiddenStats.rows.map(row => ({
          campaign_type: row.campaign_type || 'null',
          count: parseInt(row.count) || 0,
        })),
        pinned_breakdown: pinnedStats.rows.map(row => ({
          campaign_type: row.campaign_type || 'null',
          count: parseInt(row.count) || 0,
        })),
        expiring_breakdown: expiringStats.rows.map(row => ({
          campaign_type: row.campaign_type || 'null',
          count: parseInt(row.count) || 0,
        })),
        top_sources: sourceStats.rows.map(row => ({
          source_name: row.source_name,
          count: parseInt(row.count) || 0,
        })),
        source_status_breakdown: sourceStatusStats.rows.map(row => ({
          status: row.source_status || 'active',
          count: parseInt(row.count) || 0,
        })),
        hard_backlog_sources: hardBacklogSources.rows.map(row => ({
          id: row.id,
          name: row.name,
          type: row.type,
          reason: row.status_reason,
        })),
      };
    } finally {
      client.release();
    }
  }
  
  /**
   * Gets campaigns with feed filter
   * Optimized query with safe pagination
   * 
   * @param {Object} filters - Filter parameters
   * @param {string} filters.feed_type - Feed type filter (main, light, category, low, hidden)
   * @param {boolean} filters.isActive - Active filter
   * @param {string} filters.sourceId - Source ID filter
   * @param {number} filters.limit - Limit (default: 50, max: 200)
   * @param {number} filters.offset - Offset (default: 0)
   * @returns {Promise<Object>} Campaigns with pagination info
   */
  static async getCampaignsWithFeedFilter(filters = {}) {
    const {
      feed_type = null,
      isActive = null,
      sourceId = null,
      category = null,
      includeExpired = false,
      q = null,
      sortBy = null,
      sortDir = null,
      limit = 50,
      offset = 0,
    } = filters;
    
    // Safe pagination limits
    const safeLimit = Math.min(Math.max(parseInt(limit) || 50, 1), 200);
    const safeOffset = Math.max(parseInt(offset) || 0, 0);
    
    const client = await pool.connect();
    
    try {
      // Build WHERE conditions
      let whereConditions = ['1=1'];
      const params = [];
      let paramIndex = 1;
      
      // Feed type filter
      if (feed_type) {
        if (feed_type === 'main') {
          whereConditions.push(`(c.campaign_type = 'main' OR c.campaign_type IS NULL)`);
          whereConditions.push(`(c.campaign_type != 'category' OR c.campaign_type IS NULL)`);
          whereConditions.push(`(c.campaign_type != 'light' OR c.campaign_type IS NULL)`);
          whereConditions.push(`(c.campaign_type != 'hidden' OR c.campaign_type IS NULL)`);
          whereConditions.push(`(c.value_level = 'high' OR c.value_level IS NULL)`);
          whereConditions.push(`(c.is_hidden = false OR c.is_hidden IS NULL)`);
        } else if (feed_type === 'light') {
          whereConditions.push(`c.campaign_type = 'light'`);
          whereConditions.push(`c.show_in_light_feed = true`);
          whereConditions.push(`(c.is_hidden = false OR c.is_hidden IS NULL)`);
          whereConditions.push(`(c.campaign_type != 'hidden' OR c.campaign_type IS NULL)`);
        } else if (feed_type === 'category') {
          whereConditions.push(`c.campaign_type = 'category'`);
          whereConditions.push(`c.show_in_category_feed = true`);
          whereConditions.push(`(c.is_hidden = false OR c.is_hidden IS NULL)`);
          whereConditions.push(`(c.campaign_type != 'hidden' OR c.campaign_type IS NULL)`);
        } else if (feed_type === 'low') {
          whereConditions.push(`c.value_level = 'low'`);
          whereConditions.push(`(c.is_hidden = false OR c.is_hidden IS NULL)`);
          whereConditions.push(`(c.campaign_type != 'hidden' OR c.campaign_type IS NULL)`);
        } else if (feed_type === 'hidden') {
          whereConditions.push(`(c.is_hidden = true OR c.campaign_type = 'hidden')`);
        }
      }
      
      // Active filter
      if (isActive !== null) {
        whereConditions.push(`c.is_active = $${paramIndex}`);
        params.push(isActive);
        paramIndex++;
      }
      
      // Source filter
      if (sourceId) {
        whereConditions.push(`c.source_id = $${paramIndex}`);
        params.push(sourceId);
        paramIndex++;
      }

      // Category filter (partial, case-insensitive)
      if (category && String(category).trim().length > 0) {
        whereConditions.push(`c.category ILIKE $${paramIndex}`);
        params.push(`%${String(category).trim()}%`);
        paramIndex++;
      }

      // Search query (partial, case-insensitive)
      if (q && String(q).trim().length > 0) {
        const qq = `%${String(q).trim()}%`;
        whereConditions.push(
          `(
            c.title ILIKE $${paramIndex}
            OR c.description ILIKE $${paramIndex}
            OR c.category ILIKE $${paramIndex}
            OR c.sub_category ILIKE $${paramIndex}
            OR c.original_url ILIKE $${paramIndex}
            OR c.affiliate_url ILIKE $${paramIndex}
            OR s.name ILIKE $${paramIndex}
          )`
        );
        params.push(qq);
        paramIndex++;
      }
      
      // Expiry filter (only for non-hidden feeds)
      // Admin list should show expired/pasif when explicitly requested.
      const shouldFilterExpiry = feed_type !== 'hidden' && !includeExpired && isActive !== false;
      if (shouldFilterExpiry) {
        whereConditions.push(`c.expires_at > NOW()`);
      }
      
      const whereClause = whereConditions.join(' AND ');

      // Server-side sorting (pinned is always prioritized)
      const sortColumn = (() => {
        const key = String(sortBy || '').toLowerCase();
        if (key === 'scraped_at') return 'c.scraped_at';
        if (key === 'expires_at') return 'c.expires_at';
        return 'c.created_at';
      })();
      const sortDirection = String(sortDir || '').toLowerCase() === 'asc' ? 'ASC' : 'DESC';
      
      // Count query (for pagination)
      const countQuery = `
        SELECT COUNT(*) as total
        FROM campaigns c
        INNER JOIN sources s ON c.source_id = s.id
        WHERE ${whereClause}
      `;
      
      const countResult = await client.query(countQuery, params);
      const total = parseInt(countResult.rows[0].total) || 0;
      
      // Data query
      const dataQuery = `
        SELECT 
          c.*,
          s.name as source_name,
          s.type as source_type,
          s.logo_url as source_logo_url
        FROM campaigns c
        INNER JOIN sources s ON c.source_id = s.id
        WHERE ${whereClause}
        ORDER BY
          c.is_pinned DESC,
          c.pinned_at DESC NULLS LAST,
          ${sortColumn} ${sortDirection} NULLS LAST,
          c.created_at DESC
        LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
      `;
      
      params.push(safeLimit, safeOffset);
      const dataResult = await client.query(dataQuery, params);
      
      return {
        data: dataResult.rows,
        pagination: {
          total,
          limit: safeLimit,
          offset: safeOffset,
          has_more: (safeOffset + safeLimit) < total,
          total_pages: Math.ceil(total / safeLimit),
          current_page: Math.floor(safeOffset / safeLimit) + 1,
        },
      };
    } finally {
      client.release();
    }
  }
}

module.exports = AdminDashboardService;
