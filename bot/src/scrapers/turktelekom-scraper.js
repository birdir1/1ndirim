/**
 * Türk Telekom Campaign Scraper
 * Türk Telekom'un public kampanya sayfasını okur
 * 
 * UPDATED: Phase 3.2
 * - Tiered selectors for robustness
 * - Infinite scroll handling
 * - Better category detection
 * - Improved data extraction
 */

const BaseScraper = require('./base-scraper');

class TurktelekomScraper extends BaseScraper {
  constructor() {
    super('Türk Telekom', 'https://bireysel.turktelekom.com.tr/tt-mobil/kampanyalar');
  }

  /**
   * Türk Telekom kampanyalarını scrape eder
   */
  async scrape() {
    const campaigns = [];

    try {
      // Türk Telekom kampanya sayfasını yükle
      await this.page.goto(this.sourceUrl, {
        waitUntil: 'networkidle2',
        timeout: 30000,
      });
      
      // SPA loading için bekle
      await this.page.waitForTimeout(3000);

      // Infinite scroll (kampanyaları yüklemek için)
      await this.autoScroll();

      // Kampanya linklerini bul (tiered selectors)
      const campaignLinks = await this.tryTieredLinks({
        primary: 'a[href*="/kampanyalar/"]',
        secondary: 'a[href*="/kampanya/"]',
        fallback: ['.campaign-card a', '.kampanya-card a', 'article a'],
      });

      if (campaignLinks.length === 0) {
        console.warn(`⚠️  ${this.sourceName}: Kampanya linki bulunamadı`);
        return campaigns;
      }

      console.log(`🔍 ${this.sourceName}: ${campaignLinks.length} kampanya linki bulundu`);

      // İlk 20 linki kullan (hedef: 15-20 kampanya)
      const uniqueLinks = [...new Set(campaignLinks)].slice(0, 20);

      for (const link of uniqueLinks) {
        try {
          const campaign = await this.parseCampaignFromLink(link);
          if (campaign) {
            campaigns.push(campaign);
          }
        } catch (error) {
          console.error(`❌ ${this.sourceName}: Link parse hatası (${link}):`, error.message);
        }
      }

      console.log(`✅ ${this.sourceName}: ${campaigns.length} kampanya bulundu`);
      return campaigns;
    } catch (error) {
      throw new Error(`Türk Telekom scraper hatası: ${error.message}`);
    }
  }

  /**
   * Infinite scroll (SPA için)
   */
  async autoScroll() {
    try {
      await this.page.evaluate(async () => {
        await new Promise((resolve) => {
          let totalHeight = 0;
          const distance = 100;
          const maxScrolls = 20; // Max 20 scroll
          let scrolls = 0;

          const timer = setInterval(() => {
            const scrollHeight = document.body.scrollHeight;
            window.scrollBy(0, distance);
            totalHeight += distance;
            scrolls++;

            if (totalHeight >= scrollHeight || scrolls >= maxScrolls) {
              clearInterval(timer);
              resolve();
            }
          }, 100);
        });
      });

      // Scroll sonrası içerik yüklenmesi için bekle
      await this.page.waitForTimeout(2000);
    } catch (error) {
      console.warn(`⚠️  ${this.sourceName}: Auto scroll hatası:`, error.message);
    }
  }

  /**
   * Kampanya detay sayfasından bilgi çıkarır
   */
  async parseCampaignFromLink(url) {
    try {
      // Detay sayfasına git
      await this.page.goto(url, {
        waitUntil: 'networkidle2',
        timeout: 15000,
      });
      await this.page.waitForTimeout(2000);

      // Sayfa içeriğini al (tiered selectors)
      const content = await this.page.evaluate(() => {
        // Title (tiered)
        const titleEl = document.querySelector('h1') || 
                       document.querySelector('h2') || 
                       document.querySelector('.title') ||
                       document.querySelector('.campaign-title');
        const title = titleEl?.textContent.trim() || '';

        // Description (tiered)
        const descEl = document.querySelector('.description') ||
                      document.querySelector('.campaign-description') ||
                      document.querySelector('p');
        const description = descEl?.textContent.trim() || '';

        // Full text (for date/value extraction)
        const main = document.querySelector('main, [role="main"], .main-content, .content') || document.body;
        const fullText = main.textContent.trim();

        // All paragraphs
        const paragraphs = Array.from(document.querySelectorAll('p'))
          .map(p => p.textContent.trim())
          .filter(t => t.length > 20);

        return {
          title,
          description: description || paragraphs[0] || title,
          fullText: fullText.substring(0, 2000),
          paragraphs,
        };
      });

      // Tarih bilgisi bul
      let endDate = new Date();
      endDate.setDate(endDate.getDate() + 30); // Varsayılan: 30 gün sonra

      const dateMatch = content.fullText.match(/(\d{1,2})[./](\d{1,2})[./](\d{4})|(\d{4})[./-](\d{1,2})[./-](\d{1,2})/);
      if (dateMatch) {
        if (dateMatch[4]) {
          // YYYY-MM-DD formatı
          endDate = new Date(`${dateMatch[4]}-${dateMatch[5]}-${dateMatch[6]}`);
        } else {
          // DD.MM.YYYY formatı
          endDate = new Date(`${dateMatch[3]}-${dateMatch[2]}-${dateMatch[1]}`);
        }
      }

      // Category detection (rule-based)
      const text = `${content.title} ${content.description}`.toLowerCase();
      let category = 'telecom'; // Default for Türk Telekom

      if (text.match(/netflix|youtube|prime|exxen|gain|tivibu|tv\+|blutv|mubi|disney|hbo/)) {
        category = 'entertainment';
      } else if (text.match(/steam|epic|nvidia|playstation|xbox|game pass|oyun|game/)) {
        category = 'gaming';
      } else if (text.match(/spotify|apple music|youtube music|deezer|fizy|müzik|music/)) {
        category = 'music';
      } else if (text.match(/internet|hat|telefon|mobil|data|gb|paket/)) {
        category = 'telecom';
      }

      // Sub-category detection
      let subCategory = 'Türk Telekom';
      if (text.match(/netflix/)) subCategory = 'Netflix';
      else if (text.match(/youtube/)) subCategory = 'YouTube';
      else if (text.match(/spotify/)) subCategory = 'Spotify';
      else if (text.match(/game pass/)) subCategory = 'Game Pass';

      // Normalize edilmiş kampanya objesi
      return {
        sourceName: this.sourceName,
        title: content.title || 'Türk Telekom Kampanyası',
        description: content.description || content.title,
        detailText: content.fullText.substring(0, 500),
        campaignUrl: url,
        originalUrl: url,
        affiliateUrl: null,
        startDate: new Date().toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0],
        howToUse: [],
        category, // NEW: Category detection
        tags: ['Türk Telekom', subCategory].filter((t, i, a) => a.indexOf(t) === i),
        channel: 'online',
      };
    } catch (error) {
      console.error(`❌ ${this.sourceName}: Detay sayfası parse hatası (${url}):`, error.message);
      return null; // Hata durumunda null döndür (skip)
    }
  }
}

module.exports = TurktelekomScraper;
