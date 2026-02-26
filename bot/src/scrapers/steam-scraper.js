/**
 * Steam Free Games Scraper
 * Steam'de %100 indirim (free-to-keep) kampanyalarını toplar (Keşfet - Gaming)
 *
 * Data source: Steam featured categories API
 * - Only discount_percent === 100 and discount_expiration present
 */

const BaseFetchScraper = require('./fetch/base-fetch-scraper');

class SteamScraper extends BaseFetchScraper {
  constructor() {
    super('Steam', 'https://store.steampowered.com');
    this.apiEndpoint = 'https://store.steampowered.com/api/featuredcategories?cc=TR&l=turkish';
  }

  getApiEndpoint() {
    return this.apiEndpoint;
  }

  parseApiResponse(data) {
    const items = (data && data.specials && Array.isArray(data.specials.items)) ? data.specials.items : [];
    const campaigns = [];

    for (const item of items) {
      try {
        const discountPercent = Number(item.discount_percent || 0);
        if (discountPercent < 100) continue;

        const endTsSec = Number(item.discount_expiration || 0);
        if (!endTsSec) continue;

        const title = (item.name || '').toString().trim();
        if (!title) continue;

        const startTsSec = Number(item.discount_start || 0);
        const startDate = startTsSec
          ? new Date(startTsSec * 1000).toISOString().split('T')[0]
          : new Date().toISOString().split('T')[0];
        const endDate = new Date(endTsSec * 1000).toISOString().split('T')[0];

        const appId = item.id || item.appid || null;
        const url = appId ? `https://store.steampowered.com/app/${appId}` : 'https://store.steampowered.com/specials';
        const image = item.header_image || item.capsule_image || item.small_capsule_image || null;

        campaigns.push({
          sourceName: this.sourceName,
          title,
          description: `Steam'de ${title} kısa süreliğine ücretsiz. Kütüphanenize ekleyin ve kalıcı olarak sahip olun.`,
          detailText: `Steam üzerinde ${title} oyunu %100 indirimle ücretsiz. Bitiş tarihi: ${endDate}.`,
          campaignUrl: url,
          originalUrl: url,
          affiliateUrl: null,
          startDate,
          endDate,
          howToUse: [
            'Steam hesabınızla giriş yapın',
            'Oyunu kütüphaneye ekleyin',
            'Kalıcı olarak sahip olun',
          ],
          category: 'gaming',
          subCategory: 'steam',
          platform: 'steam',
          contentType: 'game',
          isFree: true,
          discountPercent: 100,
          videoThumbnailUrl: image,
          tags: ['Steam', 'Ücretsiz Oyun', 'PC'],
          channel: 'online',
        });
      } catch (error) {
        console.error(`❌ ${this.sourceName}: Steam item parse hatası:`, error.message);
      }
    }

    if (campaigns.length === 0) {
      console.log(`⚠️  ${this.sourceName}: Ücretsiz oyun bulunamadı`);
    }

    console.log(`✅ ${this.sourceName}: ${campaigns.length} ücretsiz oyun bulundu`);
    return campaigns;
  }
}

module.exports = SteamScraper;
