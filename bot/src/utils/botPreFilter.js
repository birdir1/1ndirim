/**
 * FAZ 11.5: Bot-side pre-filter (noise reduction).
 * Normalize titles, remove obvious duplicates, drop clear spam/clickbait only.
 * Backend quality filter remains final authority. If uncertain → keep and send.
 */

function normalizeTitle(s) {
  if (typeof s !== 'string') return '';
  return s
    .replace(/\s+/g, ' ')
    .replace(/\u00A0/g, ' ')
    .trim();
}

const OBVIOUS_SPAM = [
  /^tıkla\s*$/i,
  /^buraya\s*tıkla\s*$/i,
  /^kazan\s*$/i,
  /^(\d+\s*)+$/,
  /^(.)\1{50,}$/,
  /^(virus|viagra|casino)\s/i,
  /^\s*$/,
];

function isObviousSpamOrClickbait(c) {
  const t = normalizeTitle(c.title || '');
  if (t.length < 2) return true;
  for (const re of OBVIOUS_SPAM) {
    if (re.test(t)) return true;
  }
  const lower = t.toLowerCase();
  if ((lower.includes('tıkla') && lower.length < 20) || (lower === 'kampanya')) return true;
  return false;
}

function dedupeKey(c) {
  const url = (c.originalUrl || c.campaignUrl || '').toString().trim();
  const t = normalizeTitle(c.title || '');
  return `${url}|${t}`.toLowerCase();
}

/**
 * Light pre-filter before sending to backend.
 * @param {Array<Object>} campaigns
 * @returns {Array<Object>} filtered and normalized (titles) campaigns
 */
function botPreFilter(campaigns) {
  if (!Array.isArray(campaigns)) return [];

  const out = [];
  const seen = new Set();

  for (const c of campaigns) {
    const dup = dedupeKey(c);
    if (seen.has(dup)) continue;
    if (isObviousSpamOrClickbait(c)) continue;

    seen.add(dup);
    out.push({
      ...c,
      title: normalizeTitle(c.title || '') || c.title,
      description: typeof c.description === 'string' ? normalizeTitle(c.description) : c.description,
    });
  }
  return out;
}

module.exports = { botPreFilter, normalizeTitle };
