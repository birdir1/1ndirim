# Kampanya Data Fix - Özet

**Tarih:** 31 Ocak 2026  
**Durum:** ✅ Spec Tamamlandı - Implementasyona Hazır  
**Öncelik:** 🔴 CRITICAL (Store Launch Blocker)

---

## 📋 Ne Yapıldı?

Kampanya data sorununun çözümü için **tam bir spec** oluşturuldu:

### 1. Requirements Document ✅
- **Dosya:** `.kiro/specs/kampanya-data-fix/requirements.md`
- **İçerik:**
  - Problem tanımı (80 kampanya → 300-500 kampanya)
  - 5 User Story (kullanıcı + admin perspektifi)
  - 5 Technical Requirement (veri modeli, bot mimarisi, keşfet stratejisi)
  - Success metrics (300-500 kampanya, %100 veri kalitesi)

### 2. Design Document ✅
- **Dosya:** `.kiro/specs/kampanya-data-fix/design.md`
- **İçerik:**
  - Architecture overview (sistem bileşenleri)
  - Database schema updates (yeni kolonlar + campaign_categories tablosu)
  - 4 Scraper tipi (HTML, SPA, API, Hybrid)
  - Data normalization pipeline (6 adım + AI entegrasyonu)
  - AI Service design (OpenAI ile title/description üretimi)
  - Duplicate detection stratejisi
  - Keşfet sayfası design (6 kategori + sabit kaynak mapping)
  - Backend API updates (3 yeni endpoint)
  - Admin panel UI design
  - Monitoring & logging design
  - 5 fazlı deployment stratejisi

### 3. Tasks Document ✅
- **Dosya:** `.kiro/specs/kampanya-data-fix/tasks.md`
- **İçerik:**
  - **45 task** (8 faza bölünmüş)
  - **Tahmini süre:** 3-5 gün (42 saat)
  - **Critical path:** Database → Backend → Bot → Admin Panel
  - Her task için acceptance criteria
  - Dependency mapping
  - Success metrics

---

## 🎯 Sonraki Adımlar

### Seçenek 1: Kiro ile Otomatik İmplementasyon
Kiro'ya şunu söyle:
```
.kiro/specs/kampanya-data-fix spec'ini execute et
```

Kiro otomatik olarak:
1. Database migration'ları oluşturacak
2. Backend API'leri güncelleyecek
3. Bot scraper'ları düzeltecek
4. Admin panel'i entegre edecek
5. Test edecek
6. Deploy edecek

### Seçenek 2: Manuel İmplementasyon
Eğer kendin yapmak istersen:

#### Adım 1: Database Migration (4 saat)
```bash
cd 1ndirim/backend
# Migration dosyalarını oluştur
# tasks.md Phase 1'e bak
```

#### Adım 2: Backend API Updates (6 saat)
```bash
# DataNormalizer, AIService, DuplicateDetector oluştur
# tasks.md Phase 2'ye bak
```

#### Adım 3: Bot System Fixes (12 saat)
```bash
cd 1ndirim/bot
# Scraper'ları düzelt
# tasks.md Phase 3'e bak
```

#### Adım 4: Admin Panel (8 saat)
```bash
cd 1ndirim/admin-panel
# Bot dashboard ve campaign management oluştur
# tasks.md Phase 4'e bak
```

#### Adım 5-8: Monitoring, Testing, Deployment (12 saat)
```bash
# tasks.md Phase 5-8'e bak
```

---

## 📊 Beklenen Sonuçlar

### Önce (Şu An)
- ❌ Kampanya sayısı: ~80
- ❌ Veri kalitesi: Kötü (title/description yok)
- ❌ Türk Telekom: 2 kampanya
- ❌ Keşfet: Yarım çalışıyor

### Sonra (Hedef)
- ✅ Kampanya sayısı: 300-500+
- ✅ Veri kalitesi: %100 (title + description dolu)
- ✅ Türk Telekom: 15-20 kampanya
- ✅ Keşfet: 6 kategori dolu (her biri min 10 kampanya)
- ✅ Bot başarı oranı: >95%
- ✅ Admin panel: Bot tetikleme + kampanya yönetimi

---

## 🚀 Hızlı Başlangıç

### Kiro ile Başla (Önerilen)
```bash
# Kiro'ya şunu söyle:
"kampanya-data-fix spec'ini execute et, Phase 1'den başla"
```

### Manuel Başla
```bash
cd 1ndirim/backend
# Phase 1: Database Migration
# 1. migrations/001_add_category_columns.sql oluştur
# 2. migrations/002_create_campaign_categories.sql oluştur
# 3. Migration'ları çalıştır
npm run migrate
```

---

## 📁 Dosya Yapısı

```
1ndirim/
├── .kiro/specs/kampanya-data-fix/
│   ├── requirements.md    ✅ Tamamlandı
│   ├── design.md          ✅ Tamamlandı
│   └── tasks.md           ✅ Tamamlandı
├── backend/
│   ├── src/
│   │   ├── models/Campaign.js           (güncellenecek)
│   │   ├── routes/campaigns.js          (güncellenecek)
│   │   ├── services/
│   │   │   ├── DataNormalizer.js        (yeni)
│   │   │   ├── AIService.js             (yeni)
│   │   │   ├── DuplicateDetector.js     (yeni)
│   │   │   ├── BotService.js            (yeni)
│   │   │   ├── BotLogger.js             (yeni)
│   │   │   └── QualityMonitor.js        (yeni)
│   │   └── migrations/
│   │       ├── 001_add_category_columns.sql    (yeni)
│   │       └── 002_create_campaign_categories.sql (yeni)
├── bot/
│   └── src/scrapers/
│       ├── base-scraper.js              (güncellenecek)
│       ├── turktelekom-scraper.js       (düzeltilecek)
│       ├── vodafone-scraper.js          (düzeltilecek)
│       ├── turkcell-scraper.js          (düzeltilecek)
│       ├── papara-scraper.js            (düzeltilecek)
│       ├── akbank-scraper.js            (düzeltilecek)
│       ├── netflix-scraper.js           (yeni)
│       ├── steam-scraper.js             (yeni)
│       └── epicgames-scraper.js         (yeni)
└── admin-panel/
    ├── app/
    │   ├── bot/page.tsx                 (yeni)
    │   ├── campaigns/page.tsx           (güncellenecek)
    │   └── quality/page.tsx             (yeni)
    └── components/
        └── CampaignEditModal.tsx        (yeni)
```

---

## 🎯 Kritik Metrikler

### Başarı Kriterleri
- [ ] Kampanya sayısı: 300-500+ (şu an: ~80)
- [ ] Veri kalitesi: %100 (title + description dolu)
- [ ] Türk Telekom: 15-20 kampanya (şu an: 2)
- [ ] Keşfet: 6/6 kategori dolu
- [ ] Bot başarı oranı: >95%
- [ ] Duplicate rate: <5%
- [ ] API response time: <500ms

### Timeline
- **Phase 1-2:** Day 1 (10 saat) - Database + Backend
- **Phase 3:** Day 2-3 (12 saat) - Bot Fixes
- **Phase 4-5:** Day 3-4 (12 saat) - Admin Panel + Monitoring
- **Phase 6-8:** Day 5 (8 saat) - Testing + Deployment + Verification

**Toplam:** 3-5 gün (42 saat)

---

## 💡 Önemli Notlar

### AI Fallback
- OpenAI API key gerekli
- Sadece eksik title/description için kullanılacak
- Rate limiting: max 10 req/min
- Maliyet: ~$0.002 per request (GPT-3.5-turbo)

### Duplicate Detection
- 3 yöntem: URL-based, hash-based, fuzzy matching
- Hash: `md5(sourceName|title|startDate|endDate)`
- Fuzzy matching: Levenshtein distance (>0.8 similarity)

### Keşfet Sayfası
- 6 kategori: entertainment, gaming, fashion, travel, food, finance
- Her kategori min 10 kampanya
- Fallback: Son bilinen kampanyaları göster (expire flag ile)

### Bot Mimarisi
- 4 scraper tipi: HTML, SPA, API, Hybrid
- Rate limiting: 1 req/30sec per source
- Retry logic: 3 deneme
- Error handling: Robust

---

## 🔗 İlgili Dosyalar

- **Requirements:** `.kiro/specs/kampanya-data-fix/requirements.md`
- **Design:** `.kiro/specs/kampanya-data-fix/design.md`
- **Tasks:** `.kiro/specs/kampanya-data-fix/tasks.md`
- **Bu Özet:** `KAMPANYA-DATA-FIX-OZET.md`

---

## 🚨 Acil Eylem

**Store launch blocker!** Bu spec'i hemen execute etmek gerekiyor.

Kiro'ya şunu söyle:
```
kampanya-data-fix spec'ini execute et
```

veya

```
.kiro/specs/kampanya-data-fix/tasks.md dosyasındaki taskları sırayla execute et
```

---

**Hazırlayan:** Kiro AI  
**Tarih:** 31 Ocak 2026  
**Durum:** ✅ Spec Tamamlandı - Implementasyona Hazır
