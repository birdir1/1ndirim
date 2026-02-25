const HtmlListDetailScraper = require('./html-list-detail-scraper');

class MacCosmeticsFetchScraper extends HtmlListDetailScraper {
  constructor() {
    super('MAC Cosmetics', 'https://www.maccosmetics.com.tr/', {
      maxLinks: 30,
      linkInclude: /(kampanya|indirim|firsat|fırsat|sale|promosyon|campaign|outlet)/i,
      sameOriginOnly: true,
    });
  }

  normalizeCategory() {
    return { category: 'fashion', subCategory: 'makyaj' };
  }
}

module.exports = MacCosmeticsFetchScraper;
