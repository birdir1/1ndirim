const HtmlListDetailScraper = require('./html-list-detail-scraper');

class ZaraFetchScraper extends HtmlListDetailScraper {
  constructor() {
    super('Zara', 'https://www.zara.com/tr/', {
      maxLinks: 30,
      linkInclude: /(kampanya|indirim|firsat|fırsat|sale|promosyon|campaign|outlet)/i,
      sameOriginOnly: true,
    });
  }

  normalizeCategory() {
    return { category: 'fashion', subCategory: 'giyim' };
  }
}

module.exports = ZaraFetchScraper;
