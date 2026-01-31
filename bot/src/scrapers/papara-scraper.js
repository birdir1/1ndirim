/**
 * Papara Campaign Scraper
 * Papara'nın public kampanya sayfasını okur
 * 
 * CREATED: Phase 3.5
 * - Hybrid scraping (network + DOM)
 * - Category: finance
 * - Tiered selectors for robustness
 */

const BaseScraper = require('./base-scraper');

class PaparaScraper extends BaseScraper {
  constructor() {
    super('Papara', 'https://www.papara.com/kampanyalar');
  }

  /**
   * Papara kampanyalarını scrape eder
   * Hybrid approach: Network responses + DOM fallback
   */
  async scrape() {
    const campaigns = [];

    try {
      // Try network-based scraping first
      await this.init();
      const responses = await this.collectNetworkResponses();
      const fromNetwork = this.getCampaignsFromNetwork(responses);
      
      if (fromNetwork.length > 0) {
        console.log(`🔍 ${this.sourceName}: ${fromNetwork.length} kampanya bulundu (network)`);
        return fromNetwork;
      }

      // Fallback to DOM scraping
      console.log(`⚠️  ${this.sourceName}: Network'ten kampanya bulunamadı, DOM scraping'e geçiliyor`);
      
      await this.page.goto(this.sourceUrl, {
        waitUntil: 'networkidle2',
        timeout: 30000,
      });
      
      // SPA loading için bekle
      await this.page.waitForTimeout(3000);

      // Infinite scroll
      await this.autoScroll();

      // Kampanya linklerini bul (tiered selectors)
      const campaignLinks = await this.tryTieredLinks({
        primary: 'a[href*="/kampanya/"]',
        secondary: 'a[href*="/kampanyalar/"]',
        fallback: ['.campaign-card a', '.kampanya-card a', 'article a', '.card a'],
      });

      if (campaignLinks.length === 0) {
        console.warn(`⚠️  ${this.sourceName}: Kampanya linki bulunamadı`);
        return campaigns;
      }

      console.log(`🔍 ${this.sourceName}: ${campaignLinks.length} kampanya linki bulundu (DOM)`);

      // İlk 10 linki kullan (hedef: 5-10 kampanya)
      const uniqueLinks = [...new Set(campaignLinks)].slice(0, 10);

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
      throw new Error(`Papara scraper hatası: ${error.message}`);
    }
  }

  /**
   * Network response'larından kampanya listesi çıkarır
   * Override from BaseScraper
   */
  getCampaignsFromNetwork(responses) {
    const campaigns = [];
    
    // Papara API response'larını ara
    const campaignResponse = responses.find(r => 
      r.url.includes('/api/campaigns') || 
      r.url.includes('/kampanyalar') ||
      r.url.includes('/api/kampanya')
    );
    
    if (!campaignResponse || !campaignResponse.data) {
      return campaigns;
    }

    // API response'dan kampanyaları çıkar
    const data = campaignResponse.data;
    const campaignList = data.campaigns || data.data || data.items || [];

    for (const item of campaignList.slice(0, 10)) {
      try {
        const campaign = {
          sourceName: this.sourceName,
          title: item.title || item.name || 'Papara Kampanyası',
          description: item.description || item.summary || item.title,
          detailText: item.detail || item.content || '',
          campaignUrl: item.url || item.link || this.sourceUrl,
          originalUrl: item.url || item.link || this.sourceUrl,
          affiliateUrl: null,
          startDate: item.startDate || item.start_date || new Date().toISOString().split('T')[0],
          endDate: item.endDate || item.end_date || this.getDefaultEndDate(),
          howToUse: [],
          category: 'finance', // Papara is a digital wallet (finance)
          tags: ['Papara', 'Dijital Cüzdan'],
          channel: 'online',
        };

        campaigns.push(campaign);
      } catch (error) {
        console.error(`❌ ${this.sourceName}: Network kampanya parse hatası:`, error.message);
      }
    }

    return campaigns;
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
          const maxScrolls = 20;
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
   * Kampanya detay sayfasından bilgi çıkarır
   */
  async parseCampaignFromLink(url) {
    try {
      await this.page.goto(url, {
        waitUntil: 'networkidle2',
        timeout: 15000,
      });
      await this.page.waitForTimeout(2000);

      const content = await this.page.evaluate(() => {
        const titleEl = document.querySelector('h1') || 
                       document.querySelector('h2') || 
                       document.querySelector('.title');
        const title = titleEl?.textContent.trim() || '';

        const descEl = document.querySelector('.description') ||
                      document.querySelector('.campaign-description') ||
                      document.querySelector('p');
        const description = descEl?.textContent.trim() || '';

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
      });

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

      // PHASE 1: Sub-category detection
      const subCategory = this.detectSubCategory(content.title, content.description, content.fullText);

      return {
        sourceName: this.sourceName,
        title: content.title || 'Papara Kampanyası',
        description: content.description || content.title,
        detailText: content.fullText.substring(0, 500),
        campaignUrl: url,
        originalUrl: url,
        affiliateUrl: null,
        startDate: new Date().toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0],
        howToUse: [],
        category: 'finance', // PHASE 1: Always finance for wallets
        subCategory, // PHASE 1: Detected sub-category
        tags: ['Papara', subCategory].filter((t, i, a) => a.indexOf(t) === i),
        channel: 'online',
      };
    } catch (error) {
      console.error(`❌ ${this.sourceName}: Detay sayfası parse hatası (${url}):`, error.message);
      return null;
    }
  }

  /**
   * PHASE 1: Detect sub-category from campaign content
   */
  detectSubCategory(title, description, fullText) {
    const text = `${title} ${description} ${fullText}`.toLowerCase();

    // Food & Dining
    if (text.match(/yemek|restoran|kafe|cafe|lokanta|pizza|burger|fast food|yemeksepeti|getir/i)) {
      return 'food';
    }

    // Travel
    if (text.match(/uçak|otel|tatil|seyahat|thy|pegasus|booking|hotel|flight|travel/i)) {
      return 'travel';
    }

    // Fuel
    if (text.match(/akaryakıt|benzin|motorin|lpg|shell|opet|petrol ofisi|bp|total/i)) {
      return 'fuel';
    }

    // Entertainment
    if (text.match(/sinema|tiyatro|konser|müze|eğlence|netflix|spotify|cinema|theater/i)) {
      return 'entertainment';
    }

    // Shopping
    if (text.match(/alışveriş|market|süpermarket|migros|carrefour|shopping|mall|avm/i)) {
      return 'shopping';
    }

    // Transport
    if (text.match(/taksi|uber|bitaksi|toplu taşıma|metro|otobüs|transport/i)) {
      return 'transport';
    }

    return 'general'; // Default sub-category
  }

  /**
   * Helper: Default end date (30 days from now)
   */
  getDefaultEndDate() {
    const date = new Date();
    date.setDate(date.getDate() + 30);
    return date.toISOString().split('T')[0];
  }
}

module.exports = PaparaScraper;
