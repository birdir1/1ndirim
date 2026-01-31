# 🔥 FINAL EXECUTION CHECKLIST

**Goal:** 500+ verified, real campaigns with category-first scraping

**Status:** 🚧 IN PROGRESS  
**Current:** 7/57 sources, ~80 campaigns  
**Target:** 40+/57 sources, 500+ campaigns

---

## 1. Coverage First ✅ PRIORITY #1

**Rule:** Prioritize source implementation over new features

**Blockers:**
- ❌ No new UI until:
  - ≥ 40 sources implemented
  - ≥ 300 campaigns collected

**Progress:**
- [ ] Entertainment: 2/8 sources (Netflix, YouTube Premium needed)
- [ ] Gaming: 2/5 sources (NVIDIA, PlayStation, Xbox needed)
- [ ] Fashion: 0/20 sources (ALL 20 needed)
- [ ] Cosmetics: 0/5 sources (ALL needed)
- [ ] Supplement: 0/5 sources (ALL needed)
- [ ] Food: 0/4 sources (ALL needed)
- [ ] Travel-Air: 0/3 sources (ALL needed)
- [ ] Transport: 0/3 sources (ALL needed)
- [ ] Travel-Bus: 0/4 sources (ALL needed)

**Current:** 7/57 sources (12%)  
**Target:** 40/57 sources (70%)

---

## 2. Scraper Rules ✅ ENFORCED

### Priority
1. **Aggregators > Individual Providers**
   - Travel: Obilet, UcuzaBilet (NOT Kamil Koç, Metro)
   - Bus: Aggregators only
   - Hotel: Booking.com, Hotels.com (NOT individual hotels)

2. **Campaign Pages > Blog Pages**
   - Look for `/kampanyalar`, `/kampanya`, `/indirim`, `/firsat`
   - Ignore `/blog`, `/haber`, `/duyuru`

3. **Ignore "News / Announcement" Without Benefit**
   - Must have clear discount/offer
   - Must have actionable benefit
   - No generic announcements

---

## 3. AI Usage Rules ✅ STRICT

### ❌ AI is NOT Allowed To:
- Invent campaigns
- Create fake offers
- Generate URLs
- Make up dates

### ✅ AI Only Fills:
- Missing title (from description)
- Missing description (from title)
- Missing category (from content)

### Discard Rule:
- If URL has no clear benefit → **DISCARD** (don't save)
- If content is placeholder → **DISCARD**
- If title/description can't be generated → **DISCARD**

---

## 4. Scheduler ✅ CATEGORY-BASED

### Execution Logic
```javascript
for (const category of getAllCategories()) {
  for (const source of category.sources) {
    try {
      const campaigns = await scraper.run();
      if (campaigns.length === 0) {
        log('0 campaign returned', source);
      }
      await saveCampaigns(campaigns);
    } catch (error) {
      if (error.type === 'DOM_CHANGED') {
        log('DOM changed', source);
      }
      if (error.type === 'SELECTOR_FALLBACK') {
        log('Selector fallback triggered', source);
      }
      // Retry only failed sources
    }
  }
}
```

### Logging Requirements
- ✅ 0 campaign returned
- ✅ DOM changed
- ✅ Selector fallback triggered
- ✅ Retry count
- ✅ Success rate per source

---

## 5. Admin Panel (MVP) ✅ MINIMUM VIABLE

### Must Show:
1. **Campaign count per category**
   ```
   🎬 Entertainment: 18/15 ✅
   🎮 Gaming: 12/10 ✅
   👕 Fashion: 0/30 ❌
   ```

2. **Source coverage %**
   ```
   Total: 7/57 (12%)
   Entertainment: 2/8 (25%)
   Fashion: 0/20 (0%)
   ```

3. **Last successful scrape time**
   ```
   Türk Telekom: 2 hours ago ✅
   Vodafone: 2 hours ago ✅
   LC Waikiki: Never ❌
   ```

4. **Manual re-run by category**
   ```
   [Run Entertainment] [Run Gaming] [Run Fashion]
   ```

### NOT Required (Yet):
- ❌ Campaign edit UI
- ❌ Source config UI
- ❌ Advanced filters
- ❌ Charts/graphs

---

## 🎯 Current Status (Dürüst)

### ❌ "Ürün hazır" değil
- 7/57 sources (12%)
- ~80 campaigns (16% of target)
  - *(Anchor + visible campaigns only, personalized campaigns partially indexed)*
- 2/9 categories covered

### ✅ "Bu ürün ölmez"
- Architecture: Scalable ✅
- Templates: Reusable ✅
- Factory: Dynamic ✅
- Registry: 57 sources configured ✅

### Core Philosophy
**The system does not scale by adding people or code, it scales by adding configuration.**

### Bu Mimariyle:
- ✅ 500 kampanya olur
- ✅ 5.000 de olur
- ✅ Yarın banka, telco, market eklenir

---

## 📋 Implementation Order

### Phase 1: High-Priority Sources (10 hours)
**Target: 20 sources, 200+ campaigns**

**1. Banks** (campaign-heavy, personalized) - 2 hours
   - Akbank ✅
   - Garanti (use template)
   - İş Bankası (use template)
   - Yapı Kredi (use template)
   - QNB (use template)
   - *Why: 10-20 campaigns each, personalized sections*

**2. Digital Wallets** (cashback dense) - 1 hour
   - Papara ✅
   - Tosla (use template)
   - Enpara (use template)
   - *Why: High-frequency cashback, user-specific offers*

**3. Food Delivery** (city-based multipliers) - 2 hours
   - Yemeksepeti (use template)
   - Getir Yemek (use template)
   - Trendyol Yemek (use template)
   - Migros Yemek (use template)
   - *Why: Multiple campaigns per city, restaurant deals*

**4. Travel - Air** - 2 hours
   - THY (use template)
   - Pegasus (use template)
   - AJet (use template)
   - *Why: Destination-based campaigns, loyalty programs*

**5. Travel - Bus** (date-based expansion) - 2 hours
   - Obilet (use template)
   - UcuzaBilet (use template)
   - Biletall (use template)
   - NeredenNereye (use template)
   - *Why: Seasonal campaigns, route-specific discounts*

**Checkpoint: 22 sources, 200+ campaigns**

### Phase 2: Fashion Brands (8 hours)
**Target: 20 sources, 150+ campaigns**

Top 10 first (4 hours):
- Zara, H&M, LC Waikiki, Mavi, Koton
- Defacto, Pull&Bear, Bershka, Stradivarius, Colin's

Remaining 10 (4 hours):
- Boyner, Trendyol Fashion, Hepsiburada Fashion, FLO, InStreet
- Network, Vakko, Sarar, Adidas, Nike

**Checkpoint: 42 sources, 350+ campaigns**

### Phase 3: Cosmetics & Supplement (4 hours)
**Target: 10 sources, 80+ campaigns**

Cosmetics (2 hours):
- Gratis, Watsons, Rossmann, Sephora, Yves Rocher

Supplement (2 hours):
- Supplementler.com, BigJoy, Hardline, Muscle & Fitness, Protein7

**Checkpoint: 52 sources, 430+ campaigns**

### Phase 4: Remaining Sources (3 hours)
**Target: 5 sources, 70+ campaigns**

Entertainment (1 hour):
- Prime Video, Exxen, Gain, BluTV, Tivibu Go, Disney+

Gaming (1 hour):
- NVIDIA, PlayStation, Xbox Game Pass

Transport (1 hour):
- Uber, BiTaksi, Yandex Go

**Final: 57 sources, 500+ campaigns**

---

## ✅ Success Criteria

### Quantitative
- [ ] ≥ 40 sources implemented (70%)
- [ ] ≥ 500 campaigns collected
- [ ] ≥ 8/9 categories covered
- [ ] Data quality: 100% (no empty title/description)
- [ ] Duplicate rate: <5%

### Qualitative
- [ ] Scheduler runs category-first
- [ ] Admin panel shows coverage
- [ ] AI only fills missing fields
- [ ] No invented campaigns
- [ ] Aggregators preferred

---

## 🚨 Critical Rules (Reminder)

1. **Coverage First** - No new features until 40 sources + 300 campaigns
2. **Aggregators > Individuals** - Travel, bus, hotel
3. **AI Strict** - Only fill missing title/description, never invent
4. **Discard Bad Data** - No benefit = no save
5. **Category-Based** - Scheduler, admin panel, everything

---

**Next Action:** Start Phase 1 - Implement high-priority sources (banks, wallets, food, travel)

**Estimated Time:** 25 hours total (3-4 days)

**Current Progress:** 12% → Target: 100%

