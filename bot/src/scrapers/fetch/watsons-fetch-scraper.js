const HtmlListDetailScraper = require('./html-list-detail-scraper');

class WatsonsFetchScraper extends HtmlListDetailScraper {
  constructor() {
    super('Watsons', 'https://www.watsons.com.tr/', {
      maxLinks: 30,
      linkInclude: /(kampanya|indirim|firsat|fırsat|sale|promosyon|campaign|outlet)/i,
      sameOriginOnly: true,
    });
  }

  normalizeCategory() {
    return { category: 'fashion', subCategory: 'makyaj' };
  }
}

module.exports = WatsonsFetchScraper;
