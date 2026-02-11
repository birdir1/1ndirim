/**
 * AI Service
 * Uses OpenAI API for:
 * - Generating missing titles from descriptions
 * - Generating missing descriptions from titles
 * - Predicting categories when rule-based detection fails
 */

const OpenAI = require('openai');
const isTest = process.env.NODE_ENV === 'test';

class AIService {
  constructor() {
    this.openai = null;
    this.enabled = false;
    this.requestCount = 0;
    this.lastRequestTime = Date.now();
    this.maxRequestsPerMinute = 10;

    // Initialize OpenAI if API key is available
    if (process.env.OPENAI_API_KEY) {
      this.openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
      });
      this.enabled = true;
      console.log('✅ AI Service enabled (OpenAI)');
    } else {
      if (!isTest) {
        console.warn('⚠️  AI Service disabled (no OPENAI_API_KEY)');
      }
    }
  }

  /**
   * Check if AI service is enabled
   * @returns {boolean}
   */
  isEnabled() {
    return this.enabled;
  }

  /**
   * Rate limiting check
   * @returns {boolean}
   */
  canMakeRequest() {
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;

    // Reset counter every minute
    if (timeSinceLastRequest > 60000) {
      this.requestCount = 0;
      this.lastRequestTime = now;
    }

    return this.requestCount < this.maxRequestsPerMinute;
  }

  /**
   * Generate title from description using AI
   * @param {string} description
   * @returns {Promise<string>}
   */
  async generateTitle(description) {
    if (!this.enabled) {
      throw new Error('AI Service is not enabled');
    }

    if (!this.canMakeRequest()) {
      throw new Error('Rate limit exceeded (max 10 requests per minute)');
    }

    if (!description || description.length < 10) {
      throw new Error('Description too short to generate title');
    }

    try {
      this.requestCount++;

      const prompt = `Aşağıdaki kampanya açıklamasından kısa ve çekici bir başlık oluştur.
Başlık 10-50 karakter arası olmalı.
Türkçe olmalı.
Sadece başlığı yaz, başka bir şey yazma.

Açıklama: ${description}

Başlık:`;

      const response = await this.openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 50,
        temperature: 0.7,
      });

      const title = response.choices[0].message.content.trim();
      console.log(`✅ AI generated title: "${title}"`);
      return title;
    } catch (error) {
      console.error('❌ AI title generation failed:', error.message);
      throw error;
    }
  }

  /**
   * Generate description from title using AI
   * @param {string} title
   * @returns {Promise<string>}
   */
  async generateDescription(title) {
    if (!this.enabled) {
      throw new Error('AI Service is not enabled');
    }

    if (!this.canMakeRequest()) {
      throw new Error('Rate limit exceeded (max 10 requests per minute)');
    }

    if (!title || title.length < 5) {
      throw new Error('Title too short to generate description');
    }

    try {
      this.requestCount++;

      const prompt = `Aşağıdaki kampanya başlığından 1-2 cümlelik açıklama oluştur.
Açıklama 20-200 karakter arası olmalı.
Türkçe olmalı.
Sadece açıklamayı yaz, başka bir şey yazma.

Başlık: ${title}

Açıklama:`;

      const response = await this.openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 100,
        temperature: 0.7,
      });

      const description = response.choices[0].message.content.trim();
      console.log(`✅ AI generated description: "${description}"`);
      return description;
    } catch (error) {
      console.error('❌ AI description generation failed:', error.message);
      throw error;
    }
  }

  /**
   * Predict category from title and description using AI
   * @param {string} title
   * @param {string} description
   * @returns {Promise<string>}
   */
  async predictCategory(title, description) {
    if (!this.enabled) {
      throw new Error('AI Service is not enabled');
    }

    if (!this.canMakeRequest()) {
      throw new Error('Rate limit exceeded (max 10 requests per minute)');
    }

    try {
      this.requestCount++;

      const prompt = `Aşağıdaki kampanya için kategori belirle.

Kategoriler:
- entertainment (Netflix, YouTube, Prime, Exxen, Gain, Tivibu, TV+, BluTV, Mubi, Disney+, HBO)
- gaming (Steam, Epic Games, Nvidia, PlayStation, Xbox, Game Pass, oyun, game)
- fashion (Zara, H&M, LCW, Mavi, Koton, DeFacto, Trendyol, giyim, fashion, Nike, Adidas)
- travel (THY, Pegasus, Obilet, uçak, otel, tatil, travel, Booking.com, Hotels.com, Airbnb)
- food (Yemeksepeti, Getir, Migros, Trendyol Yemek, Banabi, yemek, food, Dominos, McDonalds)
- finance (Papara, Tosla, Enpara, Akbank, Garanti, banka, kredi, kart, finance, para)
- music (Spotify, Apple Music, YouTube Music, Deezer, Fizy, müzik, music)
- shopping (alışveriş, shopping, indirim, kampanya, Trendyol, Hepsiburada, N11)
- telecom (Türk Telekom, Vodafone, Turkcell, operatör, hat, internet, telefon)

Başlık: ${title}
Açıklama: ${description}

Sadece kategori adını yaz (küçük harfle), başka bir şey yazma:`;

      const response = await this.openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 20,
        temperature: 0.3,
      });

      const category = response.choices[0].message.content.trim().toLowerCase();
      
      // Validate category
      const validCategories = [
        'entertainment', 'gaming', 'fashion', 'travel', 'food', 
        'finance', 'music', 'shopping', 'telecom'
      ];

      if (!validCategories.includes(category)) {
        console.warn(`⚠️  AI predicted invalid category: "${category}", defaulting to "shopping"`);
        return 'shopping';
      }

      console.log(`✅ AI predicted category: "${category}"`);
      return category;
    } catch (error) {
      console.error('❌ AI category prediction failed:', error.message);
      throw error;
    }
  }

  /**
   * Apply AI fallback to campaign data
   * - Generate title if missing or too short
   * - Generate description if missing or too short
   * - Predict category if missing
   * @param {Object} campaign
   * @returns {Promise<Object>}
   */
  async applyFallback(campaign) {
    if (!this.enabled) {
      console.warn('⚠️  AI fallback skipped (AI Service disabled)');
      return campaign;
    }

    let modified = false;

    // Title fallback
    if (!campaign.title || campaign.title.length < 10) {
      if (campaign.description && campaign.description.length >= 10) {
        try {
          campaign.title = await this.generateTitle(campaign.description);
          modified = true;
        } catch (error) {
          console.error('❌ AI title fallback failed:', error.message);
        }
      }
    }

    // Description fallback
    if (!campaign.description || campaign.description.length < 20) {
      if (campaign.title && campaign.title.length >= 5) {
        try {
          campaign.description = await this.generateDescription(campaign.title);
          modified = true;
        } catch (error) {
          console.error('❌ AI description fallback failed:', error.message);
        }
      }
    }

    // Category fallback
    if (!campaign.category) {
      if (campaign.title && campaign.description) {
        try {
          campaign.category = await this.predictCategory(campaign.title, campaign.description);
          modified = true;
        } catch (error) {
          console.error('❌ AI category fallback failed:', error.message);
          // Default to shopping if AI fails
          campaign.category = 'shopping';
          modified = true;
        }
      }
    }

    if (modified) {
      console.log('✅ AI fallback applied successfully');
    }

    return campaign;
  }
}

module.exports = new AIService();
