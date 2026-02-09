const GenericKampanyaScraper = require('./generic-kampanya-scraper');

class SekerbankScraper extends GenericKampanyaScraper {
  constructor() {
    super('Şekerbank', 'https://www.sekerbank.com.tr/bireysel/kampanyalar');
  }
}

module.exports = SekerbankScraper;
