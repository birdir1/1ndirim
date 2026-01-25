/**
 * TEB Fetch Scraper
 * FAZ 7.1: TEB için fetch-based scraper (SPA yapı nedeniyle)
 * Network tab analizi sonucu oluşturulmuştur
 */

const BaseFetchScraper = require('./base-fetch-scraper');

class TebFetchScraper extends BaseFetchScraper {
  constructor() {
    super('TEB', 'https://www.teb.com.tr');
    // TEB'in XML endpoint'i network analizi sonucu bulundu
    this.apiEndpoint = 'https://www.teb.com.tr/kampanya-slider.xml?bnr=5508';
  }

  /**
   * API endpoint'i döndürür
   */
  getApiEndpoint() {
    return this.apiEndpoint;
  }

  /**
   * XML response'unu parse eder
   * TEB XML formatı: <index><item thumbnailText="..." href="..." .../></index>
   */
  parseApiResponse(xmlData) {
    const campaigns = [];

    try {
      // XML string'ini parse et (basit regex ile)
      // <item> elementlerini bul
      const itemRegex = /<item\s+([^>]+)\/>/g;
      let match;

      while ((match = itemRegex.exec(xmlData)) !== null) {
        const attributes = match[1];
        
        // Attribute'ları parse et
        const attrs = {};
        const attrRegex = /(\w+)="([^"]+)"/g;
        let attrMatch;
        
        while ((attrMatch = attrRegex.exec(attributes)) !== null) {
          attrs[attrMatch[1]] = attrMatch[2];
        }

        // Kampanya oluştur
        const campaign = this.parseCampaignItem(attrs);
        if (campaign) {
          campaigns.push(campaign);
        }
      }

      return campaigns;
    } catch (error) {
      console.error(`❌ TEB XML parse hatası:`, error.message);
      return [];
    }
  }

  /**
   * Tek bir kampanya item'ını parse eder (XML attribute'larından)
   */
  parseCampaignItem(attrs) {
    try {
      // TEB XML yapısı:
      // thumbnailText: Kampanya başlığı
      // href: Kampanya URL'i
      // source: Banner resmi
      // thumbnailImage: Thumbnail resmi

      const title = attrs.thumbnailText || '';
      const url = attrs.href || '';
      const imageUrl = attrs.source || attrs.thumbnailImage || '';

      // URL'i tam yap
      let fullUrl = url;
      if (url && !url.startsWith('http')) {
        fullUrl = `https://www.teb.com.tr${url.startsWith('/') ? url : '/' + url}`;
      }

      // Image URL'i tam yap
      let fullImageUrl = imageUrl;
      if (imageUrl && !imageUrl.startsWith('http')) {
        fullImageUrl = `https://www.teb.com.tr${imageUrl.startsWith('/') ? imageUrl : '/' + imageUrl}`;
      }

      // Eğer temel bilgiler yoksa skip et
      if (!title || !fullUrl) {
        return null;
      }

      // "Test içerik" gibi placeholder'ları filtrele
      if (title.toLowerCase().includes('test') || title.toLowerCase().includes('örnek')) {
        return null;
      }

      // Description = title (XML'de ayrı description yok)
      const description = title;

      return this.createCampaign({
        title,
        description: description.substring(0, 500),
        detailText: description.substring(0, 1000),
        campaignUrl: fullUrl,
        originalUrl: fullUrl,
        imageUrl: fullImageUrl || null,
        startDate: this.parseDate(null), // XML'de tarih yok
        endDate: this.parseDate(null), // XML'de tarih yok
        value: this.parseValue(title), // Title'dan değer çıkarmaya çalış
        category: this.detectCategory(title, description),
        tags: ['TEB', 'FAZ7'],
      });
    } catch (error) {
      console.error(`❌ TEB item parse hatası:`, error.message);
      return null;
    }
  }

  /**
   * Kategori tespit eder
   */
  detectCategory(title, description) {
    const text = (title + ' ' + description).toLowerCase();

    if (text.match(/indirim|discount|%|tl/i)) {
      return 'discount';
    }
    if (text.match(/puan|point|cashback/i)) {
      return 'cashback';
    }
    if (text.match(/hediye|gift|free/i)) {
      return 'gift';
    }

    return 'other';
  }
}

module.exports = TebFetchScraper;
