# 🎨 UI İyileştirme Planı

**Tarih:** 27 Ocak 2026  
**Durum:** Tespit edildi, çözüm planı hazırlanıyor

---

## 🔍 TESPİT EDİLEN SORUNLAR

### 1. ❌ Icon Sorunu
- **Sorun:** Source logo'ları gösterilmiyor, sadece generic icon'lar var
- **Sebep:** `assets/images/logos/` klasöründeki logo dosyaları kullanılmıyor
- **Çözüm:** Source logo'larını kampanya kartlarında göster

### 2. ❌ Görsel Sorunu
- **Sorun:** Sayfa çok basit, "dümdüz metin" gibi görünüyor
- **Sebep:** Kampanya görselleri yok, sadece küçük icon'lar var
- **Çözüm:** Kampanya kartlarını görsel olarak iyileştir

### 3. ❌ Source Segment Sorunu
- **Sorun:** Türk Telekom Prime vs Normal ayrımı yapılamıyor
- **Sebep:** Backend'de source_segment_id yok, sadece source_id var
- **Çözüm:** Source segment'lerine göre filtreleme ekle

### 4. ❌ Kampanya Eksikliği
- **Sorun:** Tüm kampanyalar gösterilmiyor
- **Sebep:** Source segment filtrelemesi yapılmıyor
- **Çözüm:** Backend'den tüm kampanyaları getir ve segment'e göre filtrele

---

## ✅ ÇÖZÜM PLANI

### ADIM 1: Source Logo'larını Göster

**Yapılacaklar:**
1. Source logo helper'ı oluştur (`lib/core/utils/source_logo_helper.dart`)
2. Source name'den logo path'ini döndüren fonksiyon
3. OpportunityCard'da generic icon yerine logo göster
4. SVG ve PNG desteği ekle

**Dosyalar:**
- `lib/core/utils/source_logo_helper.dart` (yeni)
- `lib/features/home/widgets/opportunity_card.dart` (güncelle)

---

### ADIM 2: Kampanya Kartlarını Görsel İyileştir

**Yapılacaklar:**
1. Kart tasarımını büyüt ve daha çekici yap
2. Kampanya görselleri ekle (backend'den image_url varsa)
3. Gradient arka planlar ekle
4. Daha büyük logo'lar göster
5. Kampanya başlıklarını daha belirgin yap

**Dosyalar:**
- `lib/features/home/widgets/opportunity_card.dart` (güncelle)

---

### ADIM 3: Source Segment Filtreleme

**Yapılacaklar:**
1. Backend'de source_segment_id ekle (migration)
2. Flutter'da segment filtreleme ekle
3. Türk Telekom Prime vs Normal ayrımı yap
4. Filter chip'lerde segment göster

**Dosyalar:**
- Backend migration (yeni)
- `lib/features/home/home_screen.dart` (güncelle)
- `lib/data/datasources/opportunity_api_datasource.dart` (güncelle)

---

### ADIM 4: Backend'den Tüm Kampanyaları Getir

**Yapılacaklar:**
1. Backend API'ye source_segment_id parametresi ekle
2. Segment'e göre filtreleme yap
3. Tüm kampanyaları getir (segment filtrelemesi ile)

**Dosyalar:**
- `backend/src/routes/campaigns.js` (güncelle)
- `backend/src/models/Campaign.js` (güncelle)

---

## 🚀 ÖNCELİK SIRASI

1. **YÜKSEK:** Source logo'larını göster (hızlı çözüm)
2. **YÜKSEK:** Kampanya kartlarını görsel iyileştir
3. **ORTA:** Source segment filtreleme
4. **ORTA:** Backend'den tüm kampanyaları getir

---

## 📋 DETAYLI TASARIM DEĞİŞİKLİKLERİ

### Kampanya Kartı Yeni Tasarım:

```
┌─────────────────────────────────────┐
│ [LOGO]  Kampanya Başlığı          │
│         Kampanya açıklaması        │
│         [Görsel - Büyük]           │
│         [Tag] [Tag] [Tag]          │
│         Kaynak: Türk Telekom       │
└─────────────────────────────────────┘
```

**Değişiklikler:**
- Logo sol üstte, daha büyük
- Kampanya görseli kartın ortasında (büyük)
- Başlık daha belirgin
- Tag'ler daha görsel
- Kaynak bilgisi alt kısımda

---

**Şimdi başlayalım mı?** 🚀
