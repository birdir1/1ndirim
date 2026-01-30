const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const { firebaseAuth } = require('../middleware/firebaseAuth');
const GamificationService = require('../services/gamificationService');
const { validateFCMToken } = require('../middleware/validation');

/**
 * POST /api/users/fcm-token
 * Kullanıcının FCM token'ını kaydeder veya günceller
 * Body: { fcmToken: string, deviceInfo?: object }
 */
router.post('/fcm-token', firebaseAuth, validateFCMToken, async (req, res) => {
  const client = await pool.connect();
  
  try {
    const userId = req.user.uid;
    const { fcmToken, deviceInfo } = req.body;

    // Token'ı kaydet veya güncelle (UPSERT)
    const result = await client.query(
      `INSERT INTO user_fcm_tokens (user_id, fcm_token, device_info, updated_at)
       VALUES ($1, $2, $3, NOW())
       ON CONFLICT (user_id, fcm_token)
       DO UPDATE SET 
         device_info = EXCLUDED.device_info,
         updated_at = NOW()
       RETURNING id, user_id, fcm_token, created_at, updated_at`,
      [userId, fcmToken.trim(), deviceInfo ? JSON.stringify(deviceInfo) : null]
    );

    res.json({
      success: true,
      message: 'FCM token kaydedildi',
      data: {
        id: result.rows[0].id,
        userId: result.rows[0].user_id,
        createdAt: result.rows[0].created_at,
        updatedAt: result.rows[0].updated_at,
      },
    });
  } catch (error) {
    console.error('❌ FCM token kaydetme hatası:', error);
    res.status(500).json({
      success: false,
      error: 'FCM token kaydetme hatası',
    });
  } finally {
    client.release();
  }
});

/**
 * DELETE /api/users/fcm-token
 * Kullanıcının FCM token'ını siler
 * Body: { fcmToken?: string } (opsiyonel - belirtilmezse tüm token'lar silinir)
 */
router.delete('/fcm-token', firebaseAuth, async (req, res) => {
  const client = await pool.connect();
  
  try {
    const userId = req.user.uid;
    const { fcmToken } = req.body;

    if (fcmToken) {
      // Belirli bir token'ı sil
      await client.query(
        'DELETE FROM user_fcm_tokens WHERE user_id = $1 AND fcm_token = $2',
        [userId, fcmToken.trim()]
      );
    } else {
      // Tüm token'ları sil
      await client.query(
        'DELETE FROM user_fcm_tokens WHERE user_id = $1',
        [userId]
      );
    }

    res.json({
      success: true,
      message: 'FCM token silindi',
    });
  } catch (error) {
    console.error('❌ FCM token silme hatası:', error);
    res.status(500).json({
      success: false,
      error: 'FCM token silme hatası',
    });
  } finally {
    client.release();
  }
});

/**
 * GET /api/users/stats
 * Kullanıcının istatistiklerini getirir
 */
router.get('/stats', firebaseAuth, async (req, res) => {
  const client = await pool.connect();
  
  try {
    const userId = req.user.uid;

    // Favori sayısı
    const favoritesResult = await client.query(
      'SELECT COUNT(*) as count FROM user_favorites WHERE user_id = $1',
      [userId]
    );
    const favoriteCount = parseInt(favoritesResult.rows[0].count) || 0;

    // Yorum sayısı
    const commentsResult = await client.query(
      'SELECT COUNT(*) as count FROM campaign_comments WHERE user_id = $1 AND is_deleted = false',
      [userId]
    );
    const commentCount = parseInt(commentsResult.rows[0].count) || 0;

    // Puan sayısı
    const ratingsResult = await client.query(
      'SELECT COUNT(*) as count FROM campaign_ratings WHERE user_id = $1',
      [userId]
    );
    const ratingCount = parseInt(ratingsResult.rows[0].count) || 0;

    // Son aktivite tarihi (en son favori, yorum veya puan)
    const lastActivityResult = await client.query(
      `SELECT MAX(activity_date) as last_activity FROM (
        SELECT created_at as activity_date FROM user_favorites WHERE user_id = $1
        UNION ALL
        SELECT created_at as activity_date FROM campaign_comments WHERE user_id = $1 AND is_deleted = false
        UNION ALL
        SELECT created_at as activity_date FROM campaign_ratings WHERE user_id = $1
      ) activities`,
      [userId]
    );
    const lastActivity = lastActivityResult.rows[0].last_activity || null;

    res.json({
      success: true,
      data: {
        favoriteCount,
        commentCount,
        ratingCount,
        totalActivity: favoriteCount + commentCount + ratingCount,
        lastActivity,
      },
    });
  } catch (error) {
    console.error('❌ Kullanıcı istatistikleri getirme hatası:', error);
    res.status(500).json({
      success: false,
      error: 'İstatistikler getirilemedi',
    });
  } finally {
    client.release();
  }
});

/**
 * GET /api/users/points
 * Kullanıcının puanlarını getirir
 */
router.get('/points', firebaseAuth, async (req, res) => {
  try {
    const userId = req.user.uid;
    const points = await GamificationService.getUserPoints(userId);

    res.json({
      success: true,
      data: points,
    });
  } catch (error) {
    console.error('❌ Puan getirme hatası:', error);
    res.status(500).json({
      success: false,
      error: 'Puanlar getirilemedi',
    });
  }
});

/**
 * GET /api/users/badges
 * Kullanıcının rozetlerini getirir
 */
router.get('/badges', firebaseAuth, async (req, res) => {
  try {
    const userId = req.user.uid;
    const badges = await GamificationService.getUserBadges(userId);

    res.json({
      success: true,
      data: badges,
    });
  } catch (error) {
    console.error('❌ Rozet getirme hatası:', error);
    res.status(500).json({
      success: false,
      error: 'Rozetler getirilemedi',
    });
  }
});

module.exports = router;
