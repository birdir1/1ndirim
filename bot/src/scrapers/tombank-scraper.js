const BaseScraper = require('./base-scraper');

class TombankScraper extends BaseScraper {
  constructor() {
    super('TOM Bank', 'https://www.tombank.com.tr/kampanyalar.html');
  }

  async scrape() {
    const campaigns = [];

    await this.loadPage(this.sourceUrl, null, 30000);

    // TOM Bank lists campaigns as accordions on a single static HTML page.
    const items = await this.page.evaluate(() => {
      const norm = (s) => (s || '').toString().replace(/\s+/g, ' ').trim();
      const pick = (el) => norm(el && (el.innerText || el.textContent));

      const buttons = Array.from(
        document.querySelectorAll('button[data-bs-toggle="collapse"], .accordion .accordion-button, .accordion button'),
      );

      const out = [];
      for (const btn of buttons) {
        const title = pick(btn);
        if (!title || title.length < 8) continue;

        const target = btn.getAttribute('data-bs-target') || btn.getAttribute('href') || '';
        let id = '';
        if (target && target.startsWith('#')) id = target.slice(1);

        let bodyText = '';
        if (id) {
          const body = document.getElementById(id);
          bodyText = pick(body);
        }
        if (!bodyText) {
          const item = btn.closest('.accordion-item') || btn.parentElement;
          bodyText = pick(item);
        }

        out.push({ title, bodyText, id });
      }

      // Dedupe by title + body hash-ish
      const uniq = new Map();
      for (const it of out) {
        const key = `${it.title}::${(it.bodyText || '').slice(0, 160)}`;
        if (!uniq.has(key)) uniq.set(key, it);
      }
      return Array.from(uniq.values()).slice(0, 20);
    });

    for (const it of items) {
      const t = (it.title || '').trim();
      const body = (it.bodyText || '').trim();
      if (!t || t.length < 6) continue;

      const blob = `${t} ${body}`.toLowerCase();
      const hasValueSignal = /(\\btl\\b|₺|%|taksit|iade|indirim|vade|puan|cashback)/i.test(blob);
      if (!hasValueSignal) continue;

      const description = (body || t).replace(/\s+/g, ' ').trim().slice(0, 220) || t;

      let endDate = new Date();
      endDate.setDate(endDate.getDate() + 30);

      const anchor = it.id ? `#${it.id}` : '';
      const url = `${this.sourceUrl}${anchor}`;

      campaigns.push({
        sourceName: this.sourceName,
        title: t,
        description,
        detailText: (body || description || t).slice(0, 500),
        campaignUrl: url,
        originalUrl: url,
        affiliateUrl: null,
        startDate: new Date().toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0],
        howToUse: [],
        category: 'finance',
        tags: ['TOM Bank', /kredi kart/i.test(blob) ? 'Kredi Kartı' : 'Kampanya'].filter((x, i, a) => a.indexOf(x) === i),
        channel: 'online',
      });
    }

    console.log(`✅ ${this.sourceName}: ${campaigns.length} kampanya (accordion parse)`);
    return campaigns;
  }
}

module.exports = TombankScraper;

