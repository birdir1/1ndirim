# 🔍 Kampanya Eksikliği Sorunu - Çözüm Planı

**Sorun:** Telefonda gözüken kampanyalar uygulamada gözükmüyor

---

## 🔍 SORUN TESPİTİ

Backend'de **Main Feed Guard** var ve sadece şu kampanyaları gösteriyor:
- `campaign_type = 'main'` VEYA `NULL`
- `value_level = 'high'` VEYA `NULL`
- `is_hidden = false` VEYA `NULL`
- `is_active = true`
- `expires_at > NOW()`

Bu yüzden bazı kampanyalar gözükmüyor olabilir.

---

## ✅ ÇÖZÜM SEÇENEKLERİ

### Seçenek 1: Backend'de Tüm Kampanyaları Getir (ÖNERİLEN)

Backend API'ye yeni bir endpoint ekle: `/api/campaigns/all`

Bu endpoint:
- Main feed guard'ı bypass eder
- Tüm aktif kampanyaları getirir (campaign_type'a bakmaz)
- Sadece `is_active = true` ve `expires_at > NOW()` kontrol eder

### Seçenek 2: Light Feed'i de Göster

Flutter app'te light feed kampanyalarını da yükle ve göster.

### Seçenek 3: Category Feed'i de Göster

Category feed kampanyalarını da yükle ve göster.

---

## 🚀 ÖNERİLEN ÇÖZÜM

**Backend'e yeni endpoint ekle:** `/api/campaigns/all`

Bu endpoint tüm aktif kampanyaları getirir (feed type'a bakmaz).

---

**Şimdilik UI iyileştirmeleri yapıldı. Logo'lar büyük ve net, kartlar daha görsel. Test et ve sonucu paylaş!** 🎨
