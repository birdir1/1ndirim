const HtmlListDetailScraper = require('./html-list-detail-scraper');

class TurktelekomPrimeFetch extends HtmlListDetailScraper {
  constructor() {
    super('Türk Telekom Prime', 'https://bireysel.turktelekom.com.tr/prime', {
      maxLinks: 30,
      linkInclude: /(kampanya|ayricalik|firsat)/i,
      sameOriginOnly: true,
    });
  }

  normalizeCategory(text) {
    const t = (text || '').toLowerCase();
    if (t.match(/uçak|ucak|bilet|havayolu|hava yolu|flight|yolcu360|biletcom|bilet\.com|enuygun/)) {
      return { category: 'travel', subCategory: 'flight' };
    }
    if (t.match(/otel|konaklama|tatil|seyahat|tur|setur|ets/)) return { category: 'travel', subCategory: 'hotel' };
    if (t.match(/oyun|game|steam|epic/)) return { category: 'entertainment', subCategory: 'gaming' };
    if (t.match(/müze|museum|tiyatro|konser|etkinlik/)) return { category: 'culture', subCategory: 'event' };
    return { category: 'other', subCategory: 'prime' };
  }
}

module.exports = TurktelekomPrimeFetch;
