const HtmlListDetailScraper = require('./html-list-detail-scraper');

class LCWFetchScraper extends HtmlListDetailScraper {
  constructor() {
    super('LCW', 'https://www.lcwaikiki.com/tr-TR/TR', {
      maxLinks: 30,
      linkInclude: /(kampanya|indirim|firsat|fırsat|sale|promosyon|campaign|outlet)/i,
      sameOriginOnly: true,
    });
  }

  normalizeCategory() {
    return { category: 'fashion', subCategory: 'giyim' };
  }
}

module.exports = LCWFetchScraper;
