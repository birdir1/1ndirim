/**
 * 1ndirim Bot - Ana Giriş Noktası
 * Otomatik kampanya okuyucu bot
 */

require('dotenv').config();
const { filterHighQualityCampaigns } = require('../src/utils/campaignQualityFilter');
const ApiClient = require('./services/apiClient');
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
// FAZ 7: Fetch-based scrapers (SPA kaynaklar için)
const TebFetchScraper = require('./scrapers/fetch/teb-fetch-scraper');
const { startScheduler } = require('./scheduler');

const SCRAPER_DELAY_MS = parseInt(process.env.SCRAPER_DELAY_MS || '3000', 10);
const SCHEDULER_INTERVAL_MINUTES = parseInt(process.env.SCHEDULER_INTERVAL_MINUTES || '30', 10);

/**
 * Tüm scraper'ları çalıştırır
 */
async function runScrapers() {
  const apiClient = new ApiClient();
  // FAZ 6: Tüm mevcut scraper'lar aktif
  // FAZ 6.2: Ziraat Bankası eklendi
  // FAZ 6.3: Halkbank eklendi (pasif - backlog), VakıfBank eklendi
  const scrapers = [
    new AkbankScraper(),
    new TurkcellScraper(),
    new GarantiScraper(),
    new YapikrediScraper(),
    new IsbankScraper(),
    new VodafoneScraper(),
    new TurktelekomScraper(),
    new ZiraatScraper(),
    // new HalkbankScraper(), // FAZ 6.3: Pasif - zor kaynak, backlog'a alındı
    // new VakifbankScraper(), // FAZ 6.3: Pasif - zor kaynak, backlog'a alındı
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
  ];

  console.log(`\n🤖 Bot başlatıldı: ${scrapers.length} scraper çalıştırılacak\n`);

  for (const scraper of scrapers) {
    try {
      console.log(`\n📡 ${scraper.sourceName} scraper çalışıyor...`);

      // Scraper'ı çalıştır (retry ile)
      const campaigns = await scraper.runWithRetry(3);

      if (campaigns.length === 0) {
        console.log(`⚠️ ${scraper.sourceName}: Kampanya bulunamadı (bu normal olabilir)`);
        continue;
      }

      // FAZ 7.2: Category Campaign Mode kontrolü
      const isCategoryScraper = scraper.sourceName === 'Türkiye Finans' || scraper.sourceName === 'Ziraat Katılım';
      
      // FAZ 7.5: Low Value Campaign Mode kontrolü
      const isLowValueScraper = scraper.sourceName === 'Enpara' || scraper.sourceName === 'PTTcell';
      
      if (isCategoryScraper) {
        // Category scraper'lar: Tüm kampanyaları category olarak işaretle
        const categoryCampaigns = campaigns.map((campaign) => ({
          ...campaign,
          campaignType: 'category',
          showInCategoryFeed: true,
        }));

        if (categoryCampaigns.length === 0) {
          console.log(`⚠️ ${scraper.sourceName}: Category kampanya bulunamadı`);
          continue;
        }

        console.log(`📁 ${scraper.sourceName}: ${categoryCampaigns.length} category kampanya gönderiliyor`);

        // Backend'e gönder (retry + dead-letter ile)
        const results = await apiClient.createCampaigns(categoryCampaigns);
        
        // Sonuçları logla
        let successCount = 0;
        let updateCount = 0;
        let errorCount = 0;

        for (const result of results) {
          if (result.success) {
            successCount++;
            if (result.isUpdate) {
              updateCount++;
            }
          } else {
            errorCount++;
            console.error(`❌ ${scraper.sourceName}: ${result.campaign} - ${result.error}`);
          }
        }

        console.log(`✅ ${scraper.sourceName}: ${successCount} başarılı (${updateCount} güncelleme, ${successCount - updateCount} yeni)`);
        if (errorCount > 0) {
          console.log(`⚠️ ${scraper.sourceName}: ${errorCount} hata`);
        }

        // Rate limiting: Kaynaklar arası delay
        if (scrapers.indexOf(scraper) < scrapers.length - 1) {
          console.log(`⏳ ${SCRAPER_DELAY_MS}ms bekleniyor...`);
          await new Promise((resolve) => setTimeout(resolve, SCRAPER_DELAY_MS));
        }
        continue;
      }

      if (isLowValueScraper) {
        // FAZ 7.5: Low Value scraper'lar: Tüm kampanyaları low value olarak işaretle
        // Kalite filtresini bypass etme, sadece value_level = 'low' işaretle
        const lowValueCampaigns = campaigns.map((campaign) => ({
          ...campaign,
          valueLevel: 'low',
        }));

        if (lowValueCampaigns.length === 0) {
          console.log(`⚠️ ${scraper.sourceName}: Low value kampanya bulunamadı`);
          continue;
        }

        console.log(`💰 ${scraper.sourceName}: ${lowValueCampaigns.length} low value kampanya gönderiliyor`);

        // Backend'e gönder (retry + dead-letter ile)
        const results = await apiClient.createCampaigns(lowValueCampaigns);
        
        // Sonuçları logla
        let successCount = 0;
        let updateCount = 0;
        let errorCount = 0;

        for (const result of results) {
          if (result.success) {
            successCount++;
            if (result.isUpdate) {
              updateCount++;
            }
          } else {
            errorCount++;
            console.error(`❌ ${scraper.sourceName}: ${result.campaign} - ${result.error}`);
          }
        }

        console.log(`✅ ${scraper.sourceName}: ${successCount} başarılı (${updateCount} güncelleme, ${successCount - updateCount} yeni)`);
        if (errorCount > 0) {
          console.log(`⚠️ ${scraper.sourceName}: ${errorCount} hata`);
        }

        // Rate limiting: Kaynaklar arası delay
        if (scrapers.indexOf(scraper) < scrapers.length - 1) {
          console.log(`⏳ ${SCRAPER_DELAY_MS}ms bekleniyor...`);
          await new Promise((resolve) => setTimeout(resolve, SCRAPER_DELAY_MS));
        }
        continue;
      }

      // Normal scraper'lar: Kalite filtresinden geçir
      const highQualityCampaigns = filterHighQualityCampaigns(campaigns);
      console.log(`✅ ${scraper.sourceName}: ${highQualityCampaigns.length}/${campaigns.length} kampanya kaliteli`);

      if (highQualityCampaigns.length === 0) {
        console.log(`⚠️ ${scraper.sourceName}: Kaliteli kampanya bulunamadı (kalite başarısı)`);
        continue;
      }

      // Backend'e gönder (retry + dead-letter ile)
      const results = await apiClient.createCampaigns(highQualityCampaigns);
      
      // Dead-letter'daki kampanyaları da dene (opsiyonel, her run'da bir kez)
      if (scrapers.indexOf(scraper) === 0) {
        // Sadece ilk scraper'da dead-letter retry yap (gereksiz tekrarı önle)
        const deadLetterResults = await apiClient.retryDeadLetters();
        if (deadLetterResults.length > 0) {
          console.log(`🔄 Dead-letter retry: ${deadLetterResults.filter((r) => r.success).length}/${deadLetterResults.length} başarılı`);
        }
      }

      // Sonuçları logla
      let successCount = 0;
      let updateCount = 0;
      let errorCount = 0;

      for (const result of results) {
        if (result.success) {
          successCount++;
          if (result.isUpdate) {
            updateCount++;
          }
        } else {
          errorCount++;
          console.error(`❌ ${scraper.sourceName}: ${result.campaign} - ${result.error}`);
        }
      }

      console.log(`✅ ${scraper.sourceName}: ${successCount} başarılı (${updateCount} güncelleme, ${successCount - updateCount} yeni)`);
      if (errorCount > 0) {
        console.log(`⚠️ ${scraper.sourceName}: ${errorCount} hata`);
      }

      // Rate limiting: Kaynaklar arası delay
      if (scrapers.indexOf(scraper) < scrapers.length - 1) {
        console.log(`⏳ ${SCRAPER_DELAY_MS}ms bekleniyor...`);
        await new Promise((resolve) => setTimeout(resolve, SCRAPER_DELAY_MS));
      }
    } catch (error) {
      console.error(`❌ ${scraper.sourceName} scraper hatası:`, error.message);
    }
  }

  console.log('\n✅ Bot çalışması tamamlandı\n');
}

/**
 * FAZ 7: Fetch-based scraper'ları çalıştırır (SPA kaynaklar için)
 * Ana bot'tan izole, fail ederse ana sistemi etkilemez
 */
async function runFetchScrapers() {
  const apiClient = new ApiClient();
  
  // FAZ 7.1: Fetch-based scraper'lar (SPA/Dinamik yapı kaynakları)
  const fetchScrapers = [
    new TebFetchScraper(), // FAZ 7.1: TEB fetch scraper (XML endpoint)
  ];

  if (fetchScrapers.length === 0) {
    console.log('\n📡 FAZ 7: Fetch scraper bulunmuyor (network analizi gerekli)\n');
    return;
  }

  console.log(`\n🔗 FAZ 7: ${fetchScrapers.length} fetch scraper çalıştırılacak\n`);

  for (const scraper of fetchScrapers) {
    try {
      console.log(`\n📡 [FAZ7] ${scraper.sourceName} fetch scraper çalışıyor...`);

      // Scraper'ı çalıştır (retry ile)
      const campaigns = await scraper.runWithRetry(3);

      if (campaigns.length === 0) {
        console.log(`⚠️ [FAZ7] ${scraper.sourceName}: Kampanya bulunamadı`);
        continue;
      }

      // FAZ 7.3: Light Campaign Mode
      // TEB için özel mantık: Tüm kampanyalar light olarak işaretlenir
      // Çünkü TEB kampanyaları kalite filtresinden geçemiyor (değer bilgisi yok)
      // Ana feed'e sokulmamalı, sadece light feed'de gösterilmeli
      let allCampaigns = [];
      
      if (scraper.sourceName === 'TEB') {
        // TEB: TÜM kampanyaları light olarak işaretle (kalite filtresine sokmadan)
        allCampaigns = campaigns.map((campaign) => ({
          ...campaign,
          campaignType: 'light',
          showInLightFeed: true,
        }));
        console.log(`📊 [FAZ7] ${scraper.sourceName}: ${allCampaigns.length} kampanya light olarak işaretleniyor (TEB özel modu)`);
      } else {
        // Diğer fetch scraper'lar için: Kalite filtresinden geçenler main, geçemeyenler light
        const highQualityCampaigns = filterHighQualityCampaigns(campaigns);
        console.log(`✅ [FAZ7] ${scraper.sourceName}: ${highQualityCampaigns.length}/${campaigns.length} kampanya kaliteli`);

        // Kalite filtresinden geçemeyenler light olarak işaretle
        const lightCampaigns = campaigns
          .filter((campaign) => !highQualityCampaigns.some((hq) => hq.originalUrl === campaign.originalUrl))
          .map((campaign) => ({
            ...campaign,
            campaignType: 'light',
            showInLightFeed: true,
          }));

        // Hem kaliteli hem light kampanyaları gönder
        allCampaigns = [
          ...highQualityCampaigns.map((campaign) => ({
            ...campaign,
            campaignType: 'main',
            showInLightFeed: false,
          })),
          ...lightCampaigns,
        ];

        console.log(`📊 [FAZ7] ${scraper.sourceName}: ${highQualityCampaigns.length} main, ${lightCampaigns.length} light kampanya gönderiliyor`);
      }

      if (allCampaigns.length === 0) {
        console.log(`⚠️ [FAZ7] ${scraper.sourceName}: Kampanya bulunamadı`);
        continue;
      }

      // Backend'e gönder
      const results = await apiClient.createCampaigns(allCampaigns);

      // Sonuçları logla
      let successCount = 0;
      let updateCount = 0;
      let errorCount = 0;

      for (const result of results) {
        if (result.success) {
          successCount++;
          if (result.isUpdate) {
            updateCount++;
          }
        } else {
          errorCount++;
          console.error(`❌ [FAZ7] ${scraper.sourceName}: ${result.campaign} - ${result.error}`);
        }
      }

      console.log(`✅ [FAZ7] ${scraper.sourceName}: ${successCount} başarılı (${updateCount} güncelleme, ${successCount - updateCount} yeni)`);
      if (errorCount > 0) {
        console.log(`⚠️ [FAZ7] ${scraper.sourceName}: ${errorCount} hata`);
      }

      // Rate limiting
      if (fetchScrapers.indexOf(scraper) < fetchScrapers.length - 1) {
        console.log(`⏳ ${SCRAPER_DELAY_MS}ms bekleniyor...`);
        await new Promise((resolve) => setTimeout(resolve, SCRAPER_DELAY_MS));
      }
    } catch (error) {
      // FAZ 7: Fetch scraper hataları ana sistemi etkilemez
      console.error(`❌ [FAZ7] ${scraper.sourceName} fetch scraper hatası (ana sistem etkilenmedi):`, error.message);
    }
  }

  console.log('\n✅ FAZ 7 fetch scraper çalışması tamamlandı\n');
}

/**
 * Ana fonksiyon
 */
async function main() {
  const mode = process.argv[2] || 'scheduler';

  if (mode === 'once') {
    // Tek seferlik çalıştırma
    console.log('🚀 Bot tek seferlik çalıştırılıyor...');
    await runScrapers();
    // FAZ 7: Fetch scraper'ları da çalıştır (izole)
    await runFetchScrapers();
    process.exit(0);
  } else if (mode === 'faz7') {
    // Sadece FAZ 7 fetch scraper'ları çalıştır (test için)
    console.log('🔗 FAZ 7 fetch scraper\'lar çalıştırılıyor...');
    await runFetchScrapers();
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
