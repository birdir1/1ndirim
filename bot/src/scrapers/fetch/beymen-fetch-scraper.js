const HtmlListDetailScraper = require('./html-list-detail-scraper');

class BeymenFetchScraper extends HtmlListDetailScraper {
  constructor() {
    super('Beymen', 'https://www.beymen.com/tr/sale-kampanyalar-beymen-ozel-markalarda-indirim--101090', {
      maxLinks: 30,
      linkInclude: /(kampanya|indirim|firsat|fırsat|sale|promosyon|campaign|outlet)/i,
      sameOriginOnly: true,
    });
  }

  normalizeCategory() {
    return { category: 'fashion', subCategory: 'giyim' };
  }
}

module.exports = BeymenFetchScraper;
