const HtmlListDetailScraper = require('./fetch/html-list-detail-scraper');

class IcbcScraper extends HtmlListDetailScraper {
  constructor() {
    // ICBC campaign listing is under "Bonus Kampanyalar" (credit card campaigns).
    super('ICBC Turkey Bank', 'https://www.icbc.com.tr/tr/sizin-icin/bonus-kampanyalar/Kredi-Kartlari/389/0/0', {
      maxLinks: 35,
      linkInclude: /(bonus-kampanyalar-detay|kampanya-detay|bonus-kampanyalar)/i,
      linkExclude: /\.(pdf|png|jpe?g|webp)(\?.*)?$/i,
    });
  }
}

module.exports = IcbcScraper;
