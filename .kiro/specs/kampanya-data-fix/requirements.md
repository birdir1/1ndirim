# Kampanya Data Fix - Requirements

**Spec ID:** kampanya-data-fix  
**Created:** 30 Ocak 2026  
**Priority:** 🔴 CRITICAL (Store Launch Blocker)  
**Status:** Draft

---

## 📋 Problem Statement

### Current State (Broken)
- **Kampanya sayısı:** ~80 (çok düşük, gerçek dışı)
- **Veri kalitesi:** Çok kötü
  - Birçok kampanya title yok
  - Description yok
  - Sadece "Faz 7 #hashtag" gibi anlamsız içerik
- **Kaynak coverage:** Çok eksik
  - Türk Telekom: Gerçekte 15-20 kampanya var → Sistemde 2 kampanya
  - Diğer kaynaklar da benzer durumda
- **Keşfet sayfası:** Yarım çalışıyor
  - Kategori bazlı veri yok
  - Eğlence/oyun/giyim/seyahat gibi dikeyler eksik
  - Anchor kampanyalar çekilmiyor (Netflix, Steam, YouTube vs)

### Desired State (Fixed)
- **Kampanya sayısı:** 300-500+ (gerçekçi)
- **Veri kalitesi:** Yüksek
  - Her kampanyada title var
  - Her kampanyada description var (en az 1-2 cümle)
  - Kategorize edilmiş
  - Sub-category var
- **Kaynak coverage:** Tam
  - Her kaynak için tüm kampanyalar çekiliyor
  - Türk Telekom: 15-20 kampanya
  - Diğer kaynaklar da tam
- **Keşfet sayfası:** Tam çalışıyor
  - Her kategori dolu
  - Anchor kampanyalar var
  - Kullanıcı deneyimi mükemmel

---

## 🎯 Goals

### Primary Goals
1. **Kampanya sayısını 300-500'e çıkarmak**
2. **Veri kalitesini %100'e çıkarmak** (title, description zorunlu)
3. **Keşfet sayfasını tam çalışır hale getirmek**
4. **Bot sistemini production-ready yapmak**

### Secondary Goals
1. Admin panel entegrasyonu
2. Manuel kampanya ekleme/düzenleme
3. Bot tetikleme UI
4. Veri kalite monitoring

---

## 👥 User Stories

### US-1: Kullanıcı Olarak - Dolu Kampanya Listesi
**As a** kullanıcı  
**I want to** uygulamayı açtığımda yüzlerce kampanya görmek  
**So that** gerçekten faydalı bir uygulama olduğunu düşüneyim

**Acceptance Criteria:**
- [ ] Ana sayfada en az 50 kampanya görünüyor
- [ ] Her kampanyada title var
- [ ] Her kampanyada description var
- [ ] Her kampanyada kaynak logosu var
- [ ] Kampanyalar kategorize edilmiş

### US-2: Kullanıcı Olarak - Keşfet Sayfası
**As a** kullanıcı  
**I want to** Keşfet sayfasında kategorilere göre kampanya görmek  
**So that** ilgilendiğim kategorideki kampanyaları kolayca bulabileyim

**Acceptance Criteria:**
- [ ] Keşfet sayfasında en az 6 kategori var (Entertainment, Gaming, Fashion, Travel, Food, Finance)
- [ ] Her kategoride en az 10 kampanya var
- [ ] Netflix, YouTube, Steam gibi anchor kampanyalar var
- [ ] Kategoriler arasında geçiş kolay

### US-3: Kullanıcı Olarak - Türk Telekom Kampanyaları
**As a** Türk Telekom kullanıcısı  
**I want to** Türk Telekom'un tüm kampanyalarını görmek  
**So that** hiçbir kampanyayı kaçırmayayım

**Acceptance Criteria:**
- [ ] Türk Telekom'un en az 15 kampanyası sistemde var
- [ ] Her kampanyada title, description, validity var
- [ ] Kampanyalar güncel (son 24 saatte çekilmiş)

### US-4: Admin Olarak - Bot Yönetimi
**As an** admin  
**I want to** bot'ları manuel olarak tetikleyebilmek  
**So that** kampanyaları istediğim zaman güncelleyebileyim

**Acceptance Criteria:**
- [ ] Admin panelde "Bot Tetikle" butonu var
- [ ] Kaynak seçerek bot tetiklenebiliyor
- [ ] Bot çalışma durumu görünüyor
- [ ] Son çalışma zamanı görünüyor

### US-5: Admin Olarak - Kampanya Düzenleme
**As an** admin  
**I want to** kampanyaları manuel olarak düzenleyebilmek  
**So that** bot'un yanlış çektiği verileri düzeltebileyim

**Acceptance Criteria:**
- [ ] Admin panelde kampanya düzenleme sayfası var
- [ ] Title, description, category düzenlenebiliyor
- [ ] Kampanya silinebiliyor
- [ ] Yeni kampanya manuel eklenebiliyor

---

## 🔧 Technical Requirements

### TR-1: Veri Modeli
**Requirement:** Her kampanya aşağıdaki alanları içermeli (zorunlu)

**Fields:**
```typescript
interface Campaign {
  // Zorunlu alanlar
  id: string;
  title: string;                    // ZORUNLU - AI ile üretilebilir
  description: string;               // ZORUNLU - En az 1-2 cümle
  source: string;                    // Türk Telekom, Papara, Steam vs
  category: CampaignCategory;        // ZORUNLU
  validFrom: Date;
  validTo: Date;
  
  // Opsiyonel ama önerilen
  subCategory?: string;              // Netflix, YouTube, Steam, Zara vs
  campaignType?: CampaignType;       // cashback, free_trial, discount, gift
  conditions?: string;
  originalUrl?: string;
  imageUrl?: string;
  discountPercentage?: number;
  isPersonalized?: boolean;          // "Bana özel" kampanyalar
  
  // Metadata
  createdAt: Date;
  updatedAt: Date;
  scrapedAt: Date;
  hash: string;                      // Duplicate detection
}

enum CampaignCategory {
  ENTERTAINMENT = 'entertainment',   // Netflix, YouTube, Prime
  MUSIC = 'music',                   // Spotify, Apple Music
  GAMING = 'gaming',                 // Steam, Epic, Nvidia
  FASHION = 'fashion',               // Zara, H&M, LCW
  TRAVEL = 'travel',                 // THY, Pegasus, Obilet
  FOOD = 'food',                     // Yemeksepeti, Getir
  FINANCE = 'finance',               // Banka, cüzdan
  SHOPPING = 'shopping',             // Genel alışveriş
  TELECOM = 'telecom',               // Operatör
}

enum CampaignType {
  CASHBACK = 'cashback',
  FREE_TRIAL = 'free_trial',
  DISCOUNT = 'discount',
  GIFT = 'gift',
  POINTS = 'points',
}
```

**Validation Rules:**
- ❌ Title boş olamaz
- ❌ Description boş olamaz
- ❌ Category boş olamaz
- ❌ Source boş olamaz
- ❌ ValidTo geçmiş tarih olamaz

**AI Fallback:**
- Eğer title yok → AI ile üret (description'dan)
- Eğer description yok → AI ile üret (title'dan)
- Eğer category yok → AI ile tahmin et

### TR-2: Bot Mimarisi
**Requirement:** Her kaynak için ayrı scraper stratejisi

**Scraper Types:**
1. **HTML Scraper** (Puppeteer)
   - Akbank, Garanti, İş Bankası
   - Static HTML parse
   
2. **SPA Scraper** (Puppeteer + Wait)
   - Turkcell, Vodafone, Türk Telekom
   - Dynamic content loading
   - Infinite scroll handling
   
3. **API Scraper** (Axios)
   - Papara, Tosla (eğer public API varsa)
   - JSON response parse
   
4. **Hybrid Scraper** (Puppeteer + API)
   - İlk sayfayı Puppeteer ile aç
   - Network request'leri dinle
   - API endpoint'i yakala
   - Sonraki request'leri API ile yap

**Scraper Requirements:**
- [ ] Her scraper BaseScraper'dan extend etmeli
- [ ] Rate limiting uygulanmalı (1 req/30sec per source)
- [ ] Retry logic olmalı (3 deneme)
- [ ] Error handling olmalı
- [ ] Logging olmalı
- [ ] Duplicate detection olmalı (hash-based)

### TR-3: Keşfet Sayfası için Sabit Kaynak Stratejisi
**Requirement:** Keşfet her zaman dolu görünmeli

**Strategy:**
```typescript
interface DiscoverCategory {
  id: string;
  name: string;
  icon: string;
  sources: string[];              // Sabit takip edilen markalar
  minCampaigns: number;           // Minimum kampanya sayısı
}

const DISCOVER_CATEGORIES: DiscoverCategory[] = [
  {
    id: 'entertainment',
    name: 'Eğlence',
    icon: '🎬',
    sources: ['Netflix', 'YouTube Premium', 'Amazon Prime', 'Exxen', 'Gain', 'Tivibu', 'TV+'],
    minCampaigns: 10,
  },
  {
    id: 'gaming',
    name: 'Oyun',
    icon: '🎮',
    sources: ['Steam', 'Epic Games', 'Nvidia', 'PlayStation', 'Xbox'],
    minCampaigns: 10,
  },
  {
    id: 'fashion',
    name: 'Giyim',
    icon: '👕',
    sources: ['Zara', 'H&M', 'LCW', 'Mavi', 'Koton', 'DeFacto'],
    minCampaigns: 10,
  },
  {
    id: 'travel',
    name: 'Seyahat',
    icon: '✈️',
    sources: ['THY', 'Pegasus', 'Obilet', 'Booking.com', 'Hotels.com'],
    minCampaigns: 10,
  },
  {
    id: 'food',
    name: 'Yemek',
    icon: '🍔',
    sources: ['Yemeksepeti', 'Getir', 'Migros', 'Trendyol Yemek'],
    minCampaigns: 10,
  },
  {
    id: 'finance',
    name: 'Finans',
    icon: '💳',
    sources: ['Papara', 'Tosla', 'Enpara', 'Akbank', 'Garanti'],
    minCampaigns: 10,
  },
];
```

**Fallback Strategy:**
- Eğer kategori boş → Son bilinen kampanyaları göster (expire flag ile)
- Eğer hiç kampanya yok → "Yakında kampanyalar eklenecek" mesajı

### TR-4: Admin Panel Entegrasyonu
**Requirement:** Admin panel'den bot yönetimi

**Features:**
- [ ] Bot tetikleme (kaynak seçerek)
- [ ] Bot durumu görüntüleme (running, idle, error)
- [ ] Son çalışma zamanı
- [ ] Kampanya sayısı (kaynak bazlı)
- [ ] Manuel kampanya ekleme
- [ ] Kampanya düzenleme
- [ ] Kampanya silme
- [ ] Veri kalite raporu

**API Endpoints:**
```
POST   /api/admin/bot/trigger/:source
GET    /api/admin/bot/status
GET    /api/admin/bot/logs
POST   /api/admin/campaigns
PUT    /api/admin/campaigns/:id
DELETE /api/admin/campaigns/:id
GET    /api/admin/campaigns/quality-report
```

### TR-5: Veri Kalite Kuralları
**Requirement:** Sisteme kötü veri giremez

**Quality Rules:**
1. **Title Validation**
   - Min length: 10 karakter
   - Max length: 200 karakter
   - Sadece hashtag olamaz
   - "Faz 7" gibi anlamsız olamaz

2. **Description Validation**
   - Min length: 20 karakter
   - Max length: 1000 karakter
   - En az 1 cümle olmalı
   - Sadece hashtag olamaz

3. **Category Validation**
   - Enum'dan biri olmalı
   - Boş olamaz

4. **Date Validation**
   - ValidTo geçmiş tarih olamaz
   - ValidFrom > ValidTo olamaz

**AI Fallback:**
```typescript
async function normalizeWithAI(rawCampaign: RawCampaign): Promise<Campaign> {
  // Eğer title yok veya kötü
  if (!rawCampaign.title || rawCampaign.title.length < 10) {
    rawCampaign.title = await generateTitleWithAI(rawCampaign.description);
  }
  
  // Eğer description yok veya kötü
  if (!rawCampaign.description || rawCampaign.description.length < 20) {
    rawCampaign.description = await generateDescriptionWithAI(rawCampaign.title);
  }
  
  // Eğer category yok
  if (!rawCampaign.category) {
    rawCampaign.category = await predictCategoryWithAI(rawCampaign.title, rawCampaign.description);
  }
  
  return rawCampaign;
}
```

---

## 📊 Success Metrics

### Quantitative Metrics
- [ ] Kampanya sayısı: 300-500+ (şu an: ~80)
- [ ] Veri kalitesi: %100 (title + description dolu)
- [ ] Kaynak coverage: %100 (tüm kaynaklar çalışıyor)
- [ ] Keşfet kategorileri: 6/6 dolu
- [ ] Bot başarı oranı: >95%
- [ ] Duplicate rate: <5%

### Qualitative Metrics
- [ ] Kullanıcı "Vay be, çok fazla kampanya var!" diyor
- [ ] Keşfet sayfası kullanılabilir
- [ ] Admin panel kullanışlı
- [ ] Bot güvenilir çalışıyor

---

## 🚫 Out of Scope (Şimdilik)

### Not Included in MVP
- ❌ AI-powered kampanya önerileri
- ❌ Kişiselleştirilmiş bildirimler
- ❌ Kampanya yorumları
- ❌ Kampanya puanlaması
- ❌ Sosyal paylaşım
- ❌ Kampanya takvimi
- ❌ Kampanya hatırlatıcıları
- ❌ Multi-language support
- ❌ Proxy rotation
- ❌ User-agent rotation
- ❌ Cookie management
- ❌ Image scraping

### Future Enhancements
- 🔵 AI-powered kampanya önerileri (FAZ 4)
- 🔵 Kişiselleştirilmiş bildirimler (FAZ 4)
- 🔵 Kampanya yorumları (FAZ 5)
- 🔵 Kampanya puanlaması (FAZ 5)

---

## 🎯 Priority

**Priority:** 🔴 CRITICAL

**Reason:** Store launch blocker. Kullanıcılar uygulamayı açtığında 80 kampanya görecek ve "Bu uygulama boş" diyecek. 300-500 kampanya olmalı ki gerçekten faydalı görünsün.

**Timeline:** 3-5 gün (acil)

---

## 📝 Notes

### Technical Debt
- Mevcut bot kodu var ama çalışmıyor
- 28 scraper dosyası var ama çoğu boş veya yarım
- Backend'de POST /api/campaigns endpoint var ama validation yok
- Admin panel var ama bot entegrasyonu yok

### Risks
- **Risk 1:** Scraping anti-bot ile engellenebilir
  - **Mitigation:** Rate limiting, user-agent, stealth mode
  
- **Risk 2:** Sayfa yapıları değişebilir
  - **Mitigation:** Modüler scraper yapısı, kolay güncelleme
  
- **Risk 3:** AI fallback maliyetli olabilir
  - **Mitigation:** Sadece gerektiğinde kullan, cache et

### Dependencies
- Backend: POST /api/campaigns endpoint (var)
- Backend: Campaign model (var, güncellenmeli)
- Bot: Puppeteer (var)
- Bot: Scraper'lar (var ama çalışmıyor)
- Admin Panel: Bot UI (yok, yapılacak)

---

## ✅ Acceptance Criteria (Overall)

### Must Have (MVP)
- [ ] Kampanya sayısı 300-500+
- [ ] Her kampanyada title, description, category var
- [ ] Türk Telekom'da 15-20 kampanya var
- [ ] Keşfet sayfasında 6 kategori dolu
- [ ] Bot otomatik çalışıyor (cron)
- [ ] Admin panel'den bot tetiklenebiliyor

### Should Have
- [ ] AI fallback çalışıyor
- [ ] Duplicate detection çalışıyor
- [ ] Error handling robust
- [ ] Logging comprehensive

### Could Have
- [ ] Manuel kampanya ekleme
- [ ] Kampanya düzenleme
- [ ] Veri kalite raporu

---

**Created by:** Kiro AI  
**Date:** 30 Ocak 2026  
**Status:** Draft → Ready for Design

