const GenericKampanyaScraper = require('./generic-kampanya-scraper');

class HsbcScraper extends GenericKampanyaScraper {
  constructor() {
    // HSBC Türkiye kampanyaları: /kartlar-ve-krediler/kampanyalar/
    super('HSBC Türkiye', 'https://www.hsbc.com.tr/kartlar-ve-krediler/kampanyalar/', {
      maxLinks: 20,
      linkInclude: /\/kartlar-ve-krediler\/kampanyalar\//i,
    });
  }
}

module.exports = HsbcScraper;
