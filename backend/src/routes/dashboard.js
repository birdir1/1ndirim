/**
 * Dashboard Stats API
 * Provides metrics for admin dashboard
 * 
 * Endpoints:
 * - GET /dashboard/stats - Overall system metrics
 * - GET /dashboard/sources - Source-level metrics
 */

const express = require('express');
const router = express.Router();
const pool = require('../config/database');

/**
 * GET /dashboard/stats
 * Returns overall system metrics
 * 
 * Response:
 * {
 *   totalCampaigns: number,
 *   activeCampaigns: number,
 *   activeSources: number,
 *   mainFeedCount: number,
 *   endingSoon: number (< 7 days),
 *   byCategory: { category: count },
 *   bySourceType: { brand: count, aggregator: count, affiliate: count },
 *   byDiscountType: { percentage: count, cashback: count, ... },
 *   avgPriorityScore: number,
 *   topSources: [{ name, count }] (top 10)
 * }
 */
router.get('/stats', async (req, res) => {
  try {
    // 1. Total campaigns (all time)
    const totalResult = await pool.query('SELECT COUNT(*) as count FROM campaigns');
    const totalCampaigns = parseInt(totalResult.rows[0].count);

    // 2. Active campaigns (is_active = true AND expires_at > NOW())
    const activeResult = await pool.query(`
      SELECT COUNT(*) as count 
      FROM campaigns 
      WHERE is_active = true AND expires_at > NOW()
    `);
    const activeCampaigns = parseInt(activeResult.rows[0].count);

    // 3. Active sources (has at least 1 active campaign)
    const activeSourcesResult = await pool.query(`
      SELECT COUNT(DISTINCT source_id) as count 
      FROM campaigns 
      WHERE is_active = true AND expires_at > NOW()
    `);
    const activeSources = parseInt(activeSourcesResult.rows[0].count);

    // 4. Main feed campaign count (campaign_type = 'main' OR NULL)
    const mainFeedResult = await pool.query(`
      SELECT COUNT(*) as count 
      FROM campaigns 
      WHERE is_active = true 
        AND expires_at > NOW()
        AND (campaign_type = 'main' OR campaign_type IS NULL)
        AND (value_level = 'high' OR value_level IS NULL)
        AND (is_hidden = false OR is_hidden IS NULL)
    `);
    const mainFeedCount = parseInt(mainFeedResult.rows[0].count);

    // 5. Ending soon (< 7 days)
    const endingSoonResult = await pool.query(`
      SELECT COUNT(*) as count 
      FROM campaigns 
      WHERE is_active = true 
        AND expires_at > NOW()
        AND expires_at <= NOW() + INTERVAL '7 days'
    `);
    const endingSoon = parseInt(endingSoonResult.rows[0].count);

    // 6. By category
    const byCategoryResult = await pool.query(`
      SELECT category, COUNT(*) as count 
      FROM campaigns 
      WHERE is_active = true AND expires_at > NOW()
      GROUP BY category
      ORDER BY count DESC
    `);
    const byCategory = {};
    byCategoryResult.rows.forEach(row => {
      byCategory[row.category || 'uncategorized'] = parseInt(row.count);
    });

    // 7. By source type
    const bySourceTypeResult = await pool.query(`
      SELECT s.source_type, COUNT(c.id) as count 
      FROM campaigns c
      INNER JOIN sources s ON c.source_id = s.id
      WHERE c.is_active = true AND c.expires_at > NOW()
      GROUP BY s.source_type
      ORDER BY count DESC
    `);
    const bySourceType = {};
    bySourceTypeResult.rows.forEach(row => {
      bySourceType[row.source_type || 'unknown'] = parseInt(row.count);
    });

    // 8. By discount type
    const byDiscountTypeResult = await pool.query(`
      SELECT discount_type, COUNT(*) as count 
      FROM campaigns 
      WHERE is_active = true AND expires_at > NOW() AND discount_type IS NOT NULL
      GROUP BY discount_type
      ORDER BY count DESC
    `);
    const byDiscountType = {};
    byDiscountTypeResult.rows.forEach(row => {
      byDiscountType[row.discount_type] = parseInt(row.count);
    });

    // 9. Average priority score
    const avgPriorityResult = await pool.query(`
      SELECT AVG(priority_score) as avg 
      FROM campaigns 
      WHERE is_active = true AND expires_at > NOW()
    `);
    const avgPriorityScore = parseFloat(avgPriorityResult.rows[0].avg || 50).toFixed(2);

    // 10. Top sources (by active campaign count)
    const topSourcesResult = await pool.query(`
      SELECT s.name, COUNT(c.id) as count 
      FROM campaigns c
      INNER JOIN sources s ON c.source_id = s.id
      WHERE c.is_active = true AND c.expires_at > NOW()
      GROUP BY s.name
      ORDER BY count DESC
      LIMIT 10
    `);
    const topSources = topSourcesResult.rows.map(row => ({
      name: row.name,
      count: parseInt(row.count)
    }));

    res.json({
      success: true,
      data: {
        totalCampaigns,
        activeCampaigns,
        activeSources,
        mainFeedCount,
        endingSoon,
        byCategory,
        bySourceType,
        byDiscountType,
        avgPriorityScore: parseFloat(avgPriorityScore),
        topSources,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    res.status(500).json({
      success: false,
      error: 'Dashboard istatistikleri yüklenirken bir hata oluştu',
      message: error.message,
    });
  }
});

/**
 * GET /dashboard/sources
 * Returns source-level metrics
 * 
 * Response:
 * {
 *   sources: [{
 *     id, name, type, isActive, campaignCount,
 *     activeCampaigns, endingSoon, avgPriorityScore
 *   }]
 * }
 */
router.get('/sources', async (req, res) => {
  try {
    const query = `
      SELECT 
        s.id,
        s.name,
        s.type as source_type,
        s.source_type as classification,
        s.is_active,
        s.campaign_count,
        COUNT(c.id) FILTER (WHERE c.is_active = true AND c.expires_at > NOW()) as active_campaigns,
        COUNT(c.id) FILTER (WHERE c.is_active = true AND c.expires_at > NOW() AND c.expires_at <= NOW() + INTERVAL '7 days') as ending_soon,
        AVG(c.priority_score) FILTER (WHERE c.is_active = true AND c.expires_at > NOW()) as avg_priority_score,
        MAX(c.created_at) FILTER (WHERE c.is_active = true AND c.expires_at > NOW()) as last_campaign_date
      FROM sources s
      LEFT JOIN campaigns c ON s.id = c.source_id
      GROUP BY s.id, s.name, s.type, s.source_type, s.is_active, s.campaign_count
      ORDER BY active_campaigns DESC, s.name ASC
    `;

    const result = await pool.query(query);

    const sources = result.rows.map(row => ({
      id: row.id,
      name: row.name,
      type: row.source_type || row.classification || 'brand',
      isActive: row.is_active,
      campaignCount: parseInt(row.campaign_count || 0),
      activeCampaigns: parseInt(row.active_campaigns || 0),
      endingSoon: parseInt(row.ending_soon || 0),
      avgPriorityScore: row.avg_priority_score ? parseFloat(row.avg_priority_score).toFixed(2) : null,
      lastCampaignDate: row.last_campaign_date,
    }));

    res.json({
      success: true,
      data: sources,
      count: sources.length,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Dashboard sources error:', error);
    res.status(500).json({
      success: false,
      error: 'Kaynak istatistikleri yüklenirken bir hata oluştu',
      message: error.message,
    });
  }
});

module.exports = router;
