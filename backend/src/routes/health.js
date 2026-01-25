const express = require('express');
const router = express.Router();
const pool = require('../config/database');

/**
 * GET /health
 * Sistem sağlık kontrolü (production-ready)
 */
router.get('/', async (req, res) => {
  const startTime = Date.now();
  const health = {
    success: true,
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: Math.floor(process.uptime()),
    version: '1.0.0',
    checks: {},
  };

  let isHealthy = true;

  // Database check
  try {
    const dbStart = Date.now();
    await pool.query('SELECT 1');
    health.checks.database = {
      status: 'connected',
      responseTime: `${Date.now() - dbStart}ms`,
    };
  } catch (error) {
    isHealthy = false;
    health.checks.database = {
      status: 'disconnected',
      error: error.message,
    };
  }

  // Memory check
  const memUsage = process.memoryUsage();
  health.checks.memory = {
    heapUsed: `${Math.round(memUsage.heapUsed / 1024 / 1024)}MB`,
    heapTotal: `${Math.round(memUsage.heapTotal / 1024 / 1024)}MB`,
    rss: `${Math.round(memUsage.rss / 1024 / 1024)}MB`,
  };

  // Response time
  health.responseTime = `${Date.now() - startTime}ms`;

  if (!isHealthy) {
    health.success = false;
    health.status = 'unhealthy';
    return res.status(503).json(health);
  }

  res.json(health);
});

module.exports = router;
