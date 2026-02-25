const HtmlListDetailScraper = require('./html-list-detail-scraper');

class KotonFetchScraper extends HtmlListDetailScraper {
  constructor() {
    super('Koton', 'https://www.koton.com/tr/', {
      maxLinks: 30,
      linkInclude: /(kampanya|indirim|firsat|fırsat|sale|promosyon|campaign|outlet)/i,
      sameOriginOnly: true,
    });
  }

  normalizeCategory() {
    return { category: 'fashion', subCategory: 'giyim' };
  }
}

module.exports = KotonFetchScraper;
