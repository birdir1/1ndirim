/**
 * Source aliases / merges.
 *
 * Goal: allow treating multiple "sources" as a single canonical source for UI and ingestion.
 * This is a pure mapping layer; DB schema remains unchanged.
 */

function normalizeKey(name) {
  return (name || '')
    .toString()
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .replace(/ı/g, 'i')
    .replace(/ğ/g, 'g')
    .replace(/ü/g, 'u')
    .replace(/ş/g, 's')
    .replace(/ö/g, 'o')
    .replace(/ç/g, 'c');
}

// Map: alias -> canonical display name
const CANONICAL = {
  // Bankkart is a Ziraat product; we treat it as Ziraat Bankası for the whole app.
  bankkart: 'Ziraat Bankası',
};

function canonicalizeSourceName(name) {
  const k = normalizeKey(name);
  if (!k) return name;
  return CANONICAL[k] || name;
}

function canonicalizeSourceNameLower(name) {
  return normalizeKey(canonicalizeSourceName(name));
}

function isHiddenSourceName(name) {
  const k = normalizeKey(name);
  // Hide sources that should never be selectable/visible in app/admin.
  return k === 'bankkart' || k === 'turkish bank' || k === 'turkishbank';
}

function canonicalizeLowerList(namesLower) {
  if (!Array.isArray(namesLower)) return [];
  return namesLower
    .map((n) => canonicalizeSourceNameLower(n))
    .filter((n) => n && n.length > 0);
}

module.exports = {
  canonicalizeSourceName,
  canonicalizeSourceNameLower,
  canonicalizeLowerList,
  isHiddenSourceName,
  normalizeKey,
};
