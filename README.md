# 1ndirim - Akıllı İndirim Asistanı

Türkiye'deki banka, operatör ve dijital cüzdan kampanyalarını tek bir platformda toplayan akıllı indirim asistanı uygulaması.

## 📊 Proje Durumu

**Genel Puan: 65/100** ⚠️

MVP aşamasında, temel özellikler çalışıyor. Production için kritik eksiklikler mevcut.

## 📱 Platform

- **Mobile:** Flutter (iOS & Android)
- **Backend:** Node.js + Express + PostgreSQL
- **Auth:** Firebase Authentication
- **Notifications:** Firebase Cloud Messaging
- **API:** https://api.1indirim.birdir1.com

## 📋 Dokümantasyon

### Ana Rapor
- **[KAPSAMLI_UYGULAMA_RAPORU.md](./KAPSAMLI_UYGULAMA_RAPORU.md)** - Detaylı analiz ve değerlendirme

### Kurulum Kılavuzları
- [FIREBASE-KURULUM.md](./FIREBASE-KURULUM.md) - Firebase kurulum adımları
- [FAVORI-SISTEMI-KURULUM.md](./FAVORI-SISTEMI-KURULUM.md) - Favori sistemi kurulumu
- [SUNUCU-KURULUM-ADIM-ADIM.md](./SUNUCU-KURULUM-ADIM-ADIM.md) - Backend kurulum
- [SUNUCU-FIREBASE-KURULUM.md](./SUNUCU-FIREBASE-KURULUM.md) - Firebase backend entegrasyonu

### Sorun Giderme
- [KAMPANYA-EKSIKLIGI-COZUMU.md](./KAMPANYA-EKSIKLIGI-COZUMU.md) - Kampanya eksikliği çözümü
- [UI-ISYILEŞTIRME-PLANI.md](./UI-ISYILEŞTIRME-PLANI.md) - UI iyileştirme planı

## 🚀 Hızlı Başlangıç

### Mobile App

```bash
cd app
flutter pub get
flutter run
```

### Backend

```bash
cd backend
npm install
npm run dev
```

## 🎯 Öncelikli Yapılacaklar

### 🔴 FAZ 1: Kritik (1-2 Hafta)
- [ ] Firebase Crashlytics
- [ ] Firebase Analytics
- [ ] API Key güvenliği
- [ ] Rate limiting
- [ ] Database backup
- [ ] Minimum test coverage

### 🟡 FAZ 2: Önemli (2-3 Hafta)
- [ ] Blog backend entegrasyonu
- [ ] Price tracking
- [ ] Premium üyelik
- [ ] Redis cache
- [ ] Database optimization

Detaylı roadmap için [KAPSAMLI_UYGULAMA_RAPORU.md](./KAPSAMLI_UYGULAMA_RAPORU.md) dosyasına bakın.

## 📊 Özellikler

### ✅ Tamamlanmış
- Firebase Auth (Google, Apple Sign-In)
- Kampanya listesi ve detayları
- Favori sistemi
- Kampanya karşılaştırma
- Discovery ekranı
- Push notifications
- Backend API

### ⚠️ Eksik
- Crash reporting
- Analytics
- Test coverage
- Blog sistemi
- Price tracking
- Premium üyelik
- Referral system

## 💰 Maliyet

- **Tamamlanan:** ~$16,000 (320 saat)
- **Kalan (Production-ready):** ~$13,600 (272 saat)
- **Operasyonel:** $36/ay (MVP), $226/ay (10K kullanıcı)

## 📞 İletişim

- GitHub: [birdir1/1ndirim](https://github.com/birdir1/1ndirim)
- API: https://api.1indirim.birdir1.com

## 📄 Lisans

Private - All rights reserved
