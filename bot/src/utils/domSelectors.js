/**
 * FAZ 11.2: Tiered DOM selectors
 * FAZ 12.2: When all tiers fail → throw DOM_CHANGED error (classified, do not crash run).
 */

const DOM_CHANGED_MSG = 'All selector tiers failed';

/**
 * Verilen tier için selector'ları dene; ilk eşleşen boş olmayan sonucu döndürür.
 * If all tiers fail, throws error with failureType DOM_CHANGED for classification.
 * @param {import('puppeteer').Page} page
 * @param {{ primary?: string|string[], secondary?: string|string[], fallback?: string|string[] }} tiers
 * @param {string} sourceName - log için
 * @returns {Promise<{ tier: string, links: { href: string, text: string }[] }|null>}
 */
async function tryTieredLinks(page, tiers, sourceName) {
  if (!page) return null;
  const order = ['primary', 'secondary', 'fallback'];
  let anyTierHadSelectors = false;
  for (const tierName of order) {
    const raw = tiers[tierName];
    if (raw == null) continue;
    const sels = Array.isArray(raw) ? raw : [raw];
    anyTierHadSelectors = true;
    for (const sel of sels) {
      try {
        const links = await page.evaluate((selector) => {
          const nodes = document.querySelectorAll(selector);
          return Array.from(nodes).map((n) => ({
            href: (n.href || '').trim(),
            text: (n.textContent || '').trim().substring(0, 300),
          })).filter((x) => x.href && x.text.length > 0);
        }, sel);
        if (links && links.length > 0) {
          return { tier: tierName, links };
        }
      } catch (err) {
        console.warn(`[${sourceName}] selector failure (${tierName}): "${sel}" - ${err.message}`);
      }
    }
    console.warn(`[${sourceName}] tier "${tierName}" failed for all selectors`);
  }
  if (anyTierHadSelectors) {
    const err = new Error(DOM_CHANGED_MSG);
    err.failureType = 'DOM_CHANGED';
    err.code = 'DOM_CHANGED';
    throw err;
  }
  return null;
}

/**
 * Tekil element için tiered selector dene (örn. main, content kutusu).
 * If all tiers fail, throws error with failureType DOM_CHANGED.
 * @param {import('puppeteer').Page} page
 * @param {{ primary?: string|string[], secondary?: string|string[], fallback?: string|string[] }} tiers
 * @param {string} sourceName
 * @returns {Promise<{ tier: string, innerText: string }|null>}
 */
async function tryTieredSelector(page, tiers, sourceName) {
  if (!page) return null;
  const order = ['primary', 'secondary', 'fallback'];
  let anyTierHadSelectors = false;
  for (const tierName of order) {
    const raw = tiers[tierName];
    if (raw == null) continue;
    const sels = Array.isArray(raw) ? raw : [raw];
    anyTierHadSelectors = true;
    for (const sel of sels) {
      try {
        const text = await page.evaluate((selector) => {
          const el = document.querySelector(selector);
          return el ? el.innerText || el.textContent || '' : '';
        }, sel);
        if (text && text.trim().length > 0) {
          return { tier: tierName, innerText: text.trim().substring(0, 5000) };
        }
      } catch (err) {
        console.warn(`[${sourceName}] selector failure (${tierName}): "${sel}" - ${err.message}`);
      }
    }
    console.warn(`[${sourceName}] tier "${tierName}" failed for all selectors`);
  }
  if (anyTierHadSelectors) {
    const err = new Error(DOM_CHANGED_MSG);
    err.failureType = 'DOM_CHANGED';
    err.code = 'DOM_CHANGED';
    throw err;
  }
  return null;
}

module.exports = {
  tryTieredLinks,
  tryTieredSelector,
};
