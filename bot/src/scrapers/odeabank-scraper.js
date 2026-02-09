const HtmlListDetailScraper = require('./fetch/html-list-detail-scraper');

class OdeabankScraper extends HtmlListDetailScraper {
  constructor() {
    super('OdeaBank', 'https://www.odeabank.com.tr/kampanyalar', {
      maxLinks: 30,
      linkInclude: /\/kampanyalar\/[^/]+/i,
      linkExclude: /\.(pdf|png|jpe?g|webp)(\?.*)?$/i,
    });
  }
}

module.exports = OdeabankScraper;
