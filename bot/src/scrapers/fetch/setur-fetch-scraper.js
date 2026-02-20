const HtmlListDetailScraper = require('./html-list-detail-scraper');

class SeturFetchScraper extends HtmlListDetailScraper {
  constructor() {
    super('Setur', 'https://www.setur.com.tr/kampanyalar', {
      maxLinks: 40,
      linkInclude: /(kampanya|indirim|firsat)/i,
    });
  }

  normalizeCategory(text) {
    return { category: 'travel', subCategory: 'hotel' };
  }
}

module.exports = SeturFetchScraper;
