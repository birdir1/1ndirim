/**
 * Yemeksepeti Campaign Scraper
 * Uses GenericSPAScraper template
 * 
 * Category: food
 */

const GenericSPAScraper = require('./templates/GenericSPAScraper');

class YemeksepetiScraper extends GenericSPAScraper {
  constructor() {
    super('Yemeksepeti', 'https://www.yemeksepeti.com/kampanyalar', 'food', {
      maxCampaigns: 15,
      waitTime: 4000, // SPA needs more time
      selectors: {
        campaignLinks: {
          primary: ['a[href*="/kampanya"]'],
          secondary: ['a[href*="/firsat"]'],
          fallback: ['.campaign-card a', '.promo-card a', 'article a'],
        },
      },
    });
  }

  detectSubCategory(title, description) {
    const text = `${title} ${description}`.toLowerCase();
    if (text.match(/banka|kart/)) return 'Banka Kampanyası';
    if (text.match(/ilk sipariş|yeni üye/)) return 'İlk Sipariş';
    if (text.match(/indirim kodu|kupon/)) return 'İndirim Kodu';
    return 'Yemeksepeti';
  }
}

module.exports = YemeksepetiScraper;
