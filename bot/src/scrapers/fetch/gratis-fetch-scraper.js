const HtmlListDetailScraper = require('./html-list-detail-scraper');

class GratisFetchScraper extends HtmlListDetailScraper {
  constructor() {
    super('Gratis', 'https://www.gratis.com/', {
      maxLinks: 30,
      linkInclude: /(kampanya|indirim|firsat|fırsat|sale|promosyon|campaign|outlet)/i,
      sameOriginOnly: true,
    });
  }

  normalizeCategory() {
    return { category: 'fashion', subCategory: 'makyaj' };
  }
}

module.exports = GratisFetchScraper;
