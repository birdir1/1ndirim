/**
 * Enpara Campaign Scraper
 * Enpara'nın public kampanya sayfasını okur
 */

const BaseScraper = require('./base-scraper');

class EnparaScraper extends BaseScraper {
  constructor() {
    super('Enpara', 'https://www.enpara.com/kampanyalar');
  }

  /**
   * Enpara kampanyalarını scrape eder
   */
  async scrape() {
    const campaigns = [];

    try {
      // Enpara kampanya sayfasını yükle
      await this.page.goto(this.sourceUrl, {
        waitUntil: 'networkidle2',
        timeout: 30000,
      });
      await this.page.waitForTimeout(3000);

      // Kampanya linklerini bul
      const campaignLinks = await this.page.evaluate(() => {
        const allLinks = Array.from(document.querySelectorAll('a[href]'));
        const links = allLinks
          .filter(a => {
            const href = a.href.toLowerCase();
            const text = a.textContent.trim().toLowerCase();
            // Enpara yapısı: /kampanyalar/ altında kampanyalar
            return (href.includes('/kampanyalar/') && !href.endsWith('/kampanyalar') && !href.endsWith('/kampanyalar/'))
              || (href.includes('/kampanya/') && !href.endsWith('/kampanya'))
              || (href.includes('promosyon') || href.includes('firsat') || href.includes('avantaj'))
              && !href.includes('#')
              && !href.includes('javascript:')
              && text.length > 5
              && !text.includes('tüm kampanyalar')
              && !text.includes('kampanyalar');
          })
          .map(a => {
            const href = a.href;
            const fullUrl = href.startsWith('http') ? href : `https://www.enpara.com${href}`;
            return {
              href: fullUrl,
              text: a.textContent.trim() || a.querySelector('h2, h3, h4, .title, .campaign-title')?.textContent.trim() || '',
            };
          })
          .filter(link => link.href && link.text.length > 5)
          .filter((link, index, self) => 
            index === self.findIndex(l => l.href === link.href)
          ); // Duplicate'leri kaldır
        return links;
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
      throw new Error(`Enpara scraper hatası: ${error.message}`);
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

      // İndirim/cashback miktarı bul
      const valueMatch = content.fullText.match(/(\d+)\s*%|(\d+[.,]\d+|\d+)\s*tl/i);
      const hasValue = valueMatch || content.title.match(/%|tl|indirim|cashback|faiz/i);

      // Normalize edilmiş kampanya objesi
      return {
        sourceName: this.sourceName,
        title: content.title || title || 'Enpara Kampanyası',
        description: content.description || content.title || title,
        detailText: content.fullText.substring(0, 500),
        campaignUrl: url,
        originalUrl: url,
        affiliateUrl: null,
        startDate: new Date().toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0],
        howToUse: [],
        category: hasValue ? 'discount' : 'other',
        tags: ['Enpara'],
        channel: 'online',
      };
    } catch (error) {
      console.error(`❌ ${this.sourceName}: Detay sayfası parse hatası (${url}):`, error.message);
      // Hata durumunda minimal kampanya döndür
      return {
        sourceName: this.sourceName,
        title: title || 'Enpara Kampanyası',
        description: title || '',
        detailText: '',
        campaignUrl: url,
        originalUrl: url,
        affiliateUrl: null,
        startDate: new Date().toISOString().split('T')[0],
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        howToUse: [],
        category: 'other',
        tags: ['Enpara'],
        channel: 'online',
      };
    }
  }
}

module.exports = EnparaScraper;
