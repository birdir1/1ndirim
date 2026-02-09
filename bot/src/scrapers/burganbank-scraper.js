const HtmlListDetailScraper = require('./fetch/html-list-detail-scraper');

class BurganbankScraper extends HtmlListDetailScraper {
  constructor() {
    super('Burgan Bank', 'https://www.burgan.com.tr/kampanyalar', {
      maxLinks: 30,
      linkInclude: /\/kampanyalar\/[^/]+/i,
      linkExclude: /\.(pdf|png|jpe?g|webp)(\?.*)?$/i,
    });
  }
}

module.exports = BurganbankScraper;
