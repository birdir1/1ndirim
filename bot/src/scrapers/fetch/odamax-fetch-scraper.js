const HtmlListDetailScraper = require('./html-list-detail-scraper');

class OdamaxFetchScraper extends HtmlListDetailScraper {
  constructor() {
    super('Odamax', 'https://www.odamax.com/kampanyalar', {
      maxLinks: 30,
      linkInclude: /(kampanya|indirim|firsat)/i,
    });
  }

  normalizeCategory(text) {
    return { category: 'travel', subCategory: 'hotel' };
  }
}

module.exports = OdamaxFetchScraper;
