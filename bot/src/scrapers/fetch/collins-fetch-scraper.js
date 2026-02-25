const HtmlListDetailScraper = require('./html-list-detail-scraper');

class CollinsFetchScraper extends HtmlListDetailScraper {
  constructor() {
    super('Collins', 'https://www.collins.com.tr/', {
      maxLinks: 30,
      linkInclude: /(kampanya|indirim|firsat|fırsat|sale|promosyon|campaign|outlet)/i,
      sameOriginOnly: true,
    });
  }

  normalizeCategory() {
    return { category: 'fashion', subCategory: 'giyim' };
  }
}

module.exports = CollinsFetchScraper;
