/**
 * Generic SPA Scraper Template
 * Reusable base class for SPA-based e-commerce/service sites
 * 
 * Used for: Fashion brands, cosmetics, supplements, food delivery, etc.
 */

const BaseScraper = require('../base-scraper');

class GenericSPAScraper extends BaseScraper {
  constructor(sourceName, sourceUrl, category, options = {}) {
    super(sourceName, sourceUrl);
    this.category = category;
    this.options = {
      scrollCount: options.scrollCount || 20,
      waitTime: options.waitTime || 3000,
      maxCampaigns: options.maxCampaigns || 15,
      selectors: options.selectors || this.getDefaultSelectors(),
      ...options,
    };
  }

  /**
   * Default selectors (can be overridden)
   */
  getDefaultSelectors() {
    return {
      campaignLinks: {
        primary: ['a[href*="/kampanya"]', 'a[href*="/campaign"]'],
        secondary: ['a[href*="/indirim"]', 'a[href*="/firsat"]'],
        fallback: ['.campaign-card a', '.kampanya-card a', 'article a', '.card a'],
      },
      title: {
        primary: 'h1',
        secondary: 'h2',
        fallback: ['.title', '.campaign-title', '.heading'],
      },
      description: {
        primary: '.description',
        secondary: '.campaign-description',
        fallback: ['p', '.summary', '.content'],
      },
    };
  }

  /**
   * Main scrape method
   */
  async scrape() {
    const campaigns = [];

    try {
      await this.page.goto(this.sourceUrl, {
        waitUntil: 'networkidle2',
        timeout: 30000,
      });
      
      await this.page.waitForTimeout(this.options.waitTime);
      await this.autoScroll();

      // Get campaign links using tiered selectors
      const campaignLinks = await this.tryTieredLinks(this.options.selectors.campaignLinks);

      if (campaignLinks.length === 0) {
        console.warn(`⚠️  ${this.sourceName}: Kampanya linki bulunamadı`);
        return [];
      }

      console.log(`🔍 ${this.sourceName}: ${campaignLinks.length} kampanya linki bulundu`);

      const uniqueLinks = [...new Set(campaignLinks)].slice(0, this.options.maxCampaigns);

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
      return campaigns.length > 0 ? campaigns : [];
    } catch (error) {
      console.error(`❌ ${this.sourceName}: Scraping hatası:`, error.message);
      return [];
    }
  }

  /**
   * Parse campaign from detail page
   */
  async parseCampaignFromLink(url) {
    try {
      await this.page.goto(url, {
        waitUntil: 'networkidle2',
        timeout: 15000,
      });
      await this.page.waitForTimeout(2000);

      const content = await this.page.evaluate((selectors) => {
        const getTextFromSelector = (selectorObj) => {
          const selectors = [selectorObj.primary, selectorObj.secondary, ...(selectorObj.fallback || [])].flat();
          for (const sel of selectors) {
            const el = document.querySelector(sel);
            if (el && el.textContent.trim()) {
              return el.textContent.trim();
            }
          }
          return '';
        };

        const title = getTextFromSelector(selectors.title);
        const description = getTextFromSelector(selectors.description);
        
        const main = document.querySelector('main, [role="main"], .main-content') || document.body;
        const fullText = main.textContent.trim();

        const paragraphs = Array.from(document.querySelectorAll('p'))
          .map(p => p.textContent.trim())
          .filter(t => t.length > 20);

        return {
          title,
          description: description || paragraphs[0] || title,
          fullText: fullText.substring(0, 2000),
        };
      }, this.options.selectors);

      // Extract date
      let endDate = new Date();
      endDate.setDate(endDate.getDate() + 30);

      const dateMatch = content.fullText.match(/(\d{1,2})[./](\d{1,2})[./](\d{4})|(\d{4})[./-](\d{1,2})[./-](\d{1,2})/);
      if (dateMatch) {
        if (dateMatch[4]) {
          endDate = new Date(`${dateMatch[4]}-${dateMatch[5]}-${dateMatch[6]}`);
        } else {
          endDate = new Date(`${dateMatch[3]}-${dateMatch[2]}-${dateMatch[1]}`);
        }
      }

      // Detect sub-category
      const subCategory = this.detectSubCategory(content.title, content.description);

      return {
        sourceName: this.sourceName,
        title: content.title || `${this.sourceName} Kampanyası`,
        description: content.description || content.title,
        detailText: content.fullText.substring(0, 500),
        campaignUrl: url,
        originalUrl: url,
        affiliateUrl: null,
        startDate: new Date().toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0],
        howToUse: [],
        category: this.category,
        tags: [this.sourceName, subCategory].filter(Boolean),
        channel: 'online',
      };
    } catch (error) {
      console.error(`❌ ${this.sourceName}: Detay sayfası parse hatası (${url}):`, error.message);
      return null;
    }
  }

  /**
   * Detect sub-category (can be overridden)
   */
  detectSubCategory(title, description) {
    return this.sourceName;
  }

  /**
   * Infinite scroll
   */
  async autoScroll() {
    try {
      await this.page.evaluate(async (scrollCount) => {
        await new Promise((resolve) => {
          let totalHeight = 0;
          const distance = 100;
          let scrolls = 0;

          const timer = setInterval(() => {
            const scrollHeight = document.body.scrollHeight;
            window.scrollBy(0, distance);
            totalHeight += distance;
            scrolls++;

            if (totalHeight >= scrollHeight || scrolls >= scrollCount) {
              clearInterval(timer);
              resolve();
            }
          }, 100);
        });
      }, this.options.scrollCount);

      await this.page.waitForTimeout(2000);
    } catch (error) {
      console.warn(`⚠️  ${this.sourceName}: Auto scroll hatası:`, error.message);
    }
  }

  /**
   * Create fallback campaigns (can be overridden)
   */
  createFallbackCampaigns() {
    // Placeholder campaigns are disabled to avoid fake data injection.
    return [];
  }

  /**
   * Helper: Calculate end date
   */
  getEndDate(days) {
    const date = new Date();
    date.setDate(date.getDate() + days);
    return date.toISOString().split('T')[0];
  }
}

module.exports = GenericSPAScraper;
