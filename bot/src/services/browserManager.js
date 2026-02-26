/**
 * FAZ 17.1–17.2: Global concurrency control + shared browser instance.
 * Semaphore limits concurrent pages; single browser reused across scrapers.
 * Log-only awareness, no decision/behavior change for scraping outcomes.
 */

const puppeteer = require('puppeteer');
const { ensureWaitForTimeout } = require('../utils/puppeteerCompat');

const MAX_CONCURRENT_PAGES = Math.max(1, Math.min(10, parseInt(process.env.MAX_CONCURRENT_PAGES || '4', 10)));
const LAUNCH_ARGS = [
  '--no-sandbox',
  '--disable-setuid-sandbox',
  '--disable-dev-shm-usage',
  '--disable-accelerated-2d-canvas',
  '--disable-gpu',
];

/**
 * @param {Object} runLogCtx - FAZ 15 run context { run_id }
 * @param {function(Object, string): string} runLog - (ctx, msg) => prefixed string
 * @returns {{ getPage: function, close: function, getStats: function }}
 */
function createBrowserManager(runLogCtx, runLog) {
  let browser = null;
  let inFlight = 0;
  const waitQueue = [];
  let pagesOpened = 0;
  let browserRestarts = 0;
  let concurrencyPeak = 0;
  let costUnits = 0;
  const log = (msg) => {
    try {
      const out = runLog && runLogCtx ? runLog(runLogCtx, msg) : msg;
      console.info(out);
    } catch (_) {}
  };
  const logWarn = (msg) => {
    try {
      const out = runLog && runLogCtx ? runLog(runLogCtx, msg) : msg;
      console.warn(out);
    } catch (_) {}
  };

  function acquire() {
    return new Promise((resolve) => {
      if (inFlight < MAX_CONCURRENT_PAGES) {
        inFlight += 1;
        concurrencyPeak = Math.max(concurrencyPeak, inFlight);
        resolve();
      } else {
        waitQueue.push(resolve);
      }
    });
  }

  function release() {
    inFlight -= 1;
    if (waitQueue.length > 0) {
      const next = waitQueue.shift();
      inFlight += 1;
      concurrencyPeak = Math.max(concurrencyPeak, inFlight);
      next();
    }
  }

  async function getBrowser() {
    if (browser && browser.connected) return browser;
    if (browser) {
      try {
        await browser.close();
      } catch (_) {}
      browser = null;
    }
    browser = await puppeteer.launch({
      headless: true,
      args: LAUNCH_ARGS,
    });
    log('BROWSER STARTED');
    return browser;
  }

  async function restartBrowser(reason) {
    if (browser) {
      try {
        await browser.close();
      } catch (_) {}
      browser = null;
    }
    browserRestarts += 1;
    costUnits += 5;
    logWarn(`BROWSER RESTARTED reason=${reason || 'unknown'}`);
    return getBrowser();
  }

  /**
   * Returns { page, release } where release() closes the page and releases the semaphore.
   * @param {Object} runLogCtx
   * @param {string} sourceName
   */
  async function getPage(runLogCtxParam, sourceName) {
    const ctx = runLogCtxParam || runLogCtx;
    await acquire();
    const inFlightNow = inFlight;
    if (runLog && ctx) console.info(runLog(ctx, `CONCURRENCY ACQUIRE source=${sourceName} in_flight=${inFlightNow}`));

    let page = null;
    let released = false;
    const releasePage = async () => {
      if (released) return;
      released = true;
      try {
        if (page) await page.close().catch(() => {});
      } catch (_) {}
      release();
      if (runLog && ctx) console.info(runLog(ctx, `CONCURRENCY RELEASE source=${sourceName} in_flight=${inFlight}`));
    };

    try {
      const b = await getBrowser();
      page = await b.newPage();
      ensureWaitForTimeout(page);
      pagesOpened += 1;
      costUnits += 1;

      const userAgents = [
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      ];
      const ua = userAgents[Math.floor(Math.random() * userAgents.length)];
      await page.setUserAgent(ua);
      await page.setViewport({ width: 1920, height: 1080 });

      return { page, release: releasePage };
    } catch (err) {
      await releasePage();
      if (browser && !browser.connected) {
        await restartBrowser(err.name || err.message || 'error');
      }
      throw err;
    }
  }

  function recordTimeout() {
    costUnits += 2;
  }

  async function close() {
    if (browser) {
      try {
        await browser.close();
      } catch (_) {}
      browser = null;
    }
    while (waitQueue.length) waitQueue.shift()();
  }

  function getStats() {
    return {
      pages_opened: pagesOpened,
      browser_restarts: browserRestarts,
      concurrency_peak: concurrencyPeak,
      estimated_cost_units: costUnits,
    };
  }

  return {
    getPage,
    close,
    getStats,
    recordTimeout,
    MAX_CONCURRENT_PAGES,
  };
}

module.exports = {
  createBrowserManager,
  MAX_CONCURRENT_PAGES: Math.max(1, Math.min(10, parseInt(process.env.MAX_CONCURRENT_PAGES || '4', 10))),
};
