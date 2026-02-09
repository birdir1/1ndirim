const HtmlListDetailScraper = require('./fetch/html-list-detail-scraper');

class SekerbankScraper extends HtmlListDetailScraper {
  constructor() {
    super('Şekerbank', 'https://www.sekerbank.com.tr/bireysel/kampanyalar', {
      maxLinks: 25,
      linkInclude: /\/kampanyalar\//i,
      linkExclude: /\.(pdf|png|jpe?g|webp)(\?.*)?$/i,
    });
  }
}

module.exports = SekerbankScraper;
