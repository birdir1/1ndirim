/**
 * Türkiye Finans Campaign Scraper
 * Türkiye Finans'ın public kampanya sayfasını okur
 */

const BaseScraper = require('./base-scraper');

class TurkiyeFinansScraper extends BaseScraper {
  constructor() {
    super('Türkiye Finans', 'https://www.turkiyefinans.com.tr/kampanyalar');
  }

  /**
   * Türkiye Finans kampanyalarını scrape eder
   */
  async scrape() {
    const campaigns = [];

    try {
      // Türkiye Finans kampanya sayfasını yükle
      await this.page.goto(this.sourceUrl, {
        waitUntil: 'networkidle2',
        timeout: 30000,
      });
      await this.page.waitForTimeout(3000);

      // Türkiye Finans yapısı: Kategori sayfaları var, kampanyalar kategori sayfalarında içerik olarak var
      // Kategori sayfalarını bul ve direkt parse et
      const categoryLinks = await this.page.evaluate(() => {
        const allLinks = Array.from(document.querySelectorAll('a[href]'));
        return allLinks
          .filter(a => {
            const href = a.href.toLowerCase();
            return href.includes('/kampanyalar/sayfalar/') 
              && !href.includes('biten-kampanyalar')
              && a.textContent.trim().length > 5;
          })
          .map(a => ({
            href: a.href.startsWith('http') ? a.href : `https://www.turkiyefinans.com.tr${a.href}`,
            text: a.textContent.trim(),
          }))
          .filter((link, index, self) => 
            index === self.findIndex(l => l.href === link.href)
          );
      });

      // Kategori sayfalarını direkt kampanya olarak parse et
      const campaignLinks = [];
      for (const categoryLink of categoryLinks.slice(0, 6)) {
        campaignLinks.push({
          href: categoryLink.href,
          text: categoryLink.text,
        });
      }

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
      throw new Error(`Türkiye Finans scraper hatası: ${error.message}`);
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
        title: content.title || title || 'Türkiye Finans Kampanyası',
        description: content.description || content.title || title,
        detailText: content.fullText.substring(0, 500),
        campaignUrl: url,
        originalUrl: url,
        affiliateUrl: null,
        startDate: new Date().toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0],
        howToUse: [],
        category: hasValue ? 'discount' : 'other',
        tags: ['Türkiye Finans'],
        channel: 'online',
      };
    } catch (error) {
      console.error(`❌ ${this.sourceName}: Detay sayfası parse hatası (${url}):`, error.message);
      // Hata durumunda minimal kampanya döndür
      return {
        sourceName: this.sourceName,
        title: title || 'Türkiye Finans Kampanyası',
        description: title || '',
        detailText: '',
        campaignUrl: url,
        originalUrl: url,
        affiliateUrl: null,
        startDate: new Date().toISOString().split('T')[0],
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        howToUse: [],
        category: 'other',
        tags: ['Türkiye Finans'],
        channel: 'online',
      };
    }
  }
}

module.exports = TurkiyeFinansScraper;
