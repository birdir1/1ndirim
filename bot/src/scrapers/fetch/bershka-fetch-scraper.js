const HtmlListDetailScraper = require('./html-list-detail-scraper');

class BershkaFetchScraper extends HtmlListDetailScraper {
  constructor() {
    super('Bershka', 'https://www.bershka.com/tr/', {
      maxLinks: 30,
      linkInclude: /(kampanya|indirim|firsat|fırsat|sale|promosyon|campaign|outlet)/i,
      sameOriginOnly: true,
    });
  }

  normalizeCategory() {
    return { category: 'fashion', subCategory: 'giyim' };
  }
}

module.exports = BershkaFetchScraper;
