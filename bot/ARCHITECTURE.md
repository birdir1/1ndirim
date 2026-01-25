# Bot Mimari Detayları

## 🎯 Tasarım Prensipleri

### 1. Modüler Yapı
- Her kaynak için ayrı scraper class'ı
- BaseScraper abstract class ile ortak mantık
- Kolay genişletilebilir (yeni kaynak eklemek kolay)

### 2. Hata Toleransı
- Bir kaynak hata verse bile diğerleri çalışmaya devam eder
- Retry mekanizması ile geçici hatalar yönetilir
- Kalıcı hatalar log'lanır ve manuel müdahale bekler

### 3. Performans
- Paralel scraping (2 kaynak aynı anda)
- Rate limiting ile kaynakları koruma
- Browser instance'ları optimize kullanım

## 📐 Class Diyagramı

```
┌─────────────────────┐
│   BaseScraper       │ (Abstract)
│                     │
│ + scrape()          │
│ + parse()            │
│ + normalize()       │
│ - _waitForPage()    │
│ - _extractData()    │
└──────────┬──────────┘
           │
           │ extends
           │
    ┌──────┴──────┬──────────────┐
    │             │              │
┌───▼────┐  ┌─────▼─────┐  ┌─────▼─────┐
│Akbank  │  │Turkcell  │  │...        │
│Scraper │  │Scraper   │  │           │
└────────┘  └──────────┘  └───────────┘

┌─────────────────────┐
│  ScraperManager     │
│                     │
│ + runAll()          │
│ + runOne()          │
│ - _rateLimit()      │
│ - _handleError()    │
└─────────────────────┘

┌─────────────────────┐
│  Normalizer         │
│                     │
│ + normalize()       │
│ + detectDuplicate() │
│ - _generateHash()   │
└─────────────────────┘

┌─────────────────────┐
│  APIClient          │
│                     │
│ + postCampaign()    │
│ + getSources()      │
└─────────────────────┘
```

## 🔄 Data Flow

### Senaryo: Akbank Kampanyalarını Çekme

```
1. Scheduler
   └─> ScraperManager.runOne('akbank')

2. ScraperManager
   ├─> Rate Limiter kontrolü
   ├─> AkbankScraper instance oluştur
   └─> AkbankScraper.scrape() çağır

3. AkbankScraper
   ├─> Puppeteer browser aç
   ├─> https://www.akbank.com/kampanyalar yükle
   ├─> Sayfa yüklenmesini bekle
   ├─> DOM'dan kampanya elementlerini bul
   ├─> Raw data extract et
   └─> BaseScraper.normalize() çağır

4. Normalizer
   ├─> Raw data'yı standart formata çevir
   ├─> Hash oluştur (duplicate kontrolü için)
   ├─> Backend'de duplicate var mı kontrol et
   └─> Yeni ise APIClient'a gönder

5. APIClient
   ├─> POST /api/campaigns
   └─> Response'u log'la

6. ScraperManager
   └─> Sonucu log'la (başarılı/başarısız)
```

## 📊 Akbank Scraper Tasarımı

### Sayfa Yapısı (Tahmini)
```
https://www.akbank.com/kampanyalar
├── Campaign List Container
│   ├── Campaign Card 1
│   │   ├── Title
│   │   ├── Description
│   │   ├── Expiry Date
│   │   └── Link
│   ├── Campaign Card 2
│   └── ...
```

### Parse Stratejisi
```javascript
// Pseudo-code
async scrape() {
  await page.goto('https://www.akbank.com/kampanyalar');
  await page.waitForSelector('.campaign-list'); // veya benzeri
  
  const campaigns = await page.evaluate(() => {
    const cards = document.querySelectorAll('.campaign-card');
    return Array.from(cards).map(card => ({
      title: card.querySelector('.title')?.textContent,
      description: card.querySelector('.description')?.textContent,
      url: card.querySelector('a')?.href,
      expiry: card.querySelector('.expiry')?.textContent,
    }));
  });
  
  return campaigns;
}
```

### Normalize Stratejisi
```javascript
normalize(rawData) {
  return {
    sourceId: 'akbank-uuid', // Backend'den alınacak
    title: rawData.title,
    description: rawData.description,
    originalUrl: rawData.url,
    expiresAt: parseDate(rawData.expiry),
    // ... diğer alanlar
  };
}
```

## 📊 Turkcell Scraper Tasarımı

### Sayfa Yapısı (Tahmini)
```
https://www.turkcell.com.tr/kampanyalar
├── SPA (Single Page Application)
│   ├── Dynamic content loading
│   ├── Campaign Cards (lazy loaded)
│   └── Infinite scroll olabilir
```

### Parse Stratejisi
```javascript
// Pseudo-code
async scrape() {
  await page.goto('https://www.turkcell.com.tr/kampanyalar');
  
  // SPA için ekstra bekleme
  await page.waitForTimeout(3000);
  await page.waitForSelector('.campaign-item'); // veya benzeri
  
  // Scroll yaparak tüm içeriği yükle (gerekirse)
  await autoScroll(page);
  
  const campaigns = await page.evaluate(() => {
    // Similar to Akbank
  });
  
  return campaigns;
}
```

## 🛡️ Error Handling Stratejisi

### Retry Logic
```javascript
async function retry(fn, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      await sleep(calculateBackoff(i));
    }
  }
}
```

### Error Types
- **NetworkError**: Retry
- **TimeoutError**: Retry
- **ParseError**: Log + Skip (sayfa yapısı değişmiş olabilir)
- **403Forbidden**: Log + Alert (anti-bot tetiklenmiş)
- **404NotFound**: Log + Alert (URL değişmiş)

## 📝 Logging Stratejisi

### Log Levels
- **INFO**: Normal işlemler (scraping başladı, tamamlandı)
- **WARN**: Retry yapıldı, geçici hata
- **ERROR**: Kalıcı hata, manuel müdahale gerekli
- **DEBUG**: Detaylı bilgi (development için)

### Log Format
```
[2026-01-16 10:30:15] [INFO] [AkbankScraper] Scraping started
[2026-01-16 10:30:20] [INFO] [AkbankScraper] Found 5 campaigns
[2026-01-16 10:30:25] [INFO] [AkbankScraper] 3 new campaigns posted to API
[2026-01-16 10:30:25] [INFO] [AkbankScraper] Scraping completed successfully
```

## 🔐 Rate Limiting

### Strateji
- Her kaynak için: 1 request / 30 saniye
- Paralel scraping: Max 2 kaynak aynı anda
- Global limit: 10 request / dakika (tüm kaynaklar)

### Implementation (Pseudo)
```javascript
class RateLimiter {
  constructor(requestsPerMinute = 2) {
    this.queue = [];
    this.interval = 60000 / requestsPerMinute;
  }
  
  async wait() {
    // Queue-based rate limiting
  }
}
```

## 🎯 Sonraki Adımlar (Implementation)

1. **BaseScraper Abstract Class**
   - Ortak metodlar (scrape, parse, normalize)
   - Puppeteer setup/teardown
   - Error handling

2. **AkbankScraper**
   - Sayfa yapısını analiz et
   - Selector'ları belirle
   - Parse logic'i yaz
   - Test et

3. **TurkcellScraper**
   - Sayfa yapısını analiz et
   - SPA handling
   - Parse logic'i yaz
   - Test et

4. **ScraperManager**
   - Orchestration logic
   - Rate limiting
   - Error handling
   - Logging

5. **Scheduler**
   - Cron job setup
   - Configurable interval
   - Graceful shutdown

6. **Integration**
   - Backend API entegrasyonu
   - End-to-end test
   - Production deployment
