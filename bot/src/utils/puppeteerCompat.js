function ensureWaitForTimeout(page) {
  if (!page || typeof page.waitForTimeout === 'function') return;
  page.waitForTimeout = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
}

module.exports = { ensureWaitForTimeout };
