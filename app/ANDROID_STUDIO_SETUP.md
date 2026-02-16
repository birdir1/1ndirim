# Android Studio Setup (Android + iOS)

## 1) Prerequisites
- Android Studio (latest stable)
- Xcode + CocoaPods (for iOS)
- Flutter SDK in PATH

## 2) Open Project
1. Android Studio -> Open
2. Select: `app/` (Flutter project root)
3. Wait for Gradle and Dart indexing to finish

## 3) Firebase Files
- iOS file exists: `ios/GoogleService-Info.plist`
- Android requires: `android/app/google-services.json`
  - Use Firebase Console -> Add Android app -> download `google-services.json`
  - Put it into `android/app/google-services.json`

## 4) Run (Debug)
```bash
cd app
flutter pub get
cd ios && pod install && cd ..
flutter run
```

## 5) Android Release Signing (Play Store)
1. Create keystore:
```bash
mkdir -p keystores
keytool -genkey -v -keystore keystores/upload-keystore.jks -keyalg RSA -keysize 2048 -validity 10000 -alias upload
```
2. Copy `android/key.properties.example` -> `android/key.properties`
3. Fill real passwords and keystore path in `android/key.properties`

## 6) Build Outputs
Android APK:
```bash
flutter build apk --release
```
Android AAB (Play Store):
```bash
flutter build appbundle --release
```
iOS:
```bash
flutter build ios --release
```

## 7) Common Issues
- `google-services.json is missing`: add Android Firebase config file.
- `aps-environment` warning: enable Push Notifications capability and use a provisioning profile that includes push entitlement.
- First Gradle build can take several minutes due to dependency downloads.
