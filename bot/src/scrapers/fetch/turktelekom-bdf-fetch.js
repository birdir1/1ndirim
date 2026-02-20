const HtmlListDetailScraper = require('./html-list-detail-scraper');

class TurktelekomBiDunyaFirsatFetch extends HtmlListDetailScraper {
  constructor() {
    super('Türk Telekom', 'https://bireysel.turktelekom.com.tr/bi-dunya-firsat', {
      maxLinks: 30,
      linkInclude: /(firsat|kampanya|ucak|bilet|otel)/i,
      sameOriginOnly: true,
    });
  }

  normalizeCategory(text) {
    const t = (text || '').toLowerCase();
    if (t.match(/uçak|bilet|havayolu/)) return { category: 'travel', subCategory: 'flight' };
    if (t.match(/otel|konaklama|tatil/)) return { category: 'travel', subCategory: 'hotel' };
    if (t.match(/oyun|game|steam|epic/)) return { category: 'entertainment', subCategory: 'gaming' };
    return { category: 'other', subCategory: 'turktelekom' };
  }
}

module.exports = TurktelekomBiDunyaFirsatFetch;
