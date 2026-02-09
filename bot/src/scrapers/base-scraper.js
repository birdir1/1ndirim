/**
 * Base Scraper
 * Tüm scraper'lar için temel sınıf
 */

const puppeteer = require('puppeteer');
const { tryTieredLinks, tryTieredSelector } = require('../utils/domSelectors');

class BaseScraper {
  constructor(sourceName, sourceUrl) {
    this.sourceName = sourceName;
    this.sourceUrl = sourceUrl;
    this.browser = null;
    this.page = null;
    this._releasePage = null; // FAZ 17.2: shared browser page release callback
  }

  /**
   * Browser veya shared page başlatır.
   * FAZ 17.2: options.browserManager + options.runLogCtx verilirse shared browser'dan page alınır.
   */
  async init(options = {}) {
    if (options.browserManager && options.runLogCtx) {
      const { page, release } = await options.browserManager.getPage(options.runLogCtx, this.sourceName);
      this.page = page;
      this._releasePage = release;
      this.browser = null;
      return;
    }
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
    this._releasePage = null;

    const userAgents = [
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    ];
    const randomUserAgent = userAgents[Math.floor(Math.random() * userAgents.length)];
    await this.page.setUserAgent(randomUserAgent);
    await this.page.setViewport({ width: 1920, height: 1080 });
  }

  /**
   * Sayfayı yükler ve JavaScript render'ını bekler.
   * FAZ 11.2: waitForSelector string ise tek selector; object ise { primary, secondary, fallback } tiered kullanılır.
   */
  async loadPage(url, waitForSelector = null, timeout = 30000) {
    try {
      await this.page.goto(url, {
        waitUntil: 'networkidle2',
        timeout,
      });

      if (waitForSelector) {
        const tiered = typeof waitForSelector === 'object' && !Array.isArray(waitForSelector);
        if (tiered) {
          const t = waitForSelector;
          const tryWait = async (sel) => {
            try {
              await this.page.waitForSelector(sel, { timeout: Math.min(5000, timeout) });
              return true;
            } catch (_) {
              console.warn(`[${this.sourceName}] selector wait failed: "${sel}"`);
              return false;
            }
          };
          const order = [t.primary, t.secondary, t.fallback].flat().filter(Boolean);
          for (const sel of order) {
            if (await tryWait(sel)) break;
          }
        } else {
          await this.page.waitForSelector(waitForSelector, { timeout });
        }
      }

      await this.page.waitForTimeout(2000);
    } catch (error) {
      throw new Error(`Sayfa yüklenemedi: ${url} - ${error.message}`);
    }
  }

  /**
   * FAZ 11.1: Sayfa yüklenirken toplanan XHR/fetch JSON response'larını döndürür.
   * init() sonrası çağrılmalı. DOM scrape öncesi network'ten kampanya çıkarımı için kullanılır.
   */
  async collectNetworkResponses(timeoutMs = 15000) {
    if (!this.page) return [];
    const responses = [];
    const onResponse = async (response) => {
      const ct = (response.headers()['content-type'] || '').toLowerCase();
      if (!ct.includes('application/json')) return;
      try {
        const json = await response.json();
        responses.push({ url: response.url(), data: json, status: response.status() });
      } catch (_) {}
    };
    this.page.on('response', onResponse);
    try {
      await this.page.goto(this.sourceUrl, { waitUntil: 'domcontentloaded', timeout: timeoutMs });
      await this.page.waitForTimeout(4000);
    } catch (e) {
      // Sayfa açılamazsa boş döndür, DOM fallback çalışsın
    }
    this.page.off('response', onResponse);
    return responses;
  }

  /**
   * FAZ 11.1: Network response'larından kampanya listesi çıkarır. Varsayılan: boş (DOM fallback).
   * Alt sınıflar override ederek XHR/fetch JSON'dan kampanya üretebilir.
   * @param {Array<{url: string, data: any, status: number}>} responses - collectNetworkResponses() çıktısı
   * @returns {Array<Object>} - Kampanya objeleri veya []
   */
  getCampaignsFromNetwork(responses) {
    return [];
  }

  /**
   * FAZ 11.2: Tiered selector ile kampanya linki listesi döndürür.
   * tiers: { primary, secondary, fallback } her biri string veya string[]
   */
  async tryTieredLinks(tiers) {
    // domSelectors.tryTieredLinks returns { tier, links:[{href,text}] }.
    // Most scrapers expect a simple string[] of hrefs.
    const res = await tryTieredLinks(this.page, tiers, this.sourceName);
    if (!res) return [];
    if (Array.isArray(res)) return res;
    if (res && Array.isArray(res.links)) return res.links.map((l) => l && l.href).filter(Boolean);
    return [];
  }

  /**
   * FAZ 11.2: Tiered selector ile tekil içerik (innerText) döndürür.
   */
  async tryTieredSelector(tiers) {
    return tryTieredSelector(this.page, tiers, this.sourceName);
  }

  /**
   * Kampanyaları parse eder (alt sınıflarda override edilecek)
   */
  async scrape() {
    throw new Error('scrape() metodu alt sınıflarda implement edilmelidir');
  }

  /**
   * Browser veya shared page'i serbest bırakır. FAZ 17.2: _releasePage varsa onu kullanır.
   */
  async close() {
    if (this._releasePage) {
      await this._releasePage();
      this._releasePage = null;
      this.page = null;
      return;
    }
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
      this.page = null;
    }
  }

  /**
   * Retry mekanizması ile scraper çalıştırır.
   * FAZ 11.1: Önce network'ten kampanya dene; boşsa DOM scrape yap.
   * FAZ 17.4: DOM_CHANGED sonrası aynı run'da tekrar DOM denemesi yapılmaz (erken çıkış).
   * @param {number} maxRetries
   * @param {{ browserManager?: object, runLogCtx?: object, getFailureType?: (err: Error) => string }} options - FAZ 17
   */
  async runWithRetry(maxRetries = 3, options = {}) {
    let lastError = null;
    const getFailureType = options.getFailureType || (() => null);

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        await this.init(options);
        const responses = await this.collectNetworkResponses();
        const fromNetwork = this.getCampaignsFromNetwork(responses);
        if (Array.isArray(fromNetwork) && fromNetwork.length > 0) {
          fromNetwork.forEach((c) => { c._fromNetwork = true; });
          await this.close();
          return fromNetwork;
        }
        const campaigns = await this.scrape();
        await this.close();
        return campaigns;
      } catch (error) {
        lastError = error;
        const ft = getFailureType(error) || error.failureType || error.code;
        const isDomChanged = ft === 'DOM_CHANGED';

        if (this._releasePage) {
          await this.close();
        } else if (this.browser) {
          await this.close();
        }

        console.error(`❌ ${this.sourceName} scraper hatası (deneme ${attempt}/${maxRetries}):`, error.message);

        if (isDomChanged && attempt < maxRetries) {
          break;
        }
        if (attempt < maxRetries && !isDomChanged) {
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
