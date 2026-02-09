const GenericKampanyaScraper = require('./generic-kampanya-scraper');

class TurkishBankScraper extends GenericKampanyaScraper {
  constructor() {
    // TurkishBank doesn't expose a clear consumer campaign listing. We scrape public announcements as a fallback.
    super('Turkish Bank', 'https://www.turkishbank.com/duyurular/', {
      linkInclude: /(duyurular|bizden-haberler)/i,
      maxLinks: 12,
    });
  }
}

module.exports = TurkishBankScraper;

