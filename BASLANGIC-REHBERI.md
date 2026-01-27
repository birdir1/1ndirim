# 🚀 Store Deploy — Başlangıç Rehberi

**Tarih:** 27 Ocak 2026  
**Hazırlayan:** Teknik Değerlendirme

---

## ✅ HAZIR OLANLAR

- ✅ Privacy Policy dokümanı hazır (`app/PRIVACY_POLICY.md`)
- ✅ Terms of Use dokümanı hazır (`app/TERMS_OF_USE.md`)
- ✅ Privacy Policy ve Terms of Use Flutter app'e eklendi
- ✅ Bundle ID'ler güncellendi (`com.birdir1.1ndirim`)
- ✅ Store listing metinleri hazır
- ✅ Build komutları hazır (`app/BUILD-KOMUTLARI.md`)
- ✅ Adım adım rehber hazır (`STORE-DEPLOY-ADIM-ADIM.md`)

---

## 📋 SIRAYLA YAPILACAKLAR

### 1. ADIM: Privacy Policy ve Terms of Use'u Web Sitesine Ekle

**Yapılacaklar:**
1. Backend'e static sayfalar ekle veya Nginx ile serve et
2. URL'ler hazır olmalı:
   - `https://1indirim.birdir1.com/privacy-policy`
   - `https://1indirim.birdir1.com/terms-of-use`

**Dosyalar:**
- `app/PRIVACY_POLICY.md` → Web sitesine ekle
- `app/TERMS_OF_USE.md` → Web sitesine ekle

**Komutlar:**
```bash
# Backend'e static route ekle veya Nginx ile serve et
# Şimdilik dokümanlar hazır, web sitesine eklenmesi gerekiyor
```

**✅ Kontrol:** URL'ler çalışıyor mu?

---

### 2. ADIM: App Icon Hazırlama

**Gereksinimler:**
- iOS: 1024x1024 px PNG (transparan arka plan olmamalı)
- Android: 512x512 px PNG (transparan arka plan olmamalı)

**Mevcut Dosya:** `app/assets/images/app_icon.png`

**Yapılacaklar:**
1. Mevcut app_icon.png'yi kontrol et
2. Gerekirse yeniden oluştur (1024x1024 ve 512x512)
3. Online tool kullanabilirsin: [appicon.co](https://appicon.co)

**Komutlar:**
```bash
cd app
# App icon'u kontrol et
ls -lh assets/images/app_icon.png

# Flutter launcher icons ile otomatik oluştur
flutter pub run flutter_launcher_icons
```

**✅ Kontrol:** App icon dosyaları hazır mı?

---

### 3. ADIM: Screenshots Hazırlama

**Gereksinimler:**

**iOS:**
- En az 3, en fazla 10 screenshot
- iPhone 6.7" (iPhone 14 Pro Max): 1290x2796 px
- iPhone 6.5" (iPhone 11 Pro Max): 1242x2688 px

**Android:**
- En az 2, en fazla 8 screenshot
- Telefon: 1080x1920 px (9:16)

**Yapılacaklar:**
1. Flutter app'i çalıştır
2. Şu ekranların screenshot'larını al:
   - Ana ekran (kampanya listesi)
   - Kampanya detay ekranı
   - Kaynak seçim ekranı
   - Profil ekranı

**Komutlar:**
```bash
cd app
# iOS Simulator'da çalıştır
flutter run -d ios

# Android Emulator'da çalıştır
flutter run -d android

# Screenshot almak için:
# iOS: Cmd+S (Simulator'da)
# Android: Emulator'da screenshot butonu
```

**✅ Kontrol:** Screenshot'lar hazır mı? (En az 3 iOS, 2 Android)

---

### 4. ADIM: Apple Developer Program Kaydı

**Yapılacaklar:**
1. [developer.apple.com](https://developer.apple.com) adresine git
2. "Enroll" butonuna tıkla
3. Apple ID ile giriş yap
4. Kişisel veya şirket bilgilerini gir
5. Ödeme yap ($99/yıl)
6. Onay bekle (genellikle 24-48 saat)

**✅ Kontrol:** Apple Developer Program hesabı aktif mi?

---

### 5. ADIM: Bundle ID Oluşturma (Apple)

**Yapılacaklar:**
1. [developer.apple.com/account/resources/identifiers/list](https://developer.apple.com/account/resources/identifiers/list) adresine git
2. "+" butonuna tıkla
3. "App IDs" seç
4. "App" seç ve Continue
5. Bilgileri gir:
   - **Description:** 1ndirim iOS App
   - **Bundle ID:** com.birdir1.1ndirim
   - **Capabilities:** Push Notifications (isteğe bağlı)
6. Register

**✅ Kontrol:** Bundle ID oluşturuldu mu? (`com.birdir1.1ndirim`)

---

### 6. ADIM: App Store Connect Setup

**Yapılacaklar:**
1. [appstoreconnect.apple.com](https://appstoreconnect.apple.com) adresine git
2. "My Apps" > "+" > "New App" tıkla
3. Bilgileri gir:
   - **Platform:** iOS
   - **Name:** 1ndirim
   - **Primary Language:** Turkish
   - **Bundle ID:** com.birdir1.1ndirim
   - **SKU:** 1ndirim-ios-001
   - **User Access:** Full Access
4. Create

**✅ Kontrol:** App Store Connect'te app oluşturuldu mu?

---

### 7. ADIM: Xcode Projesi Yapılandırma

**Yapılacaklar:**
1. Xcode'u aç
2. Runner.xcworkspace'ı aç
3. Runner projesini seç
4. "Signing & Capabilities" sekmesine git
5. "Automatically manage signing" işaretle
6. Team'i seç (Apple Developer Program hesabın)
7. Bundle Identifier'ı `com.birdir1.1ndirim` olarak ayarla (zaten güncellendi)
8. "Build Settings" > "Version" ve "Build" numaralarını kontrol et

**Komutlar:**
```bash
cd app/ios
open Runner.xcworkspace
```

**✅ Kontrol:** Xcode'da signing ayarları doğru mu?

---

### 8. ADIM: iOS Build Oluşturma

**Yapılacaklar:**
1. Flutter clean ve build
2. Xcode'da Archive oluştur
3. Archive'ı App Store Connect'e upload et

**Komutlar:**
```bash
cd app
flutter clean
flutter pub get
flutter build ios --release

# Xcode'da:
# Product > Archive
# Archive tamamlandığında "Distribute App" tıkla
# "App Store Connect" seç
# "Upload" seç
# Signing seçeneklerini onayla
# Upload'ı başlat
```

**✅ Kontrol:** Build App Store Connect'e upload edildi mi?

---

### 9. ADIM: App Store Listing Doldurma

**Yapılacaklar:**
1. App Store Connect > My Apps > 1ndirim
2. "App Store" sekmesine git
3. Şu bilgileri doldur:

**App Information:**
- **Name:** 1ndirim
- **Subtitle:** Tüm kampanyalar tek yerde
- **Category:** Finance
- **Content Rights:** Kendi içeriğin

**Pricing and Availability:**
- **Price:** Free
- **Availability:** All countries

**App Privacy:**
- **Privacy Policy URL:** https://1indirim.birdir1.com/privacy-policy
- **Data Collection:** Gerekli bilgileri doldur

**Version Information:**
- **Screenshots:** Upload et (3-10 adet)
- **Description:** (Aşağıdaki metni kullan)
- **Keywords:** kampanya,indirim,banka,operatör,kredi,kartı,ödeme,teklif,avantaj
- **Support URL:** https://1indirim.birdir1.com/support
- **Marketing URL:** https://1indirim.birdir1.com

**Description Metni:**
```
1ndirim ile tüm banka ve operatör kampanyalarını tek bir uygulamada görüntüleyin!

🎯 Özellikler:
• 20+ banka ve operatör kampanyaları
• Güncel kampanya bilgileri
• Kişiselleştirilmiş kaynak seçimi
• Kolay kullanım

💡 Nasıl Çalışır?
1ndirim, Türkiye'deki tüm önemli banka ve operatörlerin kampanyalarını toplar ve tek bir yerde sunar. İstediğiniz kaynakları seçerek sadece ilgilendiğiniz kampanyaları görüntüleyebilirsiniz.

🔒 Gizlilik
Kullanıcı verileriniz güvende. Detaylı gizlilik politikamızı inceleyebilirsiniz.

📱 Hemen İndirin ve En İyi Kampanyaları Keşfedin!
```

**✅ Kontrol:** Tüm bilgiler dolduruldu mu?

---

### 10. ADIM: App Store Review'a Gönderme

**Yapılacaklar:**
1. App Store Connect > My Apps > 1ndirim > "App Store" sekmesine git
2. Tüm bilgileri kontrol et:
   - Screenshots ✅
   - Description ✅
   - Privacy Policy URL ✅
   - Support URL ✅
   - App Icon ✅
3. "Submit for Review" tıkla
4. Export compliance sorularını cevapla
5. Submit

**✅ Kontrol:** Review'a gönderildi mi?

**Bekleme Süresi:** Genellikle 1-3 gün

---

### 11. ADIM: Google Play Developer Hesabı

**Yapılacaklar:**
1. [play.google.com/console](https://play.google.com/console) adresine git
2. "Create app" tıkla
3. Bilgileri gir:
   - **App name:** 1ndirim
   - **Default language:** Turkish (Turkey)
   - **App or game:** App
   - **Free or paid:** Free
4. "Create app" tıkla
5. Ödeme yap ($25 tek seferlik)

**✅ Kontrol:** Google Play Developer hesabı oluşturuldu mu?

---

### 12. ADIM: App Bundle Oluşturma

**Yapılacaklar:**
1. Flutter clean ve build
2. App Bundle oluştur
3. Google Play Console'a upload et

**Komutlar:**
```bash
cd app
flutter clean
flutter pub get
flutter build appbundle --release

# Çıktı: app/build/app/outputs/bundle/release/app-release.aab
```

**✅ Kontrol:** App Bundle oluşturuldu mu? (`app-release.aab`)

---

### 13. ADIM: Google Play Console Setup

**Yapılacaklar:**
1. Google Play Console > 1ndirim app'i seç
2. "Store presence" > "Main store listing" sekmesine git
3. Şu bilgileri doldur:

**App Details:**
- **App name:** 1ndirim
- **Short description (80 karakter):**
  ```
  Tüm banka ve operatör kampanyalarını tek yerde görüntüleyin!
  ```
- **Full description:** (Aşağıdaki metni kullan)
- **App icon:** Upload et (512x512)
- **Feature graphic:** Upload et (1024x500)
- **Phone screenshots:** Upload et (2-8 adet)

**Full Description Metni:**
```
1ndirim ile tüm banka ve operatör kampanyalarını tek bir uygulamada görüntüleyin!

🎯 Özellikler:
• 20+ banka ve operatör kampanyaları
• Güncel kampanya bilgileri
• Kişiselleştirilmiş kaynak seçimi
• Kolay kullanım

💡 Nasıl Çalışır?
1ndirim, Türkiye'deki tüm önemli banka ve operatörlerin kampanyalarını toplar ve tek bir yerde sunar. İstediğiniz kaynakları seçerek sadece ilgilendiğiniz kampanyaları görüntüleyebilirsiniz.

🔒 Gizlilik
Kullanıcı verileriniz güvende. Detaylı gizlilik politikamızı inceleyebilirsiniz.

📱 Hemen İndirin ve En İyi Kampanyaları Keşfedin!
```

**Categorization:**
- **App category:** Finance
- **Tags:** kampanya, indirim, banka, operatör

**Contact details:**
- **Email:** support@birdir1.com
- **Website:** https://1indirim.birdir1.com
- **Privacy Policy:** https://1indirim.birdir1.com/privacy-policy

**✅ Kontrol:** Tüm bilgiler dolduruldu mu?

---

### 14. ADIM: Content Rating

**Yapılacaklar:**
1. Google Play Console > "Content rating" sekmesine git
2. Anketi doldur:
   - **Category:** Finance
   - **Does your app contain user-generated content?** No
   - **Does your app contain ads?** No
3. "Calculate rating" tıkla
4. Rating'i onayla

**✅ Kontrol:** Content rating tamamlandı mı?

---

### 15. ADIM: App Bundle Upload

**Yapılacaklar:**
1. Google Play Console > "Production" sekmesine git
2. "Create new release" tıkla
3. App Bundle'ı yükle (`app-release.aab`)
4. Release notes yaz:
   ```
   İlk sürüm yayınlandı!
   - Tüm banka ve operatör kampanyaları
   - Kişiselleştirilmiş kaynak seçimi
   - Kolay kullanım
   ```
5. "Review release" tıkla

**✅ Kontrol:** App Bundle upload edildi mi?

---

### 16. ADIM: Production Release

**Yapılacaklar:**
1. Google Play Console > "Production" sekmesine git
2. Tüm bilgileri kontrol et:
   - Store listing ✅
   - Content rating ✅
   - Privacy policy ✅
   - App icon ✅
   - Screenshots ✅
3. "Start rollout to Production" tıkla
4. Review sürecini bekle

**✅ Kontrol:** Production release yapıldı mı?

**Bekleme Süresi:** Genellikle birkaç saat - 1 gün

---

## 🎯 İLK ADIM

**ŞİMDİ YAPMAN GEREKEN:**

### 1. Privacy Policy ve Terms of Use'u Web Sitesine Ekle

**Yapılacaklar:**
1. Backend'e static route ekle veya Nginx ile serve et
2. URL'ler hazır olmalı:
   - `https://1indirim.birdir1.com/privacy-policy`
   - `https://1indirim.birdir1.com/terms-of-use`

**Dosyalar:**
- `app/PRIVACY_POLICY.md` → Web sitesine ekle
- `app/TERMS_OF_USE.md` → Web sitesine ekle

**Nasıl Yapılır:**
- Backend'e static route ekle (Express.js)
- VEYA Nginx ile static dosya serve et
- VEYA Basit HTML sayfaları oluştur

**✅ Kontrol:** URL'ler çalışıyor mu?

---

## 📝 CHECKLIST

### Ön Hazırlık
- [ ] Privacy Policy ve Terms of Use web sitesine eklendi
- [ ] App icon hazırlandı (1024x1024 iOS, 512x512 Android)
- [ ] Screenshots hazırlandı (3-10 iOS, 2-8 Android)

### Apple App Store
- [ ] Apple Developer Program kaydı ($99/yıl)
- [ ] Bundle ID oluşturuldu (`com.birdir1.1ndirim`)
- [ ] App Store Connect'te app oluşturuldu
- [ ] Xcode projesi yapılandırıldı
- [ ] iOS build oluşturuldu ve upload edildi
- [ ] App Store listing dolduruldu
- [ ] App Store review'a gönderildi

### Google Play Store
- [ ] Google Play Developer hesabı ($25)
- [ ] App Bundle oluşturuldu
- [ ] Google Play Console setup tamamlandı
- [ ] Content rating tamamlandı
- [ ] App Bundle upload edildi
- [ ] Production release yapıldı

---

## 🚀 BAŞLANGIÇ

**İlk Adım:** Privacy Policy ve Terms of Use'u web sitesine ekle!

Sonraki adımlar için `STORE-DEPLOY-ADIM-ADIM.md` dosyasını takip et. Her adımı tamamladıktan sonra ✅ işaretini koy.

**Soruların olursa:** support@birdir1.com

---

**Not:** Bu rehber genel bir kılavuzdur. Apple ve Google'ın güncel gereksinimlerini kontrol etmeyi unutma!
