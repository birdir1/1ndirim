/**
 * Akbank Campaign Scraper
 * Akbank'ın public kampanya sayfasını okur
 * 
 * UPDATED: Phase 3.6
 * - Improved category detection (finance)
 * - Better error handling (return null on error)
 * - Tiered selectors already implemented
 */

const BaseScraper = require('./base-scraper');

class AkbankScraper extends BaseScraper {
  constructor() {
    super('Akbank', 'https://www.akbank.com/kampanyalar');
  }

  /**
   * Akbank kampanyalarını scrape eder
   * Dropdown menüdeki kampanya linklerini kullanır
   */
  async scrape() {
    const campaigns = [];

    try {
      // Akbank kampanya sayfasını yükle
      await this.page.goto(this.sourceUrl, {
        waitUntil: 'networkidle2',
        timeout: 30000,
      });
      await this.page.waitForTimeout(3000);

      // Tiered selectors for campaign links
      let campaignLinks = [];
      
      // Try primary selectors
      const primarySelectors = ['[data-testid*="kampanya"] a', '[data-testid*="campaign"] a', '[aria-label*="kampanya"]'];
      for (const selector of primarySelectors) {
        const links = await this.page.$$eval(selector, els => els.map(el => el.href).filter(href => href && href.includes('/kampanyalar/')));
        if (links.length > 0) {
          campaignLinks = links;
          break;
        }
      }
      
      // Try secondary selectors if primary failed
      if (campaignLinks.length === 0) {
        const secondarySelectors = ['a.dropdown__item[href*="/kampanyalar/"]'];
        for (const selector of secondarySelectors) {
          try {
            const links = await this.page.$$eval(selector, els => els.map(el => el.href));
            if (links.length > 0) {
              campaignLinks = links;
              break;
            }
          } catch (e) {
            // Selector not found, continue
          }
        }
      }
      
      // Try fallback selectors
      if (campaignLinks.length === 0) {
        const fallbackSelectors = ['a[href*="/kampanyalar/"]', '.campaign-card a', 'article a'];
        for (const selector of fallbackSelectors) {
          try {
            const links = await this.page.$$eval(selector, els => els.map(el => el.href).filter(href => href && href.includes('/kampanyalar/')));
            if (links.length > 0) {
              campaignLinks = links;
              break;
            }
          } catch (e) {
            // Selector not found, continue
          }
        }
      }

      if (campaignLinks.length === 0) {
        console.warn(`⚠️  ${this.sourceName}: Kampanya linki bulunamadı`);
        return campaigns;
      }

      console.log(`🔍 ${this.sourceName}: ${campaignLinks.length} kampanya linki bulundu`);

      // İlk 15 linki kullan (hedef: 10-15 kampanya)
      const uniqueLinks = [...new Set(campaignLinks)].slice(0, 15);

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
      throw new Error(`Akbank scraper hatası: ${error.message}`);
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

      // Category detection (finance for banks)
      const text = `${content.title} ${content.description}`.toLowerCase();
      let category = 'finance'; // Default for Akbank

      // Check for specific sub-categories
      if (text.match(/kredi kartı|kart|mastercard|visa/)) {
        category = 'finance';
      } else if (text.match(/kredi|konut|taşıt|ihtiyaç/)) {
        category = 'finance';
      } else if (text.match(/mevduat|faiz|vadeli/)) {
        category = 'finance';
      }

      // Sub-category detection
      let subCategory = 'Akbank';
      if (text.match(/kredi kartı|kart/)) subCategory = 'Kredi Kartı';
      else if (text.match(/kredi/)) subCategory = 'Kredi';
      else if (text.match(/mevduat/)) subCategory = 'Mevduat';

      // Normalize edilmiş kampanya objesi
      return {
        sourceName: this.sourceName,
        title: content.title || 'Akbank Kampanyası',
        description: content.description || content.title,
        detailText: content.fullText.substring(0, 500),
        campaignUrl: url,
        originalUrl: url,
        affiliateUrl: null,
        startDate: new Date().toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0],
        howToUse: [],
        category, // NEW: Category detection (finance)
        tags: ['Akbank', subCategory].filter((t, i, a) => a.indexOf(t) === i),
        channel: 'online',
      };
    } catch (error) {
      console.error(`❌ ${this.sourceName}: Detay sayfası parse hatası (${url}):`, error.message);
      return null; // Hata durumunda null döndür (skip)
    }
  }
}

module.exports = AkbankScraper;
