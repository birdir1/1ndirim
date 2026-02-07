/**
 * Epic Games Campaign Scraper
 * Epic Games free games kampanyalarını toplar (Keşfet - Gaming kategorisi için)
 * 
 * CREATED: Phase 3.9
 * - Scrapes Epic Games free games page
 * - Category: gaming
 * - Sub-category: Epic Games
 */

const BaseScraper = require('./base-scraper');

class EpicGamesScraper extends BaseScraper {
  constructor() {
    super('Epic Games', 'https://store.epicgames.com/tr/free-games');
  }

  /**
   * Epic Games kampanyalarını scrape eder
   */
  async scrape() {
    const campaigns = [];

    try {
      await this.page.goto(this.sourceUrl, {
        waitUntil: 'networkidle2',
        timeout: 30000,
      });
      
      await this.page.waitForTimeout(5000); // Epic Games SPA needs more time

      // Scroll to load content
      await this.autoScroll();

      // Epic Games free games
      const freeGames = await this.page.evaluate(() => {
        const items = [];
        
        // Try different selectors for Epic Games free games
        const gameCards = document.querySelectorAll('[data-testid*="offer"], .css-1jx3eyg, article, .offer-card');
        
        for (const card of Array.from(gameCards).slice(0, 5)) {
          try {
            const titleEl = card.querySelector('h3, h2, .title, [data-testid*="title"]');
            const title = titleEl?.textContent.trim() || '';
            
            const descEl = card.querySelector('p, .description, [data-testid*="description"]');
            const description = descEl?.textContent.trim() || '';
            
            const linkEl = card.querySelector('a[href]');
            const link = linkEl?.href || '';
            
            // Check if it's actually free
            const priceEl = card.querySelector('[data-testid*="price"], .price');
            const priceText = priceEl?.textContent.trim().toLowerCase() || '';
            const isFree = priceText.includes('free') || priceText.includes('ücretsiz') || priceText.includes('₺0');
            
            if (title && link && isFree) {
              items.push({ title, description, link });
            }
          } catch (e) {
            // Skip invalid items
          }
        }
        
        return items;
      });

      // Parse free games into campaigns
      for (const game of freeGames) {
        try {
          const campaign = {
            sourceName: this.sourceName,
            title: `${game.title} - Ücretsiz`,
            description: game.description || `Epic Games Store'da ${game.title} şu an ücretsiz! Kütüphanenize ekleyin ve sonsuza kadar sizin olsun.`,
            detailText: `Epic Games Store'da ${game.title} oyunu sınırlı süreliğine ücretsiz. Hesabınıza ekleyin ve kalıcı olarak sahip olun. ${game.description || ''}`,
            campaignUrl: game.link,
            originalUrl: game.link,
            affiliateUrl: null,
            startDate: new Date().toISOString().split('T')[0],
            endDate: this.getEndDate(7), // Epic free games typically last 1 week
            howToUse: ['Epic Games hesabınızla giriş yapın', 'Ücretsiz oyunu kütüphanenize ekleyin', 'İndirip oynayın'],
            category: 'gaming',
            tags: ['Epic Games', 'Ücretsiz Oyun', 'PC Gaming', 'Free Game'],
            channel: 'online',
          };
          
          campaigns.push(campaign);
        } catch (error) {
          console.error(`❌ ${this.sourceName}: Game parse hatası:`, error.message);
        }
      }

      if (campaigns.length === 0) {
        console.log(`⚠️  ${this.sourceName}: Canlı kampanya bulunamadı`);
      }

      console.log(`✅ ${this.sourceName}: ${campaigns.length} kampanya bulundu`);
      return campaigns;
    } catch (error) {
      console.error(`❌ ${this.sourceName}: Scraping hatası:`, error.message);
      return [];
    }
  }

  /**
   * Create anchor campaigns for Epic Games
   */
  createAnchorCampaigns() {
    // Anchor/placeholder kampanyalar devre dışı.
    return [];
  }

  /**
   * Infinite scroll
   */
  async autoScroll() {
    try {
      await this.page.evaluate(async () => {
        await new Promise((resolve) => {
          let totalHeight = 0;
          const distance = 100;
          const maxScrolls = 10;
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

      await this.page.waitForTimeout(2000);
    } catch (error) {
      console.warn(`⚠️  ${this.sourceName}: Auto scroll hatası:`, error.message);
    }
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

module.exports = EpicGamesScraper;
