const HtmlListDetailScraper = require('./fetch/html-list-detail-scraper');

class AlternatifBankScraper extends HtmlListDetailScraper {
  constructor() {
    super('Alternatif Bank', 'https://www.alternatifbank.com.tr/kampanyalar', {
      // Listing is JS-rendered; use their JSON endpoint instead.
      preferNextData: false,
      sameOriginOnly: true,
      maxLinks: 0,
    });
  }

  async scrape() {
    const apiUrl = new URL('/ajax/campaigns', this.sourceUrl).toString();
    const res = await this.http.get(apiUrl, {
      responseType: 'json',
      headers: { Accept: 'application/json, text/plain, */*' },
    });

    const data = res && res.data ? res.data : null;
    const rows = data && Array.isArray(data.data) ? data.data : [];

    const out = [];
    for (const row of rows.slice(0, 40)) {
      if (!row || typeof row !== 'object') continue;
      if (row.isPassive === true) continue; // keep only active items

      const url = new URL(row.url || '', this.sourceUrl).toString();
      const title = (row.title || '').toString().trim();
      const spot = (row.spot || '').toString().trim();

      let description = spot || '';
      let detailText = spot || '';

      // If spot is missing, fetch detail page and extract a real description.
      if (!description || description.length < 25) {
        try {
          const html = await this.fetchHtml(url);
          const parsed = this._extractFromDetailHtml(html, url);
          description = parsed.description || description;
          detailText = parsed.detailText || detailText;
        } catch (_) {}
      }

      const normalized = this._normalizeCampaign({
        title,
        description: description || title,
        detailText: detailText || description || title,
        url,
      });
      if (normalized) out.push(normalized);
    }

    return out;
  }
}

module.exports = AlternatifBankScraper;

