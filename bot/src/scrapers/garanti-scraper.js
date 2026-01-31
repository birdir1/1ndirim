/**
 * Garanti BBVA Campaign Scraper
 * Uses GenericSPAScraper template
 * 
 * Category: finance
 */

const GenericSPAScraper = require('./templates/GenericSPAScraper');

class GarantiScraper extends GenericSPAScraper {
  constructor() {
    super('Garanti BBVA', 'https://www.garantibbva.com.tr/kampanyalar', 'finance', {
      maxCampaigns: 15,
      selectors: {
        campaignLinks: {
          primary: ['a[href*="/kampanyalar/"]', 'a[href*="/kampanya/"]'],
          secondary: ['a[href*="/firsatlar"]'],
          fallback: ['.campaign-card a', 'article a', '.card a'],
        },
      },
    });
  }

  detectSubCategory(title, description) {
    const text = `${title} ${description}`.toLowerCase();
    if (text.match(/kredi kartı|kart/)) return 'Kredi Kartı';
    if (text.match(/kredi/)) return 'Kredi';
    if (text.match(/mevduat/)) return 'Mevduat';
    return 'Garanti BBVA';
  }
}

module.exports = GarantiScraper;
