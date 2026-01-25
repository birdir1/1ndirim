/**
 * İş Bankası Campaign Scraper
 * İş Bankası'nın public kampanya sayfasını okur
 */

const BaseScraper = require('./base-scraper');

class IsbankScraper extends BaseScraper {
  constructor() {
    super('İş Bankası', 'https://www.isbank.com.tr/kampanyalar');
  }

  /**
   * İş Bankası kampanyalarını scrape eder
   */
  async scrape() {
    const campaigns = [];

    try {
      // İş Bankası kampanya sayfasını yükle
      await this.page.goto(this.sourceUrl, {
        waitUntil: 'networkidle2',
        timeout: 30000,
      });
      await this.page.waitForTimeout(3000);

      // Kampanya linklerini bul
      const campaignLinks = await this.page.evaluate(() => {
        const links = Array.from(document.querySelectorAll('a[href*="/kampanyalar/"]'));
        return links
          .filter(a => !a.href.includes('#') && a.textContent.trim().length > 5)
          .map(a => ({
            href: a.href,
            text: a.textContent.trim() || a.querySelector('h2, h3, h4, .title')?.textContent.trim() || '',
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
      throw new Error(`İş Bankası scraper hatası: ${error.message}`);
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
        const paragraphs = Array.from(document.querySelectorAll('p')).map(p => p.textContent.trim()).filter(t => t.length > 20);
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
        title: content.title || title || 'İş Bankası Kampanyası',
        description: content.description || content.title || title,
        detailText: content.fullText.substring(0, 500),
        campaignUrl: url,
        originalUrl: url,
        affiliateUrl: null,
        startDate: new Date().toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0],
        howToUse: [],
        category: hasValue ? 'discount' : 'other',
        tags: ['İş Bankası'],
        channel: 'online',
      };
    } catch (error) {
      console.error(`❌ ${this.sourceName}: Detay sayfası parse hatası (${url}):`, error.message);
      // Hata durumunda minimal kampanya döndür
      return {
        sourceName: this.sourceName,
        title: title || 'İş Bankası Kampanyası',
        description: title || '',
        detailText: '',
        campaignUrl: url,
        originalUrl: url,
        affiliateUrl: null,
        startDate: new Date().toISOString().split('T')[0],
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        howToUse: [],
        category: 'other',
        tags: ['İş Bankası'],
        channel: 'online',
      };
    }
  }
}

module.exports = IsbankScraper;
