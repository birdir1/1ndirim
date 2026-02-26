const HtmlListDetailScraper = require('./html-list-detail-scraper');

class DeFactoFetchScraper extends HtmlListDetailScraper {
  constructor() {
    super('DeFacto', 'https://www.defacto.com.tr/statik/kampanyalar', {
      maxLinks: 30,
      linkInclude: /(kampanya|indirim|firsat|fırsat|sale|promosyon|campaign|outlet)/i,
      sameOriginOnly: true,
    });
  }

  normalizeCategory() {
    return { category: 'fashion', subCategory: 'giyim' };
  }
}

module.exports = DeFactoFetchScraper;
