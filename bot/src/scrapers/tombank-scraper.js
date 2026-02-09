const HtmlListDetailScraper = require('./fetch/html-list-detail-scraper');
const cheerio = require('cheerio');

class TombankScraper extends HtmlListDetailScraper {
  constructor() {
    super('TOM Bank', 'https://www.tombank.com.tr/kampanyalar.html', {
      // Single page accordion: don't waste time chasing links.
      maxLinks: 0,
      preferNextData: false,
      sameOriginOnly: true,
    });
  }

  async scrape() {
    const html = await this.fetchHtml(this.sourceUrl);
    const $ = cheerio.load(html);

    const norm = (s) => (s || '').toString().replace(/\s+/g, ' ').trim();

    const items = [];
    const buttons = $('button[data-bs-toggle="collapse"], .accordion .accordion-button, .accordion button').toArray();
    for (const btn of buttons) {
      const title = norm($(btn).text());
      if (!title || title.length < 8) continue;

      const target = $(btn).attr('data-bs-target') || $(btn).attr('href') || '';
      let bodyText = '';
      if (target && target.startsWith('#')) {
        const id = target.slice(1);
        bodyText = norm($(`#${id}`).text());
      }
      if (!bodyText) {
        const item = $(btn).closest('.accordion-item');
        bodyText = norm(item.text());
      }

      const blob = `${title} ${bodyText}`.toLowerCase();
      const hasValueSignal = /(\btl\b|₺|%|taksit|iade|indirim|vade|puan|cashback)/i.test(blob);
      if (!hasValueSignal) continue;

      items.push({ title, bodyText, anchor: target && target.startsWith('#') ? target : '' });
    }

    // Dedupe by title + first part of body
    const uniq = new Map();
    for (const it of items) {
      const key = `${it.title}::${(it.bodyText || '').slice(0, 160)}`;
      if (!uniq.has(key)) uniq.set(key, it);
    }

    const out = [];
    for (const it of Array.from(uniq.values()).slice(0, 25)) {
      const url = `${this.sourceUrl}${it.anchor || ''}`;
      const body = norm(it.bodyText);
      // If the accordion button is generic (often "Kampanya Koşulları"), derive a better title from body.
      let title = it.title;
      if (/^kampanya\s*koşullar[ıi]$/i.test(title) || title.length < 10) {
        const firstSentence = body.split('.').map((s) => s.trim()).find((s) => s.length >= 12);
        if (firstSentence) title = firstSentence.length > 90 ? `${firstSentence.slice(0, 87)}...` : firstSentence;
      }

      const desc = body.slice(0, 220) || title;
      const normalized = this._normalizeCampaign({
        title,
        description: desc,
        detailText: body.slice(0, 650),
        url,
      });
      if (normalized) out.push(normalized);
    }

    return out;
  }
}

module.exports = TombankScraper;
