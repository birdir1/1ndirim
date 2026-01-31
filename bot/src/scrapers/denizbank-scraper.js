/**
 * DenizBank Campaign Scraper
 * DenizBank'ın public kampanya sayfasını okur
 */

const BaseScraper = require('./base-scraper');

class DenizbankScraper extends BaseScraper {
  constructor() {
    super('DenizBank', 'https://www.denizbank.com/kampanyalar');
  }

  /**
   * DenizBank kampanyalarını scrape eder
   */
  async scrape() {
    const campaigns = [];

    try {
      // DenizBank kampanya sayfasını yükle
      await this.page.goto(this.sourceUrl, {
        waitUntil: 'networkidle2',
        timeout: 30000,
      });
      await this.page.waitForTimeout(3000);

      // Kampanya linklerini bul
      const campaignLinks = await this.page.evaluate(() => {
        const links = Array.from(document.querySelectorAll('a[href*="/kampanyalar/"], a[href*="/kampanya/"]'));
        return links
          .filter(a => !a.href.includes('#') && a.textContent.trim().length > 5)
          .map(a => ({
            href: a.href,
            text: a.textContent.trim() || a.querySelector('h2, h3, h4, .title, .campaign-title')?.textContent.trim() || '',
          }))
          .filter(link => link.href && link.text.length > 5)
          .filter((link, index, self) => 
            index === self.findIndex(l => l.href === link.href)
          ); // Duplicate'leri kaldır
      });

      if (campaignLinks.length === 0) {
        console.warn(`⚠️ ${this.sourceName}: Kampanya linki bulunamadı`);
        return campaigns;
      }

      // İlk 15 linki kullan
      for (const link of campaignLinks.slice(0, 15)) {
        try {
          const campaign = await this.parseCampaignFromLink(link.href, link.text);
          if (campaign) {
            campaigns.push(campaign);
          }
        } catch (error) {
          console.error(`❌ ${this.sourceName}: Link parse hatası (${link.href}):`, error.message);
        }
      }

      console.log(`✅ ${this.sourceName}: ${campaigns.length} kampanya bulundu`);
      return campaigns;
    } catch (error) {
      throw new Error(`DenizBank scraper hatası: ${error.message}`);
    }
  }

  /**
   * Kampanya detay sayfasından bilgi çıkarır
   */
  async parseCampaignFromLink(url, title) {
    try {
      // Detay sayfasına git
      await this.page.goto(url, {
        waitUntil: 'networkidle2',
        timeout: 15000,
      });
      await this.page.waitForTimeout(2000);

      // Sayfa içeriğini al
      const content = await this.page.evaluate(() => {
        const main = document.querySelector('main, [role="main"], .main-content, .content') || document.body;
        const h1 = document.querySelector('h1');
        const h2 = document.querySelector('h2');
        // Script tag'lerini ve URL'leri filtrele
        const paragraphs = Array.from(document.querySelectorAll('p'))
          .map(p => p.textContent.trim())
          .filter(t => t.length > 20 && !t.startsWith('http') && !t.includes('.js') && !t.includes('chatbot'));
        return {
          title: (h1 || h2)?.textContent.trim() || '',
          description: paragraphs[0] || paragraphs[1] || (h1 || h2)?.textContent.trim() || '',
          fullText: main.textContent.trim().substring(0, 2000),
        };
      });

      // Tarih bilgisi bul (text-based)
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

      // PHASE 1: Sub-category detection
      const subCategory = this.detectSubCategory(content.title, content.description, content.fullText);

      // Normalize edilmiş kampanya objesi
      return {
        sourceName: this.sourceName,
        title: content.title || title || 'DenizBank Kampanyası',
        description: content.description || content.title || title,
        detailText: content.fullText.substring(0, 500),
        campaignUrl: url,
        originalUrl: url,
        affiliateUrl: null,
        startDate: new Date().toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0],
        howToUse: [],
        category: 'finance', // PHASE 1: Always finance for banks
        subCategory, // PHASE 1: Detected sub-category
        tags: ['DenizBank', subCategory].filter((t, i, a) => a.indexOf(t) === i),
        channel: 'online',
      };
    } catch (error) {
      console.error(`❌ ${this.sourceName}: Detay sayfası parse hatası (${url}):`, error.message);
      return null; // PHASE 1: Return null on error, don't save placeholder
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
}

module.exports = DenizbankScraper;
