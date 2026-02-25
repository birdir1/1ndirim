const HtmlListDetailScraper = require('./html-list-detail-scraper');

class SephoraFetchScraper extends HtmlListDetailScraper {
  constructor() {
    super('Sephora', 'https://www.sephora.com.tr/', {
      maxLinks: 30,
      linkInclude: /(kampanya|indirim|firsat|fırsat|sale|promosyon|campaign|outlet)/i,
      sameOriginOnly: true,
    });
  }

  normalizeCategory() {
    return { category: 'fashion', subCategory: 'makyaj' };
  }
}

module.exports = SephoraFetchScraper;
