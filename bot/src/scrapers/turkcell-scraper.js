/**
 * Turkcell Campaign Scraper
 * Turkcell'in public kampanya sayfasını okur
 */

const BaseScraper = require('./base-scraper');

class TurkcellScraper extends BaseScraper {
  constructor() {
    super('Turkcell', 'https://www.turkcell.com.tr/kampanyalar');
  }

  /**
   * Turkcell kampanyalarını scrape eder
   * Kategori sayfalarındaki kampanyaları bulur
   */
  async scrape() {
    const campaigns = [];

    try {
      // Turkcell kampanya sayfasını yükle
      await this.page.goto(this.sourceUrl, {
        waitUntil: 'networkidle2',
        timeout: 30000,
      });
      await this.page.waitForTimeout(3000);

      // Kategori kartlarındaki linkleri bul
      const categoryLinks = await this.page.evaluate(() => {
        const links = Array.from(document.querySelectorAll('a[href*="/kampanyalar/"][class*="route-card"], a[href*="/kampanyalar/"][class*="card"]'));
        return links
          .map(a => ({
            href: a.href,
            text: a.textContent.trim() || a.querySelector('h2, h3')?.textContent.trim() || '',
          }))
          .filter(link => link.href && !link.href.includes('#') && link.text.length > 5)
          .filter((link, index, self) => 
            index === self.findIndex(l => l.href === link.href)
          ); // Duplicate'leri kaldır
      });

      if (categoryLinks.length === 0) {
        // Fallback: Tüm kampanya linklerini bul
        const allLinks = await this.page.evaluate(() => {
          const links = Array.from(document.querySelectorAll('a[href*="/kampanyalar/"]'));
          return links
            .filter(a => !a.href.includes('#') && a.textContent.trim().length > 5)
            .map(a => ({
              href: a.href,
              text: a.textContent.trim(),
            }))
            .filter((link, index, self) => 
              index === self.findIndex(l => l.href === link.href)
            );
        });

        if (allLinks.length === 0) {
          console.warn(`⚠️ ${this.sourceName}: Kampanya linki bulunamadı`);
          return campaigns;
        }

        // İlk 10 linki kullan
        for (const link of allLinks.slice(0, 10)) {
          try {
            const campaign = await this.parseCampaignFromLink(link.href, link.text);
            if (campaign) {
              campaigns.push(campaign);
            }
          } catch (error) {
            console.error(`❌ ${this.sourceName}: Link parse hatası (${link.href}):`, error.message);
          }
        }
      } else {
        // Kategori sayfalarına git ve kampanyaları bul
        for (const categoryLink of categoryLinks.slice(0, 3)) {
          try {
            const categoryCampaigns = await this.parseCategoryPage(categoryLink.href);
            campaigns.push(...categoryCampaigns);
          } catch (error) {
            console.error(`❌ ${this.sourceName}: Kategori sayfası hatası (${categoryLink.href}):`, error.message);
          }
        }
      }

      console.log(`✅ ${this.sourceName}: ${campaigns.length} kampanya bulundu`);
      return campaigns;
    } catch (error) {
      throw new Error(`Turkcell scraper hatası: ${error.message}`);
    }
  }

  /**
   * Kategori sayfasındaki kampanyaları parse eder
   */
  async parseCategoryPage(url) {
    const campaigns = [];
    
    try {
      await this.page.goto(url, {
        waitUntil: 'networkidle2',
        timeout: 15000,
      });
      await this.page.waitForTimeout(3000);

      // Kampanya linklerini bul
      const campaignLinks = await this.page.evaluate(() => {
        const links = Array.from(document.querySelectorAll('a[href*="/kampanyalar/"], a[href*="/kampanya/"]'));
        return links
          .filter(a => !a.href.includes('#') && a.textContent.trim().length > 5)
          .map(a => ({
            href: a.href,
            text: a.textContent.trim(),
            parentText: a.parentElement?.textContent.trim().substring(0, 200) || '',
          }))
          .filter((link, index, self) => 
            index === self.findIndex(l => l.href === link.href)
          )
          .slice(0, 10); // Her kategoriden max 10 kampanya
      });

      // Her kampanya linkini parse et
      for (const link of campaignLinks) {
        try {
          const campaign = await this.parseCampaignFromLink(link.href, link.text);
          if (campaign) {
            campaigns.push(campaign);
          }
        } catch (error) {
          console.error(`❌ ${this.sourceName}: Kampanya parse hatası (${link.href}):`, error.message);
        }
      }
    } catch (error) {
      console.error(`❌ ${this.sourceName}: Kategori sayfası yükleme hatası:`, error.message);
    }

    return campaigns;
  }

  /**
   * Kampanya detay sayfasından bilgi çıkarır
   */
  async parseCampaignFromLink(url, title) {
    try {
      await this.page.goto(url, {
        waitUntil: 'networkidle2',
        timeout: 15000,
      });
      await this.page.waitForTimeout(2000);

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

      // Tarih bilgisi bul
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

      // Değer bul
      const valueMatch = content.fullText.match(/(\d+)\s*%|(\d+[.,]\d+|\d+)\s*tl/i);
      const hasValue = valueMatch || content.title.match(/%|tl|indirim|cashback|faiz/i);

      return {
        sourceName: this.sourceName,
        title: content.title || title || 'Turkcell Kampanyası',
        description: content.description || content.title || title,
        detailText: content.fullText.substring(0, 500),
        campaignUrl: url,
        originalUrl: url, // Quality filter için
        affiliateUrl: null, // YENİ (opsiyonel, şimdilik null, manuel affiliate URL'ler kabul edilebilir)
        startDate: new Date().toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0],
        howToUse: [],
        category: hasValue ? 'discount' : 'other',
        tags: ['Turkcell'],
        channel: 'online',
      };
    } catch (error) {
      console.error(`❌ ${this.sourceName}: Detay sayfası parse hatası (${url}):`, error.message);
      return {
        sourceName: this.sourceName,
        title: title || 'Turkcell Kampanyası',
        description: title || '',
        detailText: '',
        campaignUrl: url,
        originalUrl: url,
        affiliateUrl: null, // YENİ (opsiyonel, şimdilik null)
        startDate: new Date().toISOString().split('T')[0],
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        howToUse: [],
        category: 'other',
        tags: ['Turkcell'],
        channel: 'online',
      };
    }
  }

  /**
   * Tek bir kampanya elementini parse eder
   */
  async parseCampaignElement(element) {
    // Başlık
    const titleElement = await element.$('.campaign-title, h3, h4, .title, [data-title]');
    const title = titleElement
      ? await this.page.evaluate((el) => el.textContent.trim(), titleElement)
      : null;

    if (!title) {
      return null;
    }

    // Açıklama
    const descriptionElement = await element.$('.campaign-description, .description, p, .summary');
    const description = descriptionElement
      ? await this.page.evaluate((el) => el.textContent.trim(), descriptionElement)
      : '';

    // Link
    const linkElement = await element.$('a[href]');
    const link = linkElement
      ? await this.page.evaluate((el) => {
          const href = el.getAttribute('href');
          return href.startsWith('http') ? href : `https://www.turkcell.com.tr${href}`;
        }, linkElement)
      : this.sourceUrl;

    // Tarih bilgisi (varsa)
    const dateElement = await element.$('.campaign-date, .date, .end-date, [data-date]');
    const dateText = dateElement
      ? await this.page.evaluate((el) => el.textContent.trim(), dateElement)
      : '';

    // End date parse et
    let endDate = new Date();
    endDate.setDate(endDate.getDate() + 30); // Varsayılan: 30 gün sonra

    if (dateText) {
      const dateMatch = dateText.match(/(\d{1,2})[./](\d{1,2})[./](\d{4})/);
      if (dateMatch) {
        const [, day, month, year] = dateMatch;
        endDate = new Date(`${year}-${month}-${day}`);
      }
    }

    // Normalize edilmiş kampanya objesi
    return {
      sourceName: this.sourceName,
      title: title.trim(),
      description: description.trim() || title.trim(),
      detailText: description.trim() || '',
      campaignUrl: link,
      originalUrl: link,
      affiliateUrl: null, // YENİ (opsiyonel, şimdilik null)
      startDate: new Date().toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0],
      howToUse: [],
      category: 'discount',
      tags: ['Turkcell'],
      channel: 'online',
    };
  }
}

module.exports = TurkcellScraper;
