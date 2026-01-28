const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const { firebaseAuth } = require('../middleware/firebaseAuth');

/**
 * POST /api/price-tracking/:campaignId
 * Kampanyayı fiyat takibine ekler
 * Body: { targetPrice?: number, notifyOnDrop?: boolean, notifyOnIncrease?: boolean }
 */
router.post('/:campaignId', firebaseAuth, async (req, res) => {
  const client = await pool.connect();

  try {
    const userId = req.user.uid;
    const { campaignId } = req.params;
    const { targetPrice, notifyOnDrop = true, notifyOnIncrease = false } = req.body;

    // Kampanya var mı kontrol et
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

    // Fiyat takibine ekle
    const result = await client.query(
      `INSERT INTO user_price_tracking (user_id, campaign_id, target_price, notify_on_drop, notify_on_increase)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (user_id, campaign_id)
       DO UPDATE SET 
         target_price = EXCLUDED.target_price,
         notify_on_drop = EXCLUDED.notify_on_drop,
         notify_on_increase = EXCLUDED.notify_on_increase,
         updated_at = NOW()
       RETURNING id, user_id, campaign_id, target_price, notify_on_drop, notify_on_increase, created_at`,
      [userId, campaignId, targetPrice || null, notifyOnDrop, notifyOnIncrease]
    );

    res.status(201).json({
      success: true,
      message: 'Fiyat takibi başlatıldı',
      data: {
        id: result.rows[0].id,
        campaignId: result.rows[0].campaign_id,
        targetPrice: result.rows[0].target_price,
        notifyOnDrop: result.rows[0].notify_on_drop,
        notifyOnIncrease: result.rows[0].notify_on_increase,
      },
    });
  } catch (error) {
    console.error('❌ Fiyat takibi ekleme hatası:', error);
    res.status(500).json({
      success: false,
      error: 'Fiyat takibi eklenemedi',
    });
  } finally {
    client.release();
  }
});

/**
 * DELETE /api/price-tracking/:campaignId
 * Kampanyayı fiyat takibinden çıkarır
 */
router.delete('/:campaignId', firebaseAuth, async (req, res) => {
  const client = await pool.connect();

  try {
    const userId = req.user.uid;
    const { campaignId } = req.params;

    const result = await client.query(
      'DELETE FROM user_price_tracking WHERE user_id = $1 AND campaign_id = $2',
      [userId, campaignId]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({
        success: false,
        error: 'Fiyat takibi bulunamadı',
      });
    }

    res.json({
      success: true,
      message: 'Fiyat takibi durduruldu',
    });
  } catch (error) {
    console.error('❌ Fiyat takibi silme hatası:', error);
    res.status(500).json({
      success: false,
      error: 'Fiyat takibi silinemedi',
    });
  } finally {
    client.release();
  }
});

/**
 * GET /api/price-tracking
 * Kullanıcının takip ettiği kampanyaları getirir
 */
router.get('/', firebaseAuth, async (req, res) => {
  const client = await pool.connect();

  try {
    const userId = req.user.uid;

    const result = await client.query(
      `SELECT 
        upt.id,
        upt.campaign_id,
        upt.target_price,
        upt.notify_on_drop,
        upt.notify_on_increase,
        upt.created_at,
        c.title,
        c.current_price,
        c.original_price,
        c.discount_percentage,
        c.price_currency,
        s.name as source_name
      FROM user_price_tracking upt
      INNER JOIN campaigns c ON upt.campaign_id = c.id
      INNER JOIN sources s ON c.source_id = s.id
      WHERE upt.user_id = $1
        AND c.is_active = true
        AND c.expires_at > NOW()
      ORDER BY upt.created_at DESC`,
      [userId]
    );

    const tracking = result.rows.map(row => ({
      id: row.id,
      campaignId: row.campaign_id,
      campaignTitle: row.title,
      sourceName: row.source_name,
      currentPrice: row.current_price ? parseFloat(row.current_price) : null,
      originalPrice: row.original_price ? parseFloat(row.original_price) : null,
      discountPercentage: row.discount_percentage ? parseFloat(row.discount_percentage) : null,
      priceCurrency: row.price_currency || 'TRY',
      targetPrice: row.target_price ? parseFloat(row.target_price) : null,
      notifyOnDrop: row.notify_on_drop,
      notifyOnIncrease: row.notify_on_increase,
      createdAt: row.created_at,
    }));

    res.json({
      success: true,
      data: tracking,
    });
  } catch (error) {
    console.error('❌ Fiyat takibi getirme hatası:', error);
    res.status(500).json({
      success: false,
      error: 'Fiyat takibi getirilemedi',
    });
  } finally {
    client.release();
  }
});

/**
 * GET /api/price-tracking/:campaignId/history
 * Kampanyanın fiyat geçmişini getirir
 */
router.get('/:campaignId/history', firebaseAuth, async (req, res) => {
  const client = await pool.connect();

  try {
    const userId = req.user.uid;
    const { campaignId } = req.params;
    const limit = parseInt(req.query.limit) || 30;

    // Kullanıcının bu kampanyayı takip ettiğini kontrol et
    const trackingCheck = await client.query(
      'SELECT id FROM user_price_tracking WHERE user_id = $1 AND campaign_id = $2',
      [userId, campaignId]
    );

    if (trackingCheck.rows.length === 0) {
      return res.status(403).json({
        success: false,
        error: 'Bu kampanyayı takip etmiyorsunuz',
      });
    }

    // Fiyat geçmişini getir
    const result = await client.query(
      `SELECT 
        id,
        price,
        discount_percentage,
        currency,
        recorded_at,
        source
      FROM campaign_price_history
      WHERE campaign_id = $1
      ORDER BY recorded_at DESC
      LIMIT $2`,
      [campaignId, limit]
    );

    const history = result.rows.map(row => ({
      id: row.id,
      price: parseFloat(row.price),
      discountPercentage: row.discount_percentage ? parseFloat(row.discount_percentage) : null,
      currency: row.currency || 'TRY',
      recordedAt: row.recorded_at,
      source: row.source,
    }));

    res.json({
      success: true,
      data: history,
    });
  } catch (error) {
    console.error('❌ Fiyat geçmişi getirme hatası:', error);
    res.status(500).json({
      success: false,
      error: 'Fiyat geçmişi getirilemedi',
    });
  } finally {
    client.release();
  }
});

module.exports = router;
