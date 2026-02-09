const HtmlListDetailScraper = require('./fetch/html-list-detail-scraper');

class FibabankaScraper extends HtmlListDetailScraper {
  constructor() {
    super('Fibabanka', 'https://www.fibabanka.com.tr/kampanyalar/guncel-ozel-kampanyalar', {
      maxLinks: 25,
      linkInclude: /\/kampanyalar\/(guncel|musteriyim|gecmis|kampanyalar)\/?/i,
      linkExclude: /\.(pdf|png|jpe?g|webp)(\?.*)?$/i,
    });
  }
}

module.exports = FibabankaScraper;
