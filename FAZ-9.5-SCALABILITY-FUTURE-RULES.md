# FAZ 9.5 – SCALABILITY & FUTURE RULES

**Tarih:** 25 Ocak 2026  
**Versiyon:** 1.0  
**Durum:** 📋 SCALABILITY RULES DOCUMENT

---

## 🎯 SCALABILITY PRENSİPLERİ

### Core Principles

1. **Backward Compatibility:**
   - ✅ Mevcut feed'ler ASLA bozulmamalı
   - ✅ Yeni feed'ler mevcut feed'leri etkilememeli
   - ✅ Mevcut kampanyalar korunmalı

2. **Extensibility:**
   - ✅ Yeni feed tipleri eklenebilmeli
   - ✅ Yeni kampanya modları eklenebilmeli
   - ✅ Sistem genişletilebilir olmalı

3. **Isolation:**
   - ✅ Feed'ler birbirinden izole olmalı
   - ✅ Yeni feed'ler mevcut feed'leri etkilememeli
   - ✅ Her feed kendi kurallarına sahip olmalı

4. **Main Feed Protection:**
   - ✅ Main feed kalitesi ASLA düşürülmemeli
   - ✅ Main feed'e yeni feed tiplerinden kampanya eklenmemeli
   - ✅ Main feed her zaman öncelikli

---

## 🏦 YENİ BANKALAR İÇİN KURALLAR

### Unknown Structure Banks

**Durum:**
- Yeni banka eklendi
- Yapısı bilinmiyor (SPA, static, dynamic)
- Feed tipi belirsiz

**Süreç:**

#### Adım 1: Network Analysis

**Kural:**
- Yeni banka için network analizi yapılmalı
- Endpoint keşfi yapılmalı
- Yapı tespiti yapılmalı

**Uygulama:**
```javascript
// Network analysis script
const analyzer = new NetworkAnalyzer(
  'Yeni Banka',
  'https://www.yenibanka.com.tr/kampanyalar'
);
const results = await analyzer.analyze(60000);
```

**Sonuç Senaryoları:**
- **Scenario A:** JSON/XML endpoint var → Fetch scraper
- **Scenario B:** HTML fragment var → DOM scraping
- **Scenario C:** Endpoint yok → Hard backlog

---

#### Adım 2: Feed Type Classification

**Kural:**
- Network analizi sonucuna göre feed tipi belirlenmeli
- Feed tipi belirlenmeden kampanya eklenmemeli
- Varsayılan feed tipi YOK

**Classification Rules:**
```
IF JSON/XML endpoint found THEN
  feedType = 'fetch'
  campaignMode = determineCampaignMode(valueInfo, categoryInfo)
ELSE IF HTML fragment found THEN
  feedType = 'dom'
  campaignMode = determineCampaignMode(valueInfo, categoryInfo)
ELSE
  feedType = 'blocked'
  campaignMode = null
END IF
```

**Campaign Mode Determination:**
```
IF valueInfo exists AND qualityFilterPasses THEN
  campaignMode = 'main'
ELSE IF valueInfo missing THEN
  campaignMode = 'light'
ELSE IF categoryBased THEN
  campaignMode = 'category'
ELSE IF lowValue THEN
  campaignMode = 'low'
END IF
```

---

#### Adım 3: Feed Integration

**Kural:**
- Belirlenen feed tipine göre entegrasyon yapılmalı
- Mevcut feed'ler etkilenmemeli
- Yeni feed tipi gerekirse eklenebilmeli

**Integration Rules:**
```
IF campaignMode = 'main' THEN
  // Main feed'e ekle
  campaign_type = 'main'
  show_in_main_feed = true
ELSE IF campaignMode = 'light' THEN
  // Light feed'e ekle
  campaign_type = 'light'
  show_in_light_feed = true
ELSE IF campaignMode = 'category' THEN
  // Category feed'e ekle
  campaign_type = 'category'
  show_in_category_feed = true
END IF
```

---

### New Bank Checklist

**Yeni Banka Ekleme Checklist:**

- [ ] Network analysis yapıldı
- [ ] Endpoint keşfi tamamlandı
- [ ] Yapı tespiti yapıldı
- [ ] Feed tipi belirlendi
- [ ] Campaign mode belirlendi
- [ ] Scraper implement edildi
- [ ] Test edildi
- [ ] Mevcut feed'ler etkilenmedi
- [ ] Main feed kalitesi korundu

---

## 📊 YENİ FEED TİPLERİ İÇİN KURALLAR

### Adding New Feed Types

**Durum:**
- Yeni feed tipi eklenmek isteniyor (örn: "Premium Feed", "Regional Feed")
- Mevcut feed'ler korunmalı
- Sistem genişletilebilir olmalı

**Süreç:**

#### Adım 1: Feed Type Definition

**Kural:**
- Yeni feed tipi tanımlanmalı
- Feed amacı net olmalı
- Feed kuralları belirlenmeli

**Definition Template:**
```
Feed Type: [Yeni Feed Adı]
Purpose: [Feed amacı]
Target Users: [Hedef kullanıcılar]
Content Type: [İçerik tipi]
Quality Level: [Kalite seviyesi]
```

**Örnek:**
```
Feed Type: Premium Feed
Purpose: Premium kullanıcılar için özel kampanyalar
Target Users: Premium üyeler
Content Type: High value + premium exclusive
Quality Level: Yüksek
```

---

#### Adım 2: Database Schema Extension

**Kural:**
- Yeni feed tipi için database schema genişletilmeli
- Mevcut feed'ler etkilenmemeli
- Backward compatibility korunmalı

**Schema Extension:**
```sql
-- Yeni feed tipi için ENUM ekleme
ALTER TYPE campaign_type_enum ADD VALUE 'premium';

-- Yeni feed flag ekleme
ALTER TABLE campaigns ADD COLUMN show_in_premium_feed BOOLEAN DEFAULT false;
```

**Migration Rules:**
- ✅ Mevcut feed'ler etkilenmemeli
- ✅ Varsayılan değerler güvenli olmalı
- ✅ Backward compatibility korunmalı

---

#### Adım 3: Backend API Extension

**Kural:**
- Yeni feed için endpoint eklenmeli
- Mevcut endpoint'ler korunmalı
- API versioning kullanılabilir

**API Extension:**
```javascript
// Yeni feed endpoint
router.get('/premium', async (req, res) => {
  const campaigns = await Campaign.findAllPremium();
  // ...
});
```

**API Rules:**
- ✅ Mevcut endpoint'ler değiştirilmemeli
- ✅ Yeni endpoint'ler eklenebilir
- ✅ API versioning kullanılabilir

---

#### Adım 4: Feed Rules Definition

**Kural:**
- Yeni feed için kurallar tanımlanmalı
- Mevcut feed kuralları korunmalı
- Feed separation korunmalı

**Feed Rules Template:**
```
Feed: [Yeni Feed Adı]
Purpose: [Amaç]
Visibility: [Görünürlük kuralları]
Forbidden Content: [Yasak içerik]
Required Content: [Zorunlu içerik]
Ranking Factors: [Sıralama faktörleri]
```

---

### New Feed Type Checklist

**Yeni Feed Tipi Ekleme Checklist:**

- [ ] Feed amacı tanımlandı
- [ ] Database schema genişletildi
- [ ] Backend API endpoint eklendi
- [ ] Feed kuralları tanımlandı
- [ ] Validation rules eklendi
- [ ] Mevcut feed'ler etkilenmedi
- [ ] Main feed kalitesi korundu
- [ ] Test edildi
- [ ] Dokümantasyon güncellendi

---

## 🚫 BREAKING EXISTING FEEDS PREVENTION

### Rule 1: Main Feed Protection

**Kural:**
- Main feed query'leri ASLA değiştirilmemeli
- Main feed validation rules ASLA gevşetilmemeli
- Main feed kalitesi ASLA düşürülmemeli

**Protection Rules:**
```
// Main feed query - ASLA değiştirilmemeli
WHERE campaign_type = 'main' OR campaign_type IS NULL
  AND campaign_type != 'light'
  AND campaign_type != 'category'
  AND value_level = 'high' OR value_level IS NULL
  AND is_active = true
  AND expires_at > NOW()
```

**Yapılmaması Gerekenler:**
- ❌ Main feed query'den type check'leri kaldırma
- ❌ Main feed'e light/category kampanyalar ekleme
- ❌ Main feed validation'ı gevşetme

---

### Rule 2: Feed Query Isolation

**Kural:**
- Her feed'in query'si izole olmalı
- Feed query'leri birbirini etkilememeli
- Yeni feed query'leri mevcut feed'leri etkilememeli

**Isolation Rules:**
```
// Her feed kendi query'sini çalıştırır
Main Feed Query: campaign_type = 'main'
Light Feed Query: campaign_type = 'light'
Category Feed Query: campaign_type = 'category'
New Feed Query: campaign_type = 'new_feed'
```

**Yapılmaması Gerekenler:**
- ❌ Feed query'lerini birleştirme
- ❌ Feed query'lerini paylaşma
- ❌ Feed query'lerini override etme

---

### Rule 3: Backward Compatibility

**Kural:**
- Mevcut feed'ler backward compatible olmalı
- Yeni değişiklikler mevcut feed'leri bozmamalı
- Varsayılan değerler güvenli olmalı

**Compatibility Rules:**
```
// Varsayılan değerler güvenli
campaign_type = NULL → Main feed (backward compatible)
show_in_light_feed = false (default)
show_in_category_feed = false (default)
```

**Yapılmaması Gerekenler:**
- ❌ Mevcut feed query'lerini breaking change yapma
- ❌ Varsayılan değerleri değiştirme
- ❌ Mevcut feed'leri etkileyecek migration'lar

---

## 🛡️ PRODUCT-LEVEL GUARDRAILS

### Guardrail 1: Feed Type Validation

**Kural:**
- Feed type validation zorunlu
- Geçersiz feed type'lar reddedilmeli
- Feed type consistency korunmalı

**Validation:**
```javascript
// Feed type validation
const validFeedTypes = ['main', 'light', 'category', 'low'];
if (!validFeedTypes.includes(campaignType)) {
  throw new Error('Invalid feed type');
}
```

**Uygulama:**
- Backend'de feed type validation
- Database'de ENUM constraint
- Frontend'de feed type validation

---

### Guardrail 2: Feed Content Validation

**Kural:**
- Feed içeriği validation zorunlu
- Forbidden content kontrolü yapılmalı
- Feed pollution önlenmeli

**Validation:**
```javascript
// Feed content validation
if (feedType === 'main') {
  if (campaignType === 'light' || campaignType === 'category') {
    throw new Error('Forbidden content in main feed');
  }
}
```

**Uygulama:**
- Backend query'lerde validation
- Database constraint'ler
- Frontend validation

---

### Guardrail 3: Feed Separation Enforcement

**Kural:**
- Feed separation zorunlu
- Feed'ler arası duplicate önlenmeli
- Bir kampanya SADECE bir feed'de olmalı

**Enforcement:**
```sql
-- Feed separation constraint
CHECK (
  (campaign_type = 'main' AND show_in_light_feed = false AND show_in_category_feed = false) OR
  (campaign_type = 'light' AND show_in_light_feed = true AND show_in_category_feed = false) OR
  (campaign_type = 'category' AND show_in_light_feed = false AND show_in_category_feed = true)
)
```

**Uygulama:**
- Database constraint'ler
- Backend validation
- Application-level checks

---

### Guardrail 4: Main Feed Quality Protection

**Kural:**
- Main feed kalitesi korunmalı
- Main feed'e düşük kaliteli kampanyalar eklenmemeli
- Main feed validation ASLA gevşetilmemeli

**Protection:**
```javascript
// Main feed quality protection
if (feedType === 'main') {
  if (!hasValueInfo || !passesQualityFilter) {
    throw new Error('Main feed quality protection');
  }
}
```

**Uygulama:**
- Backend validation
- Quality filter enforcement
- Main feed query protection

---

## 📋 DO / DON'T LIST

### ✅ DO (Yapılması Gerekenler)

#### Yeni Bankalar İçin

1. **Network Analysis:**
   - ✅ Yeni banka için network analizi yap
   - ✅ Endpoint keşfi yap
   - ✅ Yapı tespiti yap

2. **Feed Classification:**
   - ✅ Feed tipi belirle
   - ✅ Campaign mode belirle
   - ✅ Feed kuralları tanımla

3. **Integration:**
   - ✅ Belirlenen feed'e entegre et
   - ✅ Mevcut feed'leri etkileme
   - ✅ Test et

#### Yeni Feed Tipleri İçin

1. **Definition:**
   - ✅ Feed amacı tanımla
   - ✅ Feed kuralları belirle
   - ✅ Feed validation rules tanımla

2. **Schema Extension:**
   - ✅ Database schema genişlet
   - ✅ Backward compatibility koru
   - ✅ Varsayılan değerler güvenli ol

3. **API Extension:**
   - ✅ Yeni endpoint ekle
   - ✅ Mevcut endpoint'leri koru
   - ✅ API versioning kullan

4. **Testing:**
   - ✅ Yeni feed'i test et
   - ✅ Mevcut feed'lerin etkilenmediğini doğrula
   - ✅ Main feed kalitesini kontrol et

---

### ❌ DON'T (Yapılmaması Gerekenler)

#### Yeni Bankalar İçin

1. **Feed Classification:**
   - ❌ Varsayılan feed tipi kullanma
   - ❌ Feed tipi belirlemeden ekleme
   - ❌ Main feed'e direkt ekleme

2. **Integration:**
   - ❌ Mevcut feed'leri etkileme
   - ❌ Main feed kalitesini düşürme
   - ❌ Feed separation'ı bozma

#### Yeni Feed Tipleri İçin

1. **Schema Changes:**
   - ❌ Mevcut feed query'lerini değiştirme
   - ❌ Mevcut feed validation'ları gevşetme
   - ❌ Breaking migration'lar yapma

2. **API Changes:**
   - ❌ Mevcut endpoint'leri değiştirme
   - ❌ Mevcut endpoint'leri kaldırma
   - ❌ Backward incompatible değişiklikler

3. **Feed Rules:**
   - ❌ Main feed kurallarını değiştirme
   - ❌ Feed separation'ı bozma
   - ❌ Feed pollution'a izin verme

---

## 🔄 SCALABILITY PATTERNS

### Pattern 1: Feed Type Enum Extension

**Pattern:**
- Yeni feed tipi için ENUM genişletme
- Backward compatible extension
- Varsayılan değerler güvenli

**Implementation:**
```sql
-- Yeni feed tipi ekleme
ALTER TYPE campaign_type_enum ADD VALUE 'premium';

-- Varsayılan değerler güvenli
ALTER TABLE campaigns 
  ADD COLUMN show_in_premium_feed BOOLEAN DEFAULT false;
```

**Rules:**
- ✅ Mevcut feed'ler etkilenmez
- ✅ Varsayılan değerler güvenli
- ✅ Backward compatibility korunur

---

### Pattern 2: Feed Query Factory

**Pattern:**
- Feed query'leri factory pattern ile oluşturma
- Her feed kendi query'sini oluşturur
- Feed'ler birbirini etkilemez

**Implementation:**
```javascript
class FeedQueryFactory {
  static createMainFeedQuery() {
    return `
      WHERE campaign_type = 'main' OR campaign_type IS NULL
        AND campaign_type != 'light'
        AND campaign_type != 'category'
    `;
  }
  
  static createLightFeedQuery() {
    return `
      WHERE campaign_type = 'light'
        AND show_in_light_feed = true
    `;
  }
  
  static createNewFeedQuery(feedType) {
    return `
      WHERE campaign_type = '${feedType}'
        AND show_in_${feedType}_feed = true
    `;
  }
}
```

**Rules:**
- ✅ Her feed kendi query'sini oluşturur
- ✅ Feed'ler birbirini etkilemez
- ✅ Yeni feed'ler kolayca eklenebilir

---

### Pattern 3: Feed Validation Chain

**Pattern:**
- Feed validation chain pattern
- Her feed kendi validation'ını yapar
- Validation'lar birbirini etkilemez

**Implementation:**
```javascript
class FeedValidator {
  static validateMainFeed(campaign) {
    if (campaign.campaign_type === 'light' || 
        campaign.campaign_type === 'category') {
      throw new Error('Forbidden content in main feed');
    }
    // ...
  }
  
  static validateLightFeed(campaign) {
    if (campaign.campaign_type !== 'light') {
      throw new Error('Invalid content in light feed');
    }
    // ...
  }
  
  static validateNewFeed(campaign, feedType) {
    if (campaign.campaign_type !== feedType) {
      throw new Error(`Invalid content in ${feedType} feed`);
    }
    // ...
  }
}
```

**Rules:**
- ✅ Her feed kendi validation'ını yapar
- ✅ Validation'lar birbirini etkilemez
- ✅ Yeni feed validation'ları kolayca eklenebilir

---

## 📊 FEED EXTENSION RULES

### Rule 1: Feed Type Addition

**Kural:**
- Yeni feed tipi eklenebilir
- Mevcut feed'ler etkilenmemeli
- Backward compatibility korunmalı

**Process:**
1. Feed type tanımla
2. Database schema genişlet
3. Backend API endpoint ekle
4. Feed rules tanımla
5. Validation rules ekle
6. Test et

---

### Rule 2: Campaign Mode Addition

**Kural:**
- Yeni campaign mode eklenebilir
- Mevcut modlar etkilenmemeli
- Feed separation korunmalı

**Process:**
1. Campaign mode tanımla
2. Database schema genişlet
3. Backend logic ekle
4. Feed rules tanımla
5. Validation rules ekle
6. Test et

---

### Rule 3: Feed Query Extension

**Kural:**
- Yeni feed query eklenebilir
- Mevcut query'ler etkilenmemeli
- Feed isolation korunmalı

**Process:**
1. Feed query tanımla
2. Backend endpoint ekle
3. Validation rules ekle
4. Test et

---

## 🚨 CRITICAL RULES (KIRMIZI ÇİZGİLER)

### Rule 1: Main Feed Protection (KIRMIZI ÇİZGİ)

**Kural:**
- Main feed query'leri ASLA değiştirilmemeli
- Main feed validation rules ASLA gevşetilmemeli
- Main feed kalitesi ASLA düşürülmemeli

**İhlal Durumu:**
- Main feed kalitesi düşer
- Kullanıcı deneyimi bozulur
- Sistem güvenilirliği azalır

---

### Rule 2: Feed Separation (KIRMIZI ÇİZGİ)

**Kural:**
- Feed'ler arası kampanya paylaşımı YOK
- Bir kampanya SADECE bir feed'de olmalı
- Feed'ler birbirinden bağımsız olmalı

**İhlal Durumu:**
- Feed'lerin amacı belirsizleşir
- Kullanıcı karmaşası oluşur
- Sistem tutarsızlığı

---

### Rule 3: Backward Compatibility (KIRMIZI ÇİZGİ)

**Kural:**
- Mevcut feed'ler backward compatible olmalı
- Yeni değişiklikler mevcut feed'leri bozmamalı
- Breaking changes YOK

**İhlal Durumu:**
- Mevcut feed'ler bozulur
- Kullanıcı deneyimi bozulur
- Sistem güvenilirliği azalır

---

## 📋 FUTURE DEVELOPMENT GUIDELINES

### Guideline 1: New Bank Integration

**Süreç:**
1. Network analysis yap
2. Endpoint keşfi yap
3. Yapı tespiti yap
4. Feed tipi belirle
5. Campaign mode belirle
6. Scraper implement et
7. Test et
8. Mevcut feed'leri etkilemediğini doğrula

**Kurallar:**
- ✅ Network analysis zorunlu
- ✅ Feed tipi belirlenmeden ekleme YOK
- ✅ Main feed kalitesi korunmalı

---

### Guideline 2: New Feed Type Addition

**Süreç:**
1. Feed amacı tanımla
2. Database schema genişlet
3. Backend API endpoint ekle
4. Feed kuralları tanımla
5. Validation rules ekle
6. Test et
7. Mevcut feed'leri etkilemediğini doğrula

**Kurallar:**
- ✅ Feed amacı net olmalı
- ✅ Mevcut feed'ler etkilenmemeli
- ✅ Backward compatibility korunmalı

---

### Guideline 3: Campaign Mode Extension

**Süreç:**
1. Campaign mode tanımla
2. Database schema genişlet
3. Backend logic ekle
4. Feed rules tanımla
5. Validation rules ekle
6. Test et
7. Mevcut modlar etkilenmediğini doğrula

**Kurallar:**
- ✅ Campaign mode amacı net olmalı
- ✅ Mevcut modlar etkilenmemeli
- ✅ Feed separation korunmalı

---

## ✅ SCALABILITY CHECKLIST

### New Bank Integration Checklist

- [ ] Network analysis yapıldı
- [ ] Endpoint keşfi tamamlandı
- [ ] Yapı tespiti yapıldı
- [ ] Feed tipi belirlendi
- [ ] Campaign mode belirlendi
- [ ] Scraper implement edildi
- [ ] Test edildi
- [ ] Mevcut feed'ler etkilenmedi
- [ ] Main feed kalitesi korundu
- [ ] Feed separation korundu

---

### New Feed Type Addition Checklist

- [ ] Feed amacı tanımlandı
- [ ] Database schema genişletildi
- [ ] Backend API endpoint eklendi
- [ ] Feed kuralları tanımlandı
- [ ] Validation rules eklendi
- [ ] Test edildi
- [ ] Mevcut feed'ler etkilenmedi
- [ ] Main feed kalitesi korundu
- [ ] Backward compatibility korundu
- [ ] Dokümantasyon güncellendi

---

### Campaign Mode Extension Checklist

- [ ] Campaign mode amacı tanımlandı
- [ ] Database schema genişletildi
- [ ] Backend logic eklendi
- [ ] Feed rules tanımlandı
- [ ] Validation rules eklendi
- [ ] Test edildi
- [ ] Mevcut modlar etkilenmedi
- [ ] Feed separation korundu
- [ ] Dokümantasyon güncellendi

---

## 📝 FUTURE-PROOFING NOTES

### Database Schema

**Genişletilebilirlik:**
- ✅ ENUM'lar genişletilebilir
- ✅ Yeni kolonlar eklenebilir
- ✅ Varsayılan değerler güvenli

**Örnek:**
```sql
-- Yeni feed tipi ekleme
ALTER TYPE campaign_type_enum ADD VALUE 'premium';

-- Yeni feed flag ekleme
ALTER TABLE campaigns 
  ADD COLUMN show_in_premium_feed BOOLEAN DEFAULT false;
```

---

### Backend API

**Genişletilebilirlik:**
- ✅ Yeni endpoint'ler eklenebilir
- ✅ Mevcut endpoint'ler korunur
- ✅ API versioning kullanılabilir

**Örnek:**
```javascript
// Yeni feed endpoint
router.get('/premium', async (req, res) => {
  const campaigns = await Campaign.findAllPremium();
  // ...
});
```

---

### Feed Query System

**Genişletilebilirlik:**
- ✅ Yeni feed query'leri eklenebilir
- ✅ Mevcut query'ler korunur
- ✅ Feed isolation korunur

**Örnek:**
```javascript
// Yeni feed query
static async findAllPremium() {
  return `
    WHERE campaign_type = 'premium'
      AND show_in_premium_feed = true
      AND is_active = true
      AND expires_at > NOW()
  `;
}
```

---

## 🎯 SCALABILITY PRINCIPLES SUMMARY

### Principle 1: Isolation

**Kural:**
- Feed'ler birbirinden izole olmalı
- Yeni feed'ler mevcut feed'leri etkilememeli
- Her feed kendi kurallarına sahip olmalı

**Uygulama:**
- Her feed kendi query'sini çalıştırır
- Feed'ler arası bağımlılık yok
- Yeni feed'ler kolayca eklenebilir

---

### Principle 2: Extensibility

**Kural:**
- Sistem genişletilebilir olmalı
- Yeni feed tipleri eklenebilmeli
- Yeni campaign modları eklenebilmeli

**Uygulama:**
- Database schema genişletilebilir
- Backend API genişletilebilir
- Feed query system genişletilebilir

---

### Principle 3: Backward Compatibility

**Kural:**
- Mevcut feed'ler backward compatible olmalı
- Yeni değişiklikler mevcut feed'leri bozmamalı
- Breaking changes YOK

**Uygulama:**
- Varsayılan değerler güvenli
- Mevcut query'ler korunur
- Mevcut endpoint'ler korunur

---

### Principle 4: Main Feed Protection

**Kural:**
- Main feed kalitesi ASLA düşürülmemeli
- Main feed'e yeni feed tiplerinden kampanya eklenmemeli
- Main feed her zaman öncelikli

**Uygulama:**
- Main feed query protection
- Main feed validation protection
- Main feed quality protection

---

## 📊 FUTURE SCENARIOS

### Scenario 1: Premium Feed Addition

**Durum:**
- Premium feed eklenmek isteniyor
- Premium kullanıcılar için özel kampanyalar

**Süreç:**
1. Feed amacı tanımla: "Premium kullanıcılar için özel kampanyalar"
2. Database schema genişlet: `campaign_type = 'premium'`, `show_in_premium_feed = true`
3. Backend API endpoint ekle: `GET /api/campaigns/premium`
4. Feed kuralları tanımla: Premium feed rules
5. Validation rules ekle: Premium feed validation
6. Test et: Premium feed test
7. Mevcut feed'leri etkilemediğini doğrula

**Kurallar:**
- ✅ Mevcut feed'ler etkilenmez
- ✅ Main feed kalitesi korunur
- ✅ Feed separation korunur

---

### Scenario 2: Regional Feed Addition

**Durum:**
- Regional feed eklenmek isteniyor
- Bölgesel kampanyalar için

**Süreç:**
1. Feed amacı tanımla: "Bölgesel kampanyalar"
2. Database schema genişlet: `campaign_type = 'regional'`, `show_in_regional_feed = true`
3. Backend API endpoint ekle: `GET /api/campaigns/regional`
4. Feed kuralları tanımla: Regional feed rules
5. Validation rules ekle: Regional feed validation
6. Test et: Regional feed test
7. Mevcut feed'leri etkilemediğini doğrula

**Kurallar:**
- ✅ Mevcut feed'ler etkilenmez
- ✅ Main feed kalitesi korunur
- ✅ Feed separation korunur

---

### Scenario 3: Unknown Structure Bank

**Durum:**
- Yeni banka eklendi
- Yapısı bilinmiyor

**Süreç:**
1. Network analysis yap
2. Endpoint keşfi yap
3. Yapı tespiti yap
4. Feed tipi belirle (Scenario A/B/C)
5. Campaign mode belirle
6. Scraper implement et (veya hard backlog)
7. Test et
8. Mevcut feed'leri etkilemediğini doğrula

**Kurallar:**
- ✅ Network analysis zorunlu
- ✅ Feed tipi belirlenmeden ekleme YOK
- ✅ Main feed kalitesi korunur

---

## ✅ FINAL CHECKLIST

### Scalability Checklist

- [ ] Yeni bankalar için network analysis süreci tanımlı
- [ ] Yeni feed tipleri için extension süreci tanımlı
- [ ] Mevcut feed'ler korunuyor
- [ ] Main feed kalitesi korunuyor
- [ ] Backward compatibility korunuyor
- [ ] Feed separation korunuyor
- [ ] Validation rules tanımlı
- [ ] Guardrails implement edildi

---

**Rapor Tarihi:** 25 Ocak 2026  
**Hazırlayan:** AI Assistant  
**Versiyon:** 1.0  
**Durum:** 📋 SCALABILITY RULES DOCUMENT - READY FOR IMPLEMENTATION
