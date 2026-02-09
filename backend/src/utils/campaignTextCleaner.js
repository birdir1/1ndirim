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
  'url source:',
  'markdown content:',
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

function stripLabelPrefix(text) {
  return (text || '')
    .replace(/^title\s*:\s*/i, '')
    .replace(/^url\s*source\s*:\s*/i, '')
    .trim();
}

function stripTrailingNumbers(title) {
  const m = (title || '').match(/^(.*)\\s+(\\d{3,})$/);
  if (!m) return (title || '').trim();
  const num = Number(m[2]);
  // Keep meaningful years like 2025, drop random ids like 123456.
  if (!Number.isNaN(num) && num >= 2000 && num <= 2099) return (title || '').trim();
  return (m[1] || '').trim();
}

function looksLikeUrl(text) {
  return /^https?:\/\//i.test((text || '').trim());
}

function isAssetFilenameLike(text) {
  const t = (text || '').trim().toLowerCase();
  if (!t) return false;
  if (t.includes('/content/dam/') && /\.(png|jpe?g|webp)(\?.*)?$/.test(t)) return true;
  if (/(\.png|\.jpe?g|\.webp)(\?.*)?$/.test(t)) return true;
  return false;
}

function humanizeAssetFilename(text) {
  let t = stripLabelPrefix(cleanText(text || ''));

  // Strip URL to basename if needed
  try {
    if (looksLikeUrl(t)) {
      const u = new URL(t);
      t = (u.pathname || '').split('/').pop() || t;
    }
  } catch (_) {}

  // Remove query/hash
  t = t.split('?')[0].split('#')[0];

  // Remove extension
  t = t.replace(/\.(png|jpe?g|webp)$/i, '');

  // Remove size suffixes like _368x240
  t = t.replace(/[_-]\d{2,4}x\d{2,4}$/i, '');

  // Normalize separators
  t = t.replace(/[_-]+/g, ' ');
  t = normalizeWhitespace(t);

  // Fix common split artifacts (temmu z -> temmuz, ara lik -> aralik)
  t = t
    .replace(/\btemmu\s+z\b/gi, 'temmuz')
    .replace(/\bara\s+lik\b/gi, 'aralik')
    .replace(/\bsuba\s+t\b/gi, 'subat')
    .replace(/\bagi\s+stos\b/gi, 'agustos');

  const tokenMap = {
    kampanyasi: 'kampanyası',
    aralik: 'Aralık',
    ocak: 'Ocak',
    subat: 'Şubat',
    mart: 'Mart',
    nisan: 'Nisan',
    mayis: 'Mayıs',
    haziran: 'Haziran',
    temmuz: 'Temmuz',
    agustos: 'Ağustos',
    eylul: 'Eylül',
    ekim: 'Ekim',
    kasim: 'Kasım',
  };

  const tokens = t.split(' ').filter(Boolean);
  const out = tokens.map((raw) => {
    const lower = raw.toLowerCase();
    if (tokenMap[lower]) return tokenMap[lower];
    if (/^\d{4}$/.test(raw)) return raw;
    if (/^\d{1,2}$/.test(raw)) return raw;
    if (/^[a-z]{1,3}$/i.test(raw)) return raw.toUpperCase(); // e.g. MTV
    return raw.charAt(0).toUpperCase() + raw.slice(1);
  });

  return normalizeWhitespace(out.join(' '));
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
  if (looksLikeUrl(desc)) return true;
  if (lower.startsWith('url source:')) return true;
  if (lower.startsWith('markdown content:')) return true;
  return GENERIC_DESCRIPTIONS.some((p) => lower.includes(p));
}

function deriveTitleFromDescription(desc) {
  if (!desc) return null;
  const sentence = desc.split('.').map((s) => s.trim()).find((s) => s.length > 12);
  const candidate = sentence || desc;
  return candidate.length > 80 ? `${candidate.slice(0, 77)}...` : candidate;
}

function normalizeTitle(campaign) {
  let title = stripLabelPrefix(cleanText(campaign.title || ''));
  if (isAssetFilenameLike(title)) {
    title = humanizeAssetFilename(title);
  }
  title = stripTrailingNumbers(title);
  if (isGenericTitle(title)) {
    const derived = deriveTitleFromDescription(cleanText(campaign.description || campaign.detailText || ''));
    return derived || '';
  }
  return title;
}

function normalizeDescription(campaign) {
  let desc = stripLabelPrefix(cleanText(campaign.description || ''));

  // If description is just a URL or a DAM asset link, treat it as garbage.
  if (looksLikeUrl(desc) || isAssetFilenameLike(desc)) {
    desc = '';
  }

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
  if (!desc || desc.length < 5) {
    const detail = cleanText(campaign.detailText || '');
    // Allow campaigns with a solid title even if description is missing.
    // Some sources return title-only entries; dropping them makes the UI look empty.
    if (detail && !isGenericDescription(detail) && detail.length >= 12) return false;
    return false;
  }
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
