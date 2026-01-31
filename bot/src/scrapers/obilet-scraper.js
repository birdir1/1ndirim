/**
 * Obilet Campaign Scraper
 * Bus ticket aggregator (NOT individual bus companies)
 * Uses GenericSPAScraper template
 * 
 * Category: travel-bus
 */

const GenericSPAScraper = require('./templates/GenericSPAScraper');

class ObiletScraper extends GenericSPAScraper {
  constructor() {
    super('Obilet', 'https://www.obilet.com/kampanyalar', 'travel-bus', {
      maxCampaigns: 15,
      waitTime: 4000,
      selectors: {
        campaignLinks: {
          primary: ['a[href*="/kampanya"]'],
          secondary: ['a[href*="/indirim"]', 'a[href*="/firsat"]'],
          fallback: ['.campaign-card a', '.promo-card a', 'article a'],
        },
      },
    });
  }

  detectSubCategory(title, description) {
    const text = `${title} ${description}`.toLowerCase();
    
    // Extract campaign type
    if (text.match(/banka|kart|mastercard|visa/)) return 'Banka Kampanyası';
    if (text.match(/ilk|yeni üye/)) return 'İlk Alışveriş';
    if (text.match(/indirim kodu|kupon|kod/)) return 'İndirim Kodu';
    if (text.match(/turkcell|vodafone|türk telekom/)) return 'Operatör Kampanyası';
    
    return 'Obilet';
  }
}

module.exports = ObiletScraper;
