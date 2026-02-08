# 1ndirim Backend API

Backend MVP - Campaign Aggregator API

## 🚀 Hızlı Başlangıç

### 1. Gereksinimler

- Node.js 18+
- PostgreSQL 14+

### 2. Kurulum

```bash
# Bağımlılıkları yükle
npm install

# .env dosyasını oluştur
cp .env.example .env

# .env dosyasını düzenle (database bilgilerini gir)
```

### 3. Database Setup

```bash
# PostgreSQL'de database oluştur
createdb indirim_db

# Migration çalıştır (tabloları oluştur)
npm run migrate

# Seed data oluştur (test verileri)
npm run seed
```

### 4. Server'ı Başlat

```bash
# Development mode (nodemon ile)
npm run dev

# Production mode
npm start
```

Server `http://localhost:3000` adresinde çalışacak.

## 📋 API Endpoints

### Health Check
```
GET /api/health
```

### Campaigns
```
GET /api/campaigns
GET /api/campaigns?sourceIds=uuid1,uuid2
GET /api/campaigns/:id
```

### Sources
```
GET /api/sources
```

## 🗄️ Database Schema

### Sources
- `id` (UUID)
- `name` (VARCHAR)
- `type` ('bank' | 'operator')
- `logo_url` (TEXT)
- `website_url` (TEXT)
- `is_active` (BOOLEAN)
- `created_at`, `updated_at`

### Campaigns
- `id` (UUID)
- `source_id` (UUID, FK)
- `title` (VARCHAR)
- `description` (TEXT)
- `detail_text` (TEXT)
- `icon_name` (VARCHAR)
- `icon_color` (VARCHAR - hex)
- `icon_bg_color` (VARCHAR - hex)
- `tags` (JSONB)
- `original_url` (TEXT)
- `expires_at` (TIMESTAMP)
- `how_to_use` (JSONB)
- `validity_channels` (JSONB)
- `status` ('active' | 'expired' | 'cancelled')
- `is_active` (BOOLEAN)
- `created_at`, `updated_at`

## 🔧 Scripts

- `npm start` - Production server
- `npm run dev` - Development server (nodemon)
- `npm run migrate` - Database migration
- `npm run seed` - Seed data oluştur

## 🔐 Firebase Admin (prod)

- Aşağıdakilerden **birini** tanımla:
  - `FIREBASE_SERVICE_ACCOUNT` : Tek satırlık JSON (private_key içindeki new line karakterlerini `\\n` ile kaçırın).
  - veya `GOOGLE_APPLICATION_CREDENTIALS` : Konteyner içindeki service account dosya yolu (örn. `/run/secrets/firebase-service-account.json`), dosyayı secret/volume olarak mount edin.
- `docker-compose.prod.yml` backend servisi bu env'leri passthrough eder; tanımlı değilse `firebaseAuth` middleware 500 döndürür.

## 📝 Notlar

- Şu anda bot entegrasyonu yok, sadece manuel seed data ile çalışıyor
- Flutter uygulaması mock data yerine bu API'yi kullanacak
- CORS tüm origin'ler için açık (development için)
