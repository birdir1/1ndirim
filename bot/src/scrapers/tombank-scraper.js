const GenericKampanyaScraper = require('./generic-kampanya-scraper');

class TombankScraper extends GenericKampanyaScraper {
  constructor() {
    super('TOM Bank', 'https://www.tombank.com.tr/kampanyalar.html', {
      // TOMBank uses static html; keep origin-only links but allow general
      maxLinks: 20,
    });
  }
}

module.exports = TombankScraper;

