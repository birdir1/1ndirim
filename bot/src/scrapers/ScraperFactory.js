/**
 * Scraper Factory
 * Dynamically creates scrapers based on category registry
 * 
 * ARCHITECTURE: Category-driven, scalable
 * No need to manually create 60+ scraper files
 */

const { getAllEnabledSources } = require('../config/category-registry');
const GenericSPAScraper = require('./templates/GenericSPAScraper');

// Import existing scrapers
const TurktelekomScraper = require('./turktelekom-scraper');
const VodafoneScraper = require('./vodafone-scraper');
const TurkcellScraper = require('./turkcell-scraper');
const AkbankScraper = require('./akbank-scraper');
const PaparaScraper = require('./papara-scraper');
const NetflixScraper = require('./netflix-scraper');
const SteamScraper = require('./steam-scraper');
const EpicGamesScraper = require('./epicgames-scraper');

// Import new template-based scrapers
const GarantiScraper = require('./garanti-scraper');
const YemeksepetiScraper = require('./yemeksepeti-scraper');
const ObiletScraper = require('./obilet-scraper');

/**
 * Scraper Registry
 * Maps scraper class names to actual classes
 */
const SCRAPER_CLASSES = {
  // Existing scrapers
  TurktelekomScraper,
  VodafoneScraper,
  TurkcellScraper,
  AkbankScraper,
  PaparaScraper,
  NetflixScraper,
  SteamScraper,
  EpicGamesScraper,
  
  // New template-based scrapers
  GarantiScraper,
  YemeksepetiScraper,
  ObiletScraper,
  
  // Generic template (fallback)
  GenericSPAScraper,
};

/**
 * Scraper Factory
 */
class ScraperFactory {
  /**
   * Create a scraper instance for a source
   */
  static createScraper(source) {
    const { name, url, type, scraperClass, categoryId } = source;

    // Try to use specific scraper class if exists
    if (scraperClass && SCRAPER_CLASSES[scraperClass]) {
      const ScraperClass = SCRAPER_CLASSES[scraperClass];
      return new ScraperClass();
    }

    // Fallback to generic scraper based on type
    switch (type) {
      case 'spa':
      case 'html':
        return new GenericSPAScraper(name, url, categoryId);
      
      case 'anchor':
        // Anchor campaigns - create minimal scraper
        return this.createAnchorScraper(name, url, categoryId);
      
      default:
        console.warn(`⚠️  Unknown scraper type: ${type} for ${name}`);
        return new GenericSPAScraper(name, url, categoryId);
    }
  }

  /**
   * Create anchor scraper (for sources without public campaign pages)
   */
  static createAnchorScraper(sourceName, sourceUrl, categoryId) {
    return {
      sourceName,
      sourceUrl,
      async scrape() {
        // Anchor/placeholder kampanyalar fake veri ürettiği için ingestion'a gönderilmez.
        // Manuel/anchor kampanyalar admin panel üzerinden yönetilmeli.
        return [];
      },
      getEndDate(days) {
        const date = new Date();
        date.setDate(date.getDate() + days);
        return date.toISOString().split('T')[0];
      },
      async init() {},
      async close() {},
      async runWithRetry() {
        return await this.scrape();
      },
    };
  }

  /**
   * Get all scrapers grouped by category
   */
  static getAllScrapers() {
    const sources = getAllEnabledSources();
    const scrapersByCategory = {};

    for (const source of sources) {
      if (!scrapersByCategory[source.categoryId]) {
        scrapersByCategory[source.categoryId] = [];
      }

      const scraper = this.createScraper(source);
      scrapersByCategory[source.categoryId].push({
        scraper,
        source,
      });
    }

    return scrapersByCategory;
  }

  /**
   * Get scrapers for a specific category
   */
  static getScrapersByCategory(categoryId) {
    const allScrapers = this.getAllScrapers();
    return allScrapers[categoryId] || [];
  }

  /**
   * Get total scraper count
   */
  static getTotalScraperCount() {
    const sources = getAllEnabledSources();
    return sources.length;
  }
}

module.exports = ScraperFactory;
