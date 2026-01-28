const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const cron = require('node-cron');
require('dotenv').config();

const campaignsRouter = require('./routes/campaigns');
const sourcesRouter = require('./routes/sources');
const healthRouter = require('./routes/health');
const adminRouter = require('./routes/admin'); // FAZ 10: Admin & Control Layer
const legalRouter = require('./routes/legal'); // Privacy Policy & Terms of Use
const favoritesRouter = require('./routes/favorites'); // User Favorites
const usersRouter = require('./routes/users'); // User Management (FCM tokens, etc.)
const { deactivateExpiredCampaigns } = require('./jobs/deactivateExpiredCampaigns');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(helmet()); // Security headers
app.use(cors()); // CORS enabled for mobile app
app.use(morgan('combined')); // Logging
app.use(express.json()); // JSON body parser
app.use(express.urlencoded({ extended: true })); // URL encoded body parser

// Root endpoint (legal router'dan önce)
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: '1ndirim Backend API',
    version: '1.0.0',
      endpoints: {
        campaigns: '/api/campaigns',
        sources: '/api/sources',
        health: '/api/health',
        admin: '/api/admin', // FAZ 10: Admin & Control Layer
        favorites: '/api/favorites', // User Favorites
        users: '/api/users', // User Management
      },
  });
});

// Routes
app.use('/api/campaigns', campaignsRouter);
app.use('/api/sources', sourcesRouter);
app.use('/api/health', healthRouter);
app.use('/api/admin', adminRouter); // FAZ 10: Admin & Control Layer
app.use('/api/favorites', favoritesRouter); // User Favorites
app.use('/api/users', usersRouter); // User Management
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
