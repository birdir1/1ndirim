const GenericKampanyaScraper = require('./generic-kampanya-scraper');

class AlternatifBankScraper extends GenericKampanyaScraper {
  constructor() {
    super('Alternatif Bank', 'https://www.alternatifbank.com.tr/kampanyalar');
  }
}

module.exports = AlternatifBankScraper;
