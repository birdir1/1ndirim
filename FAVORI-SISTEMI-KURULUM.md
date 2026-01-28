# Favori Sistemi - Kurulum ve Kullanım Rehberi

## ✅ Tamamlanan Özellikler

### Backend
- ✅ `user_favorites` veritabanı tablosu (migration)
- ✅ Firebase Authentication middleware
- ✅ Favori API endpoint'leri:
  - `GET /api/favorites` - Favori listesi
  - `POST /api/favorites/:campaignId` - Favoriye ekle
  - `DELETE /api/favorites/:campaignId` - Favoriden çıkar
  - `GET /api/favorites/check/:campaignId` - Favori durumu kontrol
  - `POST /api/favorites/batch-check` - Toplu favori kontrolü

### Flutter
- ✅ Favori datasource ve repository
- ✅ Kampanya kartlarında favori butonu
- ✅ Favoriler sayfası
- ✅ Bottom navigation'a favoriler sekmesi eklendi

---

## 📋 Kurulum Adımları

### 1. Veritabanı Migration'ı Çalıştır

**Sunucuda:**
```bash
ssh root@37.140.242.105
cd /var/www/1indirim-api/backend
node src/scripts/migrations/create_user_favorites.js
```

**Local'de (test için):**
```bash
cd backend
node src/scripts/migrations/create_user_favorites.js
```

### 2. Firebase Admin SDK Yapılandırması

Backend'de Firebase Admin SDK'yı yapılandırman gerekiyor. İki seçenek:

**Seçenek 1: Service Account JSON Dosyası (Önerilen)**
```bash
# Firebase Console'dan service account key indir
# backend/firebase-service-account.json olarak kaydet
export GOOGLE_APPLICATION_CREDENTIALS="/var/www/1indirim-api/backend/firebase-service-account.json"
```

**Seçenek 2: Environment Variable**
```bash
# .env dosyasına ekle
FIREBASE_SERVICE_ACCOUNT='{"type":"service_account",...}'
```

**Not:** Development için `MOCK_USER_ID` environment variable'ı ile test edebilirsin:
```bash
export MOCK_USER_ID="test-user-id"
```

### 3. Backend'i Restart Et

```bash
pm2 restart 1indirim-api
```

### 4. Flutter Uygulamasını Test Et

```bash
cd app
flutter run
```

---

## 🧪 Test Senaryoları

### 1. Favoriye Ekleme
1. Uygulamayı aç
2. Giriş yap (Apple veya Google)
3. Ana sayfada bir kampanyanın sağ üstündeki kalp ikonuna tıkla
4. "Favorilere eklendi" mesajını gör
5. Kalp ikonu dolu olmalı

### 2. Favorilerden Çıkarma
1. Favoriler sekmesine git
2. Bir kampanyanın kalp ikonuna tıkla
3. "Favorilerden çıkarıldı" mesajını gör
4. Kampanya listeden kalkmalı

### 3. Favori Listesi
1. Bottom navigation'da "Favoriler" sekmesine tıkla
2. Favori kampanyalarını gör
3. Pull-to-refresh ile yenile

### 4. Giriş Yapmadan Kullanım
1. Giriş yapmadan uygulamayı aç
2. Favori butonuna tıkla
3. "Giriş yapmanız gerekiyor" mesajını gör
4. Favoriler sekmesine git
5. "Giriş Yapın" ekranını gör

---

## 🔧 API Endpoint'leri

### GET /api/favorites
Kullanıcının favori kampanyalarını getirir.

**Headers:**
```
Authorization: Bearer <firebase_token>
```

**Query Params:**
- `limit` (optional, default: 100)
- `offset` (optional, default: 0)

**Response:**
```json
{
  "success": true,
  "data": [...],
  "count": 5,
  "total": 5,
  "limit": 100,
  "offset": 0
}
```

### POST /api/favorites/:campaignId
Kampanyayı favorilere ekler.

**Headers:**
```
Authorization: Bearer <firebase_token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "campaignId": "uuid",
    "favoritedAt": "2026-01-28T..."
  },
  "message": "Kampanya favorilere eklendi"
}
```

### DELETE /api/favorites/:campaignId
Kampanyayı favorilerden çıkarır.

**Headers:**
```
Authorization: Bearer <firebase_token>
```

**Response:**
```json
{
  "success": true,
  "message": "Kampanya favorilerden çıkarıldı"
}
```

### GET /api/favorites/check/:campaignId
Kampanyanın favori olup olmadığını kontrol eder.

**Response:**
```json
{
  "success": true,
  "data": {
    "campaignId": "uuid",
    "isFavorite": true
  }
}
```

### POST /api/favorites/batch-check
Birden fazla kampanyanın favori durumunu kontrol eder.

**Body:**
```json
{
  "campaignIds": ["uuid1", "uuid2", ...]
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "uuid1": true,
    "uuid2": false,
    ...
  }
}
```

---

## 🐛 Sorun Giderme

### Hata: "Authentication servisi yapılandırılmamış"
**Çözüm:** Firebase Admin SDK'yı yapılandır (yukarıdaki adım 2).

### Hata: "Token süresi dolmuş"
**Çözüm:** Flutter uygulamasında kullanıcıyı yeniden giriş yaptır.

### Hata: "Kampanya bulunamadı"
**Çözüm:** Kampanya ID'sinin doğru olduğundan emin ol.

### Favori butonu görünmüyor
**Çözüm:** Kullanıcı giriş yapmış olmalı. Firebase Auth kontrolü yap.

---

## 📝 Sonraki Adımlar

Favori sistemi tamamlandı! Şimdi yapılabilecekler:

1. **Push Notification** - Favori kampanyalarda değişiklik bildirimleri
2. **Favori Kategorileri** - Favorileri kategorilere ayırma
3. **Favori Paylaşımı** - Favori listesini paylaşma
4. **Favori İstatistikleri** - En çok favorilenen kampanyalar

---

**Hazırlayan:** Yazılım Geliştirme Ekibi  
**Tarih:** 28 Ocak 2026
