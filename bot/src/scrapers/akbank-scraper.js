/**
 * Akbank Campaign Scraper
 * Akbank'ın public kampanya sayfasını okur
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
      // Akbank kampanya sayfasını yükle (selector beklemeden)
      await this.page.goto(this.sourceUrl, {
        waitUntil: 'networkidle2',
        timeout: 30000,
      });
      await this.page.waitForTimeout(3000);

      // FAZ 11.2: Tiered selectors — primary: semantic/testid, secondary: stable class, fallback: generic
      const tiered = await this.tryTieredLinks({
        primary: ['[data-testid*="kampanya"] a', '[data-testid*="campaign"] a', '[aria-label*="kampanya"]'],
        secondary: ['a.dropdown__item[href*="/kampanyalar/"]'],
        fallback: ['a[href*="/kampanyalar/"]'],
      });
      const campaignLinks = tiered ? tiered.links.filter((l) => !l.href.includes('#') && l.text.length > 1) : [];

      if (campaignLinks.length === 0) {
        console.warn(`⚠️ ${this.sourceName}: Kampanya linki bulunamadı`);
        return campaigns;
      }

      const linksToUse = campaignLinks.slice(0, 15);
      const tierUsed = tiered ? tiered.tier : null;
      for (const link of linksToUse) {
        try {
          const campaign = await this.parseCampaignFromLink(link.href, link.text);
          if (campaign) {
            if (tierUsed) campaign.selectorTier = tierUsed;
            campaigns.push(campaign);
          }
        } catch (error) {
          console.error(`❌ ${this.sourceName}: Link parse hatası (${link.href}):`, error.message);
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
        title: content.title || title || 'Akbank Kampanyası',
        description: content.description || content.title || title,
        detailText: content.fullText.substring(0, 500),
        campaignUrl: url,
        originalUrl: url, // Quality filter için
        affiliateUrl: null, // YENİ (opsiyonel, şimdilik null, manuel affiliate URL'ler kabul edilebilir)
        startDate: new Date().toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0],
        howToUse: [],
        category: hasValue ? 'discount' : 'other',
        tags: ['Akbank'],
        channel: 'online',
      };
    } catch (error) {
      console.error(`❌ ${this.sourceName}: Detay sayfası parse hatası (${url}):`, error.message);
      // Hata durumunda minimal kampanya döndür
      return {
        sourceName: this.sourceName,
        title: title || 'Akbank Kampanyası',
        description: title || '',
        detailText: '',
        campaignUrl: url,
        originalUrl: url,
        affiliateUrl: null, // YENİ (opsiyonel, şimdilik null)
        startDate: new Date().toISOString().split('T')[0],
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        howToUse: [],
        category: 'other',
        tags: ['Akbank'],
        channel: 'online',
      };
    }
  }

  /**
   * Tek bir kampanya elementini parse eder
   */
  async parseCampaignElement(element) {
    // Başlık
    const titleElement = await element.$('.campaign-title, h3, h4, [data-title]');
    const title = titleElement
      ? await this.page.evaluate((el) => el.textContent.trim(), titleElement)
      : null;

    if (!title) {
      return null;
    }

    // Açıklama
    const descriptionElement = await element.$('.campaign-description, .description, p');
    const description = descriptionElement
      ? await this.page.evaluate((el) => el.textContent.trim(), descriptionElement)
      : '';

    // Link
    const linkElement = await element.$('a[href]');
    const link = linkElement
      ? await this.page.evaluate((el) => {
          const href = el.getAttribute('href');
          return href.startsWith('http') ? href : `https://www.akbank.com${href}`;
        }, linkElement)
      : this.sourceUrl;

    // Tarih bilgisi (varsa)
    const dateElement = await element.$('.campaign-date, .date, [data-date]');
    const dateText = dateElement
      ? await this.page.evaluate((el) => el.textContent.trim(), dateElement)
      : '';

    // End date parse et (basit regex)
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
      tags: ['Akbank'],
      channel: 'online',
    };
  }
}

module.exports = AkbankScraper;
