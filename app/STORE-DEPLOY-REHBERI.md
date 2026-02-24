# 1ndirim App Store Deploy Rehberi

**Tarih:** 27 Ocak 2026  
**Hazırlayan:** Teknik Değerlendirme

---

## 📋 GENEL BAKIŞ

Bu rehber, 1ndirim Flutter uygulamasını App Store (iOS) ve Google Play Store (Android) üzerinden yayınlamak için gereken tüm adımları içerir.

---

## 🍎 APPLE APP STORE DEPLOY

### 1. Apple Developer Program Kaydı

**Gereksinimler:**
- Apple ID hesabı
- $99/yıl ücret (yıllık yenileme)
- Geçerli kredi kartı

**Adımlar:**
1. [developer.apple.com](https://developer.apple.com) adresine git
2. "Enroll" butonuna tıkla
3. Apple ID ile giriş yap
4. Kişisel veya şirket bilgilerini gir
5. Ödeme yap ($99/yıl)
6. Onay bekle (genellikle 24-48 saat)

### 2. App Store Connect Setup

1. [appstoreconnect.apple.com](https://appstoreconnect.apple.com) adresine git
2. "My Apps" > "+" > "New App" tıkla
3. Bilgileri gir:
   - **Platform:** iOS
   - **Name:** 1ndirim
   - **Primary Language:** Turkish
   - **Bundle ID:** com.birdir1.1ndirim (önce oluşturmalısın)
   - **SKU:** 1ndirim-ios-001
   - **User Access:** Full Access

### 3. Bundle ID Oluşturma

1. [developer.apple.com/account/resources/identifiers/list](https://developer.apple.com/account/resources/identifiers/list) adresine git
2. "+" butonuna tıkla
3. "App IDs" seç
4. "App" seç ve Continue
5. Bilgileri gir:
   - **Description:** 1ndirim iOS App
   - **Bundle ID:** com.birdir1.1ndirim
   - **Capabilities:** Push Notifications (isteğe bağlı)
6. Register

### 4. Xcode Projesi Yapılandırma

```bash
cd app/ios
open Runner.xcworkspace
```

**Xcode'da yapılacaklar:**
1. Runner projesini seç
2. "Signing & Capabilities" sekmesine git
3. "Automatically manage signing" işaretle
4. Team'i seç (Apple Developer Program hesabın)
5. Bundle Identifier'ı `com.birdir1.1ndirim` olarak ayarla
6. "Build Settings" > "Version" ve "Build" numaralarını kontrol et

### 5. App Icon Hazırlama

**Gereksinimler:**
- 1024x1024 px PNG formatında
- Transparan arka plan olmamalı
- Köşeler yuvarlatılmamalı (Apple otomatik yuvarlatır)

**Konum:** `app/ios/Runner/Assets.xcassets/AppIcon.appiconset/`

**Gerekli boyutlar:**
- 20x20 (@2x, @3x)
- 29x29 (@2x, @3x)
- 40x40 (@2x, @3x)
- 60x60 (@2x, @3x)
- 1024x1024 (App Store)

**Tool:** [appicon.co](https://appicon.co) veya [icon.kitchen](https://icon.kitchen) kullanabilirsin

### 6. Screenshots Hazırlama

**Gereksinimler:**
- En az 3, en fazla 10 screenshot
- Farklı iPhone boyutları için:
  - iPhone 6.7" (iPhone 14 Pro Max): 1290x2796 px
  - iPhone 6.5" (iPhone 11 Pro Max): 1242x2688 px
  - iPhone 5.5" (iPhone 8 Plus): 1242x2208 px

**Önerilen ekranlar:**
1. Ana ekran (kampanya listesi)
2. Kampanya detay ekranı
3. Kaynak seçim ekranı
4. Profil ekranı

### 7. Privacy Policy ve Terms of Use

**Privacy Policy:**
- URL: `https://1ndirim.birdir1.com/privacy-policy`
- Dosya: `app/PRIVACY_POLICY.md` (bu rehberle birlikte hazırlanacak)

**Terms of Use:**
- URL: `https://1ndirim.birdir1.com/terms-of-use`
- Dosya: `app/TERMS_OF_USE.md` (bu rehberle birlikte hazırlanacak)

### 8. App Store Listing Metinleri

**App Name:** 1ndirim  
**Subtitle:** Tüm kampanyalar tek yerde  
**Description (Türkçe):**

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

**Keywords:** kampanya,indirim,banka,operatör,kredi,kartı,ödeme,teklif,avantaj

**Support URL:** `https://1ndirim.birdir1.com/support`  
**Marketing URL:** `https://1ndirim.birdir1.com`

### 9. Build ve Upload

```bash
cd app
flutter clean
flutter pub get
flutter build ios --release
```

**Xcode ile upload:**
1. Xcode'da Product > Archive
2. Archive tamamlandığında "Distribute App" tıkla
3. "App Store Connect" seç
4. "Upload" seç
5. Signing seçeneklerini onayla
6. Upload'ı başlat

**Alternatif (Command Line):**
```bash
cd app/ios
fastlane build_and_upload
```

### 10. App Store Connect'te Test ve Yayınlama

1. App Store Connect > My Apps > 1ndirim
2. "TestFlight" sekmesine git
3. Build'i seç ve "Submit for Review" tıkla
4. "App Store" sekmesine git
5. Tüm bilgileri kontrol et:
   - Screenshots
   - Description
   - Privacy Policy URL
   - Support URL
   - App Icon
6. "Submit for Review" tıkla
7. Review süreci (genellikle 1-3 gün)

---

## 🤖 GOOGLE PLAY STORE DEPLOY

### 1. Google Play Developer Hesabı

**Gereksinimler:**
- Google hesabı
- $25 tek seferlik ücret
- Geçerli kredi kartı

**Adımlar:**
1. [play.google.com/console](https://play.google.com/console) adresine git
2. "Create app" tıkla
3. Bilgileri gir:
   - **App name:** 1ndirim
   - **Default language:** Turkish (Turkey)
   - **App or game:** App
   - **Free or paid:** Free
4. "Create app" tıkla
5. Ödeme yap ($25)

### 2. App Bundle Oluşturma

```bash
cd app
flutter clean
flutter pub get
flutter build appbundle --release
```

**Çıktı:** `app/build/app/outputs/bundle/release/app-release.aab`

### 3. App Icon Hazırlama

**Gereksinimler:**
- 512x512 px PNG formatında
- Transparan arka plan olmamalı

**Konum:** `app/android/app/src/main/res/mipmap-xxxhdpi/ic_launcher.png`

**Tool:** [appicon.co](https://appicon.co) kullanabilirsin

### 4. Screenshots Hazırlama

**Gereksinimler:**
- En az 2, en fazla 8 screenshot
- Telefon: En az 320px, en fazla 3840px yükseklik
- Tablet (isteğe bağlı): En az 320px, en fazla 3840px yükseklik

**Önerilen boyutlar:**
- Telefon: 1080x1920 px (9:16)
- Tablet: 1200x1920 px (5:8)

### 5. Privacy Policy ve Terms of Use

**Privacy Policy:**
- URL: `https://1ndirim.birdir1.com/privacy-policy`
- Google Play Console'da "Store presence" > "Privacy policy" bölümüne ekle

**Terms of Use:**
- URL: `https://1ndirim.birdir1.com/terms-of-use`

### 6. Google Play Listing Metinleri

**App Name:** 1ndirim  
**Short description (80 karakter):**
```
Tüm banka ve operatör kampanyalarını tek yerde görüntüleyin!
```

**Full description:**

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

**App category:** Finance  
**Tags:** kampanya, indirim, banka, operatör

### 7. Content Rating

1. Google Play Console > "Content rating" sekmesine git
2. Anketi doldur:
   - **Category:** Finance
   - **Does your app contain user-generated content?** No
   - **Does your app contain ads?** No (veya Yes, eğer reklam varsa)
3. "Calculate rating" tıkla
4. Rating'i onayla

### 8. Upload ve Yayınlama

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
6. Tüm bilgileri kontrol et:
   - Store listing
   - Content rating
   - Privacy policy
   - App icon
   - Screenshots
7. "Start rollout to Production" tıkla
8. Review süreci (genellikle birkaç saat - 1 gün)

---

## 📄 GEREKLİ DÖKÜMANLAR

### Privacy Policy
Dosya: `app/PRIVACY_POLICY.md` (hazırlanacak)

### Terms of Use
Dosya: `app/TERMS_OF_USE.md` (hazırlanacak)

---

## ✅ CHECKLIST

### Apple App Store
- [ ] Apple Developer Program kaydı ($99/yıl)
- [ ] Bundle ID oluşturuldu
- [ ] Xcode projesi yapılandırıldı
- [ ] App icon hazırlandı (1024x1024)
- [ ] Screenshots hazırlandı (3-10 adet)
- [ ] Privacy Policy hazırlandı ve yayınlandı
- [ ] Terms of Use hazırlandı ve yayınlandı
- [ ] App Store listing metinleri hazırlandı
- [ ] Build oluşturuldu ve upload edildi
- [ ] TestFlight testi yapıldı
- [ ] App Store review'a gönderildi

### Google Play Store
- [ ] Google Play Developer hesabı ($25)
- [ ] App Bundle oluşturuldu
- [ ] App icon hazırlandı (512x512)
- [ ] Screenshots hazırlandı (2-8 adet)
- [ ] Privacy Policy hazırlandı ve yayınlandı
- [ ] Terms of Use hazırlandı ve yayınlandı
- [ ] Google Play listing metinleri hazırlandı
- [ ] Content rating tamamlandı
- [ ] App Bundle upload edildi
- [ ] Production release yapıldı

---

## 🚀 SONRAKI ADIMLAR

1. Privacy Policy ve Terms of Use dokümanlarını hazırla
2. App icon ve screenshots'ları hazırla
3. Landing sayfasına Privacy Policy ve Terms of Use sayfalarını ekle
4. Apple Developer Program'a kaydol
5. Google Play Developer hesabı oluştur
6. Build'leri oluştur ve upload et
7. Review sürecini bekle
8. Yayınla! 🎉

---

**Not:** Bu rehber genel bir kılavuzdur. Apple ve Google'ın güncel gereksinimlerini kontrol etmeyi unutma!
