const GenericKampanyaScraper = require('./generic-kampanya-scraper');

class AnadolubankScraper extends GenericKampanyaScraper {
  constructor() {
    // AnadoluBank campaign listing lives under /kampanyalar (not /kampanya).
    super('Anadolubank', 'https://www.anadolubank.com.tr/kampanyalar');
  }
}

module.exports = AnadolubankScraper;
