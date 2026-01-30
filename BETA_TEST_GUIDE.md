# 1ndirim Beta Test Rehberi

**Versiyon:** 1.0.0-beta  
**Tarih:** 30 Ocak 2026  
**Platform:** iOS & Android

---

## 🎯 Beta Test Amacı

1ndirim uygulamasının store yayınından önce gerçek kullanıcılarla test edilmesi ve feedback toplanması.

---

## 📱 Test Platformları

### iOS (TestFlight)
- **Minimum iOS:** 12.0+
- **Test Cihazları:** iPhone SE, iPhone 14, iPhone 14 Pro Max
- **Test Süresi:** 7 gün
- **Tester Sayısı:** 10-20 kişi

### Android (Play Console - Internal Testing)
- **Minimum Android:** 5.0 (API 21+)
- **Test Cihazları:** Samsung, Pixel, Xiaomi
- **Test Süresi:** 7 gün
- **Tester Sayısı:** 10-20 kişi

---

## 🧪 Test Senaryoları

### 1. İlk Kullanım (Onboarding)
**Süre:** 2-3 dakika

**Adımlar:**
1. Uygulamayı aç
2. Splash screen'i izle
3. Onboarding sayfalarını oku
4. "Devam" veya "Skip" butonlarını test et
5. Google veya Apple ile giriş yap
6. Kaynak seçimi yap (en az 3 kaynak)
7. Ana sayfaya ulaş

**Test Edilecekler:**
- [ ] Splash screen düzgün görünüyor mu?
- [ ] Onboarding metinleri okunabilir mi?
- [ ] Skip butonu çalışıyor mu?
- [ ] Google Sign-In çalışıyor mu?
- [ ] Apple Sign-In çalışıyor mu?
- [ ] Kaynak seçimi kolay mı?
- [ ] Ana sayfaya geçiş sorunsuz mu?

### 2. Ana Sayfa (Home)
**Süre:** 5 dakika

**Adımlar:**
1. Ana sayfadaki kampanyaları incele
2. Aşağı kaydır (scroll)
3. Bir kampanyaya tıkla
4. Geri dön
5. Arama butonuna tıkla
6. Bir kampanya ara
7. Karşılaştır butonunu test et

**Test Edilecekler:**
- [ ] Kampanyalar düzgün yükleniyor mu?
- [ ] Scroll smooth mu?
- [ ] Kampanya kartları güzel görünüyor mu?
- [ ] Arama çalışıyor mu?
- [ ] Karşılaştır butonu çalışıyor mu?
- [ ] Loading state'ler var mı?

### 3. Keşif (Discovery)
**Süre:** 3 dakika

**Adımlar:**
1. Keşif tab'ına git
2. Kategorileri incele
3. Bir kategoriye tıkla
4. Kampanyaları incele
5. Bir kampanyaya tıkla

**Test Edilecekler:**
- [ ] Kategoriler görünüyor mu?
- [ ] Kategori filtreleme çalışıyor mu?
- [ ] Kampanyalar yükleniyor mu?
- [ ] UI temiz ve anlaşılır mı?

### 4. Favoriler
**Süre:** 3 dakika

**Adımlar:**
1. Bir kampanyayı favorilere ekle
2. Favoriler tab'ına git
3. Favori kampanyayı gör
4. Favoriden çıkar
5. Favori listesinin güncellendiğini kontrol et

**Test Edilecekler:**
- [ ] Favori ekleme çalışıyor mu?
- [ ] Favoriler listesi görünüyor mu?
- [ ] Favori çıkarma çalışıyor mu?
- [ ] Senkronizasyon çalışıyor mu?

### 5. Profil
**Süre:** 5 dakika

**Adımlar:**
1. Profil tab'ına git
2. Avatar değiştir
3. Bildirim ayarlarını değiştir
4. "Fiyat Takibi" menüsüne git
5. "Blog & Rehberler" menüsüne git
6. "Nasıl Çalışır?" sayfasını oku
7. KVKK ve Kullanım Şartlarını kontrol et

**Test Edilecekler:**
- [ ] Avatar seçimi çalışıyor mu?
- [ ] Avatar kaydediliyor mu?
- [ ] Bildirim ayarları çalışıyor mu?
- [ ] Fiyat Takibi ekranı açılıyor mu?
- [ ] Blog ekranı açılıyor mu?
- [ ] Tüm menüler çalışıyor mu?

### 6. Kampanya Karşılaştırma
**Süre:** 3 dakika

**Adımlar:**
1. 2-3 kampanyayı karşılaştırmaya ekle
2. Karşılaştır butonuna tıkla
3. Kampanyaları yan yana incele
4. Geri dön

**Test Edilecekler:**
- [ ] Karşılaştırma ekleme çalışıyor mu?
- [ ] Karşılaştırma ekranı açılıyor mu?
- [ ] Yan yana görünüm düzgün mü?
- [ ] Geri butonu çalışıyor mu?

### 7. Fiyat Takibi
**Süre:** 3 dakika

**Adımlar:**
1. Bir kampanya detayına git
2. Fiyat takibini başlat
3. Profil → Fiyat Takibi'ne git
4. Takip edilen kampanyayı gör
5. Fiyat geçmişini incele
6. Takibi durdur

**Test Edilecekler:**
- [ ] Fiyat takibi ekleme çalışıyor mu?
- [ ] Fiyat geçmişi görünüyor mu?
- [ ] Takip durdurma çalışıyor mu?

### 8. Blog & Rehberler
**Süre:** 3 dakika

**Adımlar:**
1. Profil → Blog & Rehberler'e git
2. Kategorileri incele
3. Bir blog yazısına tıkla
4. Blog detayını oku
5. Geri dön

**Test Edilecekler:**
- [ ] Blog listesi görünüyor mu?
- [ ] Kategoriler çalışıyor mu?
- [ ] Blog detayı açılıyor mu?
- [ ] Sample content görünüyor mu? (veri yoksa)

---

## 🐛 Bug Raporlama

### Bug Raporu Formatı
```
**Başlık:** [Kısa açıklama]
**Öncelik:** Kritik / Yüksek / Orta / Düşük
**Platform:** iOS / Android
**Cihaz:** [Model ve iOS/Android versiyonu]
**Adımlar:**
1. [Adım 1]
2. [Adım 2]
3. [Adım 3]

**Beklenen Sonuç:** [Ne olması gerekiyordu]
**Gerçek Sonuç:** [Ne oldu]
**Ekran Görüntüsü:** [Varsa ekle]
```

### Örnek Bug Raporu
```
**Başlık:** Favorilere ekleme çalışmıyor
**Öncelik:** Yüksek
**Platform:** iOS
**Cihaz:** iPhone 14, iOS 17.2
**Adımlar:**
1. Ana sayfada bir kampanyaya tıkla
2. Kalp ikonuna tıkla
3. Favoriler tab'ına git

**Beklenen Sonuç:** Kampanya favorilerde görünmeli
**Gerçek Sonuç:** Favoriler boş görünüyor
**Ekran Görüntüsü:** [Eklendi]
```

---

## 📝 Feedback Formu

### Genel Sorular
1. **Uygulamayı kullanmak kolay mıydı?** (1-5 yıldız)
2. **Tasarım hoşunuza gitti mi?** (1-5 yıldız)
3. **Performans nasıldı?** (1-5 yıldız)
4. **Hangi özelliği en çok beğendiniz?**
5. **Hangi özellik eksik?**
6. **Genel yorumunuz nedir?**

### Detaylı Sorular
1. **Onboarding süreci nasıldı?**
   - [ ] Çok kolay
   - [ ] Kolay
   - [ ] Orta
   - [ ] Zor
   - [ ] Çok zor

2. **Kampanya bulmak kolay mıydı?**
   - [ ] Çok kolay
   - [ ] Kolay
   - [ ] Orta
   - [ ] Zor
   - [ ] Çok zor

3. **Hangi özelliği en çok kullandınız?**
   - [ ] Ana Sayfa
   - [ ] Keşif
   - [ ] Favoriler
   - [ ] Karşılaştırma
   - [ ] Fiyat Takibi
   - [ ] Blog

4. **Uygulama hızı nasıldı?**
   - [ ] Çok hızlı
   - [ ] Hızlı
   - [ ] Normal
   - [ ] Yavaş
   - [ ] Çok yavaş

5. **Uygulamayı arkadaşlarınıza önerir misiniz?**
   - [ ] Kesinlikle evet
   - [ ] Evet
   - [ ] Belki
   - [ ] Hayır
   - [ ] Kesinlikle hayır

---

## 📊 Başarı Kriterleri

### Minimum Gereksinimler
- [ ] 0 kritik bug
- [ ] <3 yüksek öncelikli bug
- [ ] %80+ tester memnuniyeti
- [ ] 4.0+ ortalama puan
- [ ] <1% crash rate

### İdeal Hedefler
- [ ] 0 bug
- [ ] %90+ tester memnuniyeti
- [ ] 4.5+ ortalama puan
- [ ] <0.5% crash rate
- [ ] %70+ retention (7 gün)

---

## 🚀 Beta Test Süreci

### Hafta 1: Hazırlık
- [ ] TestFlight setup (iOS)
- [ ] Play Console setup (Android)
- [ ] Beta tester listesi hazırla
- [ ] Test guide paylaş

### Hafta 2: Test
- [ ] Beta build yayınla
- [ ] Tester'lara davet gönder
- [ ] Günlük feedback topla
- [ ] Bug'ları düzelt

### Hafta 3: İyileştirme
- [ ] Kritik bug'ları düzelt
- [ ] Yeni build yayınla
- [ ] Son testler
- [ ] Store submission hazırlığı

---

## 📞 İletişim

### Bug Raporlama
- **Email:** beta@1ndirim.com
- **Form:** [Google Forms linki]

### Feedback
- **Email:** feedback@1ndirim.com
- **Form:** [Google Forms linki]

### Acil Durumlar
- **Email:** support@1ndirim.com

---

## 🎁 Beta Tester Ödülleri

### Tüm Tester'lar
- ✅ İlk kullanıcı badge'i
- ✅ Özel teşekkür (credits)
- ✅ Erken erişim (yeni özellikler)

### En Aktif Tester'lar (Top 5)
- ✅ 1 yıl premium üyelik (gelecekte)
- ✅ Özel avatar
- ✅ Leaderboard'da özel badge

---

**Beta Test Başlangıç:** [Tarih]  
**Beta Test Bitiş:** [Tarih]  
**Store Launch:** [Tarih]

**Teşekkürler!** 🎉
