const express = require('express');
const router = express.Router();
const { firebaseAuth, optionalFirebaseAuth } = require('../middleware/firebaseAuth');
const ReferralService = require('../services/referralService');

/**
 * GET /api/referrals/code
 * Kullanıcının referans kodunu getirir veya oluşturur
 */
router.get('/code', firebaseAuth, async (req, res) => {
  try {
    const userId = req.user.uid;
    const referralCode = await ReferralService.getOrCreateReferralCode(userId);

    res.json({
      success: true,
      data: {
        referralCode,
      },
    });
  } catch (error) {
    console.error('❌ Referans kodu getirme hatası:', error);
    res.status(500).json({
      success: false,
      error: 'Referans kodu alınamadı',
    });
  }
});

/**
 * POST /api/referrals/process
 * Referans kodunu işler ve ödülleri verir
 */
router.post('/process', firebaseAuth, async (req, res) => {
  try {
    const userId = req.user.uid;
    const { referralCode } = req.body;

    if (!referralCode || typeof referralCode !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Referans kodu gerekli',
      });
    }

    const result = await ReferralService.processReferral(userId, referralCode);

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('❌ Referans işleme hatası:', error);
    const statusCode = error.message.includes('Geçersiz') ||
                       error.message.includes('kullanamaz') ||
                       error.message.includes('zaten')
      ? 400
      : 500;

    res.status(statusCode).json({
      success: false,
      error: error.message || 'Referans işlenemedi',
    });
  }
});

/**
 * GET /api/referrals/stats
 * Kullanıcının referans istatistiklerini getirir
 */
router.get('/stats', firebaseAuth, async (req, res) => {
  try {
    const userId = req.user.uid;
    const stats = await ReferralService.getReferralStats(userId);

    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    console.error('❌ Referans istatistikleri getirme hatası:', error);
    res.status(500).json({
      success: false,
      error: 'Referans istatistikleri alınamadı',
    });
  }
});

/**
 * GET /api/referrals/validate/:code
 * Referans kodunun geçerli olup olmadığını kontrol eder
 */
router.get('/validate/:code', optionalFirebaseAuth, async (req, res) => {
  try {
    const { code } = req.params;
    const validation = await ReferralService.validateReferralCode(code);

    res.json({
      success: true,
      data: validation,
    });
  } catch (error) {
    console.error('❌ Referans kodu doğrulama hatası:', error);
    res.status(500).json({
      success: false,
      error: 'Referans kodu doğrulanamadı',
    });
  }
});

module.exports = router;
