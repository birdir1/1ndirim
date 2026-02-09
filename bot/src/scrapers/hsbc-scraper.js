const GenericKampanyaScraper = require('./generic-kampanya-scraper');

class HsbcScraper extends GenericKampanyaScraper {
  constructor() {
    // HSBC TR doesn't have a single obvious listing page; this is the closest public "Kampanyalar" landing.
    super('HSBC Türkiye', 'https://www.hsbc.com.tr/kampanyalar/');
  }
}

module.exports = HsbcScraper;

