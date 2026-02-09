/**
 * HTML List + Detail Scraper (no Puppeteer)
 *
 * Why: Several bank sites reset/terminate connections for headless browsers.
 * This scraper uses axios + cheerio to fetch and parse HTML directly.
 *
 * It supports:
 * - Standard HTML listing pages (anchors to detail pages)
 * - Next.js pages via __NEXT_DATA__ (extract campaign_list items)
 */

const axios = require('axios');
const cheerio = require('cheerio');

function normalizeWhitespace(s) {
  return (s || '').toString().replace(/\s+/g, ' ').trim();
}

function toAbsUrl(href, baseUrl) {
  if (!href) return '';
  const raw = href.toString().trim();
  if (!raw) return '';
  if (/^https?:\/\//i.test(raw)) return raw;
  try {
    return new URL(raw, baseUrl).toString();
  } catch (_) {
    return '';
  }
}

function uniq(arr) {
  return [...new Set((arr || []).filter(Boolean))];
}

function stripBoilerplate(text) {
  const t = normalizeWhitespace(text);
  if (!t) return '';

  const lower = t.toLowerCase();
  const bad = [
    'çerez',
    'cookies',
    'gizlilik',
    'kvkk',
    'privacy',
    'consent',
    'müşteri hizmetleri',
    'musteri hizmetleri',
    'çağrı merkezi',
    'cagri merkezi',
    'bize ulaş',
    'bize ulas',
    'iletişim',
    'iletisim',
    'canlı destek',
    'canli destek',
  ];
  if (bad.some((x) => lower.includes(x))) return '';
  return t;
}

function pickFirstMeaningfulParagraph($, { min = 30, max = 260 } = {}) {
  const paras = $('main p, article p, .content p, .container p, p')
    .toArray()
    .map((el) => stripBoilerplate($(el).text()))
    .filter((t) => t && t.length >= min);
  const p = paras[0] || '';
  if (!p) return '';
  return p.length > max ? `${p.slice(0, max - 3)}...` : p;
}

function extractNextDataJson(html) {
  const marker = 'id="__NEXT_DATA__"';
  const idx = html.indexOf(marker);
  if (idx < 0) return null;
  const start = html.indexOf('>', idx);
  if (start < 0) return null;
  const end = html.indexOf('</script>', start);
  if (end < 0) return null;
  const jsonStr = html.slice(start + 1, end).trim();
  if (!jsonStr) return null;
  try {
    return JSON.parse(jsonStr);
  } catch (_) {
    return null;
  }
}

function walk(obj, visit) {
  if (!obj) return;
  if (Array.isArray(obj)) {
    for (const it of obj) walk(it, visit);
    return;
  }
  if (typeof obj !== 'object') return;
  visit(obj);
  for (const v of Object.values(obj)) walk(v, visit);
}

function extractNextDataCampaignItems(nextData) {
  const items = [];
  walk(nextData, (node) => {
    if (!node || typeof node !== 'object') return;
    // Common pattern observed in bank sites: componentname === "campaign_list" and data.items.
    if (node.componentname === 'campaign_list' && node.data && Array.isArray(node.data.items)) {
      for (const it of node.data.items) {
        if (!it || typeof it !== 'object') continue;
        const title = normalizeWhitespace(it.title || it.item_title || it.name || '');
        const url = normalizeWhitespace(it.url || it.link || it.slug || '');
        const text = normalizeWhitespace(it.text || it.description || it.summary || '');
        const isOnline = typeof it.isOnline === 'boolean' ? it.isOnline : true;
        if (title && url && isOnline) items.push({ title, url, text });
      }
    }
  });
  return items;
}

class HtmlListDetailScraper {
  constructor(sourceName, sourceUrl, options = {}) {
    this.sourceName = sourceName;
    this.sourceUrl = sourceUrl;
    this.options = {
      maxLinks: options.maxLinks || 20,
      sameOriginOnly: options.sameOriginOnly !== false,
      linkInclude: options.linkInclude || /(kampanya|kampanyalar|campaign|promosyon|firsat)/i,
      linkExclude: options.linkExclude || null,
      // If true, parse __NEXT_DATA__ to discover campaign items (Next.js sites).
      preferNextData: options.preferNextData !== false,
    };

    this.http = axios.create({
      timeout: 30000,
      maxRedirects: 5,
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'tr-TR,tr;q=0.9,en-US;q=0.8,en;q=0.7',
        'Cache-Control': 'no-cache',
        Pragma: 'no-cache',
      },
    });
  }

  async fetchHtml(url) {
    const res = await this.http.get(url, { responseType: 'text' });
    return (res && res.data ? res.data.toString() : '') || '';
  }

  _origin() {
    try {
      return new URL(this.sourceUrl).origin;
    } catch (_) {
      return null;
    }
  }

  _filterLinks(urls) {
    const origin = this._origin();
    const include = this.options.linkInclude;
    const exclude = this.options.linkExclude;

    return uniq(urls)
      .filter((u) => typeof u === 'string' && u.startsWith('http'))
      .filter((u) => (!include ? true : include.test(u)))
      .filter((u) => (!exclude ? true : !exclude.test(u)))
      .filter((u) => (!this.options.sameOriginOnly || !origin ? true : u.startsWith(origin)))
      .slice(0, this.options.maxLinks);
  }

  _collectLinksFromHtml(html, baseUrl) {
    const $ = cheerio.load(html);
    const urls = $('a[href]')
      .toArray()
      .map((el) => toAbsUrl($(el).attr('href'), baseUrl))
      .filter(Boolean);
    return this._filterLinks(urls);
  }

  _collectLinksFromNextData(html, baseUrl) {
    if (!this.options.preferNextData) return [];
    const nextData = extractNextDataJson(html);
    if (!nextData) return [];
    const items = extractNextDataCampaignItems(nextData);
    const urls = items.map((it) => toAbsUrl(it.url, baseUrl)).filter(Boolean);
    return this._filterLinks(urls);
  }

  _extractFromDetailHtml(html, url) {
    const $ = cheerio.load(html);
    // Several modern sites (e.g. Chakra UI) inject <style> inside content nodes.
    // Remove script/style so `.text()` doesn't include CSS/JS garbage.
    $('script, style, noscript').remove();

    const meta = (name) =>
      normalizeWhitespace($(`meta[name="${name}"]`).attr('content') || $(`meta[property="${name}"]`).attr('content') || '');

    const title =
      stripBoilerplate(meta('og:title')) ||
      stripBoilerplate(meta('twitter:title')) ||
      stripBoilerplate($('h1').first().text()) ||
      stripBoilerplate($('title').first().text()) ||
      '';

    // Prefer meta descriptions; fallback to first meaningful paragraph.
    let description =
      stripBoilerplate(meta('og:description')) ||
      stripBoilerplate(meta('description')) ||
      stripBoilerplate(meta('twitter:description')) ||
      '';

    const paraFallback = pickFirstMeaningfulParagraph($, { min: 30, max: 240 });
    if (!description) description = paraFallback;

    // Collect a compact detailText from paragraphs/lists. Keep it short for backend cleaner.
    const blocks = $('main p, article p, main li, article li')
      .toArray()
      .map((el) => stripBoilerplate($(el).text()))
      .filter((t) => t && t.length >= 20);

    const detailText = normalizeWhitespace(blocks.slice(0, 6).join(' ')).slice(0, 650);

    // Avoid title==description. If identical, use paragraph fallback or detailText.
    if (title && description && normalizeWhitespace(title).toLowerCase() === normalizeWhitespace(description).toLowerCase()) {
      description = paraFallback || detailText || description;
    }

    return { title, description, detailText, url };
  }

  _normalizeCampaign({ title, description, detailText, url }) {
    const t = normalizeWhitespace(title);
    if (!t || t.length < 6) return null;

    // Basic end date guess (30 days). Backend can override/normalize further.
    let endDate = new Date();
    endDate.setDate(endDate.getDate() + 30);

    const text = `${t} ${description || ''} ${detailText || ''}`;
    const m = text.match(/(\d{1,2})[./](\d{1,2})[./](\d{4})/);
    if (m) {
      const [, dd, mm, yyyy] = m;
      const parsed = new Date(`${yyyy}-${mm}-${dd}`);
      if (!Number.isNaN(parsed.getTime())) endDate = parsed;
    }

    let subCategory = this.sourceName;
    const lower = text.toLowerCase();
    if (lower.match(/kredi kart|kart|visa|mastercard|troy/)) subCategory = 'Kredi Kartı';
    else if (lower.match(/kredi|konut|tasi?t|ihtiyac/)) subCategory = 'Kredi';
    else if (lower.match(/mevduat|faiz|vadeli/)) subCategory = 'Mevduat';

    return {
      sourceName: this.sourceName,
      title: t,
      description: normalizeWhitespace(description) || t,
      detailText: normalizeWhitespace(detailText) || normalizeWhitespace(description) || t,
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

  async scrape() {
    const listHtml = await this.fetchHtml(this.sourceUrl);

    const linksFromNext = this._collectLinksFromNextData(listHtml, this.sourceUrl);
    const linksFromAnchors = this._collectLinksFromHtml(listHtml, this.sourceUrl);
    const links = this._filterLinks([...(linksFromNext || []), ...(linksFromAnchors || [])]);

    if (!links.length) {
      // Try a minimal "listing card" parse as last resort.
      const $ = cheerio.load(listHtml);
      const cards = $('article, .card, .kampanyaWrapper, .campaign')
        .toArray()
        .slice(0, 12);
      const out = [];
      for (const el of cards) {
        const title = normalizeWhitespace($(el).find('h1,h2,h3,.title,.kampanyaTitle,.card-title').first().text());
        const desc = normalizeWhitespace($(el).find('p,.desc,.description,.card-text').first().text());
        const href = toAbsUrl($(el).find('a[href]').first().attr('href'), this.sourceUrl);
        const normalized = this._normalizeCampaign({ title, description: desc || title, detailText: desc, url: href || this.sourceUrl });
        if (normalized) out.push(normalized);
      }
      return out;
    }

    const campaigns = [];
    for (const url of links) {
      try {
        const html = await this.fetchHtml(url);
        const parsed = this._extractFromDetailHtml(html, url);
        const normalized = this._normalizeCampaign(parsed);
        if (normalized) campaigns.push(normalized);
      } catch (_) {
        // Ignore a single failing detail page.
      }
    }

    return campaigns;
  }

  async runWithRetry(maxRetries = 3, _options = {}) {
    let lastError = null;
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await this.scrape();
      } catch (e) {
        lastError = e;
        if (attempt < maxRetries) {
          const delay = Math.pow(2, attempt) * 1000;
          await new Promise((r) => setTimeout(r, delay));
        }
      }
    }
    throw lastError;
  }
}

module.exports = HtmlListDetailScraper;
