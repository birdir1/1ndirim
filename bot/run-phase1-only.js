/**
 * Phase 1 Runtime Test
 * Runs ONLY the 12 Phase 1 finance scrapers
 * 
 * Goal: Collect 200+ campaigns from banks + wallets
 */

require('dotenv').config();
const ApiClient = require('./src/services/apiClient');
const { createBrowserManager } = require('./src/services/browserManager');

// Phase 1 Scrapers ONLY
const IsbankScraper = require('./src/scrapers/isbank-scraper');
const YapikrediScraper = require('./src/scrapers/yapikredi-scraper');
const ZiraatScraper = require('./src/scrapers/ziraat-scraper');
const HalkbankScraper = require('./src/scrapers/halkbank-scraper');
const VakifbankScraper = require('./src/scrapers/vakifbank-scraper');
const QNBScraper = require('./src/scrapers/qnb-scraper');
const DenizbankScraper = require('./src/scrapers/denizbank-scraper');
const EnparaScraper = require('./src/scrapers/enpara-scraper');
const PaparaScraper = require('./src/scrapers/papara-scraper');
const PaycellScraper = require('./src/scrapers/paycell-scraper');
const BKMExpressScraper = require('./src/scrapers/bkmexpress-scraper');
const ToslaScraper = require('./src/scrapers/tosla-scraper');

const PHASE1_SCRAPERS = [
  new IsbankScraper(),
  new YapikrediScraper(),
  new ZiraatScraper(),
  new HalkbankScraper(),
  new VakifbankScraper(),
  new QNBScraper(),
  new DenizbankScraper(),
  new EnparaScraper(),
  new PaparaScraper(),
  new PaycellScraper(),
  new BKMExpressScraper(),
  new ToslaScraper(),
];

async function runPhase1Test() {
  console.log('\n🚀 PHASE 1 RUNTIME TEST');
  console.log('═'.repeat(70));
  console.log(`Testing ${PHASE1_SCRAPERS.length} finance sources (banks + wallets)`);
  console.log(`Goal: Collect 200+ campaigns\n`);

  const apiClient = new ApiClient();
  const runLogCtx = { run_id: 'phase1-runtime-test' };
  const browserManager = createBrowserManager(runLogCtx, (ctx, msg) => `[${ctx.run_id}] ${msg}`);

  const results = {
    total: PHASE1_SCRAPERS.length,
    successful: 0,
    failed: 0,
    totalCampaigns: 0,
    bySource: {},
    errors: [],
  };

  const startTime = Date.now();

  for (let i = 0; i < PHASE1_SCRAPERS.length; i++) {
    const scraper = PHASE1_SCRAPERS[i];
    const sourceNum = i + 1;
    
    console.log(`\n[${ sourceNum}/${PHASE1_SCRAPERS.length}] 📡 ${scraper.sourceName}`);
    console.log('─'.repeat(70));

    const sourceStartTime = Date.now();

    try {
      // Scrape campaigns
      const campaigns = await scraper.runWithRetry(2, { browserManager, runLogCtx });
      const duration = Date.now() - sourceStartTime;

      if (campaigns.length === 0) {
        console.log(`⚠️  ${scraper.sourceName}: No campaigns found (${duration}ms)`);
        results.failed++;
        results.errors.push({ source: scraper.sourceName, reason: 'EMPTY_RESULT' });
        results.bySource[scraper.sourceName] = { count: 0, status: 'empty' };
        continue;
      }

      console.log(`✅ ${scraper.sourceName}: ${campaigns.length} campaigns scraped (${duration}ms)`);

      // Send to backend
      let savedCount = 0;
      let updatedCount = 0;
      let errorCount = 0;

      for (const campaign of campaigns) {
        try {
          const result = await apiClient.createCampaign(campaign);
          if (result.success) {
            if (result.isUpdate) {
              updatedCount++;
            } else {
              savedCount++;
            }
          } else {
            errorCount++;
          }
        } catch (err) {
          errorCount++;
        }
      }

      console.log(`   💾 Saved: ${savedCount} new, ${updatedCount} updated, ${errorCount} errors`);

      results.successful++;
      results.totalCampaigns += campaigns.length;
      results.bySource[scraper.sourceName] = {
        count: campaigns.length,
        saved: savedCount,
        updated: updatedCount,
        errors: errorCount,
        status: 'success',
        duration,
      };

      // Delay between scrapers
      if (i < PHASE1_SCRAPERS.length - 1) {
        console.log('   ⏳ Waiting 3s...');
        await new Promise(resolve => setTimeout(resolve, 3000));
      }

    } catch (error) {
      const duration = Date.now() - sourceStartTime;
      console.log(`❌ ${scraper.sourceName}: ${error.message} (${duration}ms)`);
      results.failed++;
      results.errors.push({ source: scraper.sourceName, reason: error.message });
      results.bySource[scraper.sourceName] = { count: 0, status: 'failed', error: error.message };
    }
  }

  await browserManager.close();

  const totalDuration = Date.now() - startTime;

  // Final Report
  console.log('\n\n');
  console.log('═'.repeat(70));
  console.log('📊 PHASE 1 RUNTIME TEST RESULTS');
  console.log('═'.repeat(70));
  console.log('\n');

  console.log('📈 SUMMARY:');
  console.log(`   Total sources: ${results.total}`);
  console.log(`   Successful: ${results.successful} ✅`);
  console.log(`   Failed: ${results.failed} ❌`);
  console.log(`   Total campaigns: ${results.totalCampaigns}`);
  console.log(`   Duration: ${(totalDuration / 1000).toFixed(1)}s`);
  console.log('\n');

  console.log('📋 BY SOURCE:');
  for (const [source, data] of Object.entries(results.bySource)) {
    const status = data.status === 'success' ? '✅' : data.status === 'empty' ? '⚠️ ' : '❌';
    console.log(`   ${status} ${source.padEnd(20)} ${data.count} campaigns`);
  }
  console.log('\n');

  if (results.errors.length > 0) {
    console.log('⚠️  ERRORS:');
    for (const error of results.errors) {
      console.log(`   ❌ ${error.source}: ${error.reason}`);
    }
    console.log('\n');
  }

  console.log('🎯 TARGET VALIDATION:');
  console.log(`   Target: ≥ 200 campaigns`);
  console.log(`   Actual: ${results.totalCampaigns} campaigns`);
  if (results.totalCampaigns >= 200) {
    console.log(`   Status: ✅ PASSED`);
  } else {
    console.log(`   Status: ⚠️  BELOW TARGET (${200 - results.totalCampaigns} short)`);
  }
  console.log('\n');

  console.log('═'.repeat(70));
  console.log('Test complete!\n');

  process.exit(results.totalCampaigns >= 200 ? 0 : 1);
}

runPhase1Test().catch(err => {
  console.error('\n❌ Test crashed:', err);
  process.exit(1);
});
