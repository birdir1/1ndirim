const GenericKampanyaScraper = require('./generic-kampanya-scraper');

class AnadolubankScraper extends GenericKampanyaScraper {
  constructor() {
    // AnadoluBank seems to use /kampanya/ pages
    super('Anadolubank', 'https://www.anadolubank.com.tr/kampanya/');
  }
}

module.exports = AnadolubankScraper;

