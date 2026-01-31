/**
 * PHASE 1 VALIDATION TEST
 * Tests all 12 finance sources (banks + wallets)
 * 
 * DO NOT MODIFY SCRAPERS - ONLY TEST AND REPORT
 */

require('dotenv').config();
const { createBrowserManager } = require('./src/services/browserManager');

// Import Phase 1 scrapers
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
  { name: 'İş Bankası', scraper: new IsbankScraper(), type: 'bank' },
  { name: 'Yapı Kredi', scraper: new YapikrediScraper(), type: 'bank' },
  { name: 'Ziraat Bankası', scraper: new ZiraatScraper(), type: 'bank' },
  { name: 'Halkbank', scraper: new HalkbankScraper(), type: 'bank' },
  { name: 'VakıfBank', scraper: new VakifbankScraper(), type: 'bank' },
  { name: 'QNB Finansbank', scraper: new QNBScraper(), type: 'bank' },
  { name: 'DenizBank', scraper: new DenizbankScraper(), type: 'bank' },
  { name: 'Enpara', scraper: new EnparaScraper(), type: 'bank' },
  { name: 'Papara', scraper: new PaparaScraper(), type: 'wallet' },
  { name: 'Paycell', scraper: new PaycellScraper(), type: 'wallet' },
  { name: 'BKM Express', scraper: new BKMExpressScraper(), type: 'wallet' },
  { name: 'Tosla', scraper: new ToslaScraper(), type: 'wallet' },
];

async function validatePhase1() {
  console.log('\n🔍 PHASE 1 VALIDATION TEST');
  console.log('================================\n');
  console.log(`Testing ${PHASE1_SCRAPERS.length} finance sources\n`);

  const results = {
    bySource: {},
    totalCampaigns: 0,
    successfulSources: 0,
    failedSources: 0,
    weakSources: [],
    subCategoryDistribution: {},
    duplicates: [],
    qualityIssues: [],
  };

  const runLogCtx = { run_id: 'phase1-validation' };
  const browserManager = createBrowserManager(runLogCtx, (ctx, msg) => `[${ctx.run_id}] ${msg}`);

  for (const { name, scraper, type } of PHASE1_SCRAPERS) {
    console.log(`\n📡 Testing: ${name} (${type})`);
    console.log('─'.repeat(50));

    const startTime = Date.now();
    let campaigns = [];
    let error = null;

    try {
      campaigns = await scraper.runWithRetry(2, { browserManager, runLogCtx });
      const duration = Date.now() - startTime;

      results.bySource[name] = {
        type,
        status: 'success',
        campaignCount: campaigns.length,
        duration,
        campaigns: campaigns.slice(0, 3), // Sample first 3
      };

      if (campaigns.length === 0) {
        results.weakSources.push({ source: name, reason: 'EMPTY_RESULT', campaigns: 0 });
        console.log(`⚠️  ${name}: EMPTY_RESULT (0 campaigns)`);
      } else if (campaigns.length < 5) {
        results.weakSources.push({ source: name, reason: 'LOW_COUNT', campaigns: campaigns.length });
        console.log(`⚠️  ${name}: LOW_COUNT (${campaigns.length} campaigns)`);
      } else {
        results.successfulSources++;
        console.log(`✅ ${name}: ${campaigns.length} campaigns (${duration}ms)`);
      }

      results.totalCampaigns += campaigns.length;

      // Validate data quality
      for (const campaign of campaigns.slice(0, 5)) {
        const issues = [];

        if (!campaign.title || campaign.title.length < 10) {
          issues.push('title_too_short');
        }
        if (!campaign.description || campaign.description.length < 20) {
          issues.push('description_too_short');
        }
        if (campaign.category !== 'finance') {
          issues.push(`wrong_category: ${campaign.category}`);
        }
        if (!campaign.subCategory) {
          issues.push('missing_subcategory');
        }
        if (!campaign.campaignUrl || !campaign.campaignUrl.startsWith('http')) {
          issues.push('invalid_url');
        }

        if (issues.length > 0) {
          results.qualityIssues.push({
            source: name,
            campaign: campaign.title,
            issues,
          });
        }

        // Track sub-category distribution
        const subCat = campaign.subCategory || 'unknown';
        results.subCategoryDistribution[subCat] = (results.subCategoryDistribution[subCat] || 0) + 1;
      }

    } catch (err) {
      error = err.message;
      const duration = Date.now() - startTime;

      results.bySource[name] = {
        type,
        status: 'failed',
        campaignCount: 0,
        duration,
        error,
      };

      results.failedSources++;
      results.weakSources.push({ source: name, reason: 'SCRAPER_CRASH', error });
      console.log(`❌ ${name}: SCRAPER_CRASH - ${error}`);
    }

    // Delay between scrapers
    if (PHASE1_SCRAPERS.indexOf({ name, scraper, type }) < PHASE1_SCRAPERS.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }

  await browserManager.close();

  // Generate final report
  console.log('\n\n');
  console.log('═'.repeat(70));
  console.log('📊 PHASE 1 FINAL VALIDATION REPORT');
  console.log('═'.repeat(70));
  console.log('\n');

  // 1. Campaign count per source
  console.log('1️⃣  CAMPAIGN COUNT PER SOURCE');
  console.log('─'.repeat(70));
  console.log(`${'Source'.padEnd(25)} ${'Type'.padEnd(10)} ${'Count'.padEnd(10)} ${'Status'}`);
  console.log('─'.repeat(70));

  for (const { name, type } of PHASE1_SCRAPERS) {
    const result = results.bySource[name];
    const count = result.campaignCount.toString().padEnd(10);
    const status = result.status === 'success' ? '✅' : '❌';
    console.log(`${name.padEnd(25)} ${type.padEnd(10)} ${count} ${status}`);
  }

  console.log('─'.repeat(70));
  console.log(`${'TOTAL'.padEnd(25)} ${' '.padEnd(10)} ${results.totalCampaigns.toString().padEnd(10)}`);
  console.log('\n');

  // 2. Total campaign count
  console.log('2️⃣  TOTAL CAMPAIGN COUNT');
  console.log('─'.repeat(70));
  console.log(`Total campaigns: ${results.totalCampaigns}`);
  console.log(`Target: ≥ 200 campaigns`);
  console.log(`Status: ${results.totalCampaigns >= 200 ? '✅ PASSED' : '❌ FAILED'}`);
  console.log('\n');

  // 3. Sub-category distribution
  console.log('3️⃣  SUB-CATEGORY DISTRIBUTION');
  console.log('─'.repeat(70));
  for (const [subCat, count] of Object.entries(results.subCategoryDistribution).sort((a, b) => b[1] - a[1])) {
    console.log(`${subCat.padEnd(20)}: ${count}`);
  }
  console.log('\n');

  // 4. Duplicate detection (simplified - by title similarity)
  console.log('4️⃣  DUPLICATE DETECTION');
  console.log('─'.repeat(70));
  const allCampaigns = [];
  for (const { name } of PHASE1_SCRAPERS) {
    const result = results.bySource[name];
    if (result.campaigns) {
      allCampaigns.push(...result.campaigns.map(c => ({ ...c, source: name })));
    }
  }

  const titleMap = {};
  for (const campaign of allCampaigns) {
    const key = campaign.title.toLowerCase().trim();
    if (!titleMap[key]) {
      titleMap[key] = [];
    }
    titleMap[key].push(campaign.source);
  }

  const duplicates = Object.entries(titleMap).filter(([_, sources]) => sources.length > 1);
  const duplicateRate = allCampaigns.length > 0 ? (duplicates.length / allCampaigns.length * 100).toFixed(2) : 0;

  console.log(`Duplicate rate: ${duplicateRate}% (${duplicates.length}/${allCampaigns.length})`);
  console.log(`Target: < 5%`);
  console.log(`Status: ${duplicateRate < 5 ? '✅ PASSED' : '⚠️  WARNING'}`);
  console.log('\n');

  // 5. Broken / weak sources
  console.log('5️⃣  BROKEN / WEAK SOURCES');
  console.log('─'.repeat(70));
  if (results.weakSources.length === 0) {
    console.log('✅ No weak sources detected');
  } else {
    for (const weak of results.weakSources) {
      console.log(`❌ ${weak.source}: ${weak.reason}`);
      if (weak.error) console.log(`   Error: ${weak.error}`);
      if (weak.campaigns !== undefined) console.log(`   Campaigns: ${weak.campaigns}`);
    }
  }
  console.log('\n');

  // 6. Data quality issues
  if (results.qualityIssues.length > 0) {
    console.log('⚠️  DATA QUALITY ISSUES');
    console.log('─'.repeat(70));
    const issuesBySource = {};
    for (const issue of results.qualityIssues) {
      if (!issuesBySource[issue.source]) {
        issuesBySource[issue.source] = [];
      }
      issuesBySource[issue.source].push(issue);
    }
    for (const [source, issues] of Object.entries(issuesBySource)) {
      console.log(`${source}: ${issues.length} issues`);
      for (const issue of issues.slice(0, 2)) {
        console.log(`  - ${issue.campaign}: ${issue.issues.join(', ')}`);
      }
    }
    console.log('\n');
  }

  // 7. Final verdict
  console.log('═'.repeat(70));
  console.log('6️⃣  FINAL VERDICT');
  console.log('═'.repeat(70));

  const passed = results.totalCampaigns >= 200 && results.failedSources === 0;

  if (passed) {
    console.log('✅ PHASE 1 PASSED — READY FOR PHASE 2');
    console.log(`   - ${results.totalCampaigns} campaigns collected`);
    console.log(`   - ${results.successfulSources}/${PHASE1_SCRAPERS.length} sources successful`);
    console.log(`   - ${duplicateRate}% duplicate rate`);
  } else {
    console.log('❌ PHASE 1 FAILED — FIX REQUIRED');
    console.log(`   - ${results.totalCampaigns} campaigns (target: ≥200)`);
    console.log(`   - ${results.failedSources} sources failed`);
    console.log(`   - ${results.weakSources.length} weak sources`);
  }

  console.log('═'.repeat(70));
  console.log('\n');

  process.exit(passed ? 0 : 1);
}

// Run validation
validatePhase1().catch(err => {
  console.error('\n❌ VALIDATION SCRIPT CRASHED:', err);
  process.exit(1);
});
