const HtmlListDetailScraper = require('./html-list-detail-scraper');

class MaviFetchScraper extends HtmlListDetailScraper {
  constructor() {
    super('Mavi', 'https://www.mavi.com/', {
      maxLinks: 30,
      linkInclude: /(kampanya|indirim|firsat|fırsat|sale|promosyon|campaign|outlet)/i,
      sameOriginOnly: true,
    });
  }

  normalizeCategory() {
    return { category: 'fashion', subCategory: 'giyim' };
  }
}

module.exports = MaviFetchScraper;
