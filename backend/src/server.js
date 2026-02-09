const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const cron = require('node-cron');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const campaignsRouter = require('./routes/campaigns');
const campaignsDiscoverRouter = require('./routes/campaigns-discover');
const sourcesRouter = require('./routes/sources');
const dashboardRouter = require('./routes/dashboard'); // Dashboard Stats
const healthRouter = require('./routes/health');
const adminRouter = require('./routes/admin'); // FAZ 10: Admin & Control Layer
const legalRouter = require('./routes/legal'); // Privacy Policy & Terms of Use
const favoritesRouter = require('./routes/favorites'); // User Favorites
const usersRouter = require('./routes/users'); // User Management (FCM tokens, etc.)
const commentsRouter = require('./routes/comments'); // Campaign Comments
const ratingsRouter = require('./routes/ratings'); // Campaign Ratings
const communityRouter = require('./routes/community'); // Community Features
const priceTrackingRouter = require('./routes/price_tracking'); // Price Tracking
const blogRouter = require('./routes/blog'); // Blog & Content
const referralsRouter = require('./routes/referrals'); // Referral System
const premiumRouter = require('./routes/premium'); // Premium Subscriptions
const { deactivateExpiredCampaigns } = require('./jobs/deactivateExpiredCampaigns');
const { isTrustedBotRequest } = require('./middleware/botAuth');

const app = express();
const PORT = process.env.PORT || 3000;

// Behind a reverse proxy (nginx), `req.ip` must reflect the real client IP so rate limiting
// does not treat all traffic as coming from the proxy itself.
//
// Default: trust proxy headers only when the direct peer is loopback.
// This matches the common prod setup: nginx on the same host forwarding to Node over 127.0.0.1,
// while still preventing direct external clients from spoofing X-Forwarded-*.
//
// Override with TRUST_PROXY (e.g. "1", "true", "false", "loopback") if needed.
const trustProxyEnv = process.env.TRUST_PROXY;
if (typeof trustProxyEnv === 'string' && trustProxyEnv.trim() !== '') {
  const v = trustProxyEnv.trim().toLowerCase();
  if (v === 'true') app.set('trust proxy', true);
  else if (v === 'false') app.set('trust proxy', false);
  else app.set('trust proxy', Number.isFinite(Number(v)) ? Number(v) : trustProxyEnv);
} else {
  app.set('trust proxy', 'loopback');
}

// Rate Limiting - DDoS koruması
// NOTE: Mobile apps can easily exceed 100 requests/15min due to preflights, retries, and multi-tab usage.
// Keep the default higher in production, and allow overrides via env.
const rateLimitWindowMs =
  Number(process.env.RATE_LIMIT_WINDOW_MS) > 0
    ? Number(process.env.RATE_LIMIT_WINDOW_MS)
    : 15 * 60 * 1000;
const rateLimitMax =
  Number(process.env.RATE_LIMIT_MAX) > 0
    ? Number(process.env.RATE_LIMIT_MAX)
    : process.env.NODE_ENV === 'production'
      ? 600
      : 100;

const limiter = rateLimit({
  windowMs: rateLimitWindowMs, // default 15 dakika
  max: rateLimitMax, // default: prod 600 / dev 100
  message: {
    success: false,
    error: 'Çok fazla istek gönderdiniz. Lütfen 15 dakika sonra tekrar deneyin.',
  },
  standardHeaders: true, // Rate limit bilgisini `RateLimit-*` header'larında döndür
  legacyHeaders: false, // `X-RateLimit-*` header'larını devre dışı bırak
});

// Daha sıkı rate limit (auth endpoint'leri için)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 dakika
  max: 5, // IP başına maksimum 5 istek
  message: {
    success: false,
    error: 'Çok fazla giriş denemesi. Lütfen 15 dakika sonra tekrar deneyin.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Middleware
app.use(helmet()); // Security headers
// CORS: keep public API open, optionally restrict admin routes by origin.
// Env:
// - ADMIN_CORS_ORIGINS: comma-separated list of allowed origins for /api/admin/* (optional)
const publicCors = cors();
const adminCorsOrigins = (process.env.ADMIN_CORS_ORIGINS || '')
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean);
const adminCors = adminCorsOrigins.length
  ? cors({
      origin: (origin, cb) => {
        // Non-browser clients (no Origin) should continue to work.
        if (!origin) return cb(null, true);
        return cb(null, adminCorsOrigins.includes(origin));
      },
    })
  : publicCors;
app.use((req, res, next) => {
  if (req.path.startsWith('/api/admin')) return adminCors(req, res, next);
  return publicCors(req, res, next);
});
app.use(morgan('combined')); // Logging
app.use(express.json()); // JSON body parser
app.use(express.urlencoded({ extended: true })); // URL encoded body parser

// Global rate limiting (tüm API'ye, admin hariç)
app.use((req, res, next) => {
  // Do not rate-limit CORS preflights.
  if (req.method === 'OPTIONS') return next();
  // Health checks should not consume the public rate limit window.
  if (req.path === '/api/health') return next();
  if (req.path.startsWith('/api/admin')) return next();
  // Bot ingestion runs bursty and is already protected by token + loopback/private IP.
  // Do not apply public rate limit to trusted bot requests.
  if (isTrustedBotRequest(req)) return next();
  return limiter(req, res, next);
});

// Root endpoint (legal router'dan önce)
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: '1ndirim Backend API',
    version: '1.0.0',
      endpoints: {
        campaigns: '/api/campaigns',
        sources: '/api/sources',
        dashboard: '/api/dashboard', // Dashboard Stats
        health: '/api/health',
        admin: '/api/admin', // FAZ 10: Admin & Control Layer
        favorites: '/api/favorites', // User Favorites
        users: '/api/users', // User Management
        comments: '/api/comments', // Campaign Comments
        ratings: '/api/ratings', // Campaign Ratings
        community: '/api/community', // Community Features
        priceTracking: '/api/price-tracking', // Price Tracking
        blog: '/api/blog', // Blog & Content
        referrals: '/api/referrals', // Referral System
        premium: '/api/premium', // Premium Subscriptions
      },
  });
});

// Routes
app.use('/api/campaigns', campaignsDiscoverRouter); // Discover routes (must be before campaigns)
app.use('/api/campaigns', campaignsRouter);
app.use('/api/sources', sourcesRouter);
app.use('/api/dashboard', dashboardRouter); // Dashboard Stats
app.use('/api/health', healthRouter);
app.use('/api/admin', adminRouter); // FAZ 10: Admin & Control Layer
app.use('/api/favorites', favoritesRouter); // User Favorites
app.use('/api/users', usersRouter); // User Management
app.use('/api/comments', commentsRouter); // Campaign Comments
app.use('/api/ratings', ratingsRouter); // Campaign Ratings
app.use('/api/community', communityRouter); // Community Features
app.use('/api/price-tracking', priceTrackingRouter); // Price Tracking
app.use('/api/blog', blogRouter); // Blog & Content
app.use('/api/referrals', referralsRouter); // Referral System
app.use('/api/premium', premiumRouter); // Premium Subscriptions
app.use('/', legalRouter); // Privacy Policy & Terms of Use (root level)

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint bulunamadı',
    path: req.path,
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    success: false,
    error: err.message || 'Sunucu hatası',
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 1ndirim Backend API çalışıyor: http://localhost:${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
  console.log(`📋 Campaigns: http://localhost:${PORT}/api/campaigns`);
  console.log(`🏦 Sources: http://localhost:${PORT}/api/sources`);
  console.log(`⭐ Favorites: http://localhost:${PORT}/api/favorites`);
  console.log(`👤 Users: http://localhost:${PORT}/api/users`);
  console.log(`💬 Comments: http://localhost:${PORT}/api/comments`);
  console.log(`⭐ Ratings: http://localhost:${PORT}/api/ratings`);
  console.log(`👥 Community: http://localhost:${PORT}/api/community`);
  console.log(`💰 Price Tracking: http://localhost:${PORT}/api/price-tracking`);
  console.log(`📝 Blog: http://localhost:${PORT}/api/blog`);
  console.log(`🎁 Referrals: http://localhost:${PORT}/api/referrals`);
  console.log(`⭐ Premium: http://localhost:${PORT}/api/premium`);

  // Cron job: Sadece CRON_ONLY env yoksa çalıştır (production'da ayrı worker)
  if (!process.env.CRON_ONLY) {
    cron.schedule('0 * * * *', async () => {
      console.log('⏰ Cron job çalışıyor: Süresi bitmiş kampanyalar kontrol ediliyor...');
      try {
        await deactivateExpiredCampaigns();
      } catch (error) {
        console.error('❌ Cron job hatası:', error);
      }
    });
    console.log('⏰ Cron job aktif: Her saat başı süresi bitmiş kampanyalar pasifleştirilecek');
  } else {
    console.log('⏰ Cron job devre dışı (CRON_ONLY=true, ayrı worker kullanılıyor)');
  }
});

module.exports = app;
