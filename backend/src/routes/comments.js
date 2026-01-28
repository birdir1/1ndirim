const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const { firebaseAuth, optionalFirebaseAuth } = require('../middleware/firebaseAuth');
const GamificationService = require('../services/gamificationService');

/**
 * GET /api/comments/:campaignId
 * Bir kampanyanın yorumlarını getirir
 * Query params: ?limit=20&offset=0
 */
router.get('/:campaignId', optionalFirebaseAuth, async (req, res) => {
  const client = await pool.connect();
  
  try {
    const { campaignId } = req.params;
    const limit = parseInt(req.query.limit) || 20;
    const offset = parseInt(req.query.offset) || 0;
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

    // Yorumları getir (silinenler hariç)
    const result = await client.query(
      `SELECT 
        cc.id,
        cc.campaign_id,
        cc.user_id,
        cc.comment_text,
        cc.created_at,
        cc.updated_at,
        cc.is_edited,
        COUNT(*) OVER() as total_count
      FROM campaign_comments cc
      WHERE cc.campaign_id = $1 
        AND cc.is_deleted = false
      ORDER BY cc.created_at DESC
      LIMIT $2 OFFSET $3`,
      [campaignId, limit, offset]
    );

    // Toplam sayı
    const totalCount = result.rows.length > 0 ? parseInt(result.rows[0].total_count) : 0;

    // Kullanıcının yorumlarını işaretle (eğer giriş yapmışsa)
    const comments = result.rows.map((row) => ({
      id: row.id,
      campaignId: row.campaign_id,
      userId: row.user_id,
      commentText: row.comment_text,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      isEdited: row.is_edited,
      isOwnComment: userId ? row.user_id === userId : false,
    }));

    res.json({
      success: true,
      data: comments,
      count: comments.length,
      total: totalCount,
      limit,
      offset,
    });
  } catch (error) {
    console.error('❌ Yorum getirme hatası:', error);
    res.status(500).json({
      success: false,
      error: 'Yorumlar getirilemedi',
    });
  } finally {
    client.release();
  }
});

/**
 * POST /api/comments/:campaignId
 * Bir kampanyaya yorum ekler
 * Body: { commentText: string }
 */
router.post('/:campaignId', firebaseAuth, async (req, res) => {
  const client = await pool.connect();
  
  try {
    const { campaignId } = req.params;
    const { commentText } = req.body;
    const userId = req.user.uid;

    // Validasyon
    if (!commentText || typeof commentText !== 'string' || commentText.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Yorum metni gerekli',
      });
    }

    if (commentText.trim().length > 1000) {
      return res.status(400).json({
        success: false,
        error: 'Yorum en fazla 1000 karakter olabilir',
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

    // Yorum ekle
    const result = await client.query(
      `INSERT INTO campaign_comments (campaign_id, user_id, comment_text)
       VALUES ($1, $2, $3)
       RETURNING id, campaign_id, user_id, comment_text, created_at, updated_at, is_edited`,
      [campaignId, userId, commentText.trim()]
    );

    const comment = result.rows[0];

    // Puan ekle (async, hata olsa bile devam et)
    GamificationService.addPoints(
      userId,
      GamificationService.POINTS.COMMENT,
      'comment',
      comment.id,
      'Yorum yapıldı'
    ).catch(err => console.error('Puan ekleme hatası (yorum):', err));

    res.status(201).json({
      success: true,
      message: 'Yorum eklendi',
      data: {
        id: comment.id,
        campaignId: comment.campaign_id,
        userId: comment.user_id,
        commentText: comment.comment_text,
        createdAt: comment.created_at,
        updatedAt: comment.updated_at,
        isEdited: comment.is_edited,
        isOwnComment: true,
      },
    });
  } catch (error) {
    console.error('❌ Yorum ekleme hatası:', error);
    res.status(500).json({
      success: false,
      error: 'Yorum eklenemedi',
    });
  } finally {
    client.release();
  }
});

/**
 * PUT /api/comments/:commentId
 * Bir yorumu günceller
 * Body: { commentText: string }
 */
router.put('/:commentId', firebaseAuth, async (req, res) => {
  const client = await pool.connect();
  
  try {
    const { commentId } = req.params;
    const { commentText } = req.body;
    const userId = req.user.uid;

    // Validasyon
    if (!commentText || typeof commentText !== 'string' || commentText.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Yorum metni gerekli',
      });
    }

    if (commentText.trim().length > 1000) {
      return res.status(400).json({
        success: false,
        error: 'Yorum en fazla 1000 karakter olabilir',
      });
    }

    // Yorumun var olup olmadığını ve kullanıcıya ait olup olmadığını kontrol et
    const commentCheck = await client.query(
      'SELECT id, user_id FROM campaign_comments WHERE id = $1 AND is_deleted = false',
      [commentId]
    );

    if (commentCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Yorum bulunamadı',
      });
    }

    if (commentCheck.rows[0].user_id !== userId) {
      return res.status(403).json({
        success: false,
        error: 'Bu yorumu düzenleme yetkiniz yok',
      });
    }

    // Yorumu güncelle
    const result = await client.query(
      `UPDATE campaign_comments 
       SET comment_text = $1, updated_at = NOW(), is_edited = true
       WHERE id = $2
       RETURNING id, campaign_id, user_id, comment_text, created_at, updated_at, is_edited`,
      [commentText.trim(), commentId]
    );

    const comment = result.rows[0];

    res.json({
      success: true,
      message: 'Yorum güncellendi',
      data: {
        id: comment.id,
        campaignId: comment.campaign_id,
        userId: comment.user_id,
        commentText: comment.comment_text,
        createdAt: comment.created_at,
        updatedAt: comment.updated_at,
        isEdited: comment.is_edited,
        isOwnComment: true,
      },
    });
  } catch (error) {
    console.error('❌ Yorum güncelleme hatası:', error);
    res.status(500).json({
      success: false,
      error: 'Yorum güncellenemedi',
    });
  } finally {
    client.release();
  }
});

/**
 * DELETE /api/comments/:commentId
 * Bir yorumu siler (soft delete)
 */
router.delete('/:commentId', firebaseAuth, async (req, res) => {
  const client = await pool.connect();
  
  try {
    const { commentId } = req.params;
    const userId = req.user.uid;

    // Yorumun var olup olmadığını ve kullanıcıya ait olup olmadığını kontrol et
    const commentCheck = await client.query(
      'SELECT id, user_id FROM campaign_comments WHERE id = $1 AND is_deleted = false',
      [commentId]
    );

    if (commentCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Yorum bulunamadı',
      });
    }

    if (commentCheck.rows[0].user_id !== userId) {
      return res.status(403).json({
        success: false,
        error: 'Bu yorumu silme yetkiniz yok',
      });
    }

    // Yorumu soft delete yap
    await client.query(
      'UPDATE campaign_comments SET is_deleted = true, updated_at = NOW() WHERE id = $1',
      [commentId]
    );

    res.json({
      success: true,
      message: 'Yorum silindi',
    });
  } catch (error) {
    console.error('❌ Yorum silme hatası:', error);
    res.status(500).json({
      success: false,
      error: 'Yorum silinemedi',
    });
  } finally {
    client.release();
  }
});

module.exports = router;
