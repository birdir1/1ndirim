const HtmlListDetailScraper = require('./html-list-detail-scraper');

class BiletixFetchScraper extends HtmlListDetailScraper {
  constructor() {
    super('Biletix', 'https://www.biletix.com/anasayfa/kampanyalar-tr', {
      maxLinks: 30,
      linkInclude: /(kampanya|firsat|indirim)/i,
      sameOriginOnly: false,
    });
  }

  normalizeCategory() {
    return { category: 'culture', subCategory: 'event' };
  }
}

module.exports = BiletixFetchScraper;
