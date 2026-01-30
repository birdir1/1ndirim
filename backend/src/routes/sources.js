const express = require('express');
const router = express.Router();
const Source = require('../models/Source');
const { cacheMiddleware } = require('../middleware/cache');
const CacheService = require('../services/cacheService');

/**
 * GET /sources/status
 * Bot routing: name + source_status for all sources.
 * No auth. Used by bot to respect admin authority (skip hard_backlog).
 * Does not change existing API contract.
 * 
 * CACHED: 1 hour
 */
router.get('/status', cacheMiddleware(CacheService.TTL.SOURCES_LIST), async (req, res) => {
  try {
    const rows = await Source.getSourceStatusForBot();
    const data = rows.map((r) => ({ name: r.name, source_status: r.source_status }));
    res.json({ success: true, data });
  } catch (error) {
    console.error('Sources status error:', error);
    res.status(500).json({
      success: false,
      error: 'Source status yüklenemedi',
      message: error.message,
    });
  }
});

/**
 * GET /sources
 * Tüm aktif kaynakları getirir
 * 
 * CACHED: 1 hour
 */
router.get('/', cacheMiddleware(CacheService.TTL.SOURCES_LIST), async (req, res) => {
  try {
    const sources = await Source.findAll();

    // Flutter uygulaması için format
    // Not: icon ve color Flutter tarafında hardcoded, burada sadece metadata
    const formattedSources = sources.map((source) => ({
      id: source.id,
      name: source.name,
      type: source.type, // 'bank' or 'operator'
      logoUrl: source.logo_url,
      websiteUrl: source.website_url,
      segments: source.segments || [],
      isSelected: false, // Bu client-side state, backend'de tutulmaz
    }));

    res.json({
      success: true,
      data: formattedSources,
      count: formattedSources.length,
    });
  } catch (error) {
    console.error('Sources list error:', error);
    res.status(500).json({
      success: false,
      error: 'Kaynaklar yüklenirken bir hata oluştu',
      message: error.message,
    });
  }
});

module.exports = router;
