const GenericKampanyaScraper = require('./generic-kampanya-scraper');

class OdeabankScraper extends GenericKampanyaScraper {
  constructor() {
    super('OdeaBank', 'https://www.odeabank.com.tr/kampanyalar');
  }
}

module.exports = OdeabankScraper;

