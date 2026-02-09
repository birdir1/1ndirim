const HtmlListDetailScraper = require('./fetch/html-list-detail-scraper');

class HayatFinansScraper extends HtmlListDetailScraper {
  constructor() {
    // Hayat Finans redirects to non-www and lists campaigns under /kampanyalar
    super('Hayat Finans', 'https://hayatfinans.com.tr/kampanyalar', {
      maxLinks: 30,
      linkInclude: /\/kampanyalar\//i,
      linkExclude: /\.(pdf|png|jpe?g|webp)(\?.*)?$/i,
    });
  }
}

module.exports = HayatFinansScraper;
