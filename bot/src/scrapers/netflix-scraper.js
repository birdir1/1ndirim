/**
 * Netflix Campaign Scraper
 * Netflix kampanyalarını toplar (Keşfet - Entertainment kategorisi için)
 * 
 * CREATED: Phase 3.7
 * - Manual entry system (Netflix public campaign page may not exist)
 * - Category: entertainment
 * - Sub-category: Netflix
 * 
 * NOTE: Netflix typically doesn't have a public campaigns page.
 * This scraper creates anchor campaigns for the Keşfet entertainment category.
 * Real campaigns should be added manually through admin panel.
 */

const BaseScraper = require('./base-scraper');

class NetflixScraper extends BaseScraper {
  constructor() {
    super('Netflix', 'https://www.netflix.com/tr/');
  }

  /**
   * Netflix kampanyalarını scrape eder
   * Manual entry system - creates anchor campaigns
   */
  async scrape() {
    // Netflix için public kampanya sayfası yok; anchor/placeholder gönderilmez.
    console.log(`⚠️ ${this.sourceName}: public kampanya bulunamadı, anchor gönderilmiyor`);
    return [];
  }

  /**
   * Helper: Calculate end date
   */
  getEndDate(days) {
    const date = new Date();
    date.setDate(date.getDate() + days);
    return date.toISOString().split('T')[0];
  }
}

module.exports = NetflixScraper;
