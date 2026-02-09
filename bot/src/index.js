/**
 * 1ndirim Bot - Ana Giriş Noktası
 * Otomatik kampanya okuyucu bot
 */

require('dotenv').config();
const crypto = require('crypto');
const { getQualityRejectionReason } = require('../src/utils/campaignQualityFilter');
const { botPreFilter } = require('./utils/botPreFilter');
const { classifyError, FAILURE_TYPES } = require('./utils/failureClassifier');
const { enrichWithConfidence } = require('./utils/confidenceCalculator');
const { computeAllFromRunSummary } = require('./utils/sourceTrustScore');
const { pushRunSts, getSuggestions, isLearningDisabled, recordLearningSuccess, recordLearningException } = require('./utils/trustHistory');
const { generateAdminSuggestions } = require('./utils/adminSuggestionEngine');
const { normalizeCampaigns } = require('./utils/centralNormalizer');
const { withFsRunLock } = require('./utils/runLock');
const ApiClient = require('./services/apiClient');
const { createBrowserManager } = require('./services/browserManager');
const AkbankScraper = require('./scrapers/akbank-scraper');
const TurkcellScraper = require('./scrapers/turkcell-scraper');
const YapikrediScraper = require('./scrapers/yapikredi-scraper');
const IsbankScraper = require('./scrapers/isbank-scraper');
const GarantiScraper = require('./scrapers/garanti-scraper');
const VodafoneScraper = require('./scrapers/vodafone-scraper');
const TurktelekomScraper = require('./scrapers/turktelekom-scraper');
const ZiraatScraper = require('./scrapers/ziraat-scraper');
const HalkbankScraper = require('./scrapers/halkbank-scraper');
const VakifbankScraper = require('./scrapers/vakifbank-scraper');
const DenizbankScraper = require('./scrapers/denizbank-scraper');
const QNBScraper = require('./scrapers/qnb-scraper');
const TebScraper = require('./scrapers/teb-scraper');
const IngScraper = require('./scrapers/ing-scraper');
const KuveytTurkScraper = require('./scrapers/kuveytturk-scraper');
const AlbarakaScraper = require('./scrapers/albaraka-scraper');
const TurkiyeFinansScraper = require('./scrapers/turkiyefinans-scraper');
const VakifKatilimScraper = require('./scrapers/vakifkatilim-scraper');
const ZiraatKatilimScraper = require('./scrapers/ziraatkatilim-scraper');
const EmlakKatilimScraper = require('./scrapers/emlakkatilim-scraper');
const EnparaScraper = require('./scrapers/enpara-scraper');
const CeptetebScraper = require('./scrapers/cepteteb-scraper');
const NKolayScraper = require('./scrapers/nkolay-scraper');
const PTTcellScraper = require('./scrapers/pttcell-scraper');
// PHASE 1: Wallet scrapers
const PaparaScraper = require('./scrapers/papara-scraper');
const PaycellScraper = require('./scrapers/paycell-scraper');
const BKMExpressScraper = require('./scrapers/bkmexpress-scraper');
const ToslaScraper = require('./scrapers/tosla-scraper');
// New bank scrapers
const SekerbankScraper = require('./scrapers/sekerbank-scraper');
const FibabankaScraper = require('./scrapers/fibabanka-scraper');
const AnadolubankScraper = require('./scrapers/anadolubank-scraper');
const AlternatifBankScraper = require('./scrapers/alternatifbank-scraper');
const OdeabankScraper = require('./scrapers/odeabank-scraper');
const IcbcScraper = require('./scrapers/icbc-scraper');
const BurganbankScraper = require('./scrapers/burganbank-scraper');
const TurkishBankScraper = require('./scrapers/turkishbank-scraper');
const HsbcScraper = require('./scrapers/hsbc-scraper');
const HayatFinansScraper = require('./scrapers/hayatfinans-scraper');
const TombankScraper = require('./scrapers/tombank-scraper');
// FAZ 7: Fetch-based scrapers (SPA kaynaklar için)
const TebFetchScraper = require('./scrapers/fetch/teb-fetch-scraper');
const { startScheduler } = require('./scheduler');

const SCRAPER_DELAY_MS = parseInt(process.env.SCRAPER_DELAY_MS || '3000', 10);
const SCHEDULER_INTERVAL_MINUTES = parseInt(process.env.SCHEDULER_INTERVAL_MINUTES || '30', 10);

/** FAZ 15.1: run-level log prefix (log only, no DB/API) */
function runLog(ctx, msg) {
  const prefix = ctx && ctx.run_id ? `[RUN ${ctx.run_id}] ` : '';
  return prefix + msg;
}

function newRunId() {
  return typeof crypto.randomUUID === 'function' ? crypto.randomUUID() : crypto.randomBytes(16).toString('hex');
}

function applyIngestionGate(rawCampaigns, sourceName) {
  const rawTotal = Array.isArray(rawCampaigns) ? rawCampaigns.length : 0;
  const scrapedAt = new Date().toISOString();
  const { items: normalized, dropped: droppedRequired } = normalizeCampaigns(rawCampaigns, { sourceName, scrapedAt });
  const accepted = [];
  const qualityRejectReasons = {};
  for (const c of normalized) {
    const reason = getQualityRejectionReason(c);
    if (!reason) {
      accepted.push(c);
    } else {
      qualityRejectReasons[reason] = (qualityRejectReasons[reason] || 0) + 1;
    }
  }

  const acceptedTotal = accepted.length;
  const rejectedByQuality = Math.max(0, normalized.length - acceptedTotal);
  const rejectedOverall = Math.max(0, rawTotal - acceptedTotal);
  const rejectRatio = rawTotal > 0 ? (rejectedOverall / rawTotal) : 0;

  const degraded = rawTotal >= 5 && rejectRatio > 0.8;
  return {
    items: degraded ? [] : accepted,
    stats: {
      rawTotal,
      normalizedTotal: normalized.length,
      acceptedTotal,
      droppedRequired,
      rejectedByQuality,
      rejectedOverall,
      rejectRatio: Math.round(rejectRatio * 100) / 100,
      degraded,
      qualityRejectReasons,
      scrapedAt,
    },
  };
}

/**
 * Tüm scraper'ları çalıştırır.
 * Admin authority: source_status (hard_backlog -> skip, backlog -> allow+warning, active -> normal).
 */
async function runScrapers() {
  const apiClient = new ApiClient();

  // Source lifecycle: backend is authority. Bot skips hard_backlog and respects admin state.
  let sourceStatusMap = {};
  try {
    sourceStatusMap = await apiClient.getSourceStatusList();
  } catch (_) {
    sourceStatusMap = {};
  }

  // FAZ 6: Tüm mevcut scraper'lar aktif
  // FAZ 6.2: Ziraat Bankası eklendi
  // FAZ 6.3: Halkbank eklendi (pasif - backlog), VakıfBank eklendi
  // PHASE 1: Finance sources (banks + wallets) - 12 total
  const scrapers = [
    new AkbankScraper(),
    new TurkcellScraper(),
    new GarantiScraper(),
    new YapikrediScraper(),
    new IsbankScraper(),
    new VodafoneScraper(),
    new TurktelekomScraper(),
    new ZiraatScraper(),
    new HalkbankScraper(), // PHASE 1: Re-enabled with Phase 1 pattern
    new VakifbankScraper(), // PHASE 1: Re-enabled with Phase 1 pattern
    new DenizbankScraper(), // FAZ 6.4: DenizBank eklendi
    new QNBScraper(), // FAZ 6.5.1: QNB Finansbank eklendi
    // new TebScraper(), // FAZ 6.5.2: Pasif - SPA yapı, backlog'a alındı
    new IngScraper(), // FAZ 6.5.3: ING Bank eklendi
    new KuveytTurkScraper(), // FAZ 6.5.4: Kuveyt Türk eklendi
    new AlbarakaScraper(), // FAZ 6.5.5: Albaraka Türk eklendi
    new TurkiyeFinansScraper(), // FAZ 7.2: Category mode aktif
    new VakifKatilimScraper(), // FAZ 6.5.7: Vakıf Katılım eklendi
    new ZiraatKatilimScraper(), // FAZ 7.2: Category mode aktif
    new EmlakKatilimScraper(), // FAZ 6.5.9: Emlak Katılım eklendi
    new EnparaScraper(), // FAZ 7.5: Low value mode aktif
    new CeptetebScraper(), // FAZ 6.6.2: CEPTETEB eklendi
    new NKolayScraper(), // FAZ 6.6.3: N Kolay eklendi
    new PTTcellScraper(), // FAZ 7.5: Low value mode aktif
    // PHASE 1: Wallet scrapers (finance category)
    new PaparaScraper(), // PHASE 1: Digital wallet with sub-category detection
    new PaycellScraper(), // PHASE 1: Digital wallet with sub-category detection
    new BKMExpressScraper(), // PHASE 1: Digital wallet with sub-category detection
    new ToslaScraper(), // PHASE 1: Digital wallet with sub-category detection
    // Additional banks (Phase: expansion)
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

  console.log(`\n🤖 Bot başlatıldı: ${scrapers.length} scraper çalıştırılacak\n`);

  const runStartTime = Date.now();
  const runLogCtx = {
    run_id: newRunId(),
    started_at: new Date().toISOString(),
    mode: 'dom',
    environment: process.env.NODE_ENV || 'unknown',
  };
  console.info(runLog(runLogCtx, `run_id=${runLogCtx.run_id} started_at=${runLogCtx.started_at} mode=${runLogCtx.mode} environment=${runLogCtx.environment}`));
  console.info(runLog(runLogCtx, 'ADMIN GOVERNANCE ACTIVE: suggestions enabled, execution requires admin')); // FAZ 21.5

	  const runSummary = {
	    total: scrapers.length,
	    skippedHardBacklog: [],
	    scraped: [],
	    backlogWarn: [],
	    errors: [],
	    sources_temporarily_disabled: [],
	    confidenceSum: 0,
	    confidenceCount: 0,
	    lowConfidenceCount: 0,
	    highConfidenceCount: 0,
	    bySource: {}, // FAZ 14.1: per-source confidence for STS
	    feedback: { bySource: {} }, // FAZ 14.2: confidence feedback loop
	    freezeLearning: false, // FAZ 14.5
	    campaigns: { total_sent: 0, accepted: 0, downgraded: 0, hidden: 0, low_confidence: 0 }, // FAZ 15.4
	    adminFeedback: { bySource: {} }, // FAZ 16.2: admin action signals (run-local, log-only)
	    domUnstableSources: new Set(), // FAZ 17.4: run-local, DOM_CHANGED olan kaynaklar
	  };
	  runSummary.sentBySource = {};
	  const sourceHealth = {};
  const browserManager = createBrowserManager(runLogCtx, runLog); // FAZ 17.1–17.2

  for (const scraper of scrapers) {
    const t0 = Date.now();
    console.info(runLog(runLogCtx, `SOURCE START source=${scraper.sourceName}`));
    try {
      const status = (sourceStatusMap[scraper.sourceName] || 'active').toLowerCase();
      if (status === 'hard_backlog') {
        console.info(runLog(runLogCtx, `SOURCE SKIP reason=hard_backlog source=${scraper.sourceName}`));
        console.info(runLog(runLogCtx, `SOURCE END status=skipped source=${scraper.sourceName}`));
        console.log(`⏭️ ${scraper.sourceName} skipped (hard_backlog)`);
        runSummary.skippedHardBacklog.push(scraper.sourceName);
        continue;
      }
      try {
        if ((sourceHealth[scraper.sourceName] || 0) >= 2) {
          console.info(runLog(runLogCtx, `SOURCE SKIP reason=temporarily_disabled source=${scraper.sourceName}`));
          console.info(runLog(runLogCtx, `SOURCE END status=skipped source=${scraper.sourceName}`));
          console.log(`⛔ ${scraper.sourceName} temporarily disabled (run-local)`);
          runSummary.sources_temporarily_disabled.push(scraper.sourceName);
          continue;
        }
      } catch (_) {}

      if (status === 'backlog') {
        console.warn(`⚠️ ${scraper.sourceName} status=backlog (scraping allowed for now)`);
      }

      console.info(runLog(runLogCtx, `SOURCE SCRAPE_START source=${scraper.sourceName}`));
      console.log(`\n📡 ${scraper.sourceName} scraper çalışıyor...`);

      const campaigns = await scraper.runWithRetry(3, {
        browserManager,
        runLogCtx,
        getFailureType: (e) => classifyError(e, { sourceName: scraper.sourceName, phase: 'dom', selectorUsed: e && e.selectorUsed }),
      });
      const durationMs = Date.now() - t0;
      try {
        if (!runSummary.bySource[scraper.sourceName]) runSummary.bySource[scraper.sourceName] = { confidenceSum: 0, confidenceCount: 0, lowConfidenceCount: 0 };
        if (!runSummary.bySource[scraper.sourceName].durations) runSummary.bySource[scraper.sourceName].durations = [];
        runSummary.bySource[scraper.sourceName].durations.push(durationMs);
      } catch (_) {}

      if (campaigns.length === 0) {
        try {
          const entry = {
            sourceName: scraper.sourceName,
            failure_type: FAILURE_TYPES.EMPTY_RESULT,
            phase: 'dom',
            durationMs,
          };
          runSummary.errors.push(entry);
          console.info(runLog(runLogCtx, `SOURCE SCRAPE_FAIL failure_type=EMPTY_RESULT durationMs=${durationMs} source=${scraper.sourceName}`));
          console.info(runLog(runLogCtx, `SOURCE END status=failed source=${scraper.sourceName}`));
          console.warn(`⚠️ ${scraper.sourceName}: EMPTY_RESULT – page loaded but no campaigns (failure_type: EMPTY_RESULT)`);
          console.error(JSON.stringify({
            source: scraper.sourceName,
            scraper: scraper.constructor?.name || 'Unknown',
            failure_type: FAILURE_TYPES.EMPTY_RESULT,
            phase: 'dom',
            durationMs,
          }));
        } catch (_) {
          runSummary.errors.push({ sourceName: scraper.sourceName, failure_type: FAILURE_TYPES.UNEXPECTED_ERROR });
          console.info(runLog(runLogCtx, `SOURCE SCRAPE_FAIL failure_type=EMPTY_RESULT durationMs=${durationMs} source=${scraper.sourceName}`));
          console.info(runLog(runLogCtx, `SOURCE END status=failed source=${scraper.sourceName}`));
        }
        continue;
      }

      runSummary.scraped.push(scraper.sourceName);
      if (status === 'backlog') runSummary.backlogWarn.push(scraper.sourceName);
      console.info(runLog(runLogCtx, `SOURCE SCRAPE_SUCCESS campaigns=${campaigns.length} durationMs=${durationMs} source=${scraper.sourceName}`));
      console.log(`📊 [${scraper.sourceName}] success=${campaigns.length} duration=${durationMs}ms`);

      const gated = applyIngestionGate(campaigns, scraper.sourceName);
      if (!runSummary.bySource[scraper.sourceName]) {
        runSummary.bySource[scraper.sourceName] = { confidenceSum: 0, confidenceCount: 0, lowConfidenceCount: 0 };
      }
      runSummary.bySource[scraper.sourceName].gate = gated.stats;

      if (gated.stats.degraded) {
        console.warn(runLog(runLogCtx, `SOURCE_DEGRADED source=${scraper.sourceName} raw=${gated.stats.rawTotal} accepted=${gated.stats.acceptedTotal} reject_ratio=${gated.stats.rejectRatio}`));
        runSummary.errors.push({
          sourceName: scraper.sourceName,
          failure_type: 'SOURCE_DEGRADED',
          phase: 'gate',
          durationMs,
          stats: gated.stats,
        });
        console.info(runLog(runLogCtx, `SOURCE END status=failed source=${scraper.sourceName}`));
        continue;
      }

      const campaignsAfterGate = gated.items;
      if (campaignsAfterGate.length === 0) {
        console.warn(runLog(runLogCtx, `SOURCE_EMPTY_AFTER_GATE source=${scraper.sourceName} raw=${gated.stats.rawTotal} normalized=${gated.stats.normalizedTotal}`));
        runSummary.errors.push({
          sourceName: scraper.sourceName,
          failure_type: FAILURE_TYPES.EMPTY_RESULT,
          phase: 'gate',
          durationMs,
          stats: gated.stats,
        });
        console.info(runLog(runLogCtx, `SOURCE END status=failed source=${scraper.sourceName}`));
        continue;
      }

      // FAZ 7.2: Category Campaign Mode kontrolü
      const isCategoryScraper = scraper.sourceName === 'Türkiye Finans' || scraper.sourceName === 'Ziraat Katılım';
      
      // FAZ 7.5: Low Value Campaign Mode kontrolü
      const isLowValueScraper = scraper.sourceName === 'Enpara' || scraper.sourceName === 'PTTcell';
      
      if (isCategoryScraper) {
        // Category scraper'lar: Tüm kampanyaları category olarak işaretle
        const categoryCampaigns = campaignsAfterGate.map((campaign) => ({
          ...campaign,
          campaignType: 'category',
          showInCategoryFeed: true,
        }));

        if (categoryCampaigns.length === 0) {
          console.info(runLog(runLogCtx, `SOURCE END status=success source=${scraper.sourceName}`));
          console.log(`⚠️ ${scraper.sourceName}: Category kampanya bulunamadı`);
          continue;
        }

        const preBefore = categoryCampaigns.length;
        let toSendCategory = botPreFilter(categoryCampaigns);
        const preDropped = Math.max(0, preBefore - toSendCategory.length);
        runSummary.bySource[scraper.sourceName].prefilter = { before: preBefore, after: toSendCategory.length, dropped: preDropped };
        try {
          const runContext = {
            emptyResultSources: (runSummary.errors || []).filter((e) => e.failure_type === FAILURE_TYPES.EMPTY_RESULT).map((e) => e.sourceName),
            domChangedSources: (runSummary.errors || []).filter((e) => e.failure_type === FAILURE_TYPES.DOM_CHANGED).map((e) => e.sourceName),
          };
          toSendCategory = enrichWithConfidence(toSendCategory, runContext);
        } catch (_) {
          toSendCategory = toSendCategory.map((c) => ({ ...c, confidence_score: 50, confidence_reasons: ['fallback_default'] }));
        }
        if (!runSummary.bySource[scraper.sourceName]) {
          runSummary.bySource[scraper.sourceName] = { confidenceSum: 0, confidenceCount: 0, lowConfidenceCount: 0 };
        }
        toSendCategory.forEach((c) => {
          const s = c.confidence_score != null ? c.confidence_score : 50;
          runSummary.confidenceSum += s;
          runSummary.confidenceCount += 1;
          runSummary.bySource[scraper.sourceName].confidenceSum += s;
          runSummary.bySource[scraper.sourceName].confidenceCount += 1;
          if (s < 40) {
            runSummary.lowConfidenceCount += 1;
            runSummary.bySource[scraper.sourceName].lowConfidenceCount += 1;
          }
          if (s > 70) runSummary.highConfidenceCount += 1;
        });
        console.log(`📁 ${scraper.sourceName}: ${toSendCategory.length} category kampanya gönderiliyor`);

        runSummary.campaigns.total_sent += toSendCategory.length;
        const results = await apiClient.createCampaigns(toSendCategory);
        runSummary.sentBySource[scraper.sourceName] = runSummary.sentBySource[scraper.sourceName] || { sent: 0, accepted: 0, rejected: 0 };
        runSummary.sentBySource[scraper.sourceName].sent += toSendCategory.length;

        let successCount = 0;
        let updateCount = 0;
        let errorCount = 0;
	        for (let i = 0; i < results.length; i++) {
	          const result = results[i];
	          const sent = toSendCategory[i];
          if (result.success) {
            successCount++;
            runSummary.campaigns.accepted += 1;
            runSummary.sentBySource[scraper.sourceName].accepted += 1;
            if (result.applied_action === 'downgrade') runSummary.campaigns.downgraded += 1;
            if (result.applied_action === 'hide') runSummary.campaigns.hidden += 1;
            if (result.low_confidence) runSummary.campaigns.low_confidence += 1;
            if (result.low_confidence || result.applied_action === 'downgrade' || result.applied_action === 'hide') {
              console.warn(`⚠️ [CAMPAIGN] accepted with low confidence, no retry`);
              try {
                if (!runSummary.feedback.bySource[scraper.sourceName]) runSummary.feedback.bySource[scraper.sourceName] = [];
                runSummary.feedback.bySource[scraper.sourceName].push({
                  source: scraper.sourceName,
                  campaign_id: (result.data && result.data.data && result.data.data.id) || (result.data && result.data.id),
                  backend_action: result.applied_action || (result.low_confidence ? 'downgrade' : null),
                  confidence_score: sent && sent.confidence_score != null ? sent.confidence_score : undefined,
                  admin_override: result.admin_override,
                  admin_action_type: result.admin_action_type,
                });
              } catch (_) {}
            }
            if (result.admin_override === true || result.admin_action_type != null) {
              try {
                const cid = (result.data && result.data.data && result.data.data.id) || (result.data && result.data.id);
                const entry = { source: scraper.sourceName, campaign_id: cid, admin_action_type: result.admin_action_type ?? '', applied_action: result.applied_action ?? 'accepted', confidence_score: sent && sent.confidence_score != null ? sent.confidence_score : null, timestamp: new Date().toISOString(), admin_override: !!result.admin_override };
                if (!runSummary.adminFeedback.bySource[scraper.sourceName]) runSummary.adminFeedback.bySource[scraper.sourceName] = [];
                runSummary.adminFeedback.bySource[scraper.sourceName].push(entry);
                console.warn(runLog(runLogCtx, '🧠 ADMIN FEEDBACK'));
                console.warn(runLog(runLogCtx, `source=${scraper.sourceName}`));
                console.warn(runLog(runLogCtx, `campaign_id=${cid || 'n/a'}`));
                console.warn(runLog(runLogCtx, `admin_action_type=${result.admin_action_type ?? 'n/a'}`));
                console.warn(runLog(runLogCtx, `applied_action=${result.applied_action ?? 'accepted'}`));
                console.warn(runLog(runLogCtx, `confidence_score=${sent && sent.confidence_score != null ? sent.confidence_score : 'n/a'}`));
              } catch (_) {}
            }
            if (result.freeze_learning) runSummary.freezeLearning = true;
          } else {
            errorCount++;
            runSummary.sentBySource[scraper.sourceName].rejected += 1;
            console.error(`❌ ${scraper.sourceName}: ${result.campaign} - ${result.error}`);
          }
        }
	        for (let i = 0; i < results.length; i++) {
	          const result = results[i];
	          const sent = toSendCategory[i];
          const cid = (result.data && result.data.data && result.data.data.id) || (result.data && result.data.id);
          const action = result.success ? (result.applied_action || 'accepted') : 'rejected';
          const reason = result.low_confidence ? 'low_confidence' : (result.success ? 'ok' : 'error');
          console.info(runLog(runLogCtx, `CAMPAIGN_DECISION source=${scraper.sourceName} campaign_id=${cid || 'n/a'} confidence_score=${sent && sent.confidence_score != null ? sent.confidence_score : 'n/a'} backend_action=${action} reason=${reason}`));
        }

        console.log(`✅ ${scraper.sourceName}: ${successCount} başarılı (${updateCount} güncelleme, ${successCount - updateCount} yeni)`);
        if (errorCount > 0) {
          console.log(`⚠️ ${scraper.sourceName}: ${errorCount} hata`);
        }

        console.info(runLog(runLogCtx, `SOURCE END status=success source=${scraper.sourceName}`));
        if (scrapers.indexOf(scraper) < scrapers.length - 1) {
          console.log(`⏳ ${SCRAPER_DELAY_MS}ms bekleniyor...`);
          await new Promise((resolve) => setTimeout(resolve, SCRAPER_DELAY_MS));
        }
        continue;
      }

      if (isLowValueScraper) {
        // FAZ 7.5: Low Value scraper'lar: Tüm kampanyaları low value olarak işaretle
        // Kalite filtresini bypass etme, sadece value_level = 'low' işaretle
        const lowValueCampaigns = campaignsAfterGate.map((campaign) => ({
          ...campaign,
          valueLevel: 'low',
        }));

        if (lowValueCampaigns.length === 0) {
          console.info(runLog(runLogCtx, `SOURCE END status=success source=${scraper.sourceName}`));
          console.log(`⚠️ ${scraper.sourceName}: Low value kampanya bulunamadı`);
          continue;
        }

        const preBefore = lowValueCampaigns.length;
        let toSendLow = botPreFilter(lowValueCampaigns);
        const preDropped = Math.max(0, preBefore - toSendLow.length);
        runSummary.bySource[scraper.sourceName].prefilter = { before: preBefore, after: toSendLow.length, dropped: preDropped };
        try {
          const runContext = {
            emptyResultSources: (runSummary.errors || []).filter((e) => e.failure_type === FAILURE_TYPES.EMPTY_RESULT).map((e) => e.sourceName),
            domChangedSources: (runSummary.errors || []).filter((e) => e.failure_type === FAILURE_TYPES.DOM_CHANGED).map((e) => e.sourceName),
          };
          toSendLow = enrichWithConfidence(toSendLow, runContext);
        } catch (_) {
          toSendLow = toSendLow.map((c) => ({ ...c, confidence_score: 50, confidence_reasons: ['fallback_default'] }));
        }
        if (!runSummary.bySource[scraper.sourceName]) {
          runSummary.bySource[scraper.sourceName] = { confidenceSum: 0, confidenceCount: 0, lowConfidenceCount: 0 };
        }
        toSendLow.forEach((c) => {
          const s = c.confidence_score != null ? c.confidence_score : 50;
          runSummary.confidenceSum += s;
          runSummary.confidenceCount += 1;
          runSummary.bySource[scraper.sourceName].confidenceSum += s;
          runSummary.bySource[scraper.sourceName].confidenceCount += 1;
          if (s < 40) {
            runSummary.lowConfidenceCount += 1;
            runSummary.bySource[scraper.sourceName].lowConfidenceCount += 1;
          }
          if (s > 70) runSummary.highConfidenceCount += 1;
        });
        console.log(`💰 ${scraper.sourceName}: ${toSendLow.length} low value kampanya gönderiliyor`);

        runSummary.campaigns.total_sent += toSendLow.length;
        const results = await apiClient.createCampaigns(toSendLow);
        runSummary.sentBySource[scraper.sourceName] = runSummary.sentBySource[scraper.sourceName] || { sent: 0, accepted: 0, rejected: 0 };
        runSummary.sentBySource[scraper.sourceName].sent += toSendLow.length;

        let successCount = 0;
        let updateCount = 0;
        let errorCount = 0;
        for (let i = 0; i < results.length; i++) {
          const result = results[i];
          const sent = toSendLow[i];
          if (result.success) {
            successCount++;
            if (result.isUpdate) updateCount++;
            runSummary.campaigns.accepted += 1;
            runSummary.sentBySource[scraper.sourceName].accepted += 1;
            if (result.applied_action === 'downgrade') runSummary.campaigns.downgraded += 1;
            if (result.applied_action === 'hide') runSummary.campaigns.hidden += 1;
            if (result.low_confidence) runSummary.campaigns.low_confidence += 1;
            if (result.low_confidence || result.applied_action === 'downgrade' || result.applied_action === 'hide') {
              console.warn(`⚠️ [CAMPAIGN] accepted with low confidence, no retry`);
              try {
                if (!runSummary.feedback.bySource[scraper.sourceName]) runSummary.feedback.bySource[scraper.sourceName] = [];
                runSummary.feedback.bySource[scraper.sourceName].push({
                  source: scraper.sourceName,
                  campaign_id: (result.data && result.data.data && result.data.data.id) || (result.data && result.data.id),
                  backend_action: result.applied_action || (result.low_confidence ? 'downgrade' : null),
                  confidence_score: sent && sent.confidence_score != null ? sent.confidence_score : undefined,
                  admin_override: result.admin_override,
                  admin_action_type: result.admin_action_type,
                });
              } catch (_) {}
            }
            if (result.admin_override === true || result.admin_action_type != null) {
              try {
                const cid = (result.data && result.data.data && result.data.data.id) || (result.data && result.data.id);
                const entry = { source: scraper.sourceName, campaign_id: cid, admin_action_type: result.admin_action_type ?? '', applied_action: result.applied_action ?? 'accepted', confidence_score: sent && sent.confidence_score != null ? sent.confidence_score : null, timestamp: new Date().toISOString(), admin_override: !!result.admin_override };
                if (!runSummary.adminFeedback.bySource[scraper.sourceName]) runSummary.adminFeedback.bySource[scraper.sourceName] = [];
                runSummary.adminFeedback.bySource[scraper.sourceName].push(entry);
                console.warn(runLog(runLogCtx, '🧠 ADMIN FEEDBACK'));
                console.warn(runLog(runLogCtx, `source=${scraper.sourceName}`));
                console.warn(runLog(runLogCtx, `campaign_id=${cid || 'n/a'}`));
                console.warn(runLog(runLogCtx, `admin_action_type=${result.admin_action_type ?? 'n/a'}`));
                console.warn(runLog(runLogCtx, `applied_action=${result.applied_action ?? 'accepted'}`));
                console.warn(runLog(runLogCtx, `confidence_score=${sent && sent.confidence_score != null ? sent.confidence_score : 'n/a'}`));
              } catch (_) {}
            }
          if (result.freeze_learning) runSummary.freezeLearning = true;
          } else {
            errorCount++;
            runSummary.sentBySource[scraper.sourceName].rejected += 1;
            console.error(`❌ ${scraper.sourceName}: ${result.campaign} - ${result.error}`);
          }
        }
	        for (let i = 0; i < results.length; i++) {
	          const result = results[i];
	          const sent = toSendLow[i];
          const cid = (result.data && result.data.data && result.data.data.id) || (result.data && result.data.id);
          const action = result.success ? (result.applied_action || 'accepted') : 'rejected';
          const reason = result.low_confidence ? 'low_confidence' : (result.success ? 'ok' : 'error');
          console.info(runLog(runLogCtx, `CAMPAIGN_DECISION source=${scraper.sourceName} campaign_id=${cid || 'n/a'} confidence_score=${sent && sent.confidence_score != null ? sent.confidence_score : 'n/a'} backend_action=${action} reason=${reason}`));
        }

        console.log(`✅ ${scraper.sourceName}: ${successCount} başarılı (${updateCount} güncelleme, ${successCount - updateCount} yeni)`);
        if (errorCount > 0) {
          console.log(`⚠️ ${scraper.sourceName}: ${errorCount} hata`);
        }

        console.info(runLog(runLogCtx, `SOURCE END status=success source=${scraper.sourceName}`));
        if (scrapers.indexOf(scraper) < scrapers.length - 1) {
          console.log(`⏳ ${SCRAPER_DELAY_MS}ms bekleniyor...`);
          await new Promise((resolve) => setTimeout(resolve, SCRAPER_DELAY_MS));
        }
        continue;
      }

	      const highQualityCampaigns = campaignsAfterGate;
	      console.log(`✅ ${scraper.sourceName}: ${highQualityCampaigns.length}/${gated.stats.rawTotal} kampanya kalite kapısından geçti (dropped_required=${gated.stats.droppedRequired}, rejected_quality=${gated.stats.rejectedByQuality})`);

      if (highQualityCampaigns.length === 0) {
        console.info(runLog(runLogCtx, `SOURCE END status=success source=${scraper.sourceName}`));
        console.log(`⚠️ ${scraper.sourceName}: Kaliteli kampanya bulunamadı (kalite başarısı)`);
        continue;
      }

	      const preBefore = highQualityCampaigns.length;
	      let toSend = botPreFilter(highQualityCampaigns);
	      const preDropped = Math.max(0, preBefore - toSend.length);
	      runSummary.bySource[scraper.sourceName].prefilter = { before: preBefore, after: toSend.length, dropped: preDropped };
      try {
        const runContext = {
          emptyResultSources: (runSummary.errors || []).filter((e) => e.failure_type === FAILURE_TYPES.EMPTY_RESULT).map((e) => e.sourceName),
          domChangedSources: (runSummary.errors || []).filter((e) => e.failure_type === FAILURE_TYPES.DOM_CHANGED).map((e) => e.sourceName),
        };
        toSend = enrichWithConfidence(toSend, runContext);
      } catch (_) {
        toSend = toSend.map((c) => ({ ...c, confidence_score: 50, confidence_reasons: ['fallback_default'] }));
      }
      if (!runSummary.bySource[scraper.sourceName]) {
        runSummary.bySource[scraper.sourceName] = { confidenceSum: 0, confidenceCount: 0, lowConfidenceCount: 0 };
      }
      toSend.forEach((c) => {
        const s = c.confidence_score != null ? c.confidence_score : 50;
        runSummary.confidenceSum += s;
        runSummary.confidenceCount += 1;
        runSummary.bySource[scraper.sourceName].confidenceSum += s;
        runSummary.bySource[scraper.sourceName].confidenceCount += 1;
        if (s < 40) {
          runSummary.lowConfidenceCount += 1;
          runSummary.bySource[scraper.sourceName].lowConfidenceCount += 1;
        }
        if (s > 70) runSummary.highConfidenceCount += 1;
      });
	      runSummary.campaigns.total_sent += toSend.length;
	      const results = await apiClient.createCampaigns(toSend);
	      runSummary.sentBySource[scraper.sourceName] = runSummary.sentBySource[scraper.sourceName] || { sent: 0, accepted: 0, rejected: 0 };
	      runSummary.sentBySource[scraper.sourceName].sent += toSend.length;

      if (scrapers.indexOf(scraper) === 0) {
        const deadLetterResults = await apiClient.retryDeadLetters();
        if (deadLetterResults.length > 0) {
          console.log(`🔄 Dead-letter retry: ${deadLetterResults.filter((r) => r.success).length}/${deadLetterResults.length} başarılı`);
        }
      }

      let successCount = 0;
      let updateCount = 0;
      let errorCount = 0;
	      for (let i = 0; i < results.length; i++) {
	        const result = results[i];
	        const sent = toSend[i];
      if (result.success) {
          successCount++;
          if (result.isUpdate) updateCount++;
          runSummary.campaigns.accepted += 1;
          runSummary.sentBySource[scraper.sourceName].accepted += 1;
          if (result.applied_action === 'downgrade') runSummary.campaigns.downgraded += 1;
          if (result.applied_action === 'hide') runSummary.campaigns.hidden += 1;
          if (result.low_confidence) runSummary.campaigns.low_confidence += 1;
          if (result.low_confidence || result.applied_action === 'downgrade' || result.applied_action === 'hide') {
            console.warn(`⚠️ [CAMPAIGN] accepted with low confidence, no retry`);
            try {
              if (!runSummary.feedback.bySource[scraper.sourceName]) runSummary.feedback.bySource[scraper.sourceName] = [];
              runSummary.feedback.bySource[scraper.sourceName].push({
                source: scraper.sourceName,
                campaign_id: (result.data && result.data.data && result.data.data.id) || (result.data && result.data.id),
                backend_action: result.applied_action || (result.low_confidence ? 'downgrade' : null),
                confidence_score: sent && sent.confidence_score != null ? sent.confidence_score : undefined,
                admin_override: result.admin_override,
                admin_action_type: result.admin_action_type,
              });
            } catch (_) {}
          }
          if (result.admin_override === true || result.admin_action_type != null) {
            try {
              const cid = (result.data && result.data.data && result.data.data.id) || (result.data && result.data.id);
              const entry = { source: scraper.sourceName, campaign_id: cid, admin_action_type: result.admin_action_type ?? '', applied_action: result.applied_action ?? 'accepted', confidence_score: sent && sent.confidence_score != null ? sent.confidence_score : null, timestamp: new Date().toISOString(), admin_override: !!result.admin_override };
              if (!runSummary.adminFeedback.bySource[scraper.sourceName]) runSummary.adminFeedback.bySource[scraper.sourceName] = [];
              runSummary.adminFeedback.bySource[scraper.sourceName].push(entry);
              console.warn(runLog(runLogCtx, '🧠 ADMIN FEEDBACK'));
              console.warn(runLog(runLogCtx, `source=${scraper.sourceName}`));
              console.warn(runLog(runLogCtx, `campaign_id=${cid || 'n/a'}`));
              console.warn(runLog(runLogCtx, `admin_action_type=${result.admin_action_type ?? 'n/a'}`));
              console.warn(runLog(runLogCtx, `applied_action=${result.applied_action ?? 'accepted'}`));
              console.warn(runLog(runLogCtx, `confidence_score=${sent && sent.confidence_score != null ? sent.confidence_score : 'n/a'}`));
            } catch (_) {}
          }
          if (result.freeze_learning) runSummary.freezeLearning = true;
        } else {
          errorCount++;
          runSummary.sentBySource[scraper.sourceName].rejected += 1;
          console.error(`❌ ${scraper.sourceName}: ${result.campaign} - ${result.error}`);
        }
      }
      for (let i = 0; i < results.length; i++) {
        const result = results[i];
        const sent = toSend[i];
        const cid = (result.data && result.data.data && result.data.data.id) || (result.data && result.data.id);
        const action = result.success ? (result.applied_action || 'accepted') : 'rejected';
        const reason = result.low_confidence ? 'low_confidence' : (result.success ? 'ok' : 'error');
        console.info(runLog(runLogCtx, `CAMPAIGN_DECISION source=${scraper.sourceName} campaign_id=${cid || 'n/a'} confidence_score=${sent && sent.confidence_score != null ? sent.confidence_score : 'n/a'} backend_action=${action} reason=${reason}`));
      }

      console.log(`✅ ${scraper.sourceName}: ${successCount} başarılı (${updateCount} güncelleme, ${successCount - updateCount} yeni)`);
      if (errorCount > 0) {
        console.log(`⚠️ ${scraper.sourceName}: ${errorCount} hata`);
      }

      console.info(runLog(runLogCtx, `SOURCE END status=success source=${scraper.sourceName}`));
      if (scrapers.indexOf(scraper) < scrapers.length - 1) {
        console.log(`⏳ ${SCRAPER_DELAY_MS}ms bekleniyor...`);
        await new Promise((resolve) => setTimeout(resolve, SCRAPER_DELAY_MS));
      }
    } catch (error) {
      const durationMs = Date.now() - t0;
      try {
        sourceHealth[scraper.sourceName] = (sourceHealth[scraper.sourceName] || 0) + 1;
      } catch (_) {}
      let failure_type = FAILURE_TYPES.UNEXPECTED_ERROR;
      try {
        failure_type = classifyError(error, {
          sourceName: scraper.sourceName,
          phase: 'dom',
          selectorUsed: error.selectorUsed,
        });
      } catch (_) {}
      try {
        if (!runSummary.bySource[scraper.sourceName]) runSummary.bySource[scraper.sourceName] = { confidenceSum: 0, confidenceCount: 0, lowConfidenceCount: 0 };
        if (!runSummary.bySource[scraper.sourceName].durations) runSummary.bySource[scraper.sourceName].durations = [];
        runSummary.bySource[scraper.sourceName].durations.push(durationMs);
      } catch (_) {}
      if (failure_type === FAILURE_TYPES.TIMEOUT && browserManager.recordTimeout) browserManager.recordTimeout();
      if (failure_type === FAILURE_TYPES.DOM_CHANGED) {
        runSummary.domUnstableSources.add(scraper.sourceName);
        console.warn(runLog(runLogCtx, `SOURCE DOM UNSTABLE source=${scraper.sourceName} (run-local)`));
      }
      const entry = {
        sourceName: scraper.sourceName,
        failure_type,
        phase: 'dom',
        durationMs,
      };
      runSummary.errors.push(entry);
      console.info(runLog(runLogCtx, `SOURCE SCRAPE_FAIL failure_type=${failure_type} durationMs=${durationMs} source=${scraper.sourceName}`));
      console.info(runLog(runLogCtx, `SOURCE END status=failed source=${scraper.sourceName}`));
      console.error(`❌ ${scraper.sourceName} scraper hatası (failure_type: ${failure_type}):`, error.message);
      console.log(`📊 [${scraper.sourceName}] failure duration=${durationMs}ms`);
      try {
        console.error(JSON.stringify({
          source: scraper.sourceName,
          scraper: scraper.constructor?.name || 'Unknown',
          failure_type,
          phase: 'dom',
          durationMs,
        }));
      } catch (_) {}
    }
  }

  try {
    await browserManager.close();
  } catch (_) {}

  const runDurationMs = Date.now() - runStartTime;
  const runM = Math.floor(runDurationMs / 60000);
  const runS = Math.floor((runDurationMs % 60000) / 1000);
  const failures_by_type = {};
  try {
    for (const e of runSummary.errors) {
      const t = (e && e.failure_type) || FAILURE_TYPES.UNEXPECTED_ERROR;
      failures_by_type[t] = (failures_by_type[t] || 0) + 1;
    }
  } catch (_) {
    failures_by_type[FAILURE_TYPES.UNEXPECTED_ERROR] = runSummary.errors.length;
  }
  console.log('\n📊 BOT RUN SUMMARY');
  console.log('------------------');
  try {
    const reportRows = [];
    const byName = runSummary.bySource || {};
    const sent = runSummary.sentBySource || {};
    const names = Array.from(new Set([...(runSummary.scraped || []), ...Object.keys(byName), ...Object.keys(sent)])).sort((a, b) => a.localeCompare(b));
    for (const name of names) {
      const gate = (byName[name] && byName[name].gate) || null;
      const pre = (byName[name] && byName[name].prefilter) || null;
      const s = sent[name] || { sent: 0, accepted: 0, rejected: 0 };
      reportRows.push({
        source: name,
        scraped_raw: gate ? gate.rawTotal : null,
        accepted_gate: gate ? gate.acceptedTotal : null,
        dropped_required: gate ? gate.droppedRequired : null,
        rejected_quality: gate ? gate.rejectedByQuality : null,
        reject_ratio: gate ? gate.rejectRatio : null,
        degraded: gate ? gate.degraded : null,
        prefilter_dropped: pre ? pre.dropped : null,
        sent: s.sent,
        backend_ok: s.accepted,
        backend_rejected: s.rejected,
      });
    }
    console.log('\n📋 SOURCE RUN REPORT');
    console.table(reportRows);
    for (const name of names) {
      const gate = (byName[name] && byName[name].gate) || null;
      const reasons = gate && gate.qualityRejectReasons ? gate.qualityRejectReasons : null;
      if (!reasons || Object.keys(reasons).length === 0) continue;
      console.log(`QUALITY_REJECT_REASONS source=${name} ` + JSON.stringify(reasons));
    }
  } catch (e) {
    console.warn('run report generation failed (log only):', e && e.message);
  }
  console.log(`Total sources: ${runSummary.total}`);
  console.log(`Scraped: ${runSummary.scraped.length}`);
  console.log(`Skipped (hard_backlog): ${runSummary.skippedHardBacklog.length}`);
  console.log(`Backlog (warn): ${runSummary.backlogWarn.length}`);
  console.log(`Errors: ${runSummary.errors.length}`);
  console.log(`Duration: ${runM}m ${runS}s`);
  console.log('failures_by_type:', JSON.stringify(failures_by_type));
  console.log('sources_temporarily_disabled:', JSON.stringify(runSummary.sources_temporarily_disabled || []));
  const avgConf = (runSummary.confidenceCount && runSummary.confidenceSum != null)
    ? Math.round(runSummary.confidenceSum / runSummary.confidenceCount) : 0;
  console.log('avg_confidence_score:', avgConf);
  console.log('low_confidence_campaigns_count:', runSummary.lowConfidenceCount || 0);
  console.log('high_confidence_campaigns_count:', runSummary.highConfidenceCount || 0);
  let stsList = [];
  try {
    stsList = computeAllFromRunSummary(runSummary, FAILURE_TYPES);
    console.log('source_trust_scores:', JSON.stringify(stsList));
  } catch (_) {}
  if (runSummary.feedback && runSummary.feedback.bySource && Object.keys(runSummary.feedback.bySource).length > 0) {
    console.log('confidence_feedback:', JSON.stringify(runSummary.feedback));
  }
  const run_summary_v2 = {
    run_id: runLogCtx.run_id,
    duration_ms: runDurationMs,
    sources: {
      total: runSummary.total,
      scraped: runSummary.scraped.length,
      skipped_hard_backlog: runSummary.skippedHardBacklog.length,
      backlog_warn: runSummary.backlogWarn.length,
      temporarily_disabled: (runSummary.sources_temporarily_disabled || []).length,
    },
    campaigns: runSummary.campaigns || { total_sent: 0, accepted: 0, downgraded: 0, hidden: 0, low_confidence: 0 },
    failures_by_type,
    avg_confidence_score: avgConf,
    source_trust_scores_count: stsList.length,
  };
  const allAdmin = (runSummary.adminFeedback && runSummary.adminFeedback.bySource) ? Object.values(runSummary.adminFeedback.bySource).flat() : [];
  if (allAdmin.length > 0) {
    run_summary_v2.admin_feedback = {
      total: allAdmin.length,
      by_action: {
        hide: allAdmin.filter((e) => e.applied_action === 'hide').length,
        downgrade: allAdmin.filter((e) => e.applied_action === 'downgrade').length,
        override_accept: allAdmin.filter((e) => e.admin_override === true).length,
      },
    };
  }
  console.info(runLog(runLogCtx, 'run_summary_v2 ' + JSON.stringify(run_summary_v2)));

  try {
    const stats = browserManager.getStats();
    const run_summary_v3 = {
      run_id: runLogCtx.run_id,
      duration_ms: runDurationMs,
      browser_restarts: stats.browser_restarts || 0,
      pages_opened: stats.pages_opened || 0,
      avg_page_duration_ms: (stats.pages_opened > 0 && runDurationMs) ? Math.round(runDurationMs / stats.pages_opened) : 0,
      concurrency_peak: stats.concurrency_peak || 0,
      estimated_cost_units: stats.estimated_cost_units || 0,
    };
    console.info(runLog(runLogCtx, 'run_summary_v3 ' + JSON.stringify(run_summary_v3)));
  } catch (_) {}

  const bySourceNames = Object.keys(runSummary.bySource || {});
  for (const name of bySourceNames) {
    const src = runSummary.bySource[name];
    const durations = (src && src.durations) || [];
    if (durations.length === 0) continue;
    const avg_duration_ms = Math.round(durations.reduce((a, b) => a + b, 0) / durations.length);
    const timeouts = (runSummary.errors || []).filter((e) => e.sourceName === name && e.failure_type === FAILURE_TYPES.TIMEOUT).length;
    const suggested_delay_ms = Math.round(Math.min(5000, Math.max(500, avg_duration_ms * 0.3)));
    console.warn(runLog(runLogCtx, '⚠️ RATE LIMIT SUGGESTION'));
    console.warn(runLog(runLogCtx, `source=${name}`));
    console.warn(runLog(runLogCtx, `avg_duration_ms=${avg_duration_ms}`));
    console.warn(runLog(runLogCtx, `timeouts=${timeouts}`));
    console.warn(runLog(runLogCtx, `suggested_delay_ms=${suggested_delay_ms}`));
  }
  // FAZ 17.3: Delay uygulanmaz, sadece log. Yukarıdaki suggestion operasyonel gözlem içindir.

  try {
    const adminSuggestions = generateAdminSuggestions({
      sourceTrustScores: stsList,
      confidenceFeedback: runSummary.feedback,
      adminFeedback: runSummary.adminFeedback,
      runContext: runLogCtx,
    });
    if (adminSuggestions && adminSuggestions.length > 0) {
      console.warn('🧠 ADMIN SUGGESTIONS GENERATED\n' + JSON.stringify(adminSuggestions, null, 2));
    } else {
      console.info('🧠 NO ADMIN SUGGESTIONS GENERATED');
    }
  } catch (_) {
    console.info('🧠 NO ADMIN SUGGESTIONS GENERATED');
  }

  // FAZ 14.3–14.6: learning block (log only; never block scraping)
  if (runSummary.freezeLearning) {
    console.log('learning frozen by admin');
  } else if (isLearningDisabled()) {
    console.log('learning disabled (run-local)');
  } else {
    try {
      pushRunSts(stsList);
      recordLearningSuccess();
      const suggestions = getSuggestions();
      for (const s of suggestions) {
        // FAZ 14.3: mandatory log format
        console.warn('⚠️ SOURCE STATUS SUGGESTION');
        console.warn(`source=${s.source_name}`);
        console.warn(`suggested_status=${s.suggested_status}`);
        // FAZ 14.4: explainable payload (log only)
        const payload = {
          source_name: s.source_name,
          suggested_status: s.suggested_status,
          average_trust_score: s.average_trust_score,
          runs: s.runs,
          signals: {
            avg_confidence: (s.signals && s.signals.avg_confidence) != null ? s.signals.avg_confidence : null,
            low_confidence_ratio: (s.signals && s.signals.low_confidence_ratio) != null ? s.signals.low_confidence_ratio : null,
            dom_changed: (s.signals && s.signals.dom_changed) != null ? s.signals.dom_changed : null,
            network_blocked: (s.signals && s.signals.network_blocked) != null ? s.signals.network_blocked : null,
            empty_result: (s.signals && s.signals.empty_result) != null ? s.signals.empty_result : null,
            empty_result_count: (s.signals && s.signals.empty_result_count) != null ? s.signals.empty_result_count : null,
          },
        };
        console.log(JSON.stringify(payload));
      }
    } catch (err) {
      recordLearningException();
      console.warn('learning suggestion failure (log only):', err && err.message);
    }
  }
  console.log('------------------\n');
}

/**
 * FAZ 7: Fetch-based scraper'ları çalıştırır (SPA kaynaklar için)
 * Admin authority: source_status (hard_backlog -> skip) aynı kurallar geçerli.
 */
async function runFetchScrapers() {
  const apiClient = new ApiClient();

  let sourceStatusMap = {};
  try {
    sourceStatusMap = await apiClient.getSourceStatusList();
  } catch (_) {
    sourceStatusMap = {};
  }

  // FAZ 7.1: Fetch-based scraper'lar (SPA/Dinamik yapı kaynakları)
  const fetchScrapers = [
    new TebFetchScraper(), // FAZ 7.1: TEB fetch scraper (XML endpoint)
  ];

  if (fetchScrapers.length === 0) {
    console.log('\n📡 FAZ 7: Fetch scraper bulunmuyor (network analizi gerekli)\n');
    return;
  }

  console.log(`\n🔗 FAZ 7: ${fetchScrapers.length} fetch scraper çalıştırılacak\n`);

  const runStartTime = Date.now();
  const runLogCtx = {
    run_id: newRunId(),
    started_at: new Date().toISOString(),
    mode: 'fetch',
    environment: process.env.NODE_ENV || 'unknown',
  };
  console.info(runLog(runLogCtx, `run_id=${runLogCtx.run_id} started_at=${runLogCtx.started_at} mode=${runLogCtx.mode} environment=${runLogCtx.environment}`));
  console.info(runLog(runLogCtx, 'ADMIN GOVERNANCE ACTIVE: suggestions enabled, execution requires admin')); // FAZ 21.5

	  const runSummary = {
	    total: fetchScrapers.length,
	    skippedHardBacklog: [],
	    scraped: [],
	    backlogWarn: [],
	    errors: [],
	    sources_temporarily_disabled: [],
	    confidenceSum: 0,
	    confidenceCount: 0,
	    lowConfidenceCount: 0,
	    highConfidenceCount: 0,
	    bySource: {},
	    feedback: { bySource: {} },
	    freezeLearning: false, // FAZ 14.5
	    campaigns: { total_sent: 0, accepted: 0, downgraded: 0, hidden: 0, low_confidence: 0 }, // FAZ 15.4
	    adminFeedback: { bySource: {} }, // FAZ 16.2: admin action signals (run-local, log-only)
	  };
	  runSummary.sentBySource = {};
	  const sourceHealth = {};

  for (const scraper of fetchScrapers) {
    const t0 = Date.now();
    console.info(runLog(runLogCtx, `SOURCE START source=${scraper.sourceName}`));
    try {
      const status = (sourceStatusMap[scraper.sourceName] || 'active').toLowerCase();
      if (status === 'hard_backlog') {
        console.info(runLog(runLogCtx, `SOURCE SKIP reason=hard_backlog source=${scraper.sourceName}`));
        console.info(runLog(runLogCtx, `SOURCE END status=skipped source=${scraper.sourceName}`));
        console.log(`⏭️ [FAZ7] ${scraper.sourceName} skipped (hard_backlog)`);
        runSummary.skippedHardBacklog.push(scraper.sourceName);
        continue;
      }
      try {
        if ((sourceHealth[scraper.sourceName] || 0) >= 2) {
          console.info(runLog(runLogCtx, `SOURCE SKIP reason=temporarily_disabled source=${scraper.sourceName}`));
          console.info(runLog(runLogCtx, `SOURCE END status=skipped source=${scraper.sourceName}`));
          console.log(`⛔ [FAZ7] ${scraper.sourceName} temporarily disabled (run-local)`);
          runSummary.sources_temporarily_disabled.push(scraper.sourceName);
          continue;
        }
      } catch (_) {}

      if (status === 'backlog') {
        console.warn(`⚠️ [FAZ7] ${scraper.sourceName} status=backlog (scraping allowed for now)`);
      }

      console.info(runLog(runLogCtx, `SOURCE SCRAPE_START source=${scraper.sourceName}`));
      console.log(`\n📡 [FAZ7] ${scraper.sourceName} fetch scraper çalışıyor...`);

      const campaigns = await scraper.runWithRetry(3);
      const durationMs = Date.now() - t0;

      if (campaigns.length === 0) {
        try {
          console.info(runLog(runLogCtx, `SOURCE SCRAPE_FAIL failure_type=EMPTY_RESULT durationMs=${durationMs} source=${scraper.sourceName}`));
          console.info(runLog(runLogCtx, `SOURCE END status=failed source=${scraper.sourceName}`));
          runSummary.errors.push({
            sourceName: scraper.sourceName,
            failure_type: FAILURE_TYPES.EMPTY_RESULT,
            phase: 'network',
            durationMs,
          });
          console.warn(`⚠️ [FAZ7] ${scraper.sourceName}: EMPTY_RESULT – no campaigns (failure_type: EMPTY_RESULT)`);
          console.error(JSON.stringify({
            source: scraper.sourceName,
            scraper: scraper.constructor?.name || 'Unknown',
            failure_type: FAILURE_TYPES.EMPTY_RESULT,
            phase: 'network',
            durationMs,
          }));
        } catch (_) {
          runSummary.errors.push({ sourceName: scraper.sourceName, failure_type: FAILURE_TYPES.UNEXPECTED_ERROR });
          console.info(runLog(runLogCtx, `SOURCE SCRAPE_FAIL failure_type=EMPTY_RESULT durationMs=${durationMs} source=${scraper.sourceName}`));
          console.info(runLog(runLogCtx, `SOURCE END status=failed source=${scraper.sourceName}`));
        }
        continue;
      }

      runSummary.scraped.push(scraper.sourceName);
      if (status === 'backlog') runSummary.backlogWarn.push(scraper.sourceName);
      console.info(runLog(runLogCtx, `SOURCE SCRAPE_SUCCESS campaigns=${campaigns.length} durationMs=${durationMs} source=${scraper.sourceName}`));
      console.log(`📊 [FAZ7] [${scraper.sourceName}] success=${campaigns.length} duration=${durationMs}ms`);

      const gated = applyIngestionGate(campaigns, scraper.sourceName);
      if (!runSummary.bySource[scraper.sourceName]) {
        runSummary.bySource[scraper.sourceName] = { confidenceSum: 0, confidenceCount: 0, lowConfidenceCount: 0 };
      }
      runSummary.bySource[scraper.sourceName].gate = gated.stats;

      if (gated.stats.degraded) {
        console.warn(runLog(runLogCtx, `SOURCE_DEGRADED source=${scraper.sourceName} raw=${gated.stats.rawTotal} accepted=${gated.stats.acceptedTotal} reject_ratio=${gated.stats.rejectRatio}`));
        runSummary.errors.push({
          sourceName: scraper.sourceName,
          failure_type: 'SOURCE_DEGRADED',
          phase: 'gate',
          durationMs,
          stats: gated.stats,
        });
        console.info(runLog(runLogCtx, `SOURCE END status=failed source=${scraper.sourceName}`));
        continue;
      }

      const campaignsAfterGate = gated.items;
      if (campaignsAfterGate.length === 0) {
        console.warn(runLog(runLogCtx, `SOURCE_EMPTY_AFTER_GATE source=${scraper.sourceName} raw=${gated.stats.rawTotal} normalized=${gated.stats.normalizedTotal}`));
        runSummary.errors.push({
          sourceName: scraper.sourceName,
          failure_type: FAILURE_TYPES.EMPTY_RESULT,
          phase: 'gate',
          durationMs,
          stats: gated.stats,
        });
        console.info(runLog(runLogCtx, `SOURCE END status=failed source=${scraper.sourceName}`));
        continue;
      }

      // FAZ 7.3: Light Campaign Mode
      // TEB için özel mantık: Tüm kampanyalar light olarak işaretlenir
      // Çünkü TEB kampanyaları kalite filtresinden geçemiyor (değer bilgisi yok)
      // Ana feed'e sokulmamalı, sadece light feed'de gösterilmeli
      let allCampaigns = [];
      
      if (scraper.sourceName === 'TEB') {
        // TEB: TÜM kampanyaları light olarak işaretle (kalite filtresine sokmadan)
        allCampaigns = campaignsAfterGate.map((campaign) => ({
          ...campaign,
          campaignType: 'light',
          showInLightFeed: true,
        }));
        console.log(`📊 [FAZ7] ${scraper.sourceName}: ${allCampaigns.length} kampanya light olarak işaretleniyor (TEB özel modu)`);
      } else {
        // Strict mode: only send campaigns that passed the ingestion gate.
        allCampaigns = campaignsAfterGate.map((campaign) => ({
          ...campaign,
          campaignType: 'main',
          showInLightFeed: false,
        }));
        console.log(`✅ [FAZ7] ${scraper.sourceName}: ${allCampaigns.length}/${gated.stats.rawTotal} kampanya kalite kapısından geçti (dropped_required=${gated.stats.droppedRequired}, rejected_quality=${gated.stats.rejectedByQuality})`);
      }

      if (allCampaigns.length === 0) {
        console.info(runLog(runLogCtx, `SOURCE END status=success source=${scraper.sourceName}`));
        console.log(`⚠️ [FAZ7] ${scraper.sourceName}: Kampanya bulunamadı`);
        continue;
      }

      const preBefore = allCampaigns.length;
      let toSend = botPreFilter(allCampaigns);
      const preDropped = Math.max(0, preBefore - toSend.length);
      runSummary.bySource[scraper.sourceName].prefilter = { before: preBefore, after: toSend.length, dropped: preDropped };
      try {
        const runContext = {
          emptyResultSources: (runSummary.errors || []).filter((e) => e.failure_type === FAILURE_TYPES.EMPTY_RESULT).map((e) => e.sourceName),
          domChangedSources: (runSummary.errors || []).filter((e) => e.failure_type === FAILURE_TYPES.DOM_CHANGED).map((e) => e.sourceName),
        };
        toSend = enrichWithConfidence(toSend, runContext);
      } catch (_) {
        toSend = toSend.map((c) => ({ ...c, confidence_score: 50, confidence_reasons: ['fallback_default'] }));
      }
      if (!runSummary.bySource[scraper.sourceName]) {
        runSummary.bySource[scraper.sourceName] = { confidenceSum: 0, confidenceCount: 0, lowConfidenceCount: 0 };
      }
      toSend.forEach((c) => {
        const s = c.confidence_score != null ? c.confidence_score : 50;
        runSummary.confidenceSum += s;
        runSummary.confidenceCount += 1;
        runSummary.bySource[scraper.sourceName].confidenceSum += s;
        runSummary.bySource[scraper.sourceName].confidenceCount += 1;
        if (s < 40) {
          runSummary.lowConfidenceCount += 1;
          runSummary.bySource[scraper.sourceName].lowConfidenceCount += 1;
        }
        if (s > 70) runSummary.highConfidenceCount += 1;
      });
      runSummary.campaigns.total_sent += toSend.length;
      const results = await apiClient.createCampaigns(toSend);
      runSummary.sentBySource[scraper.sourceName] = runSummary.sentBySource[scraper.sourceName] || { sent: 0, accepted: 0, rejected: 0 };
      runSummary.sentBySource[scraper.sourceName].sent += toSend.length;

      let successCount = 0;
      let updateCount = 0;
      let errorCount = 0;
      for (let i = 0; i < results.length; i++) {
        const result = results[i];
        const sent = toSend[i];
        if (result.success) {
          successCount++;
          if (result.isUpdate) updateCount++;
          runSummary.campaigns.accepted += 1;
          runSummary.sentBySource[scraper.sourceName].accepted += 1;
          if (result.applied_action === 'downgrade') runSummary.campaigns.downgraded += 1;
          if (result.applied_action === 'hide') runSummary.campaigns.hidden += 1;
          if (result.low_confidence) runSummary.campaigns.low_confidence += 1;
          if (result.low_confidence || result.applied_action === 'downgrade' || result.applied_action === 'hide') {
            console.warn(`⚠️ [CAMPAIGN] accepted with low confidence, no retry`);
            try {
              if (!runSummary.feedback.bySource[scraper.sourceName]) runSummary.feedback.bySource[scraper.sourceName] = [];
              runSummary.feedback.bySource[scraper.sourceName].push({
                source: scraper.sourceName,
                campaign_id: (result.data && result.data.data && result.data.data.id) || (result.data && result.data.id),
                backend_action: result.applied_action || (result.low_confidence ? 'downgrade' : null),
                confidence_score: sent && sent.confidence_score != null ? sent.confidence_score : undefined,
                admin_override: result.admin_override,
                admin_action_type: result.admin_action_type,
              });
            } catch (_) {}
          }
          if (result.admin_override === true || result.admin_action_type != null) {
            try {
              const cid = (result.data && result.data.data && result.data.data.id) || (result.data && result.data.id);
              const entry = { source: scraper.sourceName, campaign_id: cid, admin_action_type: result.admin_action_type ?? '', applied_action: result.applied_action ?? 'accepted', confidence_score: sent && sent.confidence_score != null ? sent.confidence_score : null, timestamp: new Date().toISOString(), admin_override: !!result.admin_override };
              if (!runSummary.adminFeedback.bySource[scraper.sourceName]) runSummary.adminFeedback.bySource[scraper.sourceName] = [];
              runSummary.adminFeedback.bySource[scraper.sourceName].push(entry);
              console.warn(runLog(runLogCtx, '🧠 ADMIN FEEDBACK'));
              console.warn(runLog(runLogCtx, `source=${scraper.sourceName}`));
              console.warn(runLog(runLogCtx, `campaign_id=${cid || 'n/a'}`));
              console.warn(runLog(runLogCtx, `admin_action_type=${result.admin_action_type ?? 'n/a'}`));
              console.warn(runLog(runLogCtx, `applied_action=${result.applied_action ?? 'accepted'}`));
              console.warn(runLog(runLogCtx, `confidence_score=${sent && sent.confidence_score != null ? sent.confidence_score : 'n/a'}`));
            } catch (_) {}
          }
          if (result.freeze_learning) runSummary.freezeLearning = true;
        } else {
          errorCount++;
          runSummary.sentBySource[scraper.sourceName].rejected += 1;
          console.error(`❌ [FAZ7] ${scraper.sourceName}: ${result.campaign} - ${result.error}`);
        }
      }
      for (let i = 0; i < results.length; i++) {
        const result = results[i];
        const sent = toSend[i];
        const cid = (result.data && result.data.data && result.data.data.id) || (result.data && result.data.id);
        const action = result.success ? (result.applied_action || 'accepted') : 'rejected';
        const reason = result.low_confidence ? 'low_confidence' : (result.success ? 'ok' : 'error');
        console.info(runLog(runLogCtx, `CAMPAIGN_DECISION source=${scraper.sourceName} campaign_id=${cid || 'n/a'} confidence_score=${sent && sent.confidence_score != null ? sent.confidence_score : 'n/a'} backend_action=${action} reason=${reason}`));
      }

      console.log(`✅ [FAZ7] ${scraper.sourceName}: ${successCount} başarılı (${updateCount} güncelleme, ${successCount - updateCount} yeni)`);
      if (errorCount > 0) {
        console.log(`⚠️ [FAZ7] ${scraper.sourceName}: ${errorCount} hata`);
      }

      console.info(runLog(runLogCtx, `SOURCE END status=success source=${scraper.sourceName}`));
      if (fetchScrapers.indexOf(scraper) < fetchScrapers.length - 1) {
        console.log(`⏳ ${SCRAPER_DELAY_MS}ms bekleniyor...`);
        await new Promise((resolve) => setTimeout(resolve, SCRAPER_DELAY_MS));
      }
    } catch (error) {
      const durationMs = Date.now() - t0;
      try {
        sourceHealth[scraper.sourceName] = (sourceHealth[scraper.sourceName] || 0) + 1;
      } catch (_) {}
      let failure_type = FAILURE_TYPES.UNEXPECTED_ERROR;
      try {
        failure_type = classifyError(error, {
          sourceName: scraper.sourceName,
          phase: 'network',
          selectorUsed: error.selectorUsed,
        });
      } catch (_) {}
      const entry = {
        sourceName: scraper.sourceName,
        failure_type,
        phase: 'network',
        durationMs,
      };
      runSummary.errors.push(entry);
      console.info(runLog(runLogCtx, `SOURCE SCRAPE_FAIL failure_type=${failure_type} durationMs=${durationMs} source=${scraper.sourceName}`));
      console.info(runLog(runLogCtx, `SOURCE END status=failed source=${scraper.sourceName}`));
      console.error(`❌ [FAZ7] ${scraper.sourceName} fetch scraper hatası (failure_type: ${failure_type}):`, error.message);
      console.log(`📊 [FAZ7] [${scraper.sourceName}] failure duration=${durationMs}ms`);
      try {
        console.error(JSON.stringify({
          source: scraper.sourceName,
          scraper: scraper.constructor?.name || 'Unknown',
          failure_type,
          phase: 'network',
          durationMs,
        }));
      } catch (_) {}
    }
  }

  const runDurationMs = Date.now() - runStartTime;
  const runM = Math.floor(runDurationMs / 60000);
  const runS = Math.floor((runDurationMs % 60000) / 1000);
  const failures_by_type = {};
  try {
    for (const e of runSummary.errors) {
      const t = (e && e.failure_type) || FAILURE_TYPES.UNEXPECTED_ERROR;
      failures_by_type[t] = (failures_by_type[t] || 0) + 1;
    }
  } catch (_) {
    failures_by_type[FAILURE_TYPES.UNEXPECTED_ERROR] = runSummary.errors.length;
  }
  console.log('\n📊 BOT RUN SUMMARY');
  console.log('------------------');
  try {
    const reportRows = [];
    const byName = runSummary.bySource || {};
    const sent = runSummary.sentBySource || {};
    const names = Array.from(new Set([...(runSummary.scraped || []), ...Object.keys(byName), ...Object.keys(sent)])).sort((a, b) => a.localeCompare(b));
    for (const name of names) {
      const gate = (byName[name] && byName[name].gate) || null;
      const pre = (byName[name] && byName[name].prefilter) || null;
      const s = sent[name] || { sent: 0, accepted: 0, rejected: 0 };
      reportRows.push({
        source: name,
        scraped_raw: gate ? gate.rawTotal : null,
        accepted_gate: gate ? gate.acceptedTotal : null,
        dropped_required: gate ? gate.droppedRequired : null,
        rejected_quality: gate ? gate.rejectedByQuality : null,
        reject_ratio: gate ? gate.rejectRatio : null,
        degraded: gate ? gate.degraded : null,
        prefilter_dropped: pre ? pre.dropped : null,
        sent: s.sent,
        backend_ok: s.accepted,
        backend_rejected: s.rejected,
      });
    }
    console.log('\n📋 SOURCE RUN REPORT');
    console.table(reportRows);
    for (const name of names) {
      const gate = (byName[name] && byName[name].gate) || null;
      const reasons = gate && gate.qualityRejectReasons ? gate.qualityRejectReasons : null;
      if (!reasons || Object.keys(reasons).length === 0) continue;
      console.log(`QUALITY_REJECT_REASONS source=${name} ` + JSON.stringify(reasons));
    }
  } catch (e) {
    console.warn('run report generation failed (log only):', e && e.message);
  }
  console.log(`Total sources: ${runSummary.total}`);
  console.log(`Scraped: ${runSummary.scraped.length}`);
  console.log(`Skipped (hard_backlog): ${runSummary.skippedHardBacklog.length}`);
  console.log(`Backlog (warn): ${runSummary.backlogWarn.length}`);
  console.log(`Errors: ${runSummary.errors.length}`);
  console.log(`Duration: ${runM}m ${runS}s`);
  console.log('failures_by_type:', JSON.stringify(failures_by_type));
  console.log('sources_temporarily_disabled:', JSON.stringify(runSummary.sources_temporarily_disabled || []));
  const avgConfFetch = (runSummary.confidenceCount && runSummary.confidenceSum != null)
    ? Math.round(runSummary.confidenceSum / runSummary.confidenceCount) : 0;
  console.log('avg_confidence_score:', avgConfFetch);
  console.log('low_confidence_campaigns_count:', runSummary.lowConfidenceCount || 0);
  console.log('high_confidence_campaigns_count:', runSummary.highConfidenceCount || 0);
  let stsListFetch = [];
  try {
    stsListFetch = computeAllFromRunSummary(runSummary, FAILURE_TYPES);
    console.log('source_trust_scores:', JSON.stringify(stsListFetch));
  } catch (_) {}
  if (runSummary.feedback && runSummary.feedback.bySource && Object.keys(runSummary.feedback.bySource).length > 0) {
    console.log('confidence_feedback:', JSON.stringify(runSummary.feedback));
  }
  const run_summary_v2_fetch = {
    run_id: runLogCtx.run_id,
    duration_ms: runDurationMs,
    sources: {
      total: runSummary.total,
      scraped: runSummary.scraped.length,
      skipped_hard_backlog: runSummary.skippedHardBacklog.length,
      backlog_warn: runSummary.backlogWarn.length,
      temporarily_disabled: (runSummary.sources_temporarily_disabled || []).length,
    },
    campaigns: runSummary.campaigns || { total_sent: 0, accepted: 0, downgraded: 0, hidden: 0, low_confidence: 0 },
    failures_by_type,
    avg_confidence_score: avgConfFetch,
    source_trust_scores_count: stsListFetch.length,
  };
  const allAdminFetch = (runSummary.adminFeedback && runSummary.adminFeedback.bySource) ? Object.values(runSummary.adminFeedback.bySource).flat() : [];
  if (allAdminFetch.length > 0) {
    run_summary_v2_fetch.admin_feedback = {
      total: allAdminFetch.length,
      by_action: {
        hide: allAdminFetch.filter((e) => e.applied_action === 'hide').length,
        downgrade: allAdminFetch.filter((e) => e.applied_action === 'downgrade').length,
        override_accept: allAdminFetch.filter((e) => e.admin_override === true).length,
      },
    };
  }
  console.info(runLog(runLogCtx, 'run_summary_v2 ' + JSON.stringify(run_summary_v2_fetch)));

  try {
    const adminSuggestionsFetch = generateAdminSuggestions({
      sourceTrustScores: stsListFetch,
      confidenceFeedback: runSummary.feedback,
      adminFeedback: runSummary.adminFeedback,
      runContext: runLogCtx,
    });
    if (adminSuggestionsFetch && adminSuggestionsFetch.length > 0) {
      console.warn('🧠 ADMIN SUGGESTIONS GENERATED\n' + JSON.stringify(adminSuggestionsFetch, null, 2));
    } else {
      console.info('🧠 NO ADMIN SUGGESTIONS GENERATED');
    }
  } catch (_) {
    console.info('🧠 NO ADMIN SUGGESTIONS GENERATED');
  }

  // FAZ 14.3–14.6: learning block (log only; never block scraping)
  if (runSummary.freezeLearning) {
    console.log('learning frozen by admin');
  } else if (isLearningDisabled()) {
    console.log('learning disabled (run-local)');
  } else {
    try {
      pushRunSts(stsListFetch);
      recordLearningSuccess();
      const suggestions = getSuggestions();
      for (const s of suggestions) {
        // FAZ 14.3: mandatory log format
        console.warn('⚠️ SOURCE STATUS SUGGESTION');
        console.warn(`source=${s.source_name}`);
        console.warn(`suggested_status=${s.suggested_status}`);
        // FAZ 14.4: explainable payload (log only)
        const payload = {
          source_name: s.source_name,
          suggested_status: s.suggested_status,
          average_trust_score: s.average_trust_score,
          runs: s.runs,
          signals: {
            avg_confidence: (s.signals && s.signals.avg_confidence) != null ? s.signals.avg_confidence : null,
            low_confidence_ratio: (s.signals && s.signals.low_confidence_ratio) != null ? s.signals.low_confidence_ratio : null,
            dom_changed: (s.signals && s.signals.dom_changed) != null ? s.signals.dom_changed : null,
            network_blocked: (s.signals && s.signals.network_blocked) != null ? s.signals.network_blocked : null,
            empty_result: (s.signals && s.signals.empty_result) != null ? s.signals.empty_result : null,
            empty_result_count: (s.signals && s.signals.empty_result_count) != null ? s.signals.empty_result_count : null,
          },
        };
        console.log(JSON.stringify(payload));
      }
    } catch (err) {
      recordLearningException();
      console.warn('learning suggestion failure (log only):', err && err.message);
    }
  }
  console.log('------------------\n');
}

/**
 * Ana fonksiyon
 */
async function main() {
  const mode = process.argv[2] || 'scheduler';
  const lockPath = process.env.BOT_LOCK_PATH || '/tmp/1ndirim-bot.lock';
  const ttlMs = Math.max(60_000, parseInt(process.env.BOT_LOCK_TTL_MS || String(2 * 60 * 60 * 1000), 10) || (2 * 60 * 60 * 1000));

  if (mode === 'once') {
    // Tek seferlik çalıştırma
    console.log('🚀 Bot tek seferlik çalıştırılıyor...');
    const locked = await withFsRunLock(async () => {
      await runScrapers();
      await runFetchScrapers();
    }, { lockPath, ttlMs, log: console });
    if (locked && locked.skipped) {
      console.warn(`⏭️ run skipped due to existing lock lock_path=${lockPath}`);
    }
    process.exit(0);
  } else if (mode === 'faz7') {
    // Sadece FAZ 7 fetch scraper'ları çalıştır (test için)
    console.log('🔗 FAZ 7 fetch scraper\'lar çalıştırılıyor...');
    const locked = await withFsRunLock(async () => {
      await runFetchScrapers();
    }, { lockPath, ttlMs, log: console });
    if (locked && locked.skipped) {
      console.warn(`⏭️ run skipped due to existing lock lock_path=${lockPath}`);
    }
    process.exit(0);
  } else {
    // Scheduler modu
    startScheduler(SCHEDULER_INTERVAL_MINUTES, async () => {
      await runScrapers();
      // FAZ 7: Fetch scraper'ları da çalıştır (izole)
      await runFetchScrapers();
    });
  }
}

// Uygulamayı başlat
if (require.main === module) {
  main().catch((error) => {
    console.error('❌ Bot başlatma hatası:', error);
    process.exit(1);
  });
}

module.exports = {
  runScrapers,
  runFetchScrapers,
};
