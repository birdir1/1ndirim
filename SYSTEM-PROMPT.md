# 🔥 FINAL SYSTEM PROMPT

**For:** Kiro / Stitch / Future AI Agents  
**Date:** 31 Ocak 2026  
**Status:** 🔒 LOCKED - DO NOT MODIFY ARCHITECTURE

---

## 🎯 GOAL

Build a **category-driven, scalable campaign aggregation system** that reliably reaches **500+ high-quality campaigns** with maximum coverage and minimum manual effort.

**This is NOT brand-by-brand.**  
**This is category-first, config-driven, template-based.**

---

## ✅ CURRENT STATE (DO NOT REBUILD)

### Architecture is 100% Complete and MUST Be Preserved

**Existing Components (LOCKED):**

1. **Category Registry** (`bot/src/config/category-registry.js`)
   - 57 sources across 9 categories
   - Config-driven, no code changes needed

2. **Generic SPA Scraper Template** (`bot/src/scrapers/templates/GenericSPAScraper.js`)
   - Reusable base for 40+ sources
   - Tiered selectors, infinite scroll, auto date extraction

3. **Scraper Factory** (`bot/src/scrapers/ScraperFactory.js`)
   - Dynamic scraper generation
   - No manual file creation needed

4. **Data Validation & Quality Gate** (`backend/src/services/DataNormalizer.js`)
   - Title/description validation
   - Duplicate detection
   - Hash generation

5. **AI Fallback** (`backend/src/services/AIService.js`)
   - Title/description generation ONLY
   - NEVER invents campaigns

6. **Admin Dashboard** (`admin.1indirim.1indir1.com/dashboard`)
   - Category coverage view
   - Source management
   - Manual triggers

### Implemented Sources (DO NOT TOUCH)

**11 sources implemented:**
- **Telecom:** Türk Telekom, Vodafone, Turkcell
- **Finance:** Akbank, Papara, Garanti BBVA
- **Entertainment:** Netflix
- **Gaming:** Steam, Epic Games
- **Food:** Yemeksepeti
- **Travel (Bus Aggregator):** Obilet

**Current Status:**
- 11/57 sources (19%)
- ~100 campaigns (20% of target)
- 3/9 categories partially covered

---

## 🚨 CORE PROBLEMS TO FIX (PRIORITY 0)

### 1️⃣ CRITICAL COVERAGE GAP

**Current State:**
- Dashboard shows ~80 campaigns
- This is **WRONG**
- Real-world campaign count should be **500+**

**Root Causes:**
1. Scrapers missing user-specific / personalized campaigns
2. Campaign lists truncated
3. Aggregators underused
4. Weak pagination / lazy loading handling
5. Missing category-wide discovery logic

**REQUIRED FIXES:**

Scrapers MUST:
- ✅ Detect "bana özel", "senin için", "fırsatlar" sections
- ✅ Handle infinite scroll + pagination
- ✅ Extract campaigns even if:
  - Title is missing
  - Description is missing
  - Only badge/percentage exists

**Decision Logic:**
```
IF benefit is unclear → DISCARD
IF benefit exists but text missing → AI FILL (STRICT MODE)
```

### 2️⃣ DISCOVER / KEŞFET PAGE LOGIC (PRIORITY 0)

**Discover Page MUST Be:**
- Category-based
- Platform-agnostic
- Aggregator-first

**Category Rules:**

#### 🎬 Entertainment
- Netflix
- Prime Video
- Exxen
- Gain
- YouTube Premium
- Spotify
- Telco-based benefits (Turkcell / TT / Vodafone)

#### 🎮 Gaming
- Steam
- Epic Games (free games REQUIRED)
- Nvidia
- Game Pass–style benefits

#### ✈️ Travel
**❌ DO NOT scrape individual bus companies**  
**✅ ONLY aggregators:**
- Obilet
- Ucuzabilet
- Enuygun
- Skyscanner-like platforms (if accessible)

**Includes:**
- Bus
- Flight
- Hotel
- Transfer
- Taxi

#### 👕 Fashion
- **EXACTLY 20 mandatory brands**
- Each must produce multiple campaigns
- Outlet + seasonal + payment-based benefits

---

## 🧠 SCRAPING RULES (ABSOLUTE)

### Data Quality Gate

**A campaign is SAVED only if:**
1. ✅ Clear benefit exists (%, ₺, cashback, free, gift)
2. ✅ Expiry date exists OR can be inferred
3. ✅ Duplicate hash does NOT exist

**Validation:**
```javascript
// MUST pass all checks
if (!campaign.title || campaign.title.length < 10) {
  // Try AI fallback
  campaign.title = await AIService.generateTitle(campaign.description);
  if (!campaign.title) {
    return DISCARD; // Don't save
  }
}

if (!campaign.description || campaign.description.length < 20) {
  campaign.description = await AIService.generateDescription(campaign.title);
  if (!campaign.description) {
    return DISCARD;
  }
}

if (!hasClearBenefit(campaign)) {
  return DISCARD; // No benefit = no save
}
```

### AI USAGE (STRICT)

**AI may ONLY:**
- ✅ Rewrite unclear text
- ✅ Clean formatting
- ✅ Complete missing title/description

**AI must NEVER:**
- ❌ Invent discounts
- ❌ Invent brands
- ❌ Invent dates
- ❌ Create fake campaigns

**Example (CORRECT):**
```javascript
// Input: { description: "Netflix 3 ay ücretsiz", title: "" }
// AI Output: { title: "Netflix 3 Ay Ücretsiz Kampanyası" }
// ✅ ALLOWED - Generated from existing content
```

**Example (WRONG):**
```javascript
// Input: { url: "https://zara.com", title: "", description: "" }
// AI Output: { title: "Zara'da %50 İndirim" }
// ❌ FORBIDDEN - Invented discount
```

---

## 🛠 ADMIN PANEL REQUIREMENTS

### Dashboard MUST Include:

1. **Campaign Count by Category**
   ```
   🎬 Entertainment: 18/15 ✅
   🎮 Gaming: 12/10 ✅
   👕 Fashion: 0/30 ❌
   ```

2. **Source Coverage (%)**
   ```
   Total: 11/57 (19%)
   Entertainment: 2/8 (25%)
   Fashion: 0/20 (0%)
   ```

3. **Missing Source Alerts**
   ```
   ⚠️ Fashion: 20 sources missing
   ⚠️ Cosmetics: 5 sources missing
   ```

4. **Manual Re-trigger**
   - By category: `[Run Entertainment]`
   - By source: `[Run Zara]`

5. **Failed Scraper Logs (Last 24h)**
   ```
   LC Waikiki: DOM_CHANGED (3 hours ago)
   H&M: SELECTOR_FALLBACK (5 hours ago)
   ```

---

## ⏱ EXECUTION PLAN (MANDATORY)

### Phase 1 – High Yield Sources (10 hours)

**Target Sources:**
- Banks: İş Bankası, Yapı Kredi, QNB (use template)
- Wallets: Tosla, Enpara (use template)
- Food Delivery: Getir Yemek, Trendyol Yemek, Migros Yemek (use template)
- Travel Aggregators: UcuzaBilet, Biletall, NeredenNereye (use template)
- Airlines: THY, Pegasus, AJet (use template)

**🎯 Result: 200+ campaigns**

### Phase 2 – Fashion (8 hours)

**Implement ALL 20 brands:**
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

**🎯 Result: +150 campaigns**

### Phase 3 – Cosmetics & Supplement (4 hours)

**Cosmetics:**
- Gratis, Watsons, Rossmann, Sephora, Yves Rocher

**Supplement:**
- Supplementler.com, BigJoy, Hardline, Muscle & Fitness, Protein7

**🎯 Result: +80 campaigns**

### Phase 4 – Remaining Sources (3 hours)

**Entertainment:**
- Prime Video, Exxen, Gain, BluTV, Tivibu Go, Disney+

**Gaming:**
- NVIDIA, PlayStation, Xbox Game Pass

**Transport:**
- Uber, BiTaksi, Yandex Go

**🎯 Result: +70 campaigns**

---

## 📊 SUCCESS METRICS (ENFORCE)

### System is SUCCESSFUL Only If:

- ✅ **≥ 40 sources active** (70% coverage)
- ✅ **≥ 500 campaigns** (verified, real)
- ✅ **≥ 8/9 categories covered**
- ✅ **Duplicate rate < 5%**
- ✅ **No empty-title campaigns in UI**

### Current Progress:
- Sources: 11/57 (19%) → Target: 40/57 (70%)
- Campaigns: ~100 (20%) → Target: 500+ (100%)
- Categories: 3/9 (33%) → Target: 8/9 (89%)

---

## 🔒 FINAL RULES

### ❌ FORBIDDEN:
- NO new UI features (until 40 sources + 300 campaigns)
- NO refactoring architecture (it's perfect)
- NO brand-first logic (always category-first)
- NO manual scraper files (use templates)

### ✅ ALLOWED:
- ONLY implement missing sources using existing templates
- ONLY increase coverage and data quality
- ONLY fix scraping issues (pagination, scroll, selectors)
- ONLY improve data extraction (personalized sections, etc.)

---

## 💬 FINAL NOTE

**This system must scale to 5,000+ campaigns without architectural changes.**

Everything must remain:
- ✅ Template-based
- ✅ Config-driven
- ✅ Category-first

**Execution only. No redesign.**

---

## 📁 Key Files Reference

### Configuration
- `bot/src/config/category-registry.js` - All 57 sources

### Templates
- `bot/src/scrapers/templates/GenericSPAScraper.js` - Main template

### Factory
- `bot/src/scrapers/ScraperFactory.js` - Dynamic creation

### Services
- `backend/src/services/DataNormalizer.js` - Validation
- `backend/src/services/AIService.js` - AI fallback
- `backend/src/services/DuplicateDetector.js` - Duplicate check

### Documentation
- `CATEGORY-DRIVEN-ARCHITECTURE.md` - Full architecture
- `EXECUTION-CHECKLIST.md` - Implementation roadmap
- `REFACTORING-SUMMARY.md` - What was built

---

## 🚀 Quick Start for New Agent

1. **Read this file first** (you're here)
2. **Check current progress:** `EXECUTION-CHECKLIST.md`
3. **Understand architecture:** `CATEGORY-DRIVEN-ARCHITECTURE.md`
4. **Start implementing:** Use `GenericSPAScraper` template
5. **Add to registry:** Update `category-registry.js`
6. **Test:** Run scraper via factory
7. **Commit:** Follow existing commit patterns

**Example (Add new source):**
```javascript
// 1. Create scraper (if needed custom logic)
class ZaraScraper extends GenericSPAScraper {
  constructor() {
    super('Zara', 'https://www.zara.com/tr/', 'fashion');
  }
}

// 2. Add to ScraperFactory
const ZaraScraper = require('./zara-scraper');
SCRAPER_CLASSES.ZaraScraper = ZaraScraper;

// 3. Already in registry (just enable if disabled)
// No code changes needed!
```

---

**Last Updated:** 31 Ocak 2026  
**Status:** 🔒 LOCKED - Architecture Complete  
**Next Action:** Execute Phase 1 (High Yield Sources)

