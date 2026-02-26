/**
 * Static Campaign Scraper
 * Partner promos / manual campaign pages without structured APIs.
 * Generates fixed campaign payloads with dates, tags, and how-to steps.
 */

function toIsoDate(value) {
  if (!value) return null;
  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) return null;
    return value.toISOString().split('T')[0];
  }
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) return null;
    if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed;
    const parsed = new Date(trimmed);
    if (!Number.isNaN(parsed.getTime())) return parsed.toISOString().split('T')[0];
  }
  return null;
}

class StaticCampaignScraper {
  constructor({ sourceName, sourceUrl, campaigns, defaultEndDays = 180 }) {
    this.sourceName = sourceName;
    this.sourceUrl = sourceUrl;
    this.campaigns = Array.isArray(campaigns) ? campaigns : [];
    this.defaultEndDays = Number.isFinite(defaultEndDays) ? defaultEndDays : 180;
  }

  getDefaultEndDate() {
    const date = new Date();
    date.setDate(date.getDate() + this.defaultEndDays);
    return date.toISOString().split('T')[0];
  }

  buildCampaign(entry) {
    const today = new Date().toISOString().split('T')[0];
    const startDate = toIsoDate(entry.startDate) || today;
    const endDate = toIsoDate(entry.endDate) || this.getDefaultEndDate();
    const campaignUrl = entry.campaignUrl || this.sourceUrl;

    return {
      sourceName: this.sourceName,
      title: entry.title || `${this.sourceName} kampanyası`,
      description: entry.description || '',
      detailText: entry.detailText || '',
      campaignUrl,
      originalUrl: entry.originalUrl || campaignUrl,
      affiliateUrl: entry.affiliateUrl || null,
      startDate,
      endDate,
      howToUse: Array.isArray(entry.howToUse) ? entry.howToUse : [],
      category: entry.category || 'entertainment',
      subCategory: entry.subCategory || null,
      platform: entry.platform || null,
      contentType: entry.contentType || null,
      isFree: typeof entry.isFree === 'boolean' ? entry.isFree : false,
      discountPercent: entry.discountPercent || entry.discountPercentage || null,
      discountPercentage: entry.discountPercentage || entry.discountPercent || null,
      tags: Array.isArray(entry.tags) ? entry.tags : [this.sourceName],
      channel: entry.channel || 'online',
    };
  }

  async scrape() {
    return this.campaigns.map((entry) => this.buildCampaign(entry));
  }

  async runWithRetry(_maxRetries = 1, _opts = null) {
    return this.scrape();
  }
}

module.exports = StaticCampaignScraper;
