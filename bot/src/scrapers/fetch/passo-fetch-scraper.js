const HtmlListDetailScraper = require('./html-list-detail-scraper');

class PassoFetchScraper extends HtmlListDetailScraper {
  constructor() {
    super('Passo', 'https://www.passo.com.tr/tr/kampanyalar', {
      maxLinks: 30,
      linkInclude: /(kampanya|firsat|etkinlik)/i,
    });
  }

  normalizeCategory(text) {
    return { category: 'culture', subCategory: 'event' };
  }
}

module.exports = PassoFetchScraper;
