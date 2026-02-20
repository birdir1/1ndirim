const HtmlListDetailScraper = require('./html-list-detail-scraper');

class AkbankFetchScraper extends HtmlListDetailScraper {
  constructor() {
    // Keep current Akbank scraper; this is an additional fetch-based one.
    super('Akbank', 'https://www.akbank.com/kampanyalar', {
      maxLinks: 40,
      linkInclude: /(kampanya|kampanyalar)/i,
    });
  }

  normalizeCategory(text) {
    const t = (text || '').toLowerCase();
    if (t.match(/uçak|bilet|thy|pegasus|anadolujet|havayolu/)) return { category: 'travel', subCategory: 'flight' };
    if (t.match(/otel|konaklama|tatil|tatili/)) return { category: 'travel', subCategory: 'hotel' };
    if (t.match(/oyun|game|steam|epic|ps|xbox/)) return { category: 'entertainment', subCategory: 'gaming' };
    if (t.match(/müze|museum|tiyatro|konser|etkinlik/)) return { category: 'culture', subCategory: 'event' };
    return { category: 'other', subCategory: 'akbank' };
  }
}

module.exports = AkbankFetchScraper;
