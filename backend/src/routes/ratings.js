const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const { firebaseAuth, optionalFirebaseAuth } = require('../middleware/firebaseAuth');
const GamificationService = require('../services/gamificationService');

/**
 * GET /api/ratings/:campaignId
 * Bir kampanyanın puanlama istatistiklerini getirir
 */
router.get('/:campaignId', optionalFirebaseAuth, async (req, res) => {
  const client = await pool.connect();
  
  try {
    const { campaignId } = req.params;
    const userId = req.user?.uid || null;

    // Kampanyanın var olup olmadığını kontrol et
    const campaignCheck = await client.query(
      'SELECT id FROM campaigns WHERE id = $1',
      [campaignId]
    );

    if (campaignCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Kampanya bulunamadı',
      });
    }

    // Puanlama istatistiklerini getir
    const statsResult = await client.query(
      `SELECT 
        COUNT(*) as total_ratings,
        AVG(rating)::numeric(3,2) as average_rating,
        COUNT(CASE WHEN rating = 5 THEN 1 END) as five_star,
        COUNT(CASE WHEN rating = 4 THEN 1 END) as four_star,
        COUNT(CASE WHEN rating = 3 THEN 1 END) as three_star,
        COUNT(CASE WHEN rating = 2 THEN 1 END) as two_star,
        COUNT(CASE WHEN rating = 1 THEN 1 END) as one_star
      FROM campaign_ratings
      WHERE campaign_id = $1`,
      [campaignId]
    );

    // Kullanıcının puanını getir (eğer giriş yapmışsa)
    let userRating = null;
    if (userId) {
      const userRatingResult = await client.query(
        'SELECT rating FROM campaign_ratings WHERE campaign_id = $1 AND user_id = $2',
        [campaignId, userId]
      );
      if (userRatingResult.rows.length > 0) {
        userRating = userRatingResult.rows[0].rating;
      }
    }

    const stats = statsResult.rows[0];

    res.json({
      success: true,
      data: {
        totalRatings: parseInt(stats.total_ratings) || 0,
        averageRating: parseFloat(stats.average_rating) || 0,
        ratingDistribution: {
          5: parseInt(stats.five_star) || 0,
          4: parseInt(stats.four_star) || 0,
          3: parseInt(stats.three_star) || 0,
          2: parseInt(stats.two_star) || 0,
          1: parseInt(stats.one_star) || 0,
        },
        userRating: userRating,
      },
    });
  } catch (error) {
    console.error('❌ Puanlama istatistikleri getirme hatası:', error);
    res.status(500).json({
      success: false,
      error: 'Puanlama istatistikleri getirilemedi',
    });
  } finally {
    client.release();
  }
});

/**
 * POST /api/ratings/:campaignId
 * Bir kampanyaya puan verir veya günceller
 * Body: { rating: number } (1-5 arası)
 */
router.post('/:campaignId', firebaseAuth, async (req, res) => {
  const client = await pool.connect();
  
  try {
    const { campaignId } = req.params;
    const { rating } = req.body;
    const userId = req.user.uid;

    // Validasyon
    if (!rating || typeof rating !== 'number' || rating < 1 || rating > 5) {
      return res.status(400).json({
        success: false,
        error: 'Puan 1-5 arasında olmalıdır',
      });
    }

    // Kampanyanın var olup olmadığını kontrol et
    const campaignCheck = await client.query(
      'SELECT id FROM campaigns WHERE id = $1',
      [campaignId]
    );

    if (campaignCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Kampanya bulunamadı',
      });
    }

    // Puanı ekle veya güncelle (UPSERT)
    const result = await client.query(
      `INSERT INTO campaign_ratings (campaign_id, user_id, rating)
       VALUES ($1, $2, $3)
       ON CONFLICT (campaign_id, user_id)
       DO UPDATE SET rating = EXCLUDED.rating, updated_at = NOW()
       RETURNING id, campaign_id, user_id, rating, created_at, updated_at`,
      [campaignId, userId, Math.round(rating)]
    );

    const ratingData = result.rows[0];

    res.status(201).json({
      success: true,
      message: 'Puan kaydedildi',
      data: {
        id: ratingData.id,
        campaignId: ratingData.campaign_id,
        userId: ratingData.user_id,
        rating: ratingData.rating,
        createdAt: ratingData.created_at,
        updatedAt: ratingData.updated_at,
      },
    });
  } catch (error) {
    console.error('❌ Puan verme hatası:', error);
    res.status(500).json({
      success: false,
      error: 'Puan verilemedi',
    });
  } finally {
    client.release();
  }
});

/**
 * DELETE /api/ratings/:campaignId
 * Bir kampanyaya verilen puanı siler
 */
router.delete('/:campaignId', firebaseAuth, async (req, res) => {
  const client = await pool.connect();
  
  try {
    const { campaignId } = req.params;
    const userId = req.user.uid;

    // Puanın var olup olmadığını kontrol et
    const ratingCheck = await client.query(
      'SELECT id FROM campaign_ratings WHERE campaign_id = $1 AND user_id = $2',
      [campaignId, userId]
    );

    if (ratingCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Puan bulunamadı',
      });
    }

    // Puanı sil
    await client.query(
      'DELETE FROM campaign_ratings WHERE campaign_id = $1 AND user_id = $2',
      [campaignId, userId]
    );

    res.json({
      success: true,
      message: 'Puan silindi',
    });
  } catch (error) {
    console.error('❌ Puan silme hatası:', error);
    res.status(500).json({
      success: false,
      error: 'Puan silinemedi',
    });
  } finally {
    client.release();
  }
});

module.exports = router;
