# Build Komutları — Store Deploy İçin

**Tarih:** 27 Ocak 2026

---

## 🍎 iOS BUILD KOMUTLARI

### 1. Flutter Clean ve Build

```bash
cd app
flutter clean
flutter pub get
flutter build ios --release
```

### 2. Xcode'da Archive Oluşturma

```bash
cd app/ios
open Runner.xcworkspace
```

**Xcode'da:**
1. Product > Archive
2. Archive tamamlandığında "Distribute App" tıkla
3. "App Store Connect" seç
4. "Upload" seç
5. Signing seçeneklerini onayla
6. Upload'ı başlat

### 3. Bundle ID Kontrolü

**Xcode'da kontrol et:**
- Runner projesi > Signing & Capabilities
- Bundle Identifier: `com.birdir1.1ndirim`
- Team: Apple Developer Program hesabın

---

## 🤖 ANDROID BUILD KOMUTLARI

### 1. Flutter Clean ve Build

```bash
cd app
flutter clean
flutter pub get
flutter build appbundle --release
```

**Çıktı:** `app/build/app/outputs/bundle/release/app-release.aab`

### 2. APK Oluşturma (Test İçin)

```bash
cd app
flutter build apk --release
```

**Çıktı:** `app/build/app/outputs/flutter-apk/app-release.apk`

### 3. Package Name Kontrolü

**AndroidManifest.xml'de kontrol et:**
- Package name: `com.birdir1.1ndirim` olmalı

---

## ✅ BUILD ÖNCESİ KONTROLLER

### iOS
- [ ] Bundle ID: `com.birdir1.1ndirim`
- [ ] Version: 1.0.0
- [ ] Build: 1
- [ ] App icon hazır
- [ ] Signing ayarları doğru

### Android
- [ ] Package name: `com.birdir1.1ndirim`
- [ ] Version name: 1.0.0
- [ ] Version code: 1
- [ ] App icon hazır
- [ ] Signing key hazır (production için)

---

## 🚀 HIZLI BAŞLANGIÇ

**iOS için:**
```bash
cd app
flutter clean && flutter pub get && flutter build ios --release
# Sonra Xcode'da Archive
```

**Android için:**
```bash
cd app
flutter clean && flutter pub get && flutter build appbundle --release
# Sonra Google Play Console'a upload
```
