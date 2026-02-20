const HtmlListDetailScraper = require('./html-list-detail-scraper');

class PegasusFetchScraper extends HtmlListDetailScraper {
  constructor() {
    super('Pegasus', 'https://www.flypgs.com/kampanyalar', {
      maxLinks: 30,
      linkInclude: /(kampanya|promosyon)/i,
    });
  }

  normalizeCategory(text) {
    const t = (text || '').toLowerCase();
    return { category: 'travel', subCategory: 'flight' };
  }
}

module.exports = PegasusFetchScraper;
