const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const { optionalFirebaseAuth } = require('../middleware/firebaseAuth');

/**
 * GET /api/community/leaderboard
 * En aktif kullanıcıları getirir (puan sıralamasına göre)
 * Query params: ?limit=10 (varsayılan: 10)
 */
router.get('/leaderboard', optionalFirebaseAuth, async (req, res) => {
  const client = await pool.connect();

  try {
    const limit = parseInt(req.query.limit) || 10;
    const userId = req.user?.uid || null;

    // En yüksek puanlı kullanıcıları getir
    const result = await client.query(`
      SELECT 
        up.user_id,
        up.points,
        up.total_points_earned,
        up.level,
        (SELECT COUNT(*) FROM user_badges WHERE user_id = up.user_id) as badge_count,
        (SELECT COUNT(*) FROM user_favorites WHERE user_id = up.user_id) as favorite_count,
        (SELECT COUNT(*) FROM campaign_comments WHERE user_id = up.user_id AND is_deleted = false) as comment_count,
        (SELECT COUNT(*) FROM campaign_ratings WHERE user_id = up.user_id) as rating_count
      FROM user_points up
      WHERE up.total_points_earned > 0
      ORDER BY up.total_points_earned DESC, up.level DESC
      LIMIT $1
    `, [limit]);

    const leaderboard = result.rows.map((row, index) => ({
      rank: index + 1,
      userId: row.user_id,
      points: parseInt(row.total_points_earned) || 0,
      level: parseInt(row.level) || 1,
      badgeCount: parseInt(row.badge_count) || 0,
      favoriteCount: parseInt(row.favorite_count) || 0,
      commentCount: parseInt(row.comment_count) || 0,
      ratingCount: parseInt(row.rating_count) || 0,
      isCurrentUser: userId === row.user_id,
    }));

    res.json({
      success: true,
      data: leaderboard,
    });
  } catch (error) {
    console.error('❌ Leaderboard getirme hatası:', error);
    res.status(500).json({
      success: false,
      error: 'Leaderboard getirilemedi',
    });
  } finally {
    client.release();
  }
});

/**
 * GET /api/community/stats
 * Topluluk istatistiklerini getirir
 */
router.get('/stats', optionalFirebaseAuth, async (req, res) => {
  const client = await pool.connect();

  try {
    // Toplam kullanıcı sayısı (puanı olan)
    const totalUsersResult = await client.query(`
      SELECT COUNT(DISTINCT user_id) as count
      FROM user_points
      WHERE total_points_earned > 0
    `);
    const totalUsers = parseInt(totalUsersResult.rows[0].count) || 0;

    // Toplam favori sayısı
    const totalFavoritesResult = await client.query(`
      SELECT COUNT(*) as count FROM user_favorites
    `);
    const totalFavorites = parseInt(totalFavoritesResult.rows[0].count) || 0;

    // Toplam yorum sayısı
    const totalCommentsResult = await client.query(`
      SELECT COUNT(*) as count FROM campaign_comments WHERE is_deleted = false
    `);
    const totalComments = parseInt(totalCommentsResult.rows[0].count) || 0;

    // Toplam puanlama sayısı
    const totalRatingsResult = await client.query(`
      SELECT COUNT(*) as count FROM campaign_ratings
    `);
    const totalRatings = parseInt(totalRatingsResult.rows[0].count) || 0;

    // Toplam rozet sayısı
    const totalBadgesResult = await client.query(`
      SELECT COUNT(*) as count FROM user_badges
    `);
    const totalBadges = parseInt(totalBadgesResult.rows[0].count) || 0;

    // Toplam puan
    const totalPointsResult = await client.query(`
      SELECT SUM(total_points_earned) as total FROM user_points
    `);
    const totalPoints = parseInt(totalPointsResult.rows[0].total) || 0;

    // En yüksek seviye
    const maxLevelResult = await client.query(`
      SELECT MAX(level) as max_level FROM user_points
    `);
    const maxLevel = parseInt(maxLevelResult.rows[0].max_level) || 1;

    res.json({
      success: true,
      data: {
        totalUsers,
        totalFavorites,
        totalComments,
        totalRatings,
        totalBadges,
        totalPoints,
        maxLevel,
      },
    });
  } catch (error) {
    console.error('❌ Topluluk istatistikleri getirme hatası:', error);
    res.status(500).json({
      success: false,
      error: 'Topluluk istatistikleri getirilemedi',
    });
  } finally {
    client.release();
  }
});

module.exports = router;
