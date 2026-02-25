const HtmlListDetailScraper = require('./html-list-detail-scraper');

class PullBearFetchScraper extends HtmlListDetailScraper {
  constructor() {
    super('Pull&Bear', 'https://www.pullandbear.com/tr/', {
      maxLinks: 30,
      linkInclude: /(kampanya|indirim|firsat|fırsat|sale|promosyon|campaign|outlet)/i,
      sameOriginOnly: true,
    });
  }

  normalizeCategory() {
    return { category: 'fashion', subCategory: 'giyim' };
  }
}

module.exports = PullBearFetchScraper;
