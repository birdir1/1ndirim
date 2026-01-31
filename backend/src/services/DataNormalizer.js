/**
 * Data Normalizer Service
 * Normalizes raw campaign data from scrapers
 * - Cleans text
 * - Parses dates
 * - Extracts discount percentage
 * - Generates hash for duplicate detection
 * - Validates data quality
 */

const crypto = require('crypto');

class DataNormalizer {
  /**
   * Normalize raw campaign data
   * @param {Object} rawCampaign - Raw campaign data from scraper
   * @param {string} sourceName - Source name (e.g., "Türk Telekom")
   * @returns {Promise<Object>} - Normalized campaign data
   */
  async normalize(rawCampaign, sourceName) {
    // Step 1: Basic normalization
    let campaign = {
      sourceName,
      title: this.cleanText(rawCampaign.title),
      description: this.cleanText(rawCampaign.description),
      detailText: this.cleanText(rawCampaign.detailText || rawCampaign.detail_text),
      originalUrl: rawCampaign.url || rawCampaign.originalUrl || rawCampaign.original_url,
      startDate: this.parseDate(rawCampaign.startDate || rawCampaign.starts_at || rawCampaign.validFrom),
      endDate: this.parseDate(rawCampaign.endDate || rawCampaign.expires_at || rawCampaign.expiresAt || rawCampaign.validTo),
      tags: Array.isArray(rawCampaign.tags) ? rawCampaign.tags : [],
      howToUse: Array.isArray(rawCampaign.howToUse) ? rawCampaign.howToUse : [],
      validityChannels: Array.isArray(rawCampaign.validityChannels) ? rawCampaign.validityChannels : [],
    };

    // Step 2: Category detection (rule-based + AI fallback handled by caller)
    campaign.category = rawCampaign.category || this.detectCategory(campaign);
    campaign.subCategory = rawCampaign.subCategory || rawCampaign.sub_category || this.detectSubCategory(campaign);

    // Step 3: Value extraction
    campaign.discountPercentage = this.extractDiscount(campaign);
    campaign.isPersonalized = rawCampaign.isPersonalized || rawCampaign.is_personalized || false;

    // Step 4: Hash generation (duplicate detection)
    campaign.dataHash = this.generateHash(campaign);

    // Step 5: Validation
    this.validate(campaign);

    return campaign;
  }

  /**
   * Clean text (trim, remove extra spaces, remove invalid characters)
   * @param {string} text
   * @returns {string}
   */
  cleanText(text) {
    if (!text || typeof text !== 'string') {
      return '';
    }

    return text
      .trim()
      .replace(/\s+/g, ' ') // Replace multiple spaces with single space
      .replace(/[\r\n\t]+/g, ' ') // Replace newlines/tabs with space
      .replace(/[^\x20-\x7E\u00A0-\uFFFF]/g, ''); // Remove non-printable characters
  }

  /**
   * Parse date from various formats
   * @param {string|Date} dateInput
   * @returns {Date|null}
   */
  parseDate(dateInput) {
    if (!dateInput) {
      return null;
    }

    if (dateInput instanceof Date) {
      return dateInput;
    }

    // Try parsing as ISO string
    const date = new Date(dateInput);
    if (!isNaN(date.getTime())) {
      return date;
    }

    // Try parsing Turkish date format (e.g., "31.01.2026")
    const turkishDateMatch = dateInput.match(/(\d{1,2})\.(\d{1,2})\.(\d{4})/);
    if (turkishDateMatch) {
      const [, day, month, year] = turkishDateMatch;
      return new Date(year, month - 1, day);
    }

    return null;
  }

  /**
   * Detect category from title and description (rule-based)
   * @param {Object} campaign
   * @returns {string|null}
   */
  detectCategory(campaign) {
    const text = `${campaign.title} ${campaign.description}`.toLowerCase();

    // Entertainment
    if (text.match(/netflix|youtube|prime|amazon prime|exxen|gain|tivibu|tv\+|blutv|mubi|disney|hbo/)) {
      return 'entertainment';
    }

    // Gaming
    if (text.match(/steam|epic games|epic|nvidia|playstation|xbox|game pass|oyun|game|ea play|ubisoft/)) {
      return 'gaming';
    }

    // Fashion
    if (text.match(/zara|h&m|lcw|waikiki|mavi|koton|defacto|trendyol|giyim|fashion|nike|adidas|puma/)) {
      return 'fashion';
    }

    // Travel
    if (text.match(/thy|türk hava yolları|pegasus|obilet|uçak|otel|tatil|travel|booking|hotels\.com|airbnb|jolly|etstur/)) {
      return 'travel';
    }

    // Food
    if (text.match(/yemek|getir|migros|yemeksepeti|trendyol yemek|banabi|dominos|mcdonalds|burger king|food/)) {
      return 'food';
    }

    // Finance
    if (text.match(/banka|kredi|kart|papara|tosla|enpara|akbank|garanti|yapı kredi|qnb|finansbank|finance|para|ödeme/)) {
      return 'finance';
    }

    // Music
    if (text.match(/spotify|apple music|youtube music|deezer|fizy|müzik|music/)) {
      return 'music';
    }

    // Shopping
    if (text.match(/alışveriş|shopping|indirim|kampanya|trendyol|hepsiburada|n11|gittigidiyor/)) {
      return 'shopping';
    }

    // Telecom
    if (text.match(/türk telekom|vodafone|turkcell|operatör|hat|internet|telefon|telecom/)) {
      return 'telecom';
    }

    return null; // Will trigger AI fallback
  }

  /**
   * Detect sub-category from title and description
   * @param {Object} campaign
   * @returns {string|null}
   */
  detectSubCategory(campaign) {
    const text = `${campaign.title} ${campaign.description}`.toLowerCase();

    // Common brands/services
    const brands = [
      'Netflix', 'YouTube', 'Amazon Prime', 'Exxen', 'Gain', 'Tivibu', 'TV+', 'BluTV', 'Mubi',
      'Steam', 'Epic Games', 'Nvidia', 'PlayStation', 'Xbox', 'Game Pass',
      'Zara', 'H&M', 'LCW', 'Mavi', 'Koton', 'DeFacto', 'Trendyol',
      'THY', 'Pegasus', 'Obilet', 'Booking.com', 'Hotels.com', 'Airbnb',
      'Yemeksepeti', 'Getir', 'Migros', 'Banabi',
      'Papara', 'Tosla', 'Enpara', 'Akbank', 'Garanti', 'İş Bankası',
      'Spotify', 'Apple Music', 'YouTube Music', 'Deezer', 'Fizy',
    ];

    for (const brand of brands) {
      if (text.includes(brand.toLowerCase())) {
        return brand;
      }
    }

    return null;
  }

  /**
   * Extract discount percentage from title/description
   * @param {Object} campaign
   * @returns {number|null}
   */
  extractDiscount(campaign) {
    const text = `${campaign.title} ${campaign.description}`;

    // Match patterns like: %50, 50%, %50 indirim, 50% off
    const percentMatch = text.match(/%?(\d{1,3})%?\s*(indirim|off|discount)/i);
    if (percentMatch) {
      const percent = parseInt(percentMatch[1], 10);
      if (percent >= 1 && percent <= 100) {
        return percent;
      }
    }

    // Match patterns like: yarı fiyatına, yarım fiyat
    if (text.match(/yarı|yarım|half/i)) {
      return 50;
    }

    return null;
  }

  /**
   * Generate hash for duplicate detection
   * Hash = md5(sourceName|title|startDate|endDate)
   * @param {Object} campaign
   * @returns {string}
   */
  generateHash(campaign) {
    const hashInput = [
      campaign.sourceName || '',
      campaign.title || '',
      campaign.startDate ? campaign.startDate.toISOString() : '',
      campaign.endDate ? campaign.endDate.toISOString() : '',
    ].join('|');

    return crypto.createHash('md5').update(hashInput).digest('hex');
  }

  /**
   * Validate campaign data
   * Throws error if validation fails
   * @param {Object} campaign
   */
  validate(campaign) {
    const errors = [];

    // Title validation
    if (!campaign.title || campaign.title.length < 10) {
      errors.push('Title too short or missing (min 10 characters)');
    }

    if (campaign.title && campaign.title.match(/^(faz|#)/i)) {
      errors.push('Invalid title (starts with hashtag or "Faz")');
    }

    // Description validation
    if (!campaign.description || campaign.description.length < 20) {
      errors.push('Description too short or missing (min 20 characters)');
    }

    // Category validation (optional - will be handled by AI fallback)
    // if (!campaign.category) {
    //   errors.push('Category missing');
    // }

    // Date validation
    if (campaign.endDate && campaign.endDate <= new Date()) {
      errors.push('End date must be in the future');
    }

    if (campaign.startDate && campaign.endDate && campaign.startDate > campaign.endDate) {
      errors.push('Start date cannot be after end date');
    }

    if (errors.length > 0) {
      const error = new Error(`Validation failed: ${errors.join(', ')}`);
      error.validationErrors = errors;
      throw error;
    }
  }
}

module.exports = new DataNormalizer();
