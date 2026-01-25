/**
 * Base Scraper
 * Tüm scraper'lar için temel sınıf
 */

const puppeteer = require('puppeteer');

class BaseScraper {
  constructor(sourceName, sourceUrl) {
    this.sourceName = sourceName;
    this.sourceUrl = sourceUrl;
    this.browser = null;
    this.page = null;
  }

  /**
   * Browser'ı başlatır
   */
  async init() {
    this.browser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--disable-gpu',
      ],
    });
    this.page = await this.browser.newPage();

    // User-Agent rotation
    const userAgents = [
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    ];
    const randomUserAgent = userAgents[Math.floor(Math.random() * userAgents.length)];
    await this.page.setUserAgent(randomUserAgent);

    // Viewport ayarla
    await this.page.setViewport({ width: 1920, height: 1080 });
  }

  /**
   * Sayfayı yükler ve JavaScript render'ını bekler
   */
  async loadPage(url, waitForSelector = null, timeout = 30000) {
    try {
      await this.page.goto(url, {
        waitUntil: 'networkidle2',
        timeout,
      });

      // Eğer selector belirtilmişse, onu bekle
      if (waitForSelector) {
        await this.page.waitForSelector(waitForSelector, { timeout });
      }

      // Ekstra bekleme (JavaScript render için)
      await this.page.waitForTimeout(2000);
    } catch (error) {
      throw new Error(`Sayfa yüklenemedi: ${url} - ${error.message}`);
    }
  }

  /**
   * Kampanyaları parse eder (alt sınıflarda override edilecek)
   */
  async scrape() {
    throw new Error('scrape() metodu alt sınıflarda implement edilmelidir');
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
   * Retry mekanizması ile scraper çalıştırır
   */
  async runWithRetry(maxRetries = 3) {
    let lastError = null;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        await this.init();
        const campaigns = await this.scrape();
        await this.close();
        return campaigns;
      } catch (error) {
        lastError = error;
        console.error(`❌ ${this.sourceName} scraper hatası (deneme ${attempt}/${maxRetries}):`, error.message);

        if (this.browser) {
          await this.close();
        }

        if (attempt < maxRetries) {
          // Exponential backoff
          const delay = Math.pow(2, attempt) * 1000;
          console.log(`⏳ ${delay}ms sonra tekrar denenecek...`);
          await new Promise((resolve) => setTimeout(resolve, delay));
        }
      }
    }

    throw lastError;
  }
}

module.exports = BaseScraper;
