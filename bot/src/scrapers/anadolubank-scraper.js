const HtmlListDetailScraper = require('./fetch/html-list-detail-scraper');

class AnadolubankScraper extends HtmlListDetailScraper {
  constructor() {
    // AnadoluBank campaign listing lives under /kampanyalar (not /kampanya).
    super('Anadolubank', 'https://www.anadolubank.com.tr/kampanyalar', {
      maxLinks: 30,
      linkInclude: /\/kampanya\//i,
      linkExclude: /\.(pdf|png|jpe?g|webp)(\?.*)?$/i,
    });
  }
}

module.exports = AnadolubankScraper;
