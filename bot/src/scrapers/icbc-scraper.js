const GenericKampanyaScraper = require('./generic-kampanya-scraper');

class IcbcScraper extends GenericKampanyaScraper {
  constructor() {
    // ICBC campaign listing is under "Bonus Kampanyalar" (credit card campaigns).
    super('ICBC Turkey Bank', 'https://www.icbc.com.tr/tr/sizin-icin/bonus-kampanyalar/Kredi-Kartlari/389/0/0', {
      maxLinks: 20,
      linkInclude: /(bonus-kampanyalar|kampanya|kampanyalar)/i,
    });
  }
}

module.exports = IcbcScraper;
