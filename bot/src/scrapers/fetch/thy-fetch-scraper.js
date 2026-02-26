const HtmlListDetailScraper = require('./html-list-detail-scraper');

class ThyFetchScraper extends HtmlListDetailScraper {
  constructor() {
    super('Türk Hava Yolları', 'https://www.turkishairlines.com/tr-tr/kampanyalar/', {
      maxLinks: 40,
      linkInclude: /(kampanya|indirim|firsat|promotion|promo|offers)/i,
    });
  }

  normalizeCategory(_text) {
    return { category: 'travel', subCategory: 'flight' };
  }
}

module.exports = ThyFetchScraper;
