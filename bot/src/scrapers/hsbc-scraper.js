const HtmlListDetailScraper = require('./fetch/html-list-detail-scraper');

class HsbcScraper extends HtmlListDetailScraper {
  constructor() {
    // HSBC Türkiye kampanyaları: /kartlar-ve-krediler/kampanyalar/
    super('HSBC Türkiye', 'https://www.hsbc.com.tr/kartlar-ve-krediler/kampanyalar/guncel-kampanyalar', {
      maxLinks: 35,
      linkInclude: /\/kartlar-ve-krediler\/kampanyalar\/guncel-kampanyalar\//i,
      linkExclude: /\.(pdf|png|jpe?g|webp)(\?.*)?$/i,
    });
  }
}

module.exports = HsbcScraper;
