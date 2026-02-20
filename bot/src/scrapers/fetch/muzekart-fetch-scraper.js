const HtmlListDetailScraper = require('./html-list-detail-scraper');

class MuzekartFetchScraper extends HtmlListDetailScraper {
  constructor() {
    super('Müzekart', 'https://muze.gov.tr/muzekart', {
      maxLinks: 20,
      linkInclude: /(kampanya|indirim|firsat)/i,
      sameOriginOnly: true,
    });
  }

  normalizeCategory() {
    return { category: 'culture', subCategory: 'museum' };
  }
}

module.exports = MuzekartFetchScraper;
