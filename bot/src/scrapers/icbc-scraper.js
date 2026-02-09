const GenericKampanyaScraper = require('./generic-kampanya-scraper');

class IcbcScraper extends GenericKampanyaScraper {
  constructor() {
    super('ICBC Turkey Bank', 'https://www.icbc.com.tr/kampanyalar');
  }
}

module.exports = IcbcScraper;

