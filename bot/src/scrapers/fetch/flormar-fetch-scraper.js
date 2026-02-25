const HtmlListDetailScraper = require('./html-list-detail-scraper');

class FlormarFetchScraper extends HtmlListDetailScraper {
  constructor() {
    super('Flormar', 'https://www.flormar.com.tr/', {
      maxLinks: 30,
      linkInclude: /(kampanya|indirim|firsat|fırsat|sale|promosyon|campaign|outlet)/i,
      sameOriginOnly: true,
    });
  }

  normalizeCategory() {
    return { category: 'fashion', subCategory: 'makyaj' };
  }
}

module.exports = FlormarFetchScraper;
