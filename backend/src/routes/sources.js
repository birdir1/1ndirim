const express = require('express');
const router = express.Router();
const Source = require('../models/Source');

/**
 * GET /sources
 * Tüm aktif kaynakları getirir
 */
router.get('/', async (req, res) => {
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
