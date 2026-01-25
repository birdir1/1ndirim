# 1ndirim Bot Service

Otomatik kampanya scraping servisi (Puppeteer tabanlı)

## 📋 Mimari Genel Bakış

```
┌─────────────────────────────────────┐
│         Bot Service                 │
│  (Node.js + Puppeteer)              │
│                                     │
│  ┌──────────────────────────────┐  │
│  │   Scheduler                  │  │
│  │   (Cron / Queue)             │  │
│  └──────────┬───────────────────┘  │
│             │                       │
│  ┌──────────▼───────────────────┐  │
│  │   Scraper Manager            │  │
│  │   - Rate Limiting            │  │
│  │   - Error Handling           │  │
│  │   - Retry Logic              │  │
│  └──────────┬───────────────────┘  │
│             │                       │
│  ┌──────────▼───────────────────┐  │
│  │   Scrapers (Modular)         │  │
│  │   - AkbankScraper            │  │
│  │   - TurkcellScraper          │  │
│  └──────────┬───────────────────┘  │
│             │                       │
│  ┌──────────▼───────────────────┐  │
│  │   Normalizer                  │  │
│  │   - Data Normalization        │  │
│  │   - Duplicate Detection       │  │
│  └──────────┬───────────────────┘  │
│             │                       │
│  ┌──────────▼───────────────────┐  │
│  │   API Client                 │  │
│  │   - POST /api/campaigns     │  │
│  └──────────┬───────────────────┘  │
└─────────────┼───────────────────────┘
              │
              │ HTTP
              │
┌─────────────▼───────────────────────┐
│      Backend API                    │
│      (Campaign Storage)             │
└─────────────────────────────────────┘
```

## 🏗️ Dosya Yapısı

```
bot/
├── package.json
├── .env.example
├── README.md
│
├── src/
│   ├── index.js                 # Entry point
│   ├── config/
│   │   ├── database.js         # (Not used, API only)
│   │   ├── puppeteer.js        # Puppeteer config
│   │   └── rateLimiter.js      # Rate limiting config
│   │
│   ├── services/
│   │   ├── scheduler.js        # Cron scheduler
│   │   ├── scraperManager.js   # Scraper orchestration
│   │   ├── normalizer.js      # Data normalization
│   │   └── apiClient.js       # Backend API client
│   │
│   ├── scrapers/
│   │   ├── base/
│   │   │   └── BaseScraper.js # Abstract base class
│   │   │
│   │   ├── banks/
│   │   │   └── AkbankScraper.js
│   │   │
│   │   └── operators/
│   │       └── TurkcellScraper.js
│   │
│   ├── utils/
│   │   ├── logger.js           # Logging utility
│   │   ├── retry.js            # Retry logic
│   │   └── hash.js             # Duplicate detection
│   │
│   └── types/
│       └── campaign.js         # Campaign data type
│
└── tests/
    └── scrapers/
        ├── AkbankScraper.test.js
        └── TurkcellScraper.test.js
```

## 🎯 MVP Scope (İlk Aşama)

### Desteklenen Kaynaklar
1. **Akbank** (Banka)
   - URL: `https://www.akbank.com/kampanyalar`
   - Yapı: HTML tabanlı, JavaScript rendering gerekebilir
   
2. **Turkcell** (Operatör)
   - URL: `https://www.turkcell.com.tr/kampanyalar`
   - Yapı: Dinamik içerik, SPA olabilir

### Özellikler
- ✅ Puppeteer ile headless browser scraping
- ✅ Rate limiting (kaynak başına)
- ✅ Retry logic (3 deneme)
- ✅ Error handling ve logging
- ✅ Data normalization
- ✅ Duplicate detection (hash-based)
- ✅ Backend API entegrasyonu

### Yapılmayacaklar (Şimdilik)
- ❌ Proxy rotation
- ❌ User-agent rotation (basit bir tane yeterli)
- ❌ Cookie management (her seferinde fresh)
- ❌ Image scraping
- ❌ Multi-language support

## 🔄 Çalışma Akışı

### 1. Scheduler Tetikleme
```
Her 15 dakikada bir:
  - Scheduler çalışır
  - Aktif kaynaklar için scraper'ları tetikler
```

### 2. Scraper Çalıştırma
```
Her kaynak için:
  1. Rate limiter kontrolü
  2. Puppeteer browser aç
  3. Sayfayı yükle
  4. Kampanyaları parse et
  5. Normalize et
  6. Duplicate kontrolü
  7. Backend API'ye gönder
  8. Browser kapat
```

### 3. Hata Yönetimi
```
Hata durumunda:
  1. Retry (3 deneme)
  2. Hala hata varsa:
     - Log'a kaydet
     - Backend'e bildir
     - Sonraki schedule'a bırak
```

## 📦 Bağımlılıklar (Planlanan)

```json
{
  "dependencies": {
    "puppeteer": "^21.0.0",
    "node-cron": "^3.0.3",
    "axios": "^1.6.0",
    "dotenv": "^16.3.1",
    "winston": "^3.11.0"
  }
}
```

## 🎯 Kampanya Kalite Filtresi

Bot, düşük değerli kampanyaları otomatik filtreler:

### Filtrelenen Kampanyalar:
- ❌ "Kahve hediye", "çay hediye" gibi küçük hediyeler
- ❌ PR kampanyaları, tanıtım kampanyaları
- ❌ 50 TL'den az değerli kampanyalar
- ❌ Belirsiz, genel kampanyalar
- ❌ Resmi olmayan URL'ler

### Geçen Kampanyalar:
- ✅ %10 ve üzeri indirimler
- ✅ 50 TL ve üzeri puan/cashback
- ✅ Uçuş, otel, tatil gibi yüksek değerli kampanyalar
- ✅ Resmi kaynak URL'leri
- ✅ Net değer ifadesi olan kampanyalar

**Dosya:** `src/utils/campaignQualityFilter.js`

## 🔐 Güvenlik ve Risk Yönetimi

### Rate Limiting
- Her kaynak için: 1 request / 30 saniye
- Paralel scraping: 2 kaynak aynı anda

### Anti-Bot Önlemleri
- User-Agent: Gerçekçi browser user-agent
- Viewport: Normal ekran boyutu
- Wait: Sayfa yüklenmesi için yeterli bekleme
- Stealth: Puppeteer-extra-plugin-stealth (gelecek)

### Hata Senaryoları
- 403 Forbidden: Retry + log
- 404 Not Found: Kaynak URL değişmiş, manuel kontrol
- Timeout: Retry + log
- Parse Error: Log + skip

## 📝 Notlar

- **Şimdilik kod yazılmadı**, sadece mimari tasarım
- Backend API'ye POST endpoint eklenmeli (şu anda sadece GET var)
- İlk test: Manuel olarak 1 scraper çalıştırılabilir
- Production'da: Cron job veya queue sistemi kullanılacak

## 🚀 Sonraki Adımlar

1. Backend'e POST /api/campaigns endpoint ekle
2. BaseScraper abstract class'ı yaz
3. AkbankScraper implementasyonu
4. TurkcellScraper implementasyonu
5. Scheduler entegrasyonu
6. Test ve debug
