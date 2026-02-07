/**
 * Central normalization before ingestion.
 * Required: sourceName, title, originalUrl (http/https), scrapedAt (ISO).
 * Drops anchor/manual items.
 */

function normalizeWhitespace(s) {
  return (s || '').toString().replace(/\s+/g, ' ').trim();
}

function isValidHttpUrl(url) {
  try {
    const u = new URL(url);
    return u.protocol === 'http:' || u.protocol === 'https:';
  } catch (_) {
    return false;
  }
}

function normalizeCampaign(raw, { sourceName: fallbackSourceName, scrapedAt: fallbackScrapedAt } = {}) {
  if (!raw || typeof raw !== 'object') return null;
  if (raw.campaignType === 'anchor' || raw.isAnchor === true || raw.manual === true) return null;

  const sourceName = normalizeWhitespace(raw.sourceName || fallbackSourceName);
  if (!sourceName) return null;

  const title = normalizeWhitespace(raw.title);
  if (!title) return null;

  const originalUrl = normalizeWhitespace(raw.originalUrl || raw.campaignUrl || raw.url);
  if (!isValidHttpUrl(originalUrl)) return null;

  const scrapedAtRaw = normalizeWhitespace(raw.scrapedAt || fallbackScrapedAt) || new Date().toISOString();
  const scrapedAt = Number.isNaN(Date.parse(scrapedAtRaw)) ? new Date().toISOString() : new Date(scrapedAtRaw).toISOString();

  const normalized = {
    ...raw,
    sourceName,
    title,
    originalUrl,
    scrapedAt,
  };

  if (!normalized.campaignUrl) normalized.campaignUrl = originalUrl;
  if (normalized.description != null) normalized.description = normalizeWhitespace(normalized.description);
  if (normalized.detailText != null) normalized.detailText = normalizeWhitespace(normalized.detailText);

  return normalized;
}

function normalizeCampaigns(items, ctx) {
  if (!Array.isArray(items)) return { items: [], dropped: 0 };
  const out = [];
  let dropped = 0;
  for (const raw of items) {
    const n = normalizeCampaign(raw, ctx);
    if (!n) { dropped += 1; continue; }
    out.push(n);
  }
  return { items: out, dropped };
}

module.exports = { normalizeCampaign, normalizeCampaigns, normalizeWhitespace, isValidHttpUrl };

