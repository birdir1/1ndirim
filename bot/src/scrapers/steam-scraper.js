/**
 * Steam Campaign Scraper
 * Steam free weekend ve sale kampanyalarını toplar (Keşfet - Gaming kategorisi için)
 * 
 * CREATED: Phase 3.8
 * - Scrapes Steam specials page
 * - Category: gaming
 * - Sub-category: Steam
 */

const BaseScraper = require('./base-scraper');

class SteamScraper extends BaseScraper {
  constructor() {
    super('Steam', 'https://store.steampowered.com/specials');
  }

  /**
   * Steam kampanyalarını scrape eder
   */
  async scrape() {
    const campaigns = [];

    try {
      await this.page.goto(this.sourceUrl, {
        waitUntil: 'networkidle2',
        timeout: 30000,
      });
      
      await this.page.waitForTimeout(3000);

      // Scroll to load more content
      await this.autoScroll();

      // Steam special offers
      const offers = await this.page.evaluate(() => {
        const items = [];
        
        // Try different selectors for Steam specials
        const specialCards = document.querySelectorAll('.special, .tab_item, .store_main_capsule');
        
        for (const card of Array.from(specialCards).slice(0, 10)) {
          try {
            const titleEl = card.querySelector('.tab_item_name, .game_name, h4, .title');
            const title = titleEl?.textContent.trim() || '';
            
            const discountEl = card.querySelector('.discount_pct, .discount_percentage');
            const discount = discountEl?.textContent.trim() || '';
            
            const priceEl = card.querySelector('.discount_final_price, .final_price');
            const price = priceEl?.textContent.trim() || '';
            
            const linkEl = card.querySelector('a[href]');
            const link = linkEl?.href || '';
            
            if (title && link) {
              items.push({ title, discount, price, link });
            }
          } catch (e) {
            // Skip invalid items
          }
        }
        
        return items;
      });

      // Parse offers into campaigns
      for (const offer of offers) {
        try {
          const campaign = {
            sourceName: this.sourceName,
            title: `${offer.title}${offer.discount ? ` - ${offer.discount} İndirim` : ''}`,
            description: `Steam'de ${offer.title} oyunu${offer.discount ? ` ${offer.discount} indirimde` : ' özel fiyatta'}. ${offer.price || 'Detaylar için tıklayın.'}`,
            detailText: `Steam platformunda ${offer.title} oyunu için özel kampanya. ${offer.discount ? `${offer.discount} indirim fırsatı.` : ''} ${offer.price || ''}`,
            campaignUrl: offer.link,
            originalUrl: offer.link,
            affiliateUrl: null,
            startDate: new Date().toISOString().split('T')[0],
            endDate: this.getEndDate(7), // Steam sales typically last 7 days
            howToUse: ['Steam hesabınızla giriş yapın', 'Oyunu sepete ekleyin', 'Ödeme yapın ve indirin'],
            category: 'gaming',
            tags: ['Steam', 'Oyun', 'PC Gaming', offer.discount ? 'İndirim' : 'Özel Fiyat'].filter(Boolean),
            channel: 'online',
          };
          
          campaigns.push(campaign);
        } catch (error) {
          console.error(`❌ ${this.sourceName}: Offer parse hatası:`, error.message);
        }
      }

      // If no campaigns found, create anchor campaigns
      if (campaigns.length === 0) {
        console.log(`⚠️  ${this.sourceName}: Canlı kampanya bulunamadı, anchor kampanyalar oluşturuluyor`);
        campaigns.push(...this.createAnchorCampaigns());
      }

      console.log(`✅ ${this.sourceName}: ${campaigns.length} kampanya bulundu`);
      return campaigns;
    } catch (error) {
      console.error(`❌ ${this.sourceName}: Scraping hatası, anchor kampanyalar oluşturuluyor:`, error.message);
      return this.createAnchorCampaigns();
    }
  }

  /**
   * Create anchor campaigns for Steam
   */
  createAnchorCampaigns() {
    return [
      {
        sourceName: this.sourceName,
        title: 'Steam Haftalık İndirimler',
        description: 'Steam\'de her hafta yüzlerce oyun indirime giriyor. En popüler oyunları kaçırmayın!',
        detailText: 'Steam platformunda her hafta düzenlenen özel indirim kampanyaları. AAA oyunlardan indie yapımlara kadar geniş oyun yelpazesi.',
        campaignUrl: 'https://store.steampowered.com/specials',
        originalUrl: 'https://store.steampowered.com/specials',
        affiliateUrl: null,
        startDate: new Date().toISOString().split('T')[0],
        endDate: this.getEndDate(7),
        howToUse: ['Steam\'i ziyaret edin', 'İndirimli oyunlara göz atın', 'Sepete ekleyip satın alın'],
        category: 'gaming',
        tags: ['Steam', 'Oyun', 'İndirim', 'PC Gaming'],
        channel: 'online',
      },
      {
        sourceName: this.sourceName,
        title: 'Steam Ücretsiz Hafta Sonu',
        description: 'Seçili oyunları hafta sonu boyunca ücretsiz oynayın!',
        detailText: 'Steam\'de belirli oyunlar hafta sonu boyunca tamamen ücretsiz. Oyunu test edin, beğenirseniz indirimli fiyattan satın alın.',
        campaignUrl: 'https://store.steampowered.com/specials',
        originalUrl: 'https://store.steampowered.com/specials',
        affiliateUrl: null,
        startDate: new Date().toISOString().split('T')[0],
        endDate: this.getEndDate(3),
        howToUse: ['Steam\'i açın', 'Ücretsiz hafta sonu oyunlarını bulun', 'İndirip oynayın'],
        category: 'gaming',
        tags: ['Steam', 'Ücretsiz', 'Free Weekend', 'PC Gaming'],
        channel: 'online',
      },
      {
        sourceName: this.sourceName,
        title: 'Steam Mevsimsel İndirimler',
        description: 'Yaz, kış ve özel günlerde dev indirimler! %90\'a varan fırsatlar.',
        detailText: 'Steam\'in meşhur mevsimsel indirim kampanyaları. Binlerce oyun %90\'a varan indirimlerle.',
        campaignUrl: 'https://store.steampowered.com/specials',
        originalUrl: 'https://store.steampowered.com/specials',
        affiliateUrl: null,
        startDate: new Date().toISOString().split('T')[0],
        endDate: this.getEndDate(14),
        howToUse: ['Steam\'i ziyaret edin', 'İstek listenizi kontrol edin', 'İndirimli oyunları satın alın'],
        category: 'gaming',
        tags: ['Steam', 'Mevsimsel İndirim', 'Büyük İndirim', 'PC Gaming'],
        channel: 'online',
      },
    ];
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

module.exports = SteamScraper;
