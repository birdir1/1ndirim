const HtmlListDetailScraper = require('./html-list-detail-scraper');

class HMFetchScraper extends HtmlListDetailScraper {
  constructor() {
    super('H&M', 'https://www2.hm.com/tr_tr/index.html', {
      maxLinks: 30,
      linkInclude: /(kampanya|indirim|firsat|fırsat|sale|promosyon|campaign|outlet)/i,
      sameOriginOnly: true,
    });
  }

  normalizeCategory() {
    return { category: 'fashion', subCategory: 'giyim' };
  }
}

module.exports = HMFetchScraper;
