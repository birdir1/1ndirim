const GenericKampanyaScraper = require('./generic-kampanya-scraper');

class HayatFinansScraper extends GenericKampanyaScraper {
  constructor() {
    // Hayat Finans redirects to non-www and lists campaigns under /kampanyalar
    super('Hayat Finans', 'https://hayatfinans.com.tr/kampanyalar', {
      maxLinks: 20,
      linkInclude: /\/kampanyalar\//i,
    });
  }
}

module.exports = HayatFinansScraper;
