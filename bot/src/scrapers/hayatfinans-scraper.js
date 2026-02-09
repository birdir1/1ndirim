const GenericKampanyaScraper = require('./generic-kampanya-scraper');

class HayatFinansScraper extends GenericKampanyaScraper {
  constructor() {
    super('Hayat Finans', 'https://www.hayatfinans.com.tr/kampanyalar');
  }
}

module.exports = HayatFinansScraper;

