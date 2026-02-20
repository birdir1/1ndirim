const HtmlListDetailScraper = require('./html-list-detail-scraper');

class EtsFetchScraper extends HtmlListDetailScraper {
  constructor() {
    super('ETS', 'https://www.etstur.com/kampanyalar', {
      maxLinks: 40,
      linkInclude: /(kampanya|indirim|firsat)/i,
    });
  }

  normalizeCategory(text) {
    return { category: 'travel', subCategory: 'hotel' };
  }
}

module.exports = EtsFetchScraper;
