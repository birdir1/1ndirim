const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const { optionalFirebaseAuth } = require('../middleware/firebaseAuth');

/**
 * GET /api/blog/categories
 * Tüm blog kategorilerini getirir
 */
router.get('/categories', optionalFirebaseAuth, async (req, res) => {
  const client = await pool.connect();

  try {
    const result = await client.query(`
      SELECT 
        id,
        name,
        slug,
        description,
        icon_name,
        color,
        display_order
      FROM blog_categories
      WHERE is_active = true
      ORDER BY display_order ASC, name ASC
    `);

    const categories = result.rows.map(row => ({
      id: row.id,
      name: row.name,
      slug: row.slug,
      description: row.description,
      iconName: row.icon_name,
      color: row.color,
      displayOrder: row.display_order,
    }));

    res.json({
      success: true,
      data: categories,
    });
  } catch (error) {
    console.error('❌ Blog kategorileri getirme hatası:', error);
    res.status(500).json({
      success: false,
      error: 'Blog kategorileri getirilemedi',
    });
  } finally {
    client.release();
  }
});

/**
 * GET /api/blog/posts
 * Blog yazılarını getirir
 * Query params: ?category=slug (opsiyonel), ?featured=true (opsiyonel), ?limit=10&offset=0
 */
router.get('/posts', optionalFirebaseAuth, async (req, res) => {
  const client = await pool.connect();

  try {
    const categorySlug = req.query.category;
    const featured = req.query.featured === 'true';
    const limit = parseInt(req.query.limit) || 10;
    const offset = parseInt(req.query.offset) || 0;

    let query = `
      SELECT 
        bp.id,
        bp.title,
        bp.slug,
        bp.excerpt,
        bp.content,
        bp.featured_image_url,
        bp.author_name,
        bp.view_count,
        bp.is_featured,
        bp.published_at,
        bp.created_at,
        bc.id as category_id,
        bc.name as category_name,
        bc.slug as category_slug,
        bc.color as category_color,
        bc.icon_name as category_icon
      FROM blog_posts bp
      LEFT JOIN blog_categories bc ON bp.category_id = bc.id
      WHERE bp.is_published = true
    `;

    const params = [];
    let paramIndex = 1;

    if (categorySlug) {
      query += ` AND bc.slug = $${paramIndex}`;
      params.push(categorySlug);
      paramIndex++;
    }

    if (featured) {
      query += ` AND bp.is_featured = true`;
    }

    query += ` ORDER BY bp.is_featured DESC, bp.published_at DESC NULLS LAST, bp.created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(limit, offset);

    const result = await client.query(query, params);

    const posts = result.rows.map(row => ({
      id: row.id,
      title: row.title,
      slug: row.slug,
      excerpt: row.excerpt,
      content: row.content,
      featuredImageUrl: row.featured_image_url,
      authorName: row.author_name,
      viewCount: parseInt(row.view_count) || 0,
      isFeatured: row.is_featured,
      publishedAt: row.published_at,
      createdAt: row.created_at,
      category: row.category_id
        ? {
            id: row.category_id,
            name: row.category_name,
            slug: row.category_slug,
            color: row.category_color,
            iconName: row.category_icon,
          }
        : null,
    }));

    res.json({
      success: true,
      data: posts,
    });
  } catch (error) {
    console.error('❌ Blog yazıları getirme hatası:', error);
    res.status(500).json({
      success: false,
      error: 'Blog yazıları getirilemedi',
    });
  } finally {
    client.release();
  }
});

/**
 * GET /api/blog/posts/:slug
 * Belirli bir blog yazısını getirir
 */
router.get('/posts/:slug', optionalFirebaseAuth, async (req, res) => {
  const client = await pool.connect();

  try {
    const { slug } = req.params;

    // Blog yazısını getir ve view count'u artır
    const result = await client.query(
      `SELECT 
        bp.id,
        bp.title,
        bp.slug,
        bp.excerpt,
        bp.content,
        bp.featured_image_url,
        bp.author_name,
        bp.view_count,
        bp.is_featured,
        bp.published_at,
        bp.created_at,
        bc.id as category_id,
        bc.name as category_name,
        bc.slug as category_slug,
        bc.color as category_color,
        bc.icon_name as category_icon
      FROM blog_posts bp
      LEFT JOIN blog_categories bc ON bp.category_id = bc.id
      WHERE bp.slug = $1 AND bp.is_published = true`,
      [slug]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Blog yazısı bulunamadı',
      });
    }

    const row = result.rows[0];

    // View count'u artır
    await client.query(
      'UPDATE blog_posts SET view_count = view_count + 1 WHERE id = $1',
      [row.id]
    );

    const post = {
      id: row.id,
      title: row.title,
      slug: row.slug,
      excerpt: row.excerpt,
      content: row.content,
      featuredImageUrl: row.featured_image_url,
      authorName: row.author_name,
      viewCount: parseInt(row.view_count) + 1,
      isFeatured: row.is_featured,
      publishedAt: row.published_at,
      createdAt: row.created_at,
      category: row.category_id
        ? {
            id: row.category_id,
            name: row.category_name,
            slug: row.category_slug,
            color: row.category_color,
            iconName: row.category_icon,
          }
        : null,
    };

    res.json({
      success: true,
      data: post,
    });
  } catch (error) {
    console.error('❌ Blog yazısı getirme hatası:', error);
    res.status(500).json({
      success: false,
      error: 'Blog yazısı getirilemedi',
    });
  } finally {
    client.release();
  }
});

module.exports = router;
