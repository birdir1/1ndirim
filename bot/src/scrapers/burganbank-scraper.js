const GenericKampanyaScraper = require('./generic-kampanya-scraper');

class BurganbankScraper extends GenericKampanyaScraper {
  constructor() {
    super('Burgan Bank', 'https://www.burgan.com.tr/kampanyalar');
  }
}

module.exports = BurganbankScraper;

