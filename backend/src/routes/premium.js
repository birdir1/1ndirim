const express = require('express');
const router = express.Router();
const { firebaseAuth, optionalFirebaseAuth } = require('../middleware/firebaseAuth');
const PremiumService = require('../services/premiumService');

/**
 * GET /api/premium/status
 * Kullanıcının premium durumunu kontrol eder
 */
router.get('/status', firebaseAuth, async (req, res) => {
  try {
    const userId = req.user.uid;
    const isPremium = await PremiumService.isPremium(userId);
    const subscription = await PremiumService.getSubscription(userId);

    res.json({
      success: true,
      data: {
        isPremium,
        subscription,
      },
    });
  } catch (error) {
    console.error('❌ Premium durum kontrolü hatası:', error);
    res.status(500).json({
      success: false,
      error: 'Premium durum kontrol edilemedi',
    });
  }
});

/**
 * GET /api/premium/plans
 * Tüm premium planları getirir
 */
router.get('/plans', optionalFirebaseAuth, async (req, res) => {
  try {
    const plans = await PremiumService.getPlans();

    res.json({
      success: true,
      data: plans,
    });
  } catch (error) {
    console.error('❌ Premium planlar getirme hatası:', error);
    res.status(500).json({
      success: false,
      error: 'Premium planlar alınamadı',
    });
  }
});

/**
 * GET /api/premium/features
 * Premium özelliklerini getirir
 */
router.get('/features', optionalFirebaseAuth, async (req, res) => {
  try {
    const features = await PremiumService.getFeatures();

    res.json({
      success: true,
      data: features,
    });
  } catch (error) {
    console.error('❌ Premium özellikler getirme hatası:', error);
    res.status(500).json({
      success: false,
      error: 'Premium özellikler alınamadı',
    });
  }
});

/**
 * POST /api/premium/subscribe
 * Premium abonelik oluşturur (test/manuel için)
 * Not: Gerçek uygulamada ödeme gateway'i entegrasyonu gerekir
 */
router.post('/subscribe', firebaseAuth, async (req, res) => {
  try {
    const userId = req.user.uid;
    const { planType, durationDays } = req.body;

    // Test için basit abonelik oluşturma
    // Gerçek uygulamada ödeme doğrulaması yapılmalı
    const subscription = await PremiumService.createSubscription(
      userId,
      planType || 'monthly',
      durationDays || 30
    );

    res.json({
      success: true,
      data: subscription,
      message: 'Premium abonelik oluşturuldu (Test modu)',
    });
  } catch (error) {
    console.error('❌ Premium abonelik oluşturma hatası:', error);
    const statusCode = error.message.includes('zaten') ? 400 : 500;

    res.status(statusCode).json({
      success: false,
      error: error.message || 'Premium abonelik oluşturulamadı',
    });
  }
});

/**
 * POST /api/premium/cancel
 * Premium aboneliği iptal eder
 */
router.post('/cancel', firebaseAuth, async (req, res) => {
  try {
    const userId = req.user.uid;
    const cancelled = await PremiumService.cancelSubscription(userId);

    if (!cancelled) {
      return res.status(404).json({
        success: false,
        error: 'Aktif premium abonelik bulunamadı',
      });
    }

    res.json({
      success: true,
      message: 'Premium abonelik iptal edildi',
    });
  } catch (error) {
    console.error('❌ Premium abonelik iptal hatası:', error);
    res.status(500).json({
      success: false,
      error: 'Premium abonelik iptal edilemedi',
    });
  }
});

module.exports = router;
