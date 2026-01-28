const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const { firebaseAuth } = require('../middleware/firebaseAuth');

/**
 * POST /api/users/fcm-token
 * Kullanıcının FCM token'ını kaydeder veya günceller
 * Body: { fcmToken: string, deviceInfo?: object }
 */
router.post('/fcm-token', firebaseAuth, async (req, res) => {
  const client = await pool.connect();
  
  try {
    const userId = req.user.uid;
    const { fcmToken, deviceInfo } = req.body;

    if (!fcmToken || typeof fcmToken !== 'string' || fcmToken.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'FCM token gerekli',
      });
    }

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

module.exports = router;
