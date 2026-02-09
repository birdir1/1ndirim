const GenericKampanyaScraper = require('./generic-kampanya-scraper');

class FibabankaScraper extends GenericKampanyaScraper {
  constructor() {
    super('Fibabanka', 'https://www.fibabanka.com.tr/kampanyalar/guncel-kampanyalar');
  }
}

module.exports = FibabankaScraper;

