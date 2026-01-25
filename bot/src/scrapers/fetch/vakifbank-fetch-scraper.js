/**
 * VakıfBank Fetch Scraper
 * FAZ 7.4: VakıfBank için fetch-based scraper (SPA yapı nedeniyle)
 * Network analizi sonucu oluşturulacak
 * 
 * NOT: Bu dosya placeholder'dır. Network analizi yapıldıktan sonra:
 * 1. apiEndpoint değerini güncelle
 * 2. parseApiResponse metodunu implement et
 * 3. parseCampaignItem metodunu implement et
 */

const BaseFetchScraper = require('./base-fetch-scraper');

class VakifbankFetchScraper extends BaseFetchScraper {
  constructor() {
    super('VakıfBank', 'https://www.vakifbank.com.tr');
    // TODO: Network analizi sonucu endpoint URL'i buraya eklenecek
    this.apiEndpoint = null; // Network analizi sonucu set edilecek
  }

  /**
   * API endpoint'i döndürür
   */
  getApiEndpoint() {
    if (!this.apiEndpoint) {
      throw new Error('VakıfBank: API endpoint tanımlanmamış. Network analizi yapılmalı.');
    }
    return this.apiEndpoint;
  }

  /**
   * API response'unu parse eder
   * TODO: Network analizi sonucu response formatına göre implement edilecek
   */
  parseApiResponse(data) {
    const campaigns = [];

    // TODO: Network analizi sonucu response formatına göre parse logic eklenecek
    // Örnek JSON formatı:
    // if (Array.isArray(data)) {
    //   data.forEach(item => {
    //     const campaign = this.parseCampaignItem(item);
    //     if (campaign) campaigns.push(campaign);
    //   });
    // }

    console.warn('⚠️ VakıfBank: parseApiResponse() henüz implement edilmedi. Network analizi gerekli.');
    return campaigns;
  }

  /**
   * Tek bir kampanya item'ını parse eder
   * TODO: Network analizi sonucu item formatına göre implement edilecek
   */
  parseCampaignItem(item) {
    // TODO: Network analizi sonucu item formatına göre parse logic eklenecek
    // Örnek:
    // return this.createCampaign({
    //   title: item.title || item.name,
    //   description: item.description || '',
    //   campaignUrl: item.url || item.link,
    //   ...
    // });

    return null;
  }
}

module.exports = VakifbankFetchScraper;
