

# Category-Driven Architecture

**Date:** 31 Ocak 2026  
**Status:** 🚧 In Progress  
**Priority:** 🔴 CRITICAL

---

## 📋 Overview

This document describes the **category-driven, scalable architecture** for the 1ndirim campaign scraping system.

### Key Principles

1. **Category-First Logic** - System organized by categories, not individual brands
2. **Scalability** - Easy to add new sources without code changes
3. **Template-Based** - Reusable scraper templates for common patterns
4. **Dynamic Generation** - Scrapers created on-demand from registry
5. **No Manual Maintenance** - Add sources via configuration, not code

---

## 🏗️ Architecture Components

### 1. Category Registry (`bot/src/config/category-registry.js`)

Central configuration for all categories and sources.

```javascript
const CATEGORY_REGISTRY = {
  entertainment: {
    id: 'entertainment',
    name: 'Eğlence',
    icon: '🎬',
    minCampaigns: 15,
    priority: 'high',
    sources: [
      { name: 'Netflix', url: '...', type: 'anchor', scraperClass: 'NetflixScraper' },
      { name: 'Amazon Prime Video', url: '...', type: 'anchor' },
      // ... 8 total sources
    ],
  },
  // ... 9 total categories
};
```

**Categories:**
- 🎬 Entertainment (8 sources)
- 🎮 Gaming (5 sources)
- 👕 Fashion (20 sources - mandatory)
- 💄 Cosmetics (5 sources)
- 💊 Supplement (5 sources)
- 🍔 Food/Delivery (4 sources)
- ✈️ Travel - Air (3 sources)
- 🚕 Transport (3 sources)
- 🚌 Travel - Bus (4 aggregators only)

**Total: 57 sources**

### 2. Scraper Templates (`bot/src/scrapers/templates/`)

Reusable base classes for common scraping patterns.

#### GenericSPAScraper
- For SPA-based e-commerce/service sites
- Handles: Fashion, cosmetics, supplements, food delivery
- Features:
  - Tiered selectors
  - Infinite scroll
  - Auto date extraction
  - Fallback campaigns

#### GenericHTMLScraper (TODO)
- For static HTML sites
- Handles: Banks, airlines

#### GenericAnchorScraper (TODO)
- For sources without public campaign pages
- Creates anchor campaigns

### 3. Scraper Factory (`bot/src/scrapers/ScraperFactory.js`)

Dynamically creates scrapers based on registry.

```javascript
// Get all scrapers grouped by category
const scrapersByCategory = ScraperFactory.getAllScrapers();

// Get scrapers for specific category
const fashionScrapers = ScraperFactory.getScrapersByCategory('fashion');

// Create single scraper
const scraper = ScraperFactory.createScraper(source);
```

**Logic:**
1. Check if specific scraper class exists (e.g., `NetflixScraper`)
2. If not, use template based on type (`spa`, `html`, `anchor`)
3. Return scraper instance ready to run

### 4. Category-Driven Scheduler (TODO)

New scheduler that loops through categories, not individual scrapers.

```javascript
// Pseudocode
for (const category of getAllCategories()) {
  for (const source of category.sources) {
    const scraper = ScraperFactory.createScraper(source);
    const campaigns = await scraper.runWithRetry();
    await saveCampaigns(campaigns, category.id);
  }
}
```

**Features:**
- Category-first scheduling
- Retry failed sources
- Log coverage per category
- Priority-based execution

---

## 📊 Category Coverage

### Required Coverage

| Category | Sources | Min Campaigns | Priority |
|----------|---------|---------------|----------|
| 🎬 Entertainment | 8 | 15 | High |
| 🎮 Gaming | 5 | 10 | High |
| 👕 Fashion | 20 | 30 | Medium |
| 💄 Cosmetics | 5 | 10 | Medium |
| 💊 Supplement | 5 | 10 | Low |
| 🍔 Food | 4 | 10 | High |
| ✈️ Travel - Air | 3 | 10 | Medium |
| 🚕 Transport | 3 | 5 | Low |
| 🚌 Travel - Bus | 4 | 10 | Medium |

**Total: 57 sources, 500+ campaigns**

### Fashion Brands (Mandatory Top 20)

Research-backed, most-used brands in Turkey:

1. Zara
2. H&M
3. LC Waikiki
4. Mavi
5. Koton
6. Defacto
7. Pull&Bear
8. Bershka
9. Stradivarius
10. Colin's
11. Boyner
12. Trendyol Fashion
13. Hepsiburada Fashion
14. FLO
15. InStreet
16. Network
17. Vakko
18. Sarar
19. Adidas
20. Nike

### Travel - Bus (Aggregators Only)

**IMPORTANT:** Only scrape aggregator platforms, not individual bus companies.

**Why?**
- Aggregators include all bus companies
- Campaigns are centralized
- Discounts are user-facing and scalable
- Stability (individual firms change pages frequently)

**Sources:**
- Obilet
- UcuzaBilet
- Biletall
- NeredenNereye

**Extract:**
- Bank/wallet discounts
- Promo codes
- Seasonal ticket campaigns
- Operator-specific deals
- "First purchase" or "app-only" discounts

---

## 🔧 Data Quality Gate

### Validation Rules

Campaign MUST NOT be saved if:
- `title` is empty
- `description` is empty
- Content is placeholder-like ("Phase 7", hashtags only)

### Fallback Strategy

If validation fails:
1. **Auto-generate via LLM** (AIService)
2. **Or mark as** `needs_review = true`

### Implementation

```javascript
// In DataNormalizer.validate()
if (!campaign.title || campaign.title.length < 10) {
  // Try AI fallback
  campaign.title = await AIService.generateTitle(campaign.description);
  
  if (!campaign.title) {
    campaign.needs_review = true;
  }
}
```

---

## 🎛️ Admin Panel Integration

### Category Management

**Dashboard Features:**
- View all categories
- See coverage per category (X/Y campaigns)
- Identify "missing coverage" categories
- Trigger scrape by category
- Trigger scrape by source

**UI Mockup:**

```
┌─────────────────────────────────────────────────┐
│ Category Coverage                               │
├─────────────────────────────────────────────────┤
│ 🎬 Entertainment    [████████░░] 18/15 ✅       │
│ 🎮 Gaming           [██████░░░░] 12/10 ✅       │
│ 👕 Fashion          [████░░░░░░] 12/30 ⚠️       │
│ 💄 Cosmetics        [░░░░░░░░░░]  0/10 ❌       │
│ 💊 Supplement       [░░░░░░░░░░]  0/10 ❌       │
│ 🍔 Food             [░░░░░░░░░░]  0/10 ❌       │
│ ✈️ Travel - Air     [░░░░░░░░░░]  0/10 ❌       │
│ 🚕 Transport        [░░░░░░░░░░]  0/5  ❌       │
│ 🚌 Travel - Bus     [░░░░░░░░░░]  0/10 ❌       │
└─────────────────────────────────────────────────┘
```

### Source Management

**Per-Category Source List:**

```
Fashion (20 sources)
├─ Zara              [✅ Active] [Last: 2h ago] [12 campaigns]
├─ H&M               [✅ Active] [Last: 2h ago] [8 campaigns]
├─ LC Waikiki        [⚠️ Error]  [Last: 1d ago] [0 campaigns]
├─ Mavi              [⏸️ Disabled]
└─ ...
```

**Actions:**
- Enable/Disable source
- Trigger scrape
- View error logs
- Edit source config

---

## 🚀 Implementation Plan

### Phase 1: Core Architecture ✅ IN PROGRESS
- [x] Create Category Registry
- [x] Create GenericSPAScraper template
- [x] Create ScraperFactory
- [ ] Update existing scrapers to use templates
- [ ] Test factory with existing sources

### Phase 2: Scheduler Refactor
- [ ] Create CategoryScheduler
- [ ] Implement category-first logic
- [ ] Add retry mechanism
- [ ] Add coverage logging

### Phase 3: Template Expansion
- [ ] Create GenericHTMLScraper
- [ ] Create GenericAnchorScraper
- [ ] Create specialized templates (fashion, food, etc.)

### Phase 4: Source Addition
- [ ] Add all 20 fashion brands
- [ ] Add cosmetics sources
- [ ] Add supplement sources
- [ ] Add food delivery sources
- [ ] Add travel sources
- [ ] Add transport sources

### Phase 5: Admin Panel
- [ ] Category coverage dashboard
- [ ] Source management UI
- [ ] Trigger scrape by category
- [ ] Missing coverage alerts

### Phase 6: Testing & Validation
- [ ] Test all categories
- [ ] Verify 500+ campaigns
- [ ] Check data quality
- [ ] Monitor coverage

---

## 📈 Success Metrics

### Quantitative
- [ ] Total campaigns: 500+ (currently: ~80)
- [ ] Category coverage: 9/9 (currently: 2/9)
- [ ] Source coverage: 57/57 (currently: 7/57)
- [ ] Data quality: 100% (title + description)
- [ ] Bot success rate: >95%
- [ ] Duplicate rate: <5%

### Qualitative
- [ ] No manual scraper creation needed
- [ ] Easy to add new sources (config only)
- [ ] Stable scraping (template-based)
- [ ] Admin panel usable
- [ ] Categories always populated

---

## 🔗 File Structure

```
bot/
├── src/
│   ├── config/
│   │   └── category-registry.js          # Central config
│   ├── scrapers/
│   │   ├── templates/
│   │   │   ├── GenericSPAScraper.js      # SPA template
│   │   │   ├── GenericHTMLScraper.js     # HTML template (TODO)
│   │   │   └── GenericAnchorScraper.js   # Anchor template (TODO)
│   │   ├── ScraperFactory.js             # Dynamic creation
│   │   ├── base-scraper.js               # Base class
│   │   ├── turktelekom-scraper.js        # Specific scrapers
│   │   ├── vodafone-scraper.js
│   │   └── ...
│   ├── scheduler/
│   │   └── CategoryScheduler.js          # Category-first scheduler (TODO)
│   └── ...
```

---

## 💡 Key Advantages

### Before (Brand-by-Brand)
- ❌ 60+ manual scraper files
- ❌ Code changes for each new source
- ❌ Hard to maintain
- ❌ Inconsistent patterns
- ❌ No category visibility

### After (Category-Driven)
- ✅ 1 registry file
- ✅ Config changes only
- ✅ Easy to maintain
- ✅ Consistent templates
- ✅ Category-first visibility

---

## 🚨 Critical Rules

1. **Category-First Logic** - Always organize by category
2. **No Manual Scrapers** - Use templates and factory
3. **Aggregators Over Individuals** - Prefer aggregator platforms (travel, bus)
4. **Data Quality Gate** - Validate before save
5. **Fallback Always** - Every category must have campaigns

---

**Next Steps:** Complete Phase 1, then move to scheduler refactor.

