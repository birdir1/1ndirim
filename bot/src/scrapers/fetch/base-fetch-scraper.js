/**
 * Base Fetch Scraper
 * FAZ 7: SPA/Dinamik yapılı kaynaklar için fetch-based scraper base class
 * Puppeteer kullanmaz, direkt API endpoint'lerden veri çeker
 */

const axios = require('axios');

class BaseFetchScraper {
  constructor(sourceName, baseUrl) {
    this.sourceName = sourceName;
    this.baseUrl = baseUrl;
    this.apiEndpoint = null; // Alt sınıflarda set edilecek
    this.httpClient = axios.create({
      timeout: 30000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/json, text/plain, */*',
        'Accept-Language': 'tr-TR,tr;q=0.9,en-US;q=0.8,en;q=0.7',
        'Referer': this.baseUrl,
      },
    });
  }

  /**
   * API endpoint'i bulur (alt sınıflarda override edilecek)
   * Network tab analizi sonucu endpoint URL'i döndürür
   */
  getApiEndpoint() {
    if (!this.apiEndpoint) {
      throw new Error(`${this.sourceName}: API endpoint tanımlanmamış. getApiEndpoint() override edilmeli.`);
    }
    return this.apiEndpoint;
  }

  /**
   * API'den ham veriyi çeker
   */
  async fetchData(endpoint, params = {}) {
    try {
      // XML için Accept header'ı güncelle
      const headers = { ...this.httpClient.defaults.headers };
      if (endpoint.includes('.xml')) {
        headers['Accept'] = 'application/xml, text/xml, */*';
      }
      
      const response = await this.httpClient.get(endpoint, { 
        params,
        headers,
        responseType: endpoint.includes('.xml') ? 'text' : 'json',
      });
      return response.data;
    } catch (error) {
      if (error.response) {
        throw new Error(`API hatası (${error.response.status}): ${error.response.statusText}`);
      } else if (error.request) {
        throw new Error(`Network hatası: ${error.message}`);
      } else {
        throw new Error(`Request hatası: ${error.message}`);
      }
    }
  }

  /**
   * Ham API verisini normalize edilmiş kampanya listesine dönüştürür
   * Alt sınıflarda override edilecek
   */
  parseApiResponse(data) {
    throw new Error('parseApiResponse() metodu alt sınıflarda implement edilmelidir');
  }

  /**
   * Kampanyaları scrape eder (ana metod)
   */
  async scrape() {
    try {
      const endpoint = this.getApiEndpoint();
      const rawData = await this.fetchData(endpoint);
      const campaigns = this.parseApiResponse(rawData);
      return campaigns;
    } catch (error) {
      throw new Error(`${this.sourceName} fetch scraper hatası: ${error.message}`);
    }
  }

  /**
   * Retry mekanizması ile scraper çalıştırır
   */
  async runWithRetry(maxRetries = 3) {
    let lastError = null;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const campaigns = await this.scrape();
        return campaigns;
      } catch (error) {
        lastError = error;
        console.error(`❌ ${this.sourceName} fetch scraper hatası (deneme ${attempt}/${maxRetries}):`, error.message);

        if (attempt < maxRetries) {
          // Exponential backoff
          const delay = Math.pow(2, attempt) * 1000;
          console.log(`⏳ ${delay}ms sonra tekrar denenecek...`);
          await new Promise((resolve) => setTimeout(resolve, delay));
        }
      }
    }

    throw lastError;
  }

  /**
   * Normalize edilmiş kampanya objesi oluşturur
   */
  createCampaign(data) {
    return {
      sourceName: this.sourceName,
      title: data.title || '',
      description: data.description || '',
      detailText: data.detailText || '',
      campaignUrl: data.campaignUrl || '',
      originalUrl: data.originalUrl || data.campaignUrl || '',
      affiliateUrl: null,
      startDate: data.startDate || new Date().toISOString().split('T')[0],
      endDate: data.endDate || this.getDefaultEndDate(),
      howToUse: data.howToUse || [],
      category: data.category || 'other',
      tags: data.tags || [this.sourceName],
      channel: data.channel || 'online',
      value: data.value || null,
    };
  }

  /**
   * Varsayılan bitiş tarihi (30 gün sonra)
   */
  getDefaultEndDate() {
    const date = new Date();
    date.setDate(date.getDate() + 30);
    return date.toISOString().split('T')[0];
  }

  /**
   * Tarih parse eder (çeşitli formatları destekler)
   */
  parseDate(dateString) {
    if (!dateString) return this.getDefaultEndDate();

    // YYYY-MM-DD
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
      return dateString;
    }

    // DD.MM.YYYY
    const ddmmyyyy = dateString.match(/(\d{1,2})\.(\d{1,2})\.(\d{4})/);
    if (ddmmyyyy) {
      return `${ddmmyyyy[3]}-${ddmmyyyy[2].padStart(2, '0')}-${ddmmyyyy[1].padStart(2, '0')}`;
    }

    // DD/MM/YYYY
    const ddmmyyyy2 = dateString.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);
    if (ddmmyyyy2) {
      return `${ddmmyyyy2[3]}-${ddmmyyyy2[2].padStart(2, '0')}-${ddmmyyyy2[1].padStart(2, '0')}`;
    }

    return this.getDefaultEndDate();
  }

  /**
   * Değer parse eder (TL, % gibi)
   */
  parseValue(text) {
    if (!text) return null;

    // TL formatı: "100 TL", "1.000 TL", "1,000 TL"
    const tlMatch = text.match(/(\d{1,3}(?:[.,]\d{3})*(?:[.,]\d+)?|\d+)\s*tl/i);
    if (tlMatch) {
      return `${tlMatch[1].replace(/,/g, '.')} TL`;
    }

    // Yüzde formatı: "%10", "10%"
    const percentMatch = text.match(/(\d+)\s*%/i);
    if (percentMatch) {
      return `%${percentMatch[1]}`;
    }

    return null;
  }
}

module.exports = BaseFetchScraper;
