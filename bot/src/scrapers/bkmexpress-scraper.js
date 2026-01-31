/**
 * BKM Express Campaign Scraper
 * PHASE 1: High-yield wallet scraper
 */

const BaseScraper = require('./base-scraper');

class BKMExpressScraper extends BaseScraper {
  constructor() {
    super('BKM Express', 'https://www.bkmexpress.com.tr/kampanyalar');
  }

  async scrape() {
    const campaigns = [];

    try {
      await this.page.goto(this.sourceUrl, {
        waitUntil: 'networkidle2',
        timeout: 30000,
      });
      await this.page.waitForTimeout(3000);

      const campaignLinks = await this.page.evaluate(() => {
        const allLinks = Array.from(document.querySelectorAll('a[href]'));
        const links = allLinks
          .filter(a => {
            const href = a.href.toLowerCase();
            const text = a.textContent.trim().toLowerCase();
            return (href.includes('/kampanya') && !href.endsWith('/kampanyalar'))
              && !href.includes('#')
              && !href.includes('javascript:')
              && text.length > 5;
          })
          .map(a => {
            const href = a.href;
            const fullUrl = href.startsWith('http') ? href : `https://www.bkmexpress.com.tr${href}`;
            return {
              href: fullUrl,
              text: a.textContent.trim() || a.querySelector('h2, h3, h4, .title')?.textContent.trim() || '',
            };
          })
          .filter(link => link.href && link.text.length > 5)
          .filter((link, index, self) => 
            index === self.findIndex(l => l.href === link.href)
          );
        return links;
      });

      if (campaignLinks.length === 0) {
        console.warn(`⚠️  ${this.sourceName}: Kampanya linki bulunamadı`);
        return campaigns;
      }

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
      throw new Error(`BKM Express scraper hatası: ${error.message}`);
    }
  }

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

      const subCategory = this.detectSubCategory(content.title, content.description, content.fullText);

      return {
        sourceName: this.sourceName,
        title: content.title || title || 'BKM Express Kampanyası',
        description: content.description || content.title || title,
        detailText: content.fullText.substring(0, 500),
        campaignUrl: url,
        originalUrl: url,
        affiliateUrl: null,
        startDate: new Date().toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0],
        howToUse: [],
        category: 'finance',
        subCategory,
        tags: ['BKM Express', subCategory].filter((t, i, a) => a.indexOf(t) === i),
        channel: 'online',
      };
    } catch (error) {
      console.error(`❌ ${this.sourceName}: Detay sayfası parse hatası (${url}):`, error.message);
      return null;
    }
  }

  detectSubCategory(title, description, fullText) {
    const text = `${title} ${description} ${fullText}`.toLowerCase();

    if (text.match(/yemek|restoran|kafe|cafe|lokanta|pizza|burger|fast food|yemeksepeti|getir/i)) {
      return 'food';
    }
    if (text.match(/uçak|otel|tatil|seyahat|thy|pegasus|booking|hotel|flight|travel/i)) {
      return 'travel';
    }
    if (text.match(/akaryakıt|benzin|motorin|lpg|shell|opet|petrol ofisi|bp|total/i)) {
      return 'fuel';
    }
    if (text.match(/sinema|tiyatro|konser|müze|eğlence|netflix|spotify|cinema|theater/i)) {
      return 'entertainment';
    }
    if (text.match(/alışveriş|market|süpermarket|migros|carrefour|shopping|mall|avm/i)) {
      return 'shopping';
    }
    if (text.match(/taksi|uber|bitaksi|toplu taşıma|metro|otobüs|transport/i)) {
      return 'transport';
    }

    return 'general';
  }
}

module.exports = BKMExpressScraper;
