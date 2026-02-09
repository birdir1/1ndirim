/**
 * Generic Kampanya Scraper (bank-style)
 *
 * A lot of bank campaign pages follow similar patterns:
 * - Listing page with links to detail pages
 * - Detail page with h1/title + content paragraphs
 *
 * This scraper tries to:
 * 1) Collect campaign links with broad/tiered selectors
 * 2) Parse each detail page into a normalized campaign object
 * 3) Fallback: parse cards directly from listing page if links are missing
 */

const BaseScraper = require('./base-scraper');

class GenericKampanyaScraper extends BaseScraper {
  constructor(sourceName, sourceUrl, options = {}) {
    super(sourceName, sourceUrl);
    this.options = {
      maxLinks: options.maxLinks || 15,
      linkInclude: options.linkInclude || /(kampanya|kampanyalar|campaign|promosyon|firsat)/i,
      // Optional: restrict to same origin
      sameOriginOnly: options.sameOriginOnly !== false,
    };
  }

  async scrape() {
    const campaigns = [];
    await this.loadPage(this.sourceUrl, null, 30000);

    // 1) Collect links
    let links = [];
    try {
      const tiers = {
        primary: [
          'a[href*="kampanya"]',
          'a[href*="kampanyalar"]',
          'a[href*="campaign"]',
          'a[href*="promosyon"]',
          'a[href*="firsat"]',
        ],
        secondary: [
          'article a[href]',
          '.campaign a[href]',
          '.kampanya a[href]',
          '.card a[href]',
          'main a[href]',
        ],
        fallback: ['a[href]'],
      };
      links = await this.tryTieredLinks(tiers);
    } catch (_) {
      links = [];
    }

    const origin = (() => {
      try {
        return new URL(this.sourceUrl).origin;
      } catch (_) {
        return null;
      }
    })();

    const filtered = (links || [])
      .filter((u) => typeof u === 'string' && u.startsWith('http'))
      .filter((u) => this.options.linkInclude.test(u))
      .filter((u) => (!this.options.sameOriginOnly || !origin ? true : u.startsWith(origin)));

    const uniqueLinks = [...new Set(filtered)].slice(0, this.options.maxLinks);

    if (uniqueLinks.length === 0) {
      // 2) Fallback: parse cards from listing page
      const items = await this.page.evaluate(() => {
        const pickText = (el) => (el && el.textContent ? el.textContent.trim() : '');
        const candidates = Array.from(
          document.querySelectorAll('article, .campaign, .kampanya, .card, .content-card'),
        );
        const out = [];
        for (const el of candidates) {
          const a = el.querySelector('a[href]');
          const title = pickText(el.querySelector('h1,h2,h3,.title,.card-title')) || pickText(a);
          const desc =
            pickText(el.querySelector('p,.desc,.description,.card-text')) ||
            pickText(el.querySelector('div,span'));
          const href = a ? a.href : '';
          if (title && title.length >= 6) out.push({ title, desc, href });
        }
        return out.slice(0, 12);
      });

      for (const it of items) {
        const normalized = this._normalizeCampaign({
          title: it.title,
          description: it.desc || it.title,
          detailText: (it.desc || '').slice(0, 500),
          url: it.href || this.sourceUrl,
        });
        if (normalized) campaigns.push(normalized);
      }

      console.log(`✅ ${this.sourceName}: ${campaigns.length} kampanya (fallback list parse)`);
      return campaigns;
    }

    console.log(`🔍 ${this.sourceName}: ${uniqueLinks.length} kampanya linki bulundu`);

    for (const url of uniqueLinks) {
      const campaign = await this._parseDetail(url);
      if (campaign) campaigns.push(campaign);
    }

    console.log(`✅ ${this.sourceName}: ${campaigns.length} kampanya bulundu`);
    return campaigns;
  }

  async _parseDetail(url) {
    try {
      await this.page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
      await this.page.waitForTimeout(1500);

      const content = await this.page.evaluate(() => {
        const pick = (sel) => {
          const el = document.querySelector(sel);
          return el && el.textContent ? el.textContent.trim() : '';
        };
        const meta = (name) => {
          const el =
            document.querySelector(`meta[name="${name}"]`) ||
            document.querySelector(`meta[property="${name}"]`);
          return el ? (el.getAttribute('content') || '').trim() : '';
        };

        const title =
          pick('h1') ||
          pick('[data-testid*="title"]') ||
          pick('.title') ||
          pick('h2') ||
          meta('og:title') ||
          document.title ||
          '';

        const description =
          meta('description') ||
          pick('.lead') ||
          pick('.summary') ||
          pick('p') ||
          '';

        const main = document.querySelector('main, [role="main"], article, .content, .container') || document.body;
        const fullText = (main.textContent || '').replace(/\s+/g, ' ').trim();

        return {
          title,
          description,
          fullText: fullText.slice(0, 2000),
        };
      });

      return this._normalizeCampaign({
        title: content.title,
        description: content.description || content.title,
        detailText: content.fullText.slice(0, 500),
        url,
      });
    } catch (e) {
      console.error(`❌ ${this.sourceName}: Detay parse hatası (${url}): ${e.message}`);
      return null;
    }
  }

  _normalizeCampaign({ title, description, detailText, url }) {
    const t = (title || '').trim();
    if (!t || t.length < 6) return null;

    // Basic end date guess
    let endDate = new Date();
    endDate.setDate(endDate.getDate() + 30);

    const text = `${t} ${description || ''} ${detailText || ''}`;
    const m = text.match(/(\d{1,2})[./](\d{1,2})[./](\d{4})/);
    if (m) {
      const [_, dd, mm, yyyy] = m;
      const parsed = new Date(`${yyyy}-${mm}-${dd}`);
      if (!isNaN(parsed.getTime())) endDate = parsed;
    }

    // Category is finance for banks by default
    let subCategory = this.sourceName;
    const lower = text.toLowerCase();
    if (lower.match(/kredi kart|kart|visa|mastercard|troy/)) subCategory = 'Kredi Kartı';
    else if (lower.match(/kredi|konut|tasi?t|ihtiyac/)) subCategory = 'Kredi';
    else if (lower.match(/mevduat|faiz|vadeli/)) subCategory = 'Mevduat';

    return {
      sourceName: this.sourceName,
      title: t,
      description: (description || '').trim() || t,
      detailText: (detailText || '').trim() || (description || '').trim() || t,
      campaignUrl: url,
      originalUrl: url,
      affiliateUrl: null,
      startDate: new Date().toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0],
      howToUse: [],
      category: 'finance',
      tags: [this.sourceName, subCategory].filter((x, i, a) => a.indexOf(x) === i),
      channel: 'online',
    };
  }
}

module.exports = GenericKampanyaScraper;

