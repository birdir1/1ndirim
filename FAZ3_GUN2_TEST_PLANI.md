# FAZ 3 - Gün 2: Detaylı UI/UX Test Planı

**Tarih**: 30 Ocak 2026  
**Test Cihazı**: iPhone 16 Pro  
**Backend**: localhost:3000 ✅  
**Durum**: Başlıyor

---

## 🎯 Test Hedefleri

1. Yeni özelliklerin (Blog, Price Tracking, Referral) tam testi
2. Tüm ekranların regression testi
3. Performans ve kullanılabilirlik kontrolü
4. Bug tespiti ve dokümantasyonu

---

## 📋 TEST SENARYOLARI

### BÖLÜM 1: Yeni Özellikler Testi

#### 1.1 Blog Screen Testi

**Erişim:**
- Home Screen → Blog butonu/kartı
- Veya Profile → Blog

**Test Adımları:**
```
□ Blog ekranı açılıyor mu?
□ Blog kategorileri görünüyor mu?
□ Blog yazıları listeleniyor mu?
□ Blog kartları düzgün görünüyor mu?
  - Başlık
  - Özet
  - Tarih
  - Kategori badge
  - Thumbnail image

□ Blog kategorilerine tıklama:
  - Kategori filtreleme çalışıyor mu?
  - Kategori değiştirme smooth mu?
  - Tüm kategoriler çalışıyor mu?

□ Blog detay sayfası:
  - Blog yazısına tıklayınca detay açılıyor mu?
  - Başlık görünüyor mu?
  - İçerik tam görünüyor mu?
  - Tarih ve yazar bilgisi var mı?
  - Geri butonu çalışıyor mu?
  - Paylaşma butonu var mı?

□ Performance:
  - İlk yükleme hızlı mı? (< 2 saniye)
  - 2. açılışta cache'den geliyor mu? (< 500ms)
  - Scroll smooth mu?
  - Image loading lazy mi?

□ Error Handling:
  - İnternet yoksa ne oluyor?
  - Backend down ise ne oluyor?
  - Boş liste durumu var mı?

□ Empty State:
  - Blog yoksa uygun mesaj gösteriliyor mu?
```

**Beklenen Sonuç:**
- ✅ Tüm blog özellikleri çalışıyor
- ✅ Performance iyi
- ✅ Error handling doğru
- ✅ UI/UX kullanıcı dostu

**Bulunan Buglar:**
```
[Buraya test sırasında bulunan bugları yaz]
```

---

#### 1.2 Price Tracking Screen Testi

**Erişim:**
- Home Screen → Price Tracking butonu
- Veya Campaign Detail → "Fiyat Takibi Ekle" butonu

**Test Adımları:**
```
□ Price Tracking ekranı açılıyor mu?

□ Takip edilen kampanyalar:
  - Liste görünüyor mu?
  - Kampanya kartları düzgün mü?
  - Mevcut fiyat görünüyor mu?
  - Fiyat değişimi gösteriliyor mu? (↑ ↓)
  - Son güncelleme tarihi var mı?

□ Fiyat geçmişi:
  - Kampanyaya tıklayınca detay açılıyor mu?
  - Fiyat grafiği görünüyor mu?
  - Grafik doğru çiziyor mu?
  - Tarih aralığı seçimi var mı?
  - Zoom/pan çalışıyor mu?

□ Takip ekleme:
  - Campaign Detail'den "Takip Ekle" butonu var mı?
  - Takip ekleme çalışıyor mu?
  - Başarı mesajı gösteriliyor mu?
  - Liste güncelleniyor mu?

□ Takip çıkarma:
  - Swipe to delete çalışıyor mu?
  - Veya delete butonu var mı?
  - Onay dialogu var mı?
  - Silme işlemi çalışıyor mu?

□ Bildirim ayarları:
  - Bildirim toggle'ı var mı?
  - Fiyat düşünce bildirim ayarı var mı?
  - Yüzde eşiği ayarlanabiliyor mu?

□ Performance:
  - Grafik rendering hızlı mı?
  - Scroll smooth mu?
  - Real-time update var mı?

□ Error Handling:
  - İnternet yoksa ne oluyor?
  - Takip eklenemezse ne oluyor?
  - Boş liste durumu var mı?

□ Empty State:
  - Takip yoksa uygun mesaj var mı?
  - "İlk takibini ekle" CTA var mı?
```

**Beklenen Sonuç:**
- ✅ Fiyat takibi çalışıyor
- ✅ Grafik doğru çiziyor
- ✅ Bildirimler ayarlanabiliyor
- ✅ UI/UX sezgisel

**Bulunan Buglar:**
```
[Buraya test sırasında bulunan bugları yaz]
```

---

#### 1.3 Referral Screen Testi

**Erişim:**
- Profile Screen → Referral/Davet Et butonu
- Veya Home Screen → Referral kartı

**Test Adımları:**
```
□ Referral ekranı açılıyor mu?

□ Referral code:
  - Kod görünüyor mu?
  - Kod unique mi? (her kullanıcıda farklı)
  - Kod formatı doğru mu? (örn: ABC123)

□ Kod kopyalama:
  - "Kodu Kopyala" butonu var mı?
  - Kopyalama çalışıyor mu?
  - Toast/Snackbar mesajı gösteriliyor mu?
  - Clipboard'a kopyalanıyor mu?

□ Paylaşma:
  - WhatsApp butonu var mı?
  - Telegram butonu var mı?
  - SMS butonu var mı?
  - Genel paylaşma butonu var mı?
  - Paylaşma metni doğru mu?
  - Deep link çalışıyor mu?

□ İstatistikler:
  - Kaç kişi davet edildi?
  - Kaç kişi kayıt oldu?
  - Kazanılan puan/ödül var mı?
  - İstatistikler doğru mu?

□ Kod girişi:
  - "Davet Kodu Gir" alanı var mı?
  - Kod girişi çalışıyor mu?
  - Geçerli kod kabul ediliyor mu?
  - Geçersiz kod reddediliyor mu?
  - Hata mesajları doğru mu?

□ Ödül sistemi:
  - Ödül açıklaması var mı?
  - Ödül kazanma koşulları açık mı?
  - Ödül geçmişi görünüyor mu?

□ Performance:
  - Sayfa hızlı yükleniyor mu?
  - İstatistikler real-time mı?

□ Error Handling:
  - İnternet yoksa ne oluyor?
  - Kod girilmezse ne oluyor?
  - Kendi kodunu girerse ne oluyor?
  - Aynı kodu 2. kez girerse ne oluyor?

□ Empty State:
  - Henüz davet yoksa mesaj var mı?
```

**Beklenen Sonuç:**
- ✅ Referral sistemi çalışıyor
- ✅ Kod paylaşımı kolay
- ✅ İstatistikler doğru
- ✅ Error handling iyi

**Bulunan Buglar:**
```
[Buraya test sırasında bulunan bugları yaz]
```

---

### BÖLÜM 2: Regression Testing (Tüm Ekranlar)

#### 2.1 Onboarding Flow
```
□ Splash screen görünüyor mu?
□ 3 sayfa geçişi smooth mu?
□ Skip butonu çalışıyor mu? ✅ (Dün düzeltildi)
□ Devam butonu tek ok ile mi? ✅ (Dün düzeltildi)
□ Animasyonlar düzgün mü?
□ Kaynak seçimi çalışıyor mu?
□ En az 1 kaynak seçme zorunluluğu var mı?
```

#### 2.2 Login Flow
```
□ Google Sign-In çalışıyor mu?
□ Apple Sign-In durumu? (ücretli hesap gerekli - beklenen)
□ Auto-login çalışıyor mu?
□ Logout çalışıyor mu?
□ Token refresh çalışıyor mu?
```

#### 2.3 Home Screen
```
□ Kampanyalar yükleniyor mu?
□ Filtreleme çalışıyor mu?
□ Arama çalışıyor mu?
□ Pull-to-refresh çalışıyor mu?
□ Favori ekleme/çıkarma çalışıyor mu?
□ Kampanya kartları düzgün mü?
□ Scroll performance iyi mi?
□ Infinite scroll çalışıyor mu?
```

#### 2.4 Discovery Screen
```
□ Kategoriler görünüyor mu?
□ Kategori filtreleme çalışıyor mu?
□ Featured kampanyalar var mı?
□ Kampanya kartları düzgün mü?
□ Scroll smooth mu?
```

#### 2.5 Favorites Screen
```
□ Favoriler listeleniyor mu?
□ Favori silme çalışıyor mu?
□ Empty state var mı?
□ Kampanya detayına gitme çalışıyor mu?
```

#### 2.6 Compare Screen
```
□ 2-3 kampanya karşılaştırma çalışıyor mu?
□ Yan yana görünüm doğru mu?
□ Detaylara gitme çalışıyor mu?
□ Geri butonu çalışıyor mu? ✅ (Dün düzeltildi)
□ Kampanya kaldırma çalışıyor mu?
```

#### 2.7 Profile Screen
```
□ Kullanıcı bilgileri görünüyor mu?
□ Kaynak seçimi çalışıyor mu?
□ Bildirim ayarları çalışıyor mu?
□ Dil ayarları var mı?
□ Logout çalışıyor mu?
□ Hesap silme var mı?
```

#### 2.8 Campaign Detail
```
□ Detaylar tam görünüyor mu?
□ Affiliate link çalışıyor mu?
□ Paylaşma çalışıyor mu?
□ Favori ekleme çalışıyor mu?
□ Fiyat takibi ekleme butonu var mı?
□ Video varsa oynatılıyor mu?
```

---

### BÖLÜM 3: Performance Testing

#### 3.1 App Performance
```
□ App açılış süresi < 3 saniye
□ Splash screen süresi uygun mu?
□ Ekran geçişleri smooth mu? (60 FPS)
□ Scroll performance iyi mi?
□ Animation frame drop var mı?
□ Memory leak var mı?
□ Battery drain normal mi?
```

#### 3.2 Network Performance
```
□ API response time < 2 saniye
□ Image loading hızlı mı?
□ Lazy loading çalışıyor mu?
□ Cache çalışıyor mu?
□ Offline mode var mı?
□ Network error handling doğru mu?
```

#### 3.3 Database Performance
```
□ Local data okuma hızlı mı?
□ Favori ekleme/çıkarma hızlı mı?
□ Search hızlı mı?
□ Filter hızlı mı?
```

---

### BÖLÜM 4: Usability Testing

#### 4.1 Navigation
```
□ Bottom navigation çalışıyor mu?
□ Geri butonu her yerde çalışıyor mu?
□ Deep linking çalışıyor mu?
□ Tab switching smooth mu?
```

#### 4.2 User Feedback
```
□ Loading indicators var mı?
□ Success messages gösteriliyor mu?
□ Error messages anlaşılır mı?
□ Toast/Snackbar kullanımı doğru mu?
□ Haptic feedback var mı?
```

#### 4.3 Accessibility
```
□ Font size ayarlanabiliyor mu?
□ Contrast yeterli mi?
□ Touch targets yeterince büyük mü? (44x44)
□ VoiceOver desteği var mı? (opsiyonel)
```

---

## 🐛 BUG RAPORU ŞABLONU

Her bug için aşağıdaki formatı kullan:

```markdown
### Bug #[numara]: [Kısa Açıklama]

**Öncelik**: 🔴 Kritik / 🟡 Önemli / 🟢 Minor

**Ekran**: [Hangi ekranda]

**Adımlar**:
1. [Adım 1]
2. [Adım 2]
3. [Adım 3]

**Beklenen Sonuç**:
[Ne olması gerekiyordu]

**Gerçek Sonuç**:
[Ne oldu]

**Screenshot/Video**:
[Varsa ekle]

**Cihaz**:
- Model: iPhone 16 Pro
- iOS: 26.2.1
- App Version: 1.0.0

**Notlar**:
[Ek bilgiler]
```

---

## 📊 TEST SONUÇLARI

### Özet
```
Toplam Test: [X]
✅ Başarılı: [X]
❌ Başarısız: [X]
⚠️ Kısmi: [X]
```

### Bulunan Buglar
```
🔴 Kritik: [X]
🟡 Önemli: [X]
🟢 Minor: [X]
```

### Performans Skorları
```
App Açılış: [X] saniye
API Response: [X] saniye
Scroll FPS: [X]
Memory: [X] MB
Crash-free: [X]%
```

---

## ✅ TEST TAMAMLAMA CHECKLİSTİ

```
□ Blog Screen testi tamamlandı
□ Price Tracking testi tamamlandı
□ Referral Screen testi tamamlandı
□ Regression testing tamamlandı
□ Performance testing tamamlandı
□ Usability testing tamamlandı
□ Tüm buglar dokümante edildi
□ Kritik buglar düzeltildi
□ Test raporu hazırlandı
```

---

## 📝 SONRAKI ADIMLAR

Test tamamlandıktan sonra:

1. **Bug Fixing** (Gün 2 sonu)
   - Kritik bugları hemen düzelt
   - Önemli bugları listele
   - Minor bugları not al

2. **Beta Testing Hazırlığı** (Gün 3)
   - TestFlight build hazırla
   - Beta tester listesi oluştur
   - Test instructions yaz

3. **Dokümantasyon**
   - Test raporunu tamamla
   - Bug listesini güncelle
   - FAZ3_GUN2_OZET.md oluştur

---

**Hazırlayan**: Kiro AI Assistant  
**Tarih**: 30 Ocak 2026  
**Durum**: Test başlıyor 🧪

**Uygulamayı başlat ve testlere başla!**
```bash
cd 1ndirim/app
flutter run -d 00008140-001879401198801C
```
