# Kampanya Data Fix - Implementation Tasks

**Spec ID:** kampanya-data-fix  
**Created:** 31 Ocak 2026  
**Priority:** 🔴 CRITICAL (Store Launch Blocker)  
**Status:** Ready for Implementation

---

## 📋 Task Overview

**Total Tasks:** 45  
**Estimated Time:** 3-5 days  
**Critical Path:** Database → Backend → Bot → Admin Panel

---

## 🎯 Phase 1: Database Migration (Day 1 - 4 hours)

### 1.1 Create Migration Files
- [ ] Create `migrations/001_add_category_columns.sql`
  - Add `category` column (TEXT)
  - Add `sub_category` column (TEXT)
  - Add `discount_percentage` column (INTEGER)
  - Add `is_personalized` column (BOOLEAN DEFAULT false)
  - Add `scraped_at` column (TIMESTAMP)
  - Add `data_hash` column (TEXT)
  - Add indexes for performance
  - Add constraints (title min 10 chars, description min 20 chars, category not null)

**Acceptance Criteria:**
- Migration file runs without errors
- All columns added successfully
- Indexes created
- Constraints enforced

**Estimated Time:** 1 hour

---

### 1.2 Create campaign_categories Table
- [ ] Create `migrations/002_create_campaign_categories.sql`
  - Create table with columns: id, name, display_name, icon, description, min_campaigns, fixed_sources (JSONB), is_active, created_at
  - Add unique constraint on name
  - Seed 6 categories (entertainment, gaming, fashion, travel, food, finance)

**Acceptance Criteria:**
- Table created successfully
- 6 categories seeded
- Unique constraint works

**Estimated Time:** 30 minutes

---

### 1.3 Run Migrations
- [ ] Test migrations on local database
- [ ] Run migrations on production database
- [ ] Verify data integrity (existing campaigns not affected)
- [ ] Create rollback script

**Acceptance Criteria:**
- Migrations run successfully
- No data loss
- Rollback script tested

**Estimated Time:** 1 hour

---

### 1.4 Update Campaign Model
- [ ] Update `backend/src/models/Campaign.js`
  - Add new fields to create() method
  - Add new fields to update() method
  - Add category validation
  - Add findByCategory() method
  - Add findByCategoryWithFallback() method (for Keşfet page)

**Acceptance Criteria:**
- Model supports new fields
- Validation works
- New methods work correctly

**Estimated Time:** 1.5 hours

---

## 🔧 Phase 2: Backend API Updates (Day 1-2 - 6 hours)

### 2.1 Create Data Normalizer Service
- [ ] Create `backend/src/services/DataNormalizer.js`
  - Implement normalize() method
  - Implement cleanText() method
  - Implement parseDate() method
  - Implement extractDiscount() method
  - Implement generateHash() method
  - Implement validate() method

**Acceptance Criteria:**
- Normalizer cleans and validates data
- Hash generation works
- Validation catches bad data

**Estimated Time:** 2 hours

---

### 2.2 Create AI Service
- [ ] Create `backend/src/services/AIService.js`
  - Implement generateTitle() method (OpenAI integration)
  - Implement generateDescription() method
  - Implement predictCategory() method
  - Add error handling and retry logic
  - Add rate limiting (max 10 req/min)

**Acceptance Criteria:**
- AI generates quality titles
- AI generates quality descriptions
- AI predicts categories accurately
- Rate limiting works

**Estimated Time:** 2 hours

---

### 2.3 Create Duplicate Detector Service
- [ ] Create `backend/src/services/DuplicateDetector.js`
  - Implement checkDuplicate() method
  - Implement URL-based detection
  - Implement hash-based detection
  - Implement fuzzy matching (Levenshtein distance)
  - Implement calculateSimilarity() method

**Acceptance Criteria:**
- Duplicate detection works (URL, hash, fuzzy)
- No false positives
- Performance acceptable (<100ms)

**Estimated Time:** 1.5 hours

---

### 2.4 Update POST /api/campaigns Endpoint
- [ ] Update `backend/src/routes/campaigns.js`
  - Add DataNormalizer integration
  - Add AI fallback integration
  - Add DuplicateDetector integration
  - Add validation middleware
  - Add error handling
  - Add logging

**Acceptance Criteria:**
- Endpoint accepts normalized data
- AI fallback works when needed
- Duplicate detection prevents duplicates
- Validation catches bad data

**Estimated Time:** 30 minutes

---

### 2.5 Create GET /api/campaigns/discover Endpoint
- [ ] Add new endpoint in `backend/src/routes/campaigns.js`
  - Implement category-based feed
  - Implement fallback strategy (show last known campaigns)
  - Add caching (5 minutes)
  - Add error handling

**Acceptance Criteria:**
- Endpoint returns 6 categories
- Each category has campaigns or fallback
- Caching works
- Response time <500ms

**Estimated Time:** 30 minutes

---

### 2.6 Create GET /api/campaigns/stats Endpoint
- [ ] Add new endpoint in `backend/src/routes/campaigns.js`
  - Implement total count
  - Implement by-category count
  - Implement by-source count
  - Implement recently-added count
  - Add caching (10 minutes)

**Acceptance Criteria:**
- Endpoint returns accurate stats
- Caching works
- Response time <300ms

**Estimated Time:** 30 minutes

---

## 🤖 Phase 3: Bot System Fixes (Day 2-3 - 12 hours)

### 3.1 Update BaseScraper
- [ ] Update `bot/src/scrapers/base-scraper.js`
  - Add normalization integration
  - Add AI fallback integration
  - Add duplicate detection integration
  - Add better error handling
  - Add retry logic improvements

**Acceptance Criteria:**
- BaseScraper supports new features
- Error handling robust
- Retry logic works

**Estimated Time:** 1 hour

---

### 3.2 Fix Türk Telekom Scraper (Priority 1)
- [ ] Update `bot/src/scrapers/turktelekom-scraper.js`
  - Fix selector issues (use tiered selectors)
  - Implement infinite scroll handling
  - Add category detection
  - Add sub_category detection
  - Test thoroughly (should find 15-20 campaigns)

**Acceptance Criteria:**
- Scraper finds 15-20 campaigns
- All campaigns have title, description, category
- No duplicates
- Success rate >95%

**Estimated Time:** 2 hours

---

### 3.3 Fix Vodafone Scraper
- [ ] Update `bot/src/scrapers/vodafone-scraper.js`
  - Fix selector issues
  - Implement SPA handling
  - Add category detection
  - Test thoroughly

**Acceptance Criteria:**
- Scraper finds 10-15 campaigns
- All campaigns have title, description, category
- Success rate >90%

**Estimated Time:** 1.5 hours

---

### 3.4 Fix Turkcell Scraper
- [ ] Update `bot/src/scrapers/turkcell-scraper.js`
  - Fix selector issues
  - Implement SPA handling
  - Add category detection
  - Test thoroughly

**Acceptance Criteria:**
- Scraper finds 10-15 campaigns
- All campaigns have title, description, category
- Success rate >90%

**Estimated Time:** 1.5 hours

---

### 3.5 Fix Papara Scraper
- [ ] Update `bot/src/scrapers/papara-scraper.js`
  - Implement hybrid scraping (network + DOM)
  - Add category detection (mostly finance)
  - Test thoroughly

**Acceptance Criteria:**
- Scraper finds 5-10 campaigns
- All campaigns have title, description, category
- Success rate >90%

**Estimated Time:** 1 hour

---

### 3.6 Fix Akbank Scraper
- [ ] Update `bot/src/scrapers/akbank-scraper.js`
  - Fix HTML parsing
  - Add category detection (finance)
  - Test thoroughly

**Acceptance Criteria:**
- Scraper finds 10-15 campaigns
- All campaigns have title, description, category
- Success rate >90%

**Estimated Time:** 1 hour

---

### 3.7 Create Netflix Scraper (Keşfet - Entertainment)
- [ ] Create `bot/src/scrapers/netflix-scraper.js`
  - Implement scraping strategy (check if public page exists)
  - If no public page, create manual entry system
  - Add category: entertainment
  - Add sub_category: Netflix

**Acceptance Criteria:**
- At least 3-5 Netflix campaigns in system
- Category: entertainment
- Sub_category: Netflix

**Estimated Time:** 1.5 hours

---

### 3.8 Create Steam Scraper (Keşfet - Gaming)
- [ ] Create `bot/src/scrapers/steam-scraper.js`
  - Scrape Steam free weekend / sales
  - Add category: gaming
  - Add sub_category: Steam

**Acceptance Criteria:**
- At least 5-10 Steam campaigns in system
- Category: gaming
- Sub_category: Steam

**Estimated Time:** 1.5 hours

---

### 3.9 Create Epic Games Scraper (Keşfet - Gaming)
- [ ] Create `bot/src/scrapers/epicgames-scraper.js`
  - Scrape Epic Games free games
  - Add category: gaming
  - Add sub_category: Epic Games

**Acceptance Criteria:**
- At least 2-5 Epic Games campaigns in system
- Category: gaming
- Sub_category: Epic Games

**Estimated Time:** 1 hour

---

### 3.10 Update Bot Scheduler
- [ ] Update `bot/src/scheduler.js`
  - Add all new scrapers to schedule
  - Set appropriate intervals (daily for most, hourly for high-priority)
  - Add error handling
  - Add logging

**Acceptance Criteria:**
- All scrapers run on schedule
- Error handling works
- Logs are comprehensive

**Estimated Time:** 30 minutes

---

## 🎛️ Phase 4: Admin Panel Integration (Day 3-4 - 8 hours)

### 4.1 Create Bot Dashboard Page
- [ ] Create `admin-panel/app/bot/page.tsx`
  - Implement BotDashboard component
  - Implement StatCard component
  - Implement SourceRow component
  - Implement StatusBadge component
  - Add loading states
  - Add error handling

**Acceptance Criteria:**
- Dashboard shows all sources
- Stats are accurate
- UI is responsive
- Loading states work

**Estimated Time:** 2 hours

---

### 4.2 Create Bot Trigger API
- [ ] Create `backend/src/routes/admin/bot.js`
  - Implement POST /api/admin/bot/trigger/:source
  - Implement GET /api/admin/bot/status
  - Implement GET /api/admin/bot/logs
  - Add authentication (admin only)
  - Add error handling

**Acceptance Criteria:**
- Trigger endpoint works
- Status endpoint returns accurate data
- Logs endpoint returns recent runs
- Authentication works

**Estimated Time:** 1.5 hours

---

### 4.3 Create Bot Service
- [ ] Create `backend/src/services/BotService.js`
  - Implement triggerScraper() method
  - Implement getAllSourceStatus() method
  - Implement getStats() method
  - Implement getRecentRuns() method
  - Add job queue integration (optional)

**Acceptance Criteria:**
- Service triggers scrapers correctly
- Status methods return accurate data
- Job queue works (if implemented)

**Estimated Time:** 2 hours

---

### 4.4 Create Campaign Management Page
- [ ] Create `admin-panel/app/campaigns/page.tsx`
  - Implement CampaignList component
  - Implement CampaignRow component
  - Implement filters (category, source, search)
  - Add pagination
  - Add loading states

**Acceptance Criteria:**
- List shows all campaigns
- Filters work
- Pagination works
- UI is responsive

**Estimated Time:** 1.5 hours

---

### 4.5 Create Campaign Edit Modal
- [ ] Create `admin-panel/components/CampaignEditModal.tsx`
  - Implement form fields (title, description, category, sub_category, expires_at)
  - Add validation
  - Add save functionality
  - Add error handling

**Acceptance Criteria:**
- Modal opens/closes correctly
- Form validation works
- Save updates campaign
- Error handling works

**Estimated Time:** 1 hour

---

## 📊 Phase 5: Monitoring & Quality (Day 4-5 - 4 hours)

### 5.1 Create Bot Logger
- [ ] Create `backend/src/services/BotLogger.js`
  - Implement logRun() method
  - Implement getRecentRuns() method
  - Implement getSourceStats() method
  - Create bot_runs table migration

**Acceptance Criteria:**
- Logger saves run data
- Recent runs query works
- Source stats query works

**Estimated Time:** 1 hour

---

### 5.2 Create Quality Monitor
- [ ] Create `backend/src/services/QualityMonitor.js`
  - Implement checkDataQuality() method
  - Check for missing titles
  - Check for missing descriptions
  - Check for missing categories
  - Check for expired active campaigns
  - Add scheduled job (daily)

**Acceptance Criteria:**
- Quality checks run successfully
- Issues are detected
- Report is comprehensive

**Estimated Time:** 1.5 hours

---

### 5.3 Create Quality Report Endpoint
- [ ] Add GET /api/admin/campaigns/quality-report endpoint
  - Return quality check results
  - Add caching (1 hour)
  - Add error handling

**Acceptance Criteria:**
- Endpoint returns quality report
- Caching works
- Response time <500ms

**Estimated Time:** 30 minutes

---

### 5.4 Create Quality Dashboard
- [ ] Create `admin-panel/app/quality/page.tsx`
  - Show quality metrics
  - Show issues list
  - Add fix suggestions
  - Add refresh button

**Acceptance Criteria:**
- Dashboard shows quality metrics
- Issues are listed
- UI is clear and actionable

**Estimated Time:** 1 hour

---

## 🧪 Phase 6: Testing & Validation (Day 5 - 4 hours)

### 6.1 Test Database Migrations
- [ ] Test on local database
- [ ] Test on staging database
- [ ] Verify data integrity
- [ ] Test rollback script

**Acceptance Criteria:**
- Migrations run without errors
- No data loss
- Rollback works

**Estimated Time:** 30 minutes

---

### 6.2 Test Backend APIs
- [ ] Test POST /api/campaigns with normalized data
- [ ] Test POST /api/campaigns with AI fallback
- [ ] Test POST /api/campaigns with duplicate detection
- [ ] Test GET /api/campaigns/discover
- [ ] Test GET /api/campaigns/stats
- [ ] Test admin endpoints

**Acceptance Criteria:**
- All endpoints work correctly
- Validation catches bad data
- AI fallback works
- Duplicate detection works

**Estimated Time:** 1 hour

---

### 6.3 Test Bot Scrapers
- [ ] Test Türk Telekom scraper (should find 15-20 campaigns)
- [ ] Test Vodafone scraper
- [ ] Test Turkcell scraper
- [ ] Test Papara scraper
- [ ] Test Akbank scraper
- [ ] Test Netflix scraper
- [ ] Test Steam scraper
- [ ] Test Epic Games scraper

**Acceptance Criteria:**
- All scrapers run successfully
- Campaign counts meet targets
- Data quality is high (title, description, category)
- No duplicates

**Estimated Time:** 1.5 hours

---

### 6.4 Test Admin Panel
- [ ] Test bot dashboard
- [ ] Test bot trigger functionality
- [ ] Test campaign list
- [ ] Test campaign edit
- [ ] Test quality dashboard

**Acceptance Criteria:**
- All pages load correctly
- All functionality works
- UI is responsive
- No console errors

**Estimated Time:** 1 hour

---

## 🚀 Phase 7: Deployment (Day 5 - 2 hours)

### 7.1 Deploy Database Migrations
- [ ] Backup production database
- [ ] Run migrations on production
- [ ] Verify data integrity
- [ ] Monitor for errors

**Acceptance Criteria:**
- Migrations run successfully
- No data loss
- No errors

**Estimated Time:** 30 minutes

---

### 7.2 Deploy Backend
- [ ] Deploy backend code
- [ ] Restart backend service
- [ ] Test endpoints
- [ ] Monitor logs

**Acceptance Criteria:**
- Backend deploys successfully
- All endpoints work
- No errors in logs

**Estimated Time:** 30 minutes

---

### 7.3 Deploy Bot Service
- [ ] Deploy bot code
- [ ] Restart bot service
- [ ] Trigger test scraper
- [ ] Monitor logs

**Acceptance Criteria:**
- Bot deploys successfully
- Test scraper works
- No errors in logs

**Estimated Time:** 30 minutes

---

### 7.4 Deploy Admin Panel
- [ ] Build admin panel
- [ ] Deploy to production
- [ ] Test functionality
- [ ] Monitor for errors

**Acceptance Criteria:**
- Admin panel deploys successfully
- All functionality works
- No errors

**Estimated Time:** 30 minutes

---

## 📝 Phase 8: Verification & Monitoring (Day 5 - 2 hours)

### 8.1 Verify Campaign Count
- [ ] Check total campaign count (should be 300-500+)
- [ ] Check Türk Telekom count (should be 15-20)
- [ ] Check other source counts
- [ ] Verify data quality (title, description, category)

**Acceptance Criteria:**
- Campaign count meets target (300-500+)
- Türk Telekom has 15-20 campaigns
- Data quality is high

**Estimated Time:** 30 minutes

---

### 8.2 Verify Keşfet Page
- [ ] Check all 6 categories are populated
- [ ] Check each category has min 10 campaigns
- [ ] Check anchor campaigns exist (Netflix, Steam, YouTube)
- [ ] Test fallback strategy

**Acceptance Criteria:**
- All 6 categories populated
- Each category has min 10 campaigns
- Anchor campaigns exist

**Estimated Time:** 30 minutes

---

### 8.3 Monitor Bot Performance
- [ ] Check bot success rate (should be >95%)
- [ ] Check duplicate rate (should be <5%)
- [ ] Check error logs
- [ ] Verify scheduled runs

**Acceptance Criteria:**
- Bot success rate >95%
- Duplicate rate <5%
- No critical errors

**Estimated Time:** 30 minutes

---

### 8.4 User Acceptance Testing
- [ ] Test app on iOS
- [ ] Test app on Android
- [ ] Verify campaign list is full
- [ ] Verify Keşfet page works
- [ ] Get user feedback

**Acceptance Criteria:**
- App works on both platforms
- Campaign list is full
- Keşfet page works
- User feedback positive

**Estimated Time:** 30 minutes

---

## 📊 Success Metrics

### Quantitative Metrics
- [ ] Kampanya sayısı: 300-500+ (şu an: ~80) ✅ Target: 300+
- [ ] Veri kalitesi: %100 (title + description dolu) ✅ Target: 100%
- [ ] Kaynak coverage: %100 (tüm kaynaklar çalışıyor) ✅ Target: 100%
- [ ] Keşfet kategorileri: 6/6 dolu ✅ Target: 6/6
- [ ] Bot başarı oranı: >95% ✅ Target: 95%
- [ ] Duplicate rate: <5% ✅ Target: <5%
- [ ] API response time: <500ms ✅ Target: <500ms

### Qualitative Metrics
- [ ] Kullanıcı "Vay be, çok fazla kampanya var!" diyor
- [ ] Keşfet sayfası kullanılabilir ve dolu
- [ ] Admin panel kullanışlı
- [ ] Bot güvenilir çalışıyor

---

## 🚨 Critical Path

**Must Complete in Order:**
1. Phase 1: Database Migration (blocker for everything)
2. Phase 2: Backend API Updates (blocker for bot)
3. Phase 3: Bot System Fixes (blocker for data)
4. Phase 4: Admin Panel Integration (can be parallel with Phase 5)
5. Phase 5: Monitoring & Quality (can be parallel with Phase 4)
6. Phase 6: Testing & Validation
7. Phase 7: Deployment
8. Phase 8: Verification & Monitoring

**Estimated Total Time:** 42 hours (3-5 days with 8-10 hour workdays)

---

## 🔄 Dependencies

### External Dependencies
- OpenAI API key (for AI fallback)
- PostgreSQL database access
- Admin panel authentication

### Internal Dependencies
- Phase 2 depends on Phase 1 (database schema)
- Phase 3 depends on Phase 2 (backend APIs)
- Phase 4 depends on Phase 2 (backend APIs)
- Phase 6 depends on Phases 1-5 (all features)
- Phase 7 depends on Phase 6 (testing)
- Phase 8 depends on Phase 7 (deployment)

---

## 📋 Task Status Legend

- [ ] Not Started
- [~] In Progress
- [x] Completed
- [!] Blocked
- [?] Needs Clarification

---

**Created by:** Kiro AI  
**Date:** 31 Ocak 2026  
**Status:** Ready for Execution  
**Next Step:** Start with Phase 1 (Database Migration)
