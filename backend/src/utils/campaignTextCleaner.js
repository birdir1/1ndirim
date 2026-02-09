const he = require('he');

const GENERIC_TITLES = new Set([
  'kampanya',
  'kampanyalar',
  'kampanyalarımız',
  'kampanyalarim',
  'detaylar',
  'banka',
  'bankası',
  'bankasi',
  'operator',
  'operatör',
  'başlık',
  'title',
]);

const GENERIC_DESCRIPTIONS = [
  'sana nasıl yardımcı olabiliriz',
  'sizin için ne yapabilirim',
  'çerez politikası',
  'gizlilik politikası',
  'kullanım koşulları',
  'çerez',
  'cookies',
  'faq',
];

function normalizeWhitespace(text) {
  return text.replace(/\s+/g, ' ').trim();
}

function decodeHtmlEntities(text) {
  if (!text) return '';
  return he.decode(text);
}

function cleanText(text) {
  if (!text) return '';
  return normalizeWhitespace(decodeHtmlEntities(text));
}

function stripTrailingNumbers(title) {
  return title.replace(/\s+\d{3,}$/g, '').trim();
}

function isGenericTitle(title) {
  const lower = title.toLowerCase();
  if (GENERIC_TITLES.has(lower)) return true;
  if (lower.length < 4) return true;
  return false;
}

function isGenericDescription(desc) {
  const lower = desc.toLowerCase();
  if (lower.length < 4) return true;
  if (GENERIC_TITLES.has(lower)) return true;
  return GENERIC_DESCRIPTIONS.some((p) => lower.includes(p));
}

function deriveTitleFromDescription(desc) {
  if (!desc) return null;
  const sentence = desc.split('.').map((s) => s.trim()).find((s) => s.length > 12);
  const candidate = sentence || desc;
  return candidate.length > 80 ? `${candidate.slice(0, 77)}...` : candidate;
}

function normalizeTitle(campaign) {
  let title = cleanText(campaign.title || '');
  title = stripTrailingNumbers(title);
  if (isGenericTitle(title)) {
    const derived = deriveTitleFromDescription(cleanText(campaign.description || campaign.detailText || ''));
    return derived || '';
  }
  return title;
}

function normalizeDescription(campaign) {
  let desc = cleanText(campaign.description || '');
  if (isGenericDescription(desc)) {
    const detail = cleanText(campaign.detailText || '');
    if (detail && !isGenericDescription(detail)) {
      desc = detail;
    }
  }
  return desc;
}

function shouldDropCampaign(campaign) {
  const title = normalizeTitle(campaign);
  const desc = normalizeDescription(campaign);
  if (!title || title.length < 5) return true;
  if (!desc || desc.length < 5) return true;
  return false;
}

function fingerprint(campaign) {
  return [
    (campaign.sourceName || '').toLowerCase(),
    normalizeWhitespace(cleanText(campaign.title || '')),
    normalizeWhitespace(cleanText(campaign.description || '')),
    campaign.originalUrl || campaign.url || '',
  ].join('|');
}

module.exports = {
  normalizeTitle,
  normalizeDescription,
  shouldDropCampaign,
  decodeHtmlEntities,
  fingerprint,
};
