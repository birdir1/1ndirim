/**
 * Expansion Runtime Runner
 * Runs only the newly added bank sources to quickly populate campaigns.
 *
 * Notes:
 * - Uses centralNormalizer + botPreFilter + confidence enrichment.
 * - Does NOT apply the strict bot quality gate; backend remains the final authority.
 */

require('dotenv').config();

const ApiClient = require('./src/services/apiClient');
const { createBrowserManager } = require('./src/services/browserManager');
const { normalizeCampaigns } = require('./src/utils/centralNormalizer');
const { botPreFilter } = require('./src/utils/botPreFilter');
const { enrichWithConfidence } = require('./src/utils/confidenceCalculator');

const SekerbankScraper = require('./src/scrapers/sekerbank-scraper');
const FibabankaScraper = require('./src/scrapers/fibabanka-scraper');
const AnadolubankScraper = require('./src/scrapers/anadolubank-scraper');
const AlternatifBankScraper = require('./src/scrapers/alternatifbank-scraper');
const OdeabankScraper = require('./src/scrapers/odeabank-scraper');
const IcbcScraper = require('./src/scrapers/icbc-scraper');
const BurganbankScraper = require('./src/scrapers/burganbank-scraper');
const TurkishBankScraper = require('./src/scrapers/turkishbank-scraper');
const HsbcScraper = require('./src/scrapers/hsbc-scraper');
const HayatFinansScraper = require('./src/scrapers/hayatfinans-scraper');
const TombankScraper = require('./src/scrapers/tombank-scraper');

const SCRAPERS = [
  new SekerbankScraper(),
  new FibabankaScraper(),
  new AnadolubankScraper(),
  new AlternatifBankScraper(),
  new OdeabankScraper(),
  new IcbcScraper(),
  new BurganbankScraper(),
  new TurkishBankScraper(),
  new HsbcScraper(),
  new HayatFinansScraper(),
  new TombankScraper(),
];

async function run() {
  const apiClient = new ApiClient();
  const runLogCtx = { run_id: 'expansion-runner' };
  const browserManager = createBrowserManager(runLogCtx, (ctx, msg) => `[${ctx.run_id}] ${msg}`);

  const results = { total: SCRAPERS.length, bySource: {}, sent: 0, accepted: 0, rejected: 0 };
  const startedAt = Date.now();

  console.log(`\n🚀 EXPANSION RUNNER: ${SCRAPERS.length} sources\n`);

  try {
    for (let i = 0; i < SCRAPERS.length; i++) {
      const scraper = SCRAPERS[i];
      const t0 = Date.now();

      console.log(`\n[${i + 1}/${SCRAPERS.length}] 📡 ${scraper.sourceName}`);
      let raw = [];
      try {
        raw = await scraper.runWithRetry(2, { browserManager, runLogCtx });
      } catch (e) {
        results.bySource[scraper.sourceName] = { scraped: 0, sent: 0, accepted: 0, rejected: 0, error: e.message };
        console.log(`❌ scrape failed: ${e.message}`);
        continue;
      }

      const scrapedAt = new Date().toISOString();
      const { items: normalized, dropped } = normalizeCampaigns(raw, { sourceName: scraper.sourceName, scrapedAt });
      let toSend = botPreFilter(normalized);
      try {
        toSend = enrichWithConfidence(toSend, { emptyResultSources: [], domChangedSources: [] });
      } catch (_) {
        toSend = toSend.map((c) => ({ ...c, confidence_score: 50, confidence_reasons: ['fallback_default'] }));
      }

      if (toSend.length === 0) {
        results.bySource[scraper.sourceName] = { scraped: raw.length, normalized: normalized.length, droppedRequired: dropped, sent: 0, accepted: 0, rejected: 0 };
        console.log(`⚠️  no campaigns after normalize/prefilter (scraped=${raw.length}, normalized=${normalized.length}, dropped_required=${dropped})`);
        continue;
      }

      const postResults = await apiClient.createCampaigns(toSend);
      const accepted = postResults.filter((r) => r && r.success).length;
      const rejected = postResults.length - accepted;
      results.sent += postResults.length;
      results.accepted += accepted;
      results.rejected += rejected;
      results.bySource[scraper.sourceName] = {
        scraped: raw.length,
        normalized: normalized.length,
        droppedRequired: dropped,
        sent: postResults.length,
        accepted,
        rejected,
        durationMs: Date.now() - t0,
      };

      console.log(`✅ sent=${postResults.length} accepted=${accepted} rejected=${rejected} duration=${Date.now() - t0}ms`);
      await new Promise((r) => setTimeout(r, 1500));
    }
  } finally {
    await browserManager.close();
  }

  const dur = Date.now() - startedAt;
  console.log(`\n📊 DONE: sent=${results.sent} accepted=${results.accepted} rejected=${results.rejected} duration=${Math.round(dur / 1000)}s\n`);
  for (const [k, v] of Object.entries(results.bySource)) {
    const status = v && v.error ? '❌' : (v && v.sent ? '✅' : '⚠️ ');
    console.log(`${status} ${k}: scraped=${v.scraped ?? 0} sent=${v.sent ?? 0} accepted=${v.accepted ?? 0} rejected=${v.rejected ?? 0}${v.error ? ` error=${v.error}` : ''}`);
  }

  process.exit(0);
}

run().catch((e) => {
  console.error('runner crashed:', e);
  process.exit(1);
});

