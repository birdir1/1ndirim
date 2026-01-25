/**
 * Network Analyzer
 * FAZ 7: SPA kaynaklar için network request'leri analiz eder
 * Puppeteer ile sayfa yüklenirken XHR/Fetch request'leri yakalanır
 */

const puppeteer = require('puppeteer');

class NetworkAnalyzer {
  constructor(sourceName, sourceUrl) {
    this.sourceName = sourceName;
    this.sourceUrl = sourceUrl;
    this.browser = null;
    this.page = null;
    this.networkRequests = [];
    this.allRequests = [];
  }

  /**
   * Browser'ı başlatır ve network request'leri dinler
   */
  async init() {
    this.browser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
      ],
    });

    this.page = await this.browser.newPage();

    // Network request'leri yakala
    this.page.on('request', (request) => {
      const url = request.url();
      const method = request.method();
      const resourceType = request.resourceType();

      // Sadece XHR/Fetch request'lerini kaydet
      if (resourceType === 'xhr' || resourceType === 'fetch') {
        this.networkRequests.push({
          url,
          method,
          resourceType,
          headers: request.headers(),
          postData: request.postData(),
        });
      }
    });
    
    // Tüm request'leri de kaydet (debug için)
    this.allRequests = [];
    this.page.on('request', (request) => {
      this.allRequests.push({
        url: request.url(),
        method: request.method(),
        resourceType: request.resourceType(),
      });
    });

    // Response'ları da yakala (JSON içeriği için)
    this.page.on('response', async (response) => {
      const url = response.url();
      const status = response.status();
      const contentType = response.headers()['content-type'] || '';

      // JSON response'ları kaydet
      if (contentType.includes('application/json')) {
        try {
          const json = await response.json();
          const existing = this.networkRequests.find(r => r.url === url);
          if (existing) {
            existing.responseData = json;
            existing.status = status;
          }
        } catch (error) {
          // JSON parse hatası, görmezden gel
        }
      }
    });
  }

  /**
   * Sayfayı yükler ve network request'lerini toplar
   */
  async analyze(timeout = 30000) {
    try {
      await this.init();

      console.log(`\n🌐 Sayfa yükleniyor: ${this.sourceUrl}`);
      
      try {
        await this.page.goto(this.sourceUrl, {
          waitUntil: 'domcontentloaded',
          timeout,
        });
      } catch (gotoError) {
        console.log(`⚠️ Sayfa yükleme hatası (devam ediliyor): ${gotoError.message}`);
      }

      // Ekstra bekleme (SPA'lar için)
      await this.page.waitForTimeout(10000);
      
      // Sayfa durumunu kontrol et
      try {
        const pageTitle = await this.page.title();
        const pageUrl = this.page.url();
        console.log(`\n📄 Sayfa yüklendi: ${pageTitle}`);
        console.log(`🔗 URL: ${pageUrl}`);
        console.log(`📊 Toplam request sayısı (tüm tipler): ${this.allRequests.length}`);
        console.log(`📡 XHR/Fetch request sayısı: ${this.networkRequests.length}`);
      } catch (error) {
        console.log(`⚠️ Sayfa durumu kontrol edilemedi: ${error.message}`);
      }

      // Sayfa içi etkileşimler (scroll, click vb.) gerekirse burada yapılabilir
      // await this.page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));

      return this.getAnalysisResults();
    } catch (error) {
      console.error(`❌ Network analiz hatası: ${error.message}`);
      throw new Error(`Network analiz hatası: ${error.message}`);
    } finally {
      await this.close();
    }
  }

  /**
   * Analiz sonuçlarını döndürür
   */
  getAnalysisResults() {
    // Kampanya ile ilgili endpoint'leri filtrele
    const campaignEndpoints = this.networkRequests.filter(req => {
      const url = req.url.toLowerCase();
      return (
        url.includes('kampanya') ||
        url.includes('campaign') ||
        url.includes('promo') ||
        url.includes('offer') ||
        url.includes('advantage') ||
        url.includes('avantaj')
      );
    });

    // JSON response'u olan endpoint'leri önceliklendir
    const jsonEndpoints = campaignEndpoints.filter(req => req.responseData);

    return {
      allRequests: this.networkRequests,
      campaignEndpoints,
      jsonEndpoints,
      summary: {
        totalRequests: this.networkRequests.length,
        campaignRelated: campaignEndpoints.length,
        jsonResponses: jsonEndpoints.length,
      },
    };
  }

  /**
   * Browser'ı kapatır
   */
  async close() {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
      this.page = null;
    }
  }

  /**
   * Analiz sonuçlarını konsola yazdırır
   */
  printResults(results) {
    console.log(`\n📊 ${this.sourceName} Network Analiz Sonuçları:`);
    console.log(`─────────────────────────────────────────`);
    console.log(`Toplam Request: ${results.summary.totalRequests}`);
    console.log(`Kampanya İlgili: ${results.summary.campaignRelated}`);
    console.log(`JSON Response: ${results.summary.jsonResponses}`);

    if (results.jsonEndpoints.length > 0) {
      console.log(`\n✅ JSON Endpoint'ler:`);
      results.jsonEndpoints.forEach((req, index) => {
        console.log(`\n${index + 1}. ${req.method} ${req.url}`);
        console.log(`   Status: ${req.status}`);
        if (req.responseData) {
          const keys = Object.keys(req.responseData).slice(0, 5);
          console.log(`   Keys: ${keys.join(', ')}...`);
        }
      });
    } else {
      console.log(`\n⚠️ JSON endpoint bulunamadı. XHR/Fetch request'leri:`);
      results.campaignEndpoints.slice(0, 5).forEach((req, index) => {
        console.log(`${index + 1}. ${req.method} ${req.url}`);
      });
    }
  }
}

module.exports = NetworkAnalyzer;
