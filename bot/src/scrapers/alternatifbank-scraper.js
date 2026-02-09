const GenericKampanyaScraper = require('./generic-kampanya-scraper');

class AlternatifBankScraper extends GenericKampanyaScraper {
  constructor() {
    super('Alternatif Bank', 'https://www.abank.com.tr/kampanyalar');
  }
}

module.exports = AlternatifBankScraper;

