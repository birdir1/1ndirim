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

function normalizeSourceKey(name) {
  return (name || '')
    .toString()
    .toLowerCase()
    .replace(/\s+/g, '')
    .replace(/ı/g, 'i')
    .replace(/ğ/g, 'g')
    .replace(/ü/g, 'u')
    .replace(/ş/g, 's')
    .replace(/ö/g, 'o')
    .replace(/ç/g, 'c');
}

function cleanText(text) {
  if (!text) return '';
  return normalizeWhitespace(decodeHtmlEntities(text));
}

function stripTrailingIncele(text) {
  let t = cleanText(text || '');
  if (!t) return '';
  // Remove trailing "İncele" / "incele" CTA text that leaks into scraped titles.
  t = t.replace(/\s*(?:\u0130|I\u0307|I|ı|i)ncele\.?$/gu, '').trim();
  return t;
}

function stripInceleAnywhere(text) {
  let t = cleanText(text || '');
  if (!t) return '';
  t = t.replace(/\s*(?:\u0130|I\u0307|I|ı|i)ncele\.?\s*/gu, ' ').trim();
  return normalizeWhitespace(t);
}

function escRe(s) {
  return (s || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function stripDashSourceSuffix(text, sourceName) {
  let t = cleanText(text || '');
  const s = cleanText(sourceName || '');
  if (!t || !s) return t;

  // Pattern: "<left> - <source> <right>"
  const re = new RegExp(`^(.*?)\\s*[\\-–]\\s*${escRe(s)}\\b\\s*[,\\-–]*\\s*(.*)$`, 'iu');
  const m = t.match(re);
  if (!m) return t;

  const left = (m[1] || '').trim();
  const right = (m[2] || '').trim();

  // Only remove the source chunk when the "right" looks like leaked meta/slug text (common on operator sites).
  if (
    right &&
    (right.includes('/') ||
      /kampanyalar/i.test(right) ||
      /^[a-z]/.test(right) ||
      /^[çğıöşü]/i.test(right))
  ) {
    return normalizeWhitespace(`${left} ${right}`);
  }

  // If it's exactly "<left> - <source>", keep only left.
  if (!right) return left;

  return t;
}

function stripCampaignPathArtifacts(text, sourceName) {
  let t = cleanText(text || '');
  if (!t) return '';

  t = stripDashSourceSuffix(t, sourceName);

  // Remove leaked path fragments like ",kampanyalar/slug" or "/kampanyalar/slug"
  t = t.replace(/,?\s*kampanyalar\/[^\s]+/gi, '').trim();
  t = t.replace(/\/kampanyalar\/[^\s]+/gi, '').trim();

  // If title contains "<something> - <Source>,kampanyalar/slug", keep only the left part.
  if (sourceName) {
    const s = cleanText(sourceName);
    if (s) {
      const re = new RegExp(`^(.*?)\\s*[\\-–]\\s*${s.replace(/[.*+?^${}()|[\\]\\\\]/g, '\\\\$&')}\\s*,?\\s*kampanyalar\\/.*$`, 'i');
      const m = t.match(re);
      if (m && m[1] && m[1].trim().length >= 6) {
        t = m[1].trim();
      }
    }
  }

  // Strip stray punctuation
  t = t.replace(/[.,;:\-–]+$/g, '').trim();
  t = stripInceleAnywhere(t);
  return t;
}

function extractSlugCandidate(text) {
  const raw = (text || '').toString();
  if (!raw) return null;
  const lower = raw.toLowerCase();

  let s = raw;
  const idx = lower.lastIndexOf('kampanyalar/');
  if (idx >= 0) {
    s = raw.slice(idx + 'kampanyalar/'.length);
  } else if (raw.includes('/')) {
    s = raw.split('/').pop() || raw;
  }

  s = s.split('?')[0].split('#')[0];
  s = s.replace(/^[,.\s]+/, '').replace(/[,.\s]+$/, '');
  if (!s) return null;

  // Only consider slug candidates with hyphens/underscores and reasonable length.
  if (!/[-_]/.test(s) || s.length < 10) return null;
  return s;
}

function humanizeSlug(slug) {
  let t = (slug || '').toString().trim();
  if (!t) return '';
  t = t.replace(/[_-]+/g, ' ');
  t = normalizeWhitespace(t);
  const words = t.split(' ').filter(Boolean);
  const out = words.map((w) => (w.length <= 2 ? w.toUpperCase() : (w.charAt(0).toUpperCase() + w.slice(1))));
  return normalizeWhitespace(out.join(' '));
}

function localizePaparaText(text) {
  let t = cleanText(text || '');
  if (!t) return '';

  // Common vocabulary
  t = t.replace(/\bCashback\b/gi, 'Nakit İade');

  // Detail sentence patterns from Papara cashback pages
  // "Earn instant 10% Cashback on your total spending up to 250 TL at X with your Papara Card."
  // Note: we run after "Cashback -> Nakit İade", so match both variants.
  t = t.replace(
    /earn instant\s*(\d{1,2})%\s*(?:cashback|nakit\s*[iİ]ade)\s*on your total spending up to\s*(\d+(?:[.,]\d+)?)\s*tl\s*at\s*(.+?)(?:\s*with your papara card)?(?:\.\s*|$)/i,
    (_m, pct, cap, place) => `Papara Kart ile ${place.trim()} harcamalarında anında %${pct} Nakit İade. Ayda en fazla ${cap} TL. `,
  );

  // "If you spend 150 TL at X, you will earn 15 TL."
  t = t.replace(
    /if you spend\s*(\d+(?:[.,]\d+)?)\s*tl[^,]*,\s*you will earn\s*(\d+(?:[.,]\d+)?)\s*tl\.?/gi,
    (_m, spend, earn) => `${spend} TL harcarsan ${earn} TL Nakit İade kazanırsın.`,
  );

  // "If you spend 500 TL, you can earn a maximum of 25 TL cashback per month."
  t = t.replace(
    /if you spend\s*(\d+(?:[.,]\d+)?)\s*tl[^,]*,\s*you can earn a maximum of\s*(\d+(?:[.,]\d+)?)\s*tl[^.]*per month\.?/gi,
    (_m, spend, amount) => `${spend} TL harcarsan ayda en fazla ${amount} TL Nakit İade kazanabilirsin.`,
  );

  // "you can earn a maximum of 25 TL ... per month."
  t = t.replace(
    /you can earn a maximum of\s*(\d+(?:[.,]\d+)?)\s*tl[^.]*per month\.?/gi,
    (_m, amount) => `Ayda en fazla ${amount} TL Nakit İade kazanabilirsin.`,
  );

  // Some pages use "maximum of X TL ... per month" without "you can earn"
  t = t.replace(
    /maximum of\s*(\d+(?:[.,]\d+)?)\s*tl[^.]*per month\.?/gi,
    (_m, amount) => `Ayda en fazla ${amount} TL Nakit İade.`,
  );

  t = t.replace(/\bwith your papara card\b/gi, 'Papara Kart ile');

  // "X – You can earn up to 25 TL each month." -> "X - Ayda en fazla 25 TL kazanabilirsin."
  t = t.replace(
    /(\S.*?)[\s]*[–-][\s]*you can earn up to\s*(\d+(?:[.,]\d+)?)\s*tl\s*each month\.?/i,
    (_m, left, amount) => `${left.trim()} - Ayda en fazla ${amount} TL kazanabilirsin.`,
  );

  // "You can earn up to 25 TL each month." -> "Ayda en fazla 25 TL kazanabilirsin."
  t = t.replace(
    /you can earn up to\s*(\d+(?:[.,]\d+)?)\s*tl\s*each month\.?/i,
    (_m, amount) => `Ayda en fazla ${amount} TL kazanabilirsin.`,
  );

  // "You can earn up to 25 TL." -> "En fazla 25 TL kazanabilirsin."
  t = t.replace(
    /you can earn up to\s*(\d+(?:[.,]\d+)?)\s*tl\.?/i,
    (_m, amount) => `En fazla ${amount} TL kazanabilirsin.`,
  );

  // Loose cleanups
  t = t.replace(/\beach month\b/gi, 'her ay');

  return normalizeWhitespace(t);
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
  const sourceKey = normalizeSourceKey(campaign.sourceName || campaign.source_name || '');
  const sourceName = campaign.sourceName || campaign.source_name || '';
  const titleRaw = stripLabelPrefix(stripTrailingIncele(cleanText(campaign.title || '')));

  // Capture slug candidate before stripping artifacts
  const slugCandidate = extractSlugCandidate(titleRaw);

  let title = stripCampaignPathArtifacts(titleRaw, sourceName);
  if (sourceKey === 'papara') {
    title = localizePaparaText(title);
  }
  if (isAssetFilenameLike(title)) {
    title = humanizeAssetFilename(title);
  }
  title = stripInceleAnywhere(title);

  // If title looks like a paragraph, keep it short (detail can still show full text).
  if (title.length > 90) {
    const km = title.match(/^(.*?kampanyas[ıi])/iu);
    if (km && km[1] && km[1].trim().length >= 10) {
      title = km[1].trim();
    } else {
      const sentence = title.split('.').map((s) => s.trim()).find((s) => s.length >= 10 && s.length <= 90);
      if (sentence) title = sentence;
    }
  }

  title = stripTrailingNumbers(title);
  if (isGenericTitle(title)) {
    const derived = deriveTitleFromDescription(cleanText(campaign.description || campaign.detailText || ''));
    if (derived && !isGenericTitle(derived)) return derived;
    if (slugCandidate) {
      const human = humanizeSlug(slugCandidate);
      if (human && !isGenericTitle(human)) return human;
    }
    return derived || '';
  }
  return title;
}

function normalizeDescription(campaign) {
  const sourceKey = normalizeSourceKey(campaign.sourceName || campaign.source_name || '');
  const sourceName = campaign.sourceName || campaign.source_name || '';
  const normalizedTitle = normalizeTitle(campaign);
  const descRaw = stripLabelPrefix(stripTrailingIncele(cleanText(campaign.description || '')));
  const descLooksLikePath = /kampanyalar\/|\/kampanyalar\//i.test(descRaw) || /,?\s*kampanyalar\//i.test(descRaw);

  let desc = descLooksLikePath ? '' : stripCampaignPathArtifacts(descRaw, sourceName);
  if (sourceKey === 'papara') {
    desc = localizePaparaText(desc);
  }

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

  // If description is missing or redundant, try to derive from the remainder of the raw title.
  if (!desc || desc.length < 5 || desc === normalizedTitle) {
    const rawTitleClean = stripCampaignPathArtifacts(
      stripLabelPrefix(stripTrailingIncele(cleanText(campaign.title || ''))),
      sourceName,
    );
    let rest = rawTitleClean;
    if (normalizedTitle && rest) {
      const a = rest.toLowerCase();
      const b = normalizedTitle.toLowerCase();
      if (a.startsWith(b)) {
        rest = rest.slice(normalizedTitle.length).trim();
        rest = rest.replace(/^[,.;:\-–]+/g, '').trim();
      }
    }
    rest = stripInceleAnywhere(rest);
    if (rest && rest.length >= 12 && !isGenericDescription(rest)) {
      desc = rest.length > 120 ? `${rest.slice(0, 117)}...` : rest;
    }
  }

  return desc;
}

function normalizeDetailText(campaign) {
  const sourceKey = normalizeSourceKey(campaign.sourceName || campaign.source_name || '');
  const sourceName = campaign.sourceName || campaign.source_name || '';
  let text = stripCampaignPathArtifacts(stripTrailingIncele(cleanText(campaign.detailText || campaign.detail_text || '')), sourceName);
  if (!text) return '';

  if (sourceKey === 'papara') {
    text = localizePaparaText(text);
  }

  // Strip common wrapper prefixes (often from proxy readers / metadata dumps).
  text = text
    .replace(/\\btitle\\s*:\\s*\\S+/gi, ' ')
    .replace(/\\burl\\s*source\\s*:\\s*\\S+/gi, ' ')
    .replace(/\\bmarkdown\\s*content\\s*:\\s*/gi, ' ');

  // Drop obvious asset filenames that add noise.
  text = text.replace(/\\b\\S+\\.(png|jpe?g|webp)\\b/gi, ' ');

  text = normalizeWhitespace(text);

  // Remove stray CTAs
  text = text.replace(/\bincele\b/gi, '').trim();

  // If still garbage / too short, hide it.
  if (!text || text.length < 12) return '';
  if (isGenericDescription(text)) return '';

  // Avoid sending huge payloads to mobile.
  return text.length > 800 ? `${text.slice(0, 797)}...` : text;
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
    (campaign.sourceName || campaign.source_name || '').toLowerCase(),
    normalizeWhitespace(cleanText(campaign.title || '')),
    normalizeWhitespace(cleanText(campaign.description || '')),
    campaign.originalUrl || campaign.url || '',
  ].join('|');
}

module.exports = {
  normalizeTitle,
  normalizeDescription,
  normalizeDetailText,
  shouldDropCampaign,
  decodeHtmlEntities,
  fingerprint,
};
