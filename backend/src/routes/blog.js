const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const { cacheMiddleware } = require('../middleware/cache');
const CacheService = require('../services/cacheService');

/**
 * GET /api/blog/categories
 * Blog kategorilerini getirir
 * 
 * CACHED: 1 hour
 */
router.get('/categories', cacheMiddleware(CacheService.TTL.SOURCES_LIST), async (req, res) => {
  const client = await pool.connect();
  
  try {
    const result = await client.query(`
      SELECT 
        id,
        name,
        slug,
        description,
        icon,
        color,
        display_order,
        is_active,
        created_at
      FROM blog_categories
      WHERE is_active = true
      ORDER BY display_order ASC, name ASC
    `);

    res.json({
      success: true,
      data: result.rows,
    });
  } catch (error) {
    console.error('❌ Blog categories error:', error);
    res.status(500).json({
      success: false,
      error: 'Blog kategorileri yüklenemedi',
    });
  } finally {
    client.release();
  }
});

/**
 * GET /api/blog/posts
 * Blog yazılarını getirir
 * 
 * Query params:
 * - category: Kategori slug (opsiyonel)
 * - featured: true/false (opsiyonel)
 * - limit: Sayfa başına kayıt (default: 10)
 * - offset: Başlangıç noktası (default: 0)
 * 
 * CACHED: 5 minutes
 */
router.get('/posts', cacheMiddleware(CacheService.TTL.CAMPAIGNS_LIST), async (req, res) => {
  const client = await pool.connect();
  
  try {
    const {
      category,
      featured,
      limit = 10,
      offset = 0,
    } = req.query;

    // Build WHERE clause
    const conditions = ['bp.is_published = true'];
    const params = [];
    let paramIndex = 1;

    if (category) {
      conditions.push(`bc.slug = $${paramIndex}`);
      params.push(category);
      paramIndex++;
    }

    if (featured === 'true') {
      conditions.push('bp.is_featured = true');
    }

    const whereClause = conditions.join(' AND ');

    // Get total count
    const countResult = await client.query(`
      SELECT COUNT(*) as total
      FROM blog_posts bp
      LEFT JOIN blog_categories bc ON bp.category_id = bc.id
      WHERE ${whereClause}
    `, params);

    const total = parseInt(countResult.rows[0].total) || 0;

    // Get posts
    params.push(parseInt(limit));
    params.push(parseInt(offset));

    const result = await client.query(`
      SELECT 
        bp.id,
        bp.title,
        bp.slug,
        bp.excerpt,
        bp.featured_image_url,
        bp.author_name,
        bp.author_avatar_url,
        bp.read_time_minutes,
        bp.is_featured,
        bp.published_at,
        bp.view_count,
        bc.id as category_id,
        bc.name as category_name,
        bc.slug as category_slug,
        bc.color as category_color
      FROM blog_posts bp
      LEFT JOIN blog_categories bc ON bp.category_id = bc.id
      WHERE ${whereClause}
      ORDER BY bp.published_at DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `, params);

    res.json({
      success: true,
      data: result.rows,
      pagination: {
        total,
        limit: parseInt(limit),
        offset: parseInt(offset),
        hasMore: (parseInt(offset) + parseInt(limit)) < total,
      },
    });
  } catch (error) {
    console.error('❌ Blog posts error:', error);
    res.status(500).json({
      success: false,
      error: 'Blog yazıları yüklenemedi',
    });
  } finally {
    client.release();
  }
});

/**
 * GET /api/blog/posts/:slug
 * Belirli bir blog yazısını getirir
 * 
 * CACHED: 10 minutes
 */
router.get('/posts/:slug', cacheMiddleware(CacheService.TTL.CAMPAIGN_DETAIL), async (req, res) => {
  const client = await pool.connect();
  
  try {
    const { slug } = req.params;

    const result = await client.query(`
      SELECT 
        bp.id,
        bp.title,
        bp.slug,
        bp.excerpt,
        bp.content,
        bp.featured_image_url,
        bp.author_name,
        bp.author_avatar_url,
        bp.read_time_minutes,
        bp.is_featured,
        bp.published_at,
        bp.view_count,
        bc.id as category_id,
        bc.name as category_name,
        bc.slug as category_slug,
        bc.color as category_color,
        bc.icon as category_icon
      FROM blog_posts bp
      LEFT JOIN blog_categories bc ON bp.category_id = bc.id
      WHERE bp.slug = $1 AND bp.is_published = true
    `, [slug]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Blog yazısı bulunamadı',
      });
    }

    // Increment view count (async, don't wait)
    client.query(
      'UPDATE blog_posts SET view_count = view_count + 1 WHERE slug = $1',
      [slug]
    ).catch(err => console.error('View count update error:', err));

    res.json({
      success: true,
      data: result.rows[0],
    });
  } catch (error) {
    console.error('❌ Blog post error:', error);
    res.status(500).json({
      success: false,
      error: 'Blog yazısı yüklenemedi',
    });
  } finally {
    client.release();
  }
});

/**
 * GET /api/blog/featured
 * Öne çıkan blog yazılarını getirir
 * 
 * CACHED: 10 minutes
 */
router.get('/featured', cacheMiddleware(CacheService.TTL.CAMPAIGN_DETAIL), async (req, res) => {
  const client = await pool.connect();
  
  try {
    const limit = parseInt(req.query.limit) || 3;

    const result = await client.query(`
      SELECT 
        bp.id,
        bp.title,
        bp.slug,
        bp.excerpt,
        bp.featured_image_url,
        bp.author_name,
        bp.read_time_minutes,
        bp.published_at,
        bc.name as category_name,
        bc.slug as category_slug,
        bc.color as category_color
      FROM blog_posts bp
      LEFT JOIN blog_categories bc ON bp.category_id = bc.id
      WHERE bp.is_published = true AND bp.is_featured = true
      ORDER BY bp.published_at DESC
      LIMIT $1
    `, [limit]);

    res.json({
      success: true,
      data: result.rows,
    });
  } catch (error) {
    console.error('❌ Featured posts error:', error);
    res.status(500).json({
      success: false,
      error: 'Öne çıkan yazılar yüklenemedi',
    });
  } finally {
    client.release();
  }
});

module.exports = router;
