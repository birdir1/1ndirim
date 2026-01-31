# Kampanya Data Fix - Design Document

**Spec ID:** kampanya-data-fix  
**Created:** 30 Ocak 2026  
**Status:** Draft  
**Priority:** 🔴 CRITICAL

---

## 📋 Executive Summary

### Problem
- Kampanya sayısı: ~80 (çok düşük, gerçek dışı)
- Veri kalitesi: Kötü (title/description yok, sadece hashtag)
- Bot sistemi: 28 scraper var ama çalışmıyor
- Keşfet sayfası: Yarım çalışıyor, kategoriler boş

### Solution
1. **Bot Sistemini Düzelt:** 28 scraper'ı çalışır hale getir
2. **Veri Modelini Güncelle:** Category, sub_category, validation ekle
3. **AI Fallback Ekle:** Eksik title/description'ları AI ile üret
4. **Keşfet Sayfasını Doldur:** 6 kategori için sabit kaynak stratejisi
5. **Admin Panel Entegrasyonu:** Bot tetikleme, kampanya yönetimi

### Success Metrics
- Kampanya sayısı: 300-500+ (şu an: ~80)
- Veri kalitesi: %100 (title + description dolu)
- Bot başarı oranı: >95%
- Keşfet kategorileri: 6/6 dolu

---

## 🏗️ Architecture Overview

### System Components

```
┌─────────────────────────────────────────────────────────────┐
│                     1ndirim System                          │
└─────────────────────────────────────────────────────────────┘
                              │
                ┌─────────────┼─────────────┐
                │             │             │
        ┌───────▼──────┐ ┌───▼────┐ ┌─────▼──────┐
        │   Bot        │ │Backend │ │Admin Panel │
        │   Service    │ │  API   │ │            │
        └───────┬──────┘ └───┬────┘ └─────┬──────┘
                │            │            │
        ┌───────▼────────────▼────────────▼──────┐
        │         PostgreSQL Database             │
        │  - campaigns (main table)               │
        │  - sources                              │
        │  - campaign_categories (NEW)            │
        └─────────────────────────────────────────┘
```

### Data Flow

```
1. Bot Scraping
   ├─> Scraper runs (Puppeteer/Axios)
   ├─> Parse raw data
   ├─> Normalize data
   ├─> AI fallback (if needed)
   ├─> Duplicate check
   └─> POST /api/campaigns

2. Backend Processing
   ├─> Validate data
   ├─> Check quality rules
   ├─> Save to database
   └─> Update cache

3. App Consumption
   ├─> GET /api/campaigns (main feed)
   ├─> GET /api/campaigns/discover (category feed)
   └─> Display in UI
```

---

## 📊 Database Schema Updates

### Current Schema (campaigns table)
```sql
CREATE TABLE campaigns (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  source_id UUID REFERENCES sources(id),
  title TEXT,
  description TEXT,
  detail_text TEXT,
  original_url TEXT,
  affiliate_url TEXT,
  expires_at TIMESTAMP,
  starts_at TIMESTAMP,
  tags JSONB,
  how_to_use JSONB,
  validity_channels JSONB,
  campaign_type TEXT, -- 'main', 'light', 'category'
  value_level TEXT,   -- 'high', 'low'
  is_active BOOLEAN DEFAULT true,
  is_hidden BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### Required Updates
```sql
-- 1. Add category columns
ALTER TABLE campaigns 
ADD COLUMN category TEXT,
ADD COLUMN sub_category TEXT,
ADD COLUMN discount_percentage INTEGER,
ADD COLUMN is_personalized BOOLEAN DEFAULT false,
ADD COLUMN scraped_at TIMESTAMP,
ADD COLUMN data_hash TEXT;

-- 2. Add indexes for performance
CREATE INDEX idx_campaigns_category ON campaigns(category);
CREATE INDEX idx_campaigns_sub_category ON campaigns(sub_category);
CREATE INDEX idx_campaigns_scraped_at ON campaigns(scraped_at);
CREATE INDEX idx_campaigns_data_hash ON campaigns(data_hash);

-- 3. Add constraints
ALTER TABLE campaigns 
ADD CONSTRAINT chk_title_not_empty CHECK (LENGTH(TRIM(title)) >= 10),
ADD CONSTRAINT chk_description_not_empty CHECK (LENGTH(TRIM(description)) >= 20),
ADD CONSTRAINT chk_category_not_null CHECK (category IS NOT NULL);
```

### New Table: campaign_categories
```sql
CREATE TABLE campaign_categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  icon TEXT,
  description TEXT,
  min_campaigns INTEGER DEFAULT 10,
  fixed_sources JSONB, -- ['Netflix', 'YouTube', 'Steam']
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Seed data
INSERT INTO campaign_categories (name, display_name, icon, fixed_sources) VALUES
('entertainment', 'Eğlence', '🎬', '["Netflix", "YouTube Premium", "Amazon Prime", "Exxen", "Gain", "Tivibu", "TV+"]'),
('gaming', 'Oyun', '🎮', '["Steam", "Epic Games", "Nvidia", "PlayStation", "Xbox"]'),
('fashion', 'Giyim', '👕', '["Zara", "H&M", "LCW", "Mavi", "Koton", "DeFacto"]'),
('travel', 'Seyahat', '✈️', '["THY", "Pegasus", "Obilet", "Booking.com", "Hotels.com"]'),
('food', 'Yemek', '🍔', '["Yemeksepeti", "Getir", "Migros", "Trendyol Yemek"]'),
('finance', 'Finans', '💳', '["Papara", "Tosla", "Enpara", "Akbank", "Garanti"]');
```

---


## 🤖 Bot Architecture Design

### 1. Scraper Types & Strategy

#### Type 1: HTML Scraper (Static Pages)
**Use Case:** Bankalar (Akbank, Garanti, İş Bankası)

**Strategy:**
```javascript
class HTMLScraper extends BaseScraper {
  async scrape() {
    await this.loadPage(this.sourceUrl, '.campaign-list');
    
    const campaigns = await this.page.evaluate(() => {
      const cards = document.querySelectorAll('.campaign-card');
      return Array.from(cards).map(card => ({
        title: card.querySelector('.title')?.textContent,
        description: card.querySelector('.description')?.textContent,
        url: card.querySelector('a')?.href,
        expiry: card.querySelector('.expiry')?.textContent,
      }));
    });
    
    return this.normalizeCampaigns(campaigns);
  }
}
```

#### Type 2: SPA Scraper (Dynamic Content)
**Use Case:** Operatörler (Turkcell, Vodafone, Türk Telekom)

**Strategy:**
```javascript
class SPAScraper extends BaseScraper {
  async scrape() {
    await this.loadPage(this.sourceUrl);
    await this.page.waitForTimeout(3000); // SPA loading
    await this.autoScroll(); // Infinite scroll
    
    const campaigns = await this.page.evaluate(() => {
      // Similar to HTML scraper
    });
    
    return this.normalizeCampaigns(campaigns);
  }
  
  async autoScroll() {
    await this.page.evaluate(async () => {
      await new Promise((resolve) => {
        let totalHeight = 0;
        const distance = 100;
        const timer = setInterval(() => {
          window.scrollBy(0, distance);
          totalHeight += distance;
          if (totalHeight >= document.body.scrollHeight) {
            clearInterval(timer);
            resolve();
          }
        }, 100);
      });
    });
  }
}
```

#### Type 3: API Scraper (JSON Response)
**Use Case:** Dijital cüzdanlar (Papara, Tosla - eğer public API varsa)

**Strategy:**
```javascript
class APIScraper extends BaseScraper {
  async scrape() {
    const response = await axios.get(this.apiUrl);
    const campaigns = response.data.campaigns;
    return this.normalizeCampaigns(campaigns);
  }
}
```

#### Type 4: Hybrid Scraper (Network + DOM)
**Use Case:** Modern SPA'lar (network request'leri dinle)

**Strategy:**
```javascript
class HybridScraper extends BaseScraper {
  async scrape() {
    const responses = await this.collectNetworkResponses();
    const fromNetwork = this.getCampaignsFromNetwork(responses);
    
    if (fromNetwork.length > 0) {
      return this.normalizeCampaigns(fromNetwork);
    }
    
    // Fallback to DOM scraping
    return await this.scrapeDom();
  }
  
  getCampaignsFromNetwork(responses) {
    const campaignResponse = responses.find(r => 
      r.url.includes('/api/campaigns') || 
      r.url.includes('/kampanyalar')
    );
    
    if (campaignResponse) {
      return campaignResponse.data.campaigns || [];
    }
    
    return [];
  }
}
```

### 2. Data Normalization

#### Normalization Pipeline
```javascript
class DataNormalizer {
  async normalize(rawCampaign, sourceName) {
    // Step 1: Basic normalization
    let campaign = {
      sourceName,
      title: this.cleanText(rawCampaign.title),
      description: this.cleanText(rawCampaign.description),
      originalUrl: rawCampaign.url,
      startDate: this.parseDate(rawCampaign.startDate),
      endDate: this.parseDate(rawCampaign.endDate),
    };
    
    // Step 2: AI fallback (if needed)
    campaign = await this.applyAIFallback(campaign);
    
    // Step 3: Category detection
    campaign.category = await this.detectCategory(campaign);
    campaign.subCategory = await this.detectSubCategory(campaign);
    
    // Step 4: Value extraction
    campaign.discountPercentage = this.extractDiscount(campaign);
    
    // Step 5: Hash generation (duplicate detection)
    campaign.dataHash = this.generateHash(campaign);
    
    // Step 6: Validation
    this.validate(campaign);
    
    return campaign;
  }
  
  async applyAIFallback(campaign) {
    // Title missing or too short
    if (!campaign.title || campaign.title.length < 10) {
      campaign.title = await this.generateTitleWithAI(campaign.description);
    }
    
    // Description missing or too short
    if (!campaign.description || campaign.description.length < 20) {
      campaign.description = await this.generateDescriptionWithAI(campaign.title);
    }
    
    return campaign;
  }
  
  async detectCategory(campaign) {
    const text = `${campaign.title} ${campaign.description}`.toLowerCase();
    
    // Rule-based detection
    if (text.match(/netflix|youtube|prime|exxen|gain|tivibu/)) {
      return 'entertainment';
    }
    if (text.match(/steam|epic|nvidia|playstation|xbox|oyun|game/)) {
      return 'gaming';
    }
    if (text.match(/zara|h&m|lcw|mavi|koton|giyim|fashion/)) {
      return 'fashion';
    }
    if (text.match(/thy|pegasus|obilet|uçak|otel|tatil|travel/)) {
      return 'travel';
    }
    if (text.match(/yemek|getir|migros|food/)) {
      return 'food';
    }
    if (text.match(/banka|kredi|kart|papara|tosla|finance/)) {
      return 'finance';
    }
    
    // AI fallback
    return await this.predictCategoryWithAI(campaign.title, campaign.description);
  }
  
  generateHash(campaign) {
    const hashInput = `${campaign.sourceName}|${campaign.title}|${campaign.startDate}|${campaign.endDate}`;
    return crypto.createHash('md5').update(hashInput).digest('hex');
  }
  
  validate(campaign) {
    if (!campaign.title || campaign.title.length < 10) {
      throw new Error('Title too short or missing');
    }
    if (!campaign.description || campaign.description.length < 20) {
      throw new Error('Description too short or missing');
    }
    if (!campaign.category) {
      throw new Error('Category missing');
    }
    if (campaign.title.match(/^(faz|#)/i)) {
      throw new Error('Invalid title (hashtag only)');
    }
  }
}
```

### 3. AI Integration (OpenAI/Anthropic)

#### AI Service
```javascript
class AIService {
  constructor() {
    this.openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }
  
  async generateTitle(description) {
    const prompt = `
      Aşağıdaki kampanya açıklamasından kısa ve çekici bir başlık oluştur.
      Başlık 10-50 karakter arası olmalı.
      Türkçe olmalı.
      
      Açıklama: ${description}
      
      Başlık:
    `;
    
    const response = await this.openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 50,
      temperature: 0.7,
    });
    
    return response.choices[0].message.content.trim();
  }
  
  async generateDescription(title) {
    const prompt = `
      Aşağıdaki kampanya başlığından 1-2 cümlelik açıklama oluştur.
      Açıklama 20-200 karakter arası olmalı.
      Türkçe olmalı.
      
      Başlık: ${title}
      
      Açıklama:
    `;
    
    const response = await this.openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 100,
      temperature: 0.7,
    });
    
    return response.choices[0].message.content.trim();
  }
  
  async predictCategory(title, description) {
    const prompt = `
      Aşağıdaki kampanya için kategori belirle.
      
      Kategoriler:
      - entertainment (Netflix, YouTube, Prime)
      - gaming (Steam, Epic, Nvidia)
      - fashion (Zara, H&M, LCW)
      - travel (THY, Pegasus, Obilet)
      - food (Yemeksepeti, Getir)
      - finance (Banka, cüzdan)
      
      Başlık: ${title}
      Açıklama: ${description}
      
      Kategori (sadece kategori adını yaz):
    `;
    
    const response = await this.openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 20,
      temperature: 0.3,
    });
    
    return response.choices[0].message.content.trim().toLowerCase();
  }
}
```

### 4. Duplicate Detection

#### Hash-Based Strategy
```javascript
class DuplicateDetector {
  async checkDuplicate(campaign) {
    // Method 1: URL-based (most reliable)
    if (campaign.originalUrl) {
      const existing = await Campaign.findOne({
        where: {
          originalUrl: campaign.originalUrl,
          sourceId: campaign.sourceId,
        },
      });
      if (existing) return existing;
    }
    
    // Method 2: Hash-based
    const existing = await Campaign.findOne({
      where: {
        dataHash: campaign.dataHash,
      },
    });
    if (existing) return existing;
    
    // Method 3: Fuzzy matching (title + source + date)
    const similar = await Campaign.findAll({
      where: {
        sourceId: campaign.sourceId,
        startDate: campaign.startDate,
        endDate: campaign.endDate,
      },
    });
    
    for (const s of similar) {
      const similarity = this.calculateSimilarity(campaign.title, s.title);
      if (similarity > 0.8) {
        return s;
      }
    }
    
    return null;
  }
  
  calculateSimilarity(str1, str2) {
    // Levenshtein distance
    const matrix = [];
    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }
    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }
    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }
    const distance = matrix[str2.length][str1.length];
    return 1 - distance / Math.max(str1.length, str2.length);
  }
}
```

---


## 🎨 Keşfet Sayfası Design

### 1. Category Feed Strategy

#### Fixed Source Mapping
```javascript
const DISCOVER_CATEGORIES = [
  {
    id: 'entertainment',
    name: 'Eğlence',
    icon: '🎬',
    sources: [
      'Netflix', 'YouTube Premium', 'Amazon Prime', 
      'Exxen', 'Gain', 'Tivibu', 'TV+'
    ],
    minCampaigns: 10,
    fallbackMessage: 'Yakında eğlence kampanyaları eklenecek',
  },
  {
    id: 'gaming',
    name: 'Oyun',
    icon: '🎮',
    sources: [
      'Steam', 'Epic Games', 'Nvidia', 
      'PlayStation', 'Xbox', 'Game Pass'
    ],
    minCampaigns: 10,
    fallbackMessage: 'Yakında oyun kampanyaları eklenecek',
  },
  {
    id: 'fashion',
    name: 'Giyim',
    icon: '👕',
    sources: [
      'Zara', 'H&M', 'LCW', 'Mavi', 
      'Koton', 'DeFacto', 'Trendyol'
    ],
    minCampaigns: 10,
    fallbackMessage: 'Yakında giyim kampanyaları eklenecek',
  },
  {
    id: 'travel',
    name: 'Seyahat',
    icon: '✈️',
    sources: [
      'THY', 'Pegasus', 'Obilet', 
      'Booking.com', 'Hotels.com', 'Airbnb'
    ],
    minCampaigns: 10,
    fallbackMessage: 'Yakında seyahat kampanyaları eklenecek',
  },
  {
    id: 'food',
    name: 'Yemek',
    icon: '🍔',
    sources: [
      'Yemeksepeti', 'Getir', 'Migros', 
      'Trendyol Yemek', 'Banabi'
    ],
    minCampaigns: 10,
    fallbackMessage: 'Yakında yemek kampanyaları eklenecek',
  },
  {
    id: 'finance',
    name: 'Finans',
    icon: '💳',
    sources: [
      'Papara', 'Tosla', 'Enpara', 
      'Akbank', 'Garanti', 'İş Bankası'
    ],
    minCampaigns: 10,
    fallbackMessage: 'Yakında finans kampanyaları eklenecek',
  },
];
```

#### Backend API Design
```javascript
// GET /api/campaigns/discover
router.get('/discover', async (req, res) => {
  try {
    const categories = DISCOVER_CATEGORIES;
    const result = [];
    
    for (const category of categories) {
      // Get campaigns for this category
      const campaigns = await Campaign.findAll({
        where: {
          category: category.id,
          isActive: true,
          expiresAt: { [Op.gt]: new Date() },
        },
        limit: 20,
        order: [['createdAt', 'DESC']],
      });
      
      // Fallback: Show last known campaigns with expire flag
      if (campaigns.length === 0) {
        const lastKnown = await Campaign.findAll({
          where: {
            category: category.id,
          },
          limit: 5,
          order: [['createdAt', 'DESC']],
        });
        
        result.push({
          ...category,
          campaigns: lastKnown.map(c => ({ ...c, isExpired: true })),
          isEmpty: true,
        });
      } else {
        result.push({
          ...category,
          campaigns,
          isEmpty: false,
        });
      }
    }
    
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

### 2. Flutter UI Design

#### Discover Screen
```dart
class DiscoverScreen extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text('Keşfet')),
      body: FutureBuilder<List<DiscoverCategory>>(
        future: _fetchDiscoverCategories(),
        builder: (context, snapshot) {
          if (snapshot.hasData) {
            return ListView.builder(
              itemCount: snapshot.data!.length,
              itemBuilder: (context, index) {
                final category = snapshot.data![index];
                return CategorySection(category: category);
              },
            );
          }
          return LoadingIndicator();
        },
      ),
    );
  }
}

class CategorySection extends StatelessWidget {
  final DiscoverCategory category;
  
  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // Category header
        Padding(
          padding: EdgeInsets.all(16),
          child: Row(
            children: [
              Text(category.icon, style: TextStyle(fontSize: 24)),
              SizedBox(width: 8),
              Text(category.name, style: Theme.of(context).textTheme.headline6),
            ],
          ),
        ),
        
        // Campaigns horizontal list
        if (category.isEmpty)
          EmptyStateWidget(message: category.fallbackMessage)
        else
          SizedBox(
            height: 200,
            child: ListView.builder(
              scrollDirection: Axis.horizontal,
              itemCount: category.campaigns.length,
              itemBuilder: (context, index) {
                final campaign = category.campaigns[index];
                return CampaignCard(
                  campaign: campaign,
                  isExpired: campaign.isExpired,
                );
              },
            ),
          ),
      ],
    );
  }
}
```

---

## 🔧 Backend API Updates

### 1. New Endpoints

#### POST /api/campaigns (Enhanced)
```javascript
router.post('/campaigns', 
  firebaseAuth, // Authentication
  validateCampaign, // Validation middleware
  async (req, res) => {
    try {
      const campaignData = req.body;
      
      // Step 1: Get source ID
      const sourceId = await Campaign.getSourceIdByName(campaignData.sourceName);
      if (!sourceId) {
        return res.status(400).json({ error: 'Invalid source name' });
      }
      
      // Step 2: Normalize data
      const normalizer = new DataNormalizer();
      const normalized = await normalizer.normalize(campaignData, campaignData.sourceName);
      
      // Step 3: Check duplicate
      const duplicate = await DuplicateDetector.checkDuplicate(normalized);
      if (duplicate) {
        return res.status(200).json({ 
          message: 'Campaign already exists',
          campaign: duplicate,
          isDuplicate: true,
        });
      }
      
      // Step 4: Create campaign
      const campaign = await Campaign.create({
        sourceId,
        title: normalized.title,
        description: normalized.description,
        detailText: normalized.detailText,
        originalUrl: normalized.originalUrl,
        expiresAt: normalized.endDate,
        startsAt: normalized.startDate,
        category: normalized.category,
        subCategory: normalized.subCategory,
        discountPercentage: normalized.discountPercentage,
        isPersonalized: normalized.isPersonalized,
        scrapedAt: new Date(),
        dataHash: normalized.dataHash,
        tags: normalized.tags || [],
        howToUse: normalized.howToUse || [],
        validityChannels: normalized.validityChannels || [],
      });
      
      // Step 5: Clear cache
      await cacheService.clearCampaignCache();
      
      res.status(201).json({ campaign });
    } catch (error) {
      console.error('Campaign creation error:', error);
      res.status(500).json({ error: error.message });
    }
  }
);
```

#### GET /api/campaigns/discover (New)
```javascript
router.get('/campaigns/discover', 
  cache('5 minutes'), // Cache for 5 minutes
  async (req, res) => {
    try {
      const categories = DISCOVER_CATEGORIES;
      const result = [];
      
      for (const category of categories) {
        const campaigns = await Campaign.findAll({
          where: {
            category: category.id,
            isActive: true,
            expiresAt: { [Op.gt]: new Date() },
          },
          limit: 20,
          order: [['createdAt', 'DESC']],
        });
        
        result.push({
          ...category,
          campaigns,
          count: campaigns.length,
        });
      }
      
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
);
```

#### GET /api/campaigns/stats (New)
```javascript
router.get('/campaigns/stats', async (req, res) => {
  try {
    const stats = {
      total: await Campaign.count({ where: { isActive: true } }),
      byCategory: {},
      bySource: {},
      recentlyAdded: await Campaign.count({
        where: {
          isActive: true,
          createdAt: { [Op.gt]: new Date(Date.now() - 24 * 60 * 60 * 1000) },
        },
      }),
    };
    
    // By category
    for (const category of DISCOVER_CATEGORIES) {
      stats.byCategory[category.id] = await Campaign.count({
        where: {
          category: category.id,
          isActive: true,
        },
      });
    }
    
    // By source
    const sources = await Source.findAll();
    for (const source of sources) {
      stats.bySource[source.name] = await Campaign.count({
        where: {
          sourceId: source.id,
          isActive: true,
        },
      });
    }
    
    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

### 2. Validation Middleware

```javascript
const validateCampaign = (req, res, next) => {
  const { title, description, sourceName, expiresAt } = req.body;
  
  // Title validation
  if (!title || title.trim().length < 10) {
    return res.status(400).json({ 
      error: 'Title must be at least 10 characters' 
    });
  }
  
  if (title.match(/^(faz|#)/i)) {
    return res.status(400).json({ 
      error: 'Title cannot start with hashtag or "Faz"' 
    });
  }
  
  // Description validation
  if (!description || description.trim().length < 20) {
    return res.status(400).json({ 
      error: 'Description must be at least 20 characters' 
    });
  }
  
  // Source validation
  if (!sourceName || sourceName.trim().length === 0) {
    return res.status(400).json({ 
      error: 'Source name is required' 
    });
  }
  
  // Date validation
  if (!expiresAt || new Date(expiresAt) <= new Date()) {
    return res.status(400).json({ 
      error: 'Expires at must be a future date' 
    });
  }
  
  next();
};
```

---


## 🎛️ Admin Panel Design

### 1. Bot Management UI

#### Dashboard
```typescript
interface BotDashboard {
  sources: BotSource[];
  stats: BotStats;
  recentRuns: BotRun[];
}

interface BotSource {
  id: string;
  name: string;
  type: 'bank' | 'operator' | 'wallet' | 'entertainment';
  status: 'idle' | 'running' | 'error';
  lastRun: Date;
  lastSuccess: Date;
  campaignCount: number;
  successRate: number;
}

interface BotStats {
  totalCampaigns: number;
  todayAdded: number;
  activeSources: number;
  errorSources: number;
}

interface BotRun {
  id: string;
  sourceName: string;
  startedAt: Date;
  completedAt: Date;
  status: 'success' | 'error';
  campaignsFound: number;
  campaignsAdded: number;
  error?: string;
}
```

#### UI Components
```tsx
// Bot Dashboard Component
export default function BotDashboard() {
  const [sources, setSources] = useState<BotSource[]>([]);
  const [stats, setStats] = useState<BotStats | null>(null);
  
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Bot Yönetimi</h1>
      
      {/* Stats Cards */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <StatCard 
          title="Toplam Kampanya" 
          value={stats?.totalCampaigns} 
          icon="📊"
        />
        <StatCard 
          title="Bugün Eklenen" 
          value={stats?.todayAdded} 
          icon="🆕"
        />
        <StatCard 
          title="Aktif Kaynaklar" 
          value={stats?.activeSources} 
          icon="✅"
        />
        <StatCard 
          title="Hatalı Kaynaklar" 
          value={stats?.errorSources} 
          icon="❌"
        />
      </div>
      
      {/* Source List */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-4 border-b">
          <h2 className="text-lg font-semibold">Kaynaklar</h2>
        </div>
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50">
              <th className="px-4 py-2 text-left">Kaynak</th>
              <th className="px-4 py-2 text-left">Durum</th>
              <th className="px-4 py-2 text-left">Son Çalışma</th>
              <th className="px-4 py-2 text-left">Kampanya Sayısı</th>
              <th className="px-4 py-2 text-left">Başarı Oranı</th>
              <th className="px-4 py-2 text-left">İşlemler</th>
            </tr>
          </thead>
          <tbody>
            {sources.map(source => (
              <SourceRow key={source.id} source={source} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// Source Row Component
function SourceRow({ source }: { source: BotSource }) {
  const [isRunning, setIsRunning] = useState(false);
  
  const handleTrigger = async () => {
    setIsRunning(true);
    try {
      await fetch(`/api/admin/bot/trigger/${source.name}`, {
        method: 'POST',
      });
      toast.success(`${source.name} bot'u tetiklendi`);
    } catch (error) {
      toast.error('Bot tetiklenemedi');
    } finally {
      setIsRunning(false);
    }
  };
  
  return (
    <tr className="border-b hover:bg-gray-50">
      <td className="px-4 py-3">
        <div className="flex items-center">
          <span className="font-medium">{source.name}</span>
          <span className="ml-2 text-xs text-gray-500">{source.type}</span>
        </div>
      </td>
      <td className="px-4 py-3">
        <StatusBadge status={source.status} />
      </td>
      <td className="px-4 py-3 text-sm text-gray-600">
        {formatDate(source.lastRun)}
      </td>
      <td className="px-4 py-3 text-sm">
        {source.campaignCount}
      </td>
      <td className="px-4 py-3 text-sm">
        <div className="flex items-center">
          <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
            <div 
              className="bg-green-500 h-2 rounded-full" 
              style={{ width: `${source.successRate}%` }}
            />
          </div>
          <span>{source.successRate}%</span>
        </div>
      </td>
      <td className="px-4 py-3">
        <button
          onClick={handleTrigger}
          disabled={isRunning}
          className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
        >
          {isRunning ? 'Çalışıyor...' : 'Tetikle'}
        </button>
      </td>
    </tr>
  );
}
```

### 2. Campaign Management UI

#### Campaign List
```tsx
export default function CampaignList() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [filters, setFilters] = useState({
    category: '',
    source: '',
    search: '',
  });
  
  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Kampanya Yönetimi</h1>
        <button 
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2 bg-blue-500 text-white rounded"
        >
          + Yeni Kampanya
        </button>
      </div>
      
      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="grid grid-cols-3 gap-4">
          <input
            type="text"
            placeholder="Ara..."
            value={filters.search}
            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            className="px-3 py-2 border rounded"
          />
          <select
            value={filters.category}
            onChange={(e) => setFilters({ ...filters, category: e.target.value })}
            className="px-3 py-2 border rounded"
          >
            <option value="">Tüm Kategoriler</option>
            <option value="entertainment">Eğlence</option>
            <option value="gaming">Oyun</option>
            <option value="fashion">Giyim</option>
            <option value="travel">Seyahat</option>
            <option value="food">Yemek</option>
            <option value="finance">Finans</option>
          </select>
          <select
            value={filters.source}
            onChange={(e) => setFilters({ ...filters, source: e.target.value })}
            className="px-3 py-2 border rounded"
          >
            <option value="">Tüm Kaynaklar</option>
            {/* Dynamic source list */}
          </select>
        </div>
      </div>
      
      {/* Campaign Table */}
      <div className="bg-white rounded-lg shadow">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50">
              <th className="px-4 py-2 text-left">Başlık</th>
              <th className="px-4 py-2 text-left">Kaynak</th>
              <th className="px-4 py-2 text-left">Kategori</th>
              <th className="px-4 py-2 text-left">Bitiş Tarihi</th>
              <th className="px-4 py-2 text-left">Durum</th>
              <th className="px-4 py-2 text-left">İşlemler</th>
            </tr>
          </thead>
          <tbody>
            {campaigns.map(campaign => (
              <CampaignRow key={campaign.id} campaign={campaign} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
```

#### Campaign Edit Modal
```tsx
function CampaignEditModal({ campaign, onClose, onSave }) {
  const [formData, setFormData] = useState({
    title: campaign.title,
    description: campaign.description,
    category: campaign.category,
    subCategory: campaign.subCategory,
    expiresAt: campaign.expiresAt,
  });
  
  const handleSave = async () => {
    try {
      await fetch(`/api/admin/campaigns/${campaign.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      toast.success('Kampanya güncellendi');
      onSave();
      onClose();
    } catch (error) {
      toast.error('Güncelleme başarısız');
    }
  };
  
  return (
    <Modal onClose={onClose}>
      <h2 className="text-xl font-bold mb-4">Kampanya Düzenle</h2>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Başlık</label>
          <input
            type="text"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            className="w-full px-3 py-2 border rounded"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-1">Açıklama</label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            className="w-full px-3 py-2 border rounded"
            rows={4}
          />
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Kategori</label>
            <select
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className="w-full px-3 py-2 border rounded"
            >
              <option value="entertainment">Eğlence</option>
              <option value="gaming">Oyun</option>
              <option value="fashion">Giyim</option>
              <option value="travel">Seyahat</option>
              <option value="food">Yemek</option>
              <option value="finance">Finans</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">Alt Kategori</label>
            <input
              type="text"
              value={formData.subCategory}
              onChange={(e) => setFormData({ ...formData, subCategory: e.target.value })}
              className="w-full px-3 py-2 border rounded"
              placeholder="Netflix, Steam, vb."
            />
          </div>
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-1">Bitiş Tarihi</label>
          <input
            type="date"
            value={formData.expiresAt}
            onChange={(e) => setFormData({ ...formData, expiresAt: e.target.value })}
            className="w-full px-3 py-2 border rounded"
          />
        </div>
      </div>
      
      <div className="flex justify-end gap-2 mt-6">
        <button
          onClick={onClose}
          className="px-4 py-2 border rounded hover:bg-gray-50"
        >
          İptal
        </button>
        <button
          onClick={handleSave}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Kaydet
        </button>
      </div>
    </Modal>
  );
}
```

### 3. Admin API Endpoints

```javascript
// POST /api/admin/bot/trigger/:source
router.post('/admin/bot/trigger/:source', 
  adminAuth,
  async (req, res) => {
    try {
      const { source } = req.params;
      
      // Trigger bot asynchronously
      const job = await botService.triggerScraper(source);
      
      res.json({ 
        message: `${source} bot'u tetiklendi`,
        jobId: job.id,
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
);

// GET /api/admin/bot/status
router.get('/admin/bot/status', 
  adminAuth,
  async (req, res) => {
    try {
      const sources = await botService.getAllSourceStatus();
      const stats = await botService.getStats();
      const recentRuns = await botService.getRecentRuns(10);
      
      res.json({ sources, stats, recentRuns });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
);

// PUT /api/admin/campaigns/:id
router.put('/admin/campaigns/:id', 
  adminAuth,
  validateCampaign,
  async (req, res) => {
    try {
      const { id } = req.params;
      const updates = req.body;
      
      const campaign = await Campaign.update(id, updates);
      
      if (!campaign) {
        return res.status(404).json({ error: 'Campaign not found' });
      }
      
      // Clear cache
      await cacheService.clearCampaignCache();
      
      res.json({ campaign });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
);

// DELETE /api/admin/campaigns/:id
router.delete('/admin/campaigns/:id', 
  adminAuth,
  async (req, res) => {
    try {
      const { id } = req.params;
      
      await Campaign.update(id, { isActive: false, isHidden: true });
      
      // Clear cache
      await cacheService.clearCampaignCache();
      
      res.json({ message: 'Campaign deleted' });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
);
```

---

## 📊 Monitoring & Logging

### 1. Bot Run Logging

```javascript
class BotLogger {
  async logRun(sourceName, status, details) {
    await pool.query(`
      INSERT INTO bot_runs (
        source_name, 
        status, 
        campaigns_found, 
        campaigns_added, 
        error_message,
        started_at,
        completed_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
    `, [
      sourceName,
      status,
      details.campaignsFound,
      details.campaignsAdded,
      details.error,
      details.startedAt,
      details.completedAt,
    ]);
  }
  
  async getRecentRuns(limit = 10) {
    const result = await pool.query(`
      SELECT * FROM bot_runs
      ORDER BY started_at DESC
      LIMIT $1
    `, [limit]);
    
    return result.rows;
  }
  
  async getSourceStats(sourceName) {
    const result = await pool.query(`
      SELECT 
        COUNT(*) as total_runs,
        SUM(CASE WHEN status = 'success' THEN 1 ELSE 0 END) as successful_runs,
        SUM(campaigns_added) as total_campaigns_added,
        MAX(completed_at) as last_run,
        MAX(CASE WHEN status = 'success' THEN completed_at END) as last_success
      FROM bot_runs
      WHERE source_name = $1
    `, [sourceName]);
    
    return result.rows[0];
  }
}
```

### 2. Data Quality Monitoring

```javascript
class QualityMonitor {
  async checkDataQuality() {
    const issues = [];
    
    // Check 1: Campaigns without title
    const noTitle = await pool.query(`
      SELECT COUNT(*) as count FROM campaigns
      WHERE title IS NULL OR LENGTH(TRIM(title)) < 10
    `);
    if (noTitle.rows[0].count > 0) {
      issues.push({
        type: 'missing_title',
        count: noTitle.rows[0].count,
        severity: 'high',
      });
    }
    
    // Check 2: Campaigns without description
    const noDescription = await pool.query(`
      SELECT COUNT(*) as count FROM campaigns
      WHERE description IS NULL OR LENGTH(TRIM(description)) < 20
    `);
    if (noDescription.rows[0].count > 0) {
      issues.push({
        type: 'missing_description',
        count: noDescription.rows[0].count,
        severity: 'high',
      });
    }
    
    // Check 3: Campaigns without category
    const noCategory = await pool.query(`
      SELECT COUNT(*) as count FROM campaigns
      WHERE category IS NULL
    `);
    if (noCategory.rows[0].count > 0) {
      issues.push({
        type: 'missing_category',
        count: noCategory.rows[0].count,
        severity: 'medium',
      });
    }
    
    // Check 4: Expired campaigns still active
    const expiredActive = await pool.query(`
      SELECT COUNT(*) as count FROM campaigns
      WHERE expires_at < NOW() AND is_active = true
    `);
    if (expiredActive.rows[0].count > 0) {
      issues.push({
        type: 'expired_active',
        count: expiredActive.rows[0].count,
        severity: 'medium',
      });
    }
    
    return {
      timestamp: new Date(),
      issues,
      totalIssues: issues.length,
      isHealthy: issues.length === 0,
    };
  }
}
```

---

## 🚀 Deployment Strategy

### 1. Phased Rollout

#### Phase 1: Database Migration (Day 1)
```bash
# Run database migrations
npm run migrate

# Add new columns
psql -d 1ndirim -f migrations/add_category_columns.sql

# Create new table
psql -d 1ndirim -f migrations/create_campaign_categories.sql

# Seed categories
npm run seed:categories
```

#### Phase 2: Backend Updates (Day 1-2)
```bash
# Deploy backend changes
git pull origin main
npm install
pm2 restart backend

# Test endpoints
curl http://localhost:3000/api/campaigns/discover
curl http://localhost:3000/api/campaigns/stats
```

#### Phase 3: Bot Deployment (Day 2-3)
```bash
# Deploy bot service
cd bot
npm install
pm2 start src/index.js --name "1ndirim-bot"

# Test scrapers
npm run test:scraper -- turktelekom
npm run test:scraper -- akbank
```

#### Phase 4: Admin Panel (Day 3-4)
```bash
# Deploy admin panel
cd admin-panel
npm install
npm run build
pm2 restart admin-panel
```

#### Phase 5: Monitoring (Day 4-5)
```bash
# Setup monitoring
npm run setup:monitoring

# Check data quality
npm run check:quality

# View bot logs
pm2 logs 1ndirim-bot
```

### 2. Rollback Plan

```bash
# If issues occur, rollback database
psql -d 1ndirim -f migrations/rollback_category_columns.sql

# Rollback backend
git checkout <previous-commit>
pm2 restart backend

# Stop bot
pm2 stop 1ndirim-bot
```

---

## ✅ Success Criteria

### Quantitative Metrics
- [ ] Kampanya sayısı: 300-500+ (şu an: ~80)
- [ ] Veri kalitesi: %100 (title + description dolu)
- [ ] Kaynak coverage: %100 (tüm kaynaklar çalışıyor)
- [ ] Keşfet kategorileri: 6/6 dolu (her biri min 10 kampanya)
- [ ] Bot başarı oranı: >95%
- [ ] Duplicate rate: <5%
- [ ] API response time: <500ms

### Qualitative Metrics
- [ ] Kullanıcı "Vay be, çok fazla kampanya var!" diyor
- [ ] Keşfet sayfası kullanılabilir ve dolu
- [ ] Admin panel kullanışlı
- [ ] Bot güvenilir çalışıyor

---

**Created by:** Kiro AI  
**Date:** 30 Ocak 2026  
**Status:** Draft → Ready for Implementation

