const HtmlListDetailScraper = require('./html-list-detail-scraper');

class AJetFetchScraper extends HtmlListDetailScraper {
  constructor() {
    super('AJet', 'https://www.ajet.com.tr/', {
      maxLinks: 40,
      linkInclude: /(kampanya|indirim|firsat|ucuz|bilet|promosyon|promotion|promo)/i,
      sameOriginOnly: true,
    });
    this.listPages = [
      'https://www.ajet.com.tr/',
      'https://www.ajet.com.tr/kampanyalar',
      'https://ajet.com.tr/',
      'https://ajet.com.tr/kampanyalar',
    ];
  }

  normalizeCategory(_text) {
    return { category: 'travel', subCategory: 'flight' };
  }

  async scrape() {
    for (const url of this.listPages) {
      try {
        this.sourceUrl = url;
        const campaigns = await super.scrape();
        if (Array.isArray(campaigns) && campaigns.length > 0) {
          return campaigns;
        }
      } catch (_) {
        // Try next URL
      }
    }
    return [];
  }
}

module.exports = AJetFetchScraper;
