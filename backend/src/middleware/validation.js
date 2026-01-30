const { body, param, query, validationResult } = require('express-validator');

/**
 * Validation sonuçlarını kontrol et
 * Hata varsa 400 döndür
 */
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: 'Geçersiz istek parametreleri',
      details: errors.array(),
    });
  }
  next();
};

/**
 * Campaign ID validation
 */
const validateCampaignId = [
  param('id')
    .isUUID()
    .withMessage('Geçersiz kampanya ID formatı'),
  validate,
];

/**
 * Search query validation
 */
const validateSearch = [
  query('q')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Arama terimi 2-100 karakter arasında olmalıdır'),
  query('sourceNames')
    .optional()
    .isString()
    .withMessage('Kaynak isimleri string olmalıdır'),
  query('category')
    .optional()
    .isIn(['main', 'light', 'category'])
    .withMessage('Geçersiz kategori'),
  validate,
];

/**
 * Favorite add validation
 */
const validateFavoriteAdd = [
  body('campaignId')
    .isUUID()
    .withMessage('Geçersiz kampanya ID formatı'),
  body('userId')
    .isString()
    .notEmpty()
    .withMessage('Kullanıcı ID gerekli'),
  validate,
];

/**
 * FCM token validation
 */
const validateFCMToken = [
  body('userId')
    .isString()
    .notEmpty()
    .withMessage('Kullanıcı ID gerekli'),
  body('fcmToken')
    .isString()
    .notEmpty()
    .withMessage('FCM token gerekli'),
  validate,
];

/**
 * Comment validation
 */
const validateComment = [
  body('campaignId')
    .isUUID()
    .withMessage('Geçersiz kampanya ID formatı'),
  body('userId')
    .isString()
    .notEmpty()
    .withMessage('Kullanıcı ID gerekli'),
  body('comment')
    .trim()
    .isLength({ min: 1, max: 500 })
    .withMessage('Yorum 1-500 karakter arasında olmalıdır'),
  validate,
];

/**
 * Rating validation
 */
const validateRating = [
  body('campaignId')
    .isUUID()
    .withMessage('Geçersiz kampanya ID formatı'),
  body('userId')
    .isString()
    .notEmpty()
    .withMessage('Kullanıcı ID gerekli'),
  body('rating')
    .isInt({ min: 1, max: 5 })
    .withMessage('Puan 1-5 arasında olmalıdır'),
  validate,
];

module.exports = {
  validate,
  validateCampaignId,
  validateSearch,
  validateFavoriteAdd,
  validateFCMToken,
  validateComment,
  validateRating,
};
