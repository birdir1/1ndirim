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
    const campaigns = [];

    try {
      // Netflix genellikle public kampanya sayfası olmadığı için
      // Keşfet kategorisi için anchor kampanyalar oluşturuyoruz
      
      // Anchor campaign 1: Netflix subscription info
      campaigns.push({
        sourceName: this.sourceName,
        title: 'Netflix Temel Plan - Aylık 99.99 TL',
        description: 'Netflix Temel planı ile sınırsız dizi ve film izleyin. HD kalitede, reklamsız içerik.',
        detailText: 'Netflix Temel planı ile sevdiğiniz dizileri ve filmleri HD kalitede izleyebilirsiniz. Reklamsız, sınırsız içerik. İstediğiniz zaman iptal edebilirsiniz.',
        campaignUrl: 'https://www.netflix.com/tr/',
        originalUrl: 'https://www.netflix.com/tr/',
        affiliateUrl: null,
        startDate: new Date().toISOString().split('T')[0],
        endDate: this.getEndDate(90), // 90 days
        howToUse: ['Netflix.com adresinden üye olun', 'Plan seçin ve ödeme yapın', 'Hemen izlemeye başlayın'],
        category: 'entertainment',
        tags: ['Netflix', 'Streaming', 'Dizi', 'Film'],
        channel: 'online',
      });

      // Anchor campaign 2: Netflix Standard plan
      campaigns.push({
        sourceName: this.sourceName,
        title: 'Netflix Standart Plan - Aylık 149.99 TL',
        description: 'Netflix Standart planı ile Full HD kalitede, 2 cihazda aynı anda izleyin.',
        detailText: 'Netflix Standart planı ile Full HD kalitede içerik izleyebilir, aynı anda 2 farklı cihazda kullanabilirsiniz. Reklamsız, sınırsız içerik.',
        campaignUrl: 'https://www.netflix.com/tr/',
        originalUrl: 'https://www.netflix.com/tr/',
        affiliateUrl: null,
        startDate: new Date().toISOString().split('T')[0],
        endDate: this.getEndDate(90),
        howToUse: ['Netflix.com adresinden üye olun', 'Standart planı seçin', 'Hemen izlemeye başlayın'],
        category: 'entertainment',
        tags: ['Netflix', 'Streaming', 'Full HD'],
        channel: 'online',
      });

      // Anchor campaign 3: Netflix Premium plan
      campaigns.push({
        sourceName: this.sourceName,
        title: 'Netflix Premium Plan - Aylık 199.99 TL',
        description: 'Netflix Premium planı ile 4K Ultra HD kalitede, 4 cihazda aynı anda izleyin.',
        detailText: 'Netflix Premium planı ile 4K Ultra HD kalitede içerik izleyebilir, aynı anda 4 farklı cihazda kullanabilirsiniz. En yüksek görüntü ve ses kalitesi.',
        campaignUrl: 'https://www.netflix.com/tr/',
        originalUrl: 'https://www.netflix.com/tr/',
        affiliateUrl: null,
        startDate: new Date().toISOString().split('T')[0],
        endDate: this.getEndDate(90),
        howToUse: ['Netflix.com adresinden üye olun', 'Premium planı seçin', '4K kalitede izleyin'],
        category: 'entertainment',
        tags: ['Netflix', 'Streaming', '4K', 'Ultra HD'],
        channel: 'online',
      });

      console.log(`✅ ${this.sourceName}: ${campaigns.length} anchor kampanya oluşturuldu`);
      return campaigns;
    } catch (error) {
      throw new Error(`Netflix scraper hatası: ${error.message}`);
    }
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
