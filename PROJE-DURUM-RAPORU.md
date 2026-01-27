# 1ndirim Projesi — Kapsamlı Durum Raporu ve Değerlendirme

**Tarih:** 27 Ocak 2026  
**Hazırlayan:** Teknik Değerlendirme  
**Kapsam:** Proje durumu, eksikler, sonraki adımlar, kalite puanlaması

---

## 📊 EXECUTIVE SUMMARY

**Genel Durum:** ⚠️ **%75 TAMAMLANMIŞ** — Altyapı ve backend hazır, frontend temel seviyede, production'a yakın ama kritik eksikler var.

**Production Hazırlık:** **72/100** (SYSTEM-AUDIT-REPORT.md'den)

**Son Durum:** Sunucu kuruldu, domain bağlandı, backend deploy edildi, HTTPS aktif. Admin panel çalışıyor ama UI/UX geliştirilmeli. Flutter mobil app var ama store'a çıkmamış.

---

## 🎯 NE YAPILDI? (Tamamlananlar)

### ✅ Altyapı (100% Tamamlandı)

1. **Sunucu Kurulumu**
   - ✅ Ubuntu 22.04 LTS kurulu
   - ✅ Nginx reverse proxy yapılandırıldı
   - ✅ Node.js 20.20.0 kurulu
   - ✅ PostgreSQL 14 kurulu ve çalışıyor
   - ✅ PM2 ile process yönetimi aktif
   - ✅ Firewall (UFW) aktif
   - ✅ SSL/HTTPS (Let's Encrypt) aktif

2. **Domain ve DNS**
   - ✅ `birdir1.com` alındı (Natro)
   - ✅ DNS A kayıtları ayarlandı (`@` ve `*` → `37.140.242.105`)
   - ✅ Wildcard subdomain desteği aktif
   - ✅ SSL sertifikaları 3 domain için alındı

3. **Deploy**
   - ✅ Backend API deploy edildi (`https://api.1indirim.birdir1.com`)
   - ✅ Health check çalışıyor
   - ✅ Veritabanı bağlantısı aktif

---

### ✅ Backend (95% Tamamlandı)

**Güçlü Yanlar:**

1. **Mimari**
   - ✅ Express.js tabanlı, modüler yapı
   - ✅ Admin ve public API'ler ayrılmış
   - ✅ Middleware katmanı (auth, quality filter, safety guards)
   - ✅ Service layer pattern (adminCampaignService, adminDashboardService, vb.)
   - ✅ Audit logging sistemi (immutable logs)

2. **Güvenlik ve Kontrol**
   - ✅ Role-based access control (super_admin, editor, viewer)
   - ✅ Admin authentication (email-based production, API key dev)
   - ✅ Main feed guard (SQL + runtime validation)
   - ✅ Safety guards (7 assertion function)
   - ✅ Campaign quality filter (FAZ 6)
   - ✅ Source status management (active, backlog, hard_backlog)

3. **Özellikler**
   - ✅ Campaign management (CRUD, hide/show, type assignment)
   - ✅ Source management (status, reason tracking)
   - ✅ Admin suggestions (bot önerileri, confidence scoring)
   - ✅ Governance timeline (tüm admin actions'ın zaman çizelgesi)
   - ✅ Campaign explainability (neden main feed'de değil açıklaması)
   - ✅ Dashboard metrics (suggestions, executions, overrides)
   - ✅ Cron job (expired campaigns deactivation)

4. **Veritabanı**
   - ✅ Migration sistemi (15+ migration dosyası)
   - ✅ Core schema (campaigns, sources, source_segments)
   - ✅ Admin schema (admin_users, admin_audit_logs, admin_suggestions)
   - ✅ Tracking (campaign_clicks)
   - ✅ ENUMs (campaign_type, value_level, admin_role, source_status)
   - ✅ Indexes ve triggers

**Eksikler:**
   - ⚠️ Migration'ların sırası tam dokümante değil
   - ⚠️ Bazı migration'lar idempotent değil (re-run riski)

---

### ✅ Admin Panel (70% Tamamlandı)

**Mevcut Özellikler:**

1. **Sayfalar**
   - ✅ Login (`/login`) — Email + API key ile giriş
   - ✅ Sources (`/sources`) — Kaynak listesi, status değiştirme
   - ✅ Campaigns (`/campaigns`) — Kampanya listesi, hide/show, type assignment
   - ✅ Suggestions (`/suggestions`) — Bot önerileri, state filtreleme
   - ✅ Governance Timeline (`/governance/timeline`) — Tüm admin actions zaman çizelgesi
   - ✅ Suggestion Detail (`/suggestions/[id]`) — Öneri detayı ve context

2. **Teknik Yapı**
   - ✅ Next.js 14 (App Router)
   - ✅ TypeScript
   - ✅ Tailwind CSS
   - ✅ Client-side auth (localStorage)
   - ✅ API client (`lib/api.ts`)

**Eksikler:**
   - ✅ Dashboard/ana sayfa eklendi (27 Ocak 2026)
   - ✅ Filtreleme/arama eklendi (27 Ocak 2026) — Campaigns ve Sources sayfalarında
   - ✅ Pagination iyileştirildi (27 Ocak 2026) — Sayfa numarası, ilk/önceki/sonraki/son butonları
   - ❌ UI/UX çok basit (tablo + modal, modern tasarım yok)
   - ❌ Responsive tasarım eksik
   - ❌ Loading states minimal
   - ❌ Error handling görsel olarak zayıf
   - ❌ Export/import yok

---

### ✅ Bot Service (85% Tamamlandı)

**Mevcut Özellikler:**

1. **Scrapers**
   - ✅ 20+ banka/kurum scraper'ı (Akbank, Garanti, İş Bankası, Ziraat, vb.)
   - ✅ Puppeteer-based scrapers (klasik web siteleri)
   - ✅ Fetch-based scrapers (SPA kaynaklar: TEB, Halkbank, VakıfBank)
   - ✅ Modular yapı (her scraper ayrı class)

2. **Kalite ve Güvenilirlik**
   - ✅ Quality filter integration
   - ✅ Confidence scoring
   - ✅ Source trust score
   - ✅ Failure classification
   - ✅ Retry logic
   - ✅ Rate limiting

3. **Admin Entegrasyonu**
   - ✅ Source status check (hard_backlog skip, backlog warning)
   - ✅ Admin suggestions generation
   - ✅ Run-level logging

**Eksikler:**
   - ⚠️ Bot henüz production'da çalışmıyor (deploy edilmemiş)
   - ⚠️ Bazı scrapers pasif (Halkbank, VakıfBank backlog'ta)
   - ⚠️ Monitoring/alerting yok

---

### ✅ Flutter Mobil App (80% Tamamlandı)

**Mevcut Özellikler:**

1. **Ekranlar**
   - ✅ Splash screen
   - ✅ Onboarding (4 sayfa: value prop, trust, selection, aggregation)
   - ✅ Login screen
   - ✅ Home screen (kampanya listesi)
   - ✅ Campaign detail screen
   - ✅ Profile screen
   - ✅ Settings screens (KVKK, privacy, terms)
   - ✅ Source selection/edit screens

2. **Tasarım**
   - ✅ Material 3
   - ✅ Tutarlı renk paleti (mavi tonları, beyaz arka plan)
   - ✅ Custom theme (AppTheme, AppColors, AppTextStyles)
   - ✅ Responsive layout

3. **Fonksiyonellik**
   - ✅ API entegrasyonu (campaigns, sources)
   - ✅ Source selection (kullanıcı kaynak seçebilir)
   - ✅ State management (Provider)
   - ✅ Firebase integration (hata toleranslı)

**Eksikler:**
   - ❌ App Store / Play Store'a çıkmamış
   - ❌ Push notification yok
   - ❌ Offline mode yok
   - ❌ Deep linking yok
   - ❌ Analytics yok
   - ⚠️ Discover ve Notifications ekranları comment'li (V2 için)

---

## ❌ NE EKSİK? (Kritik Gaps)

### 1. Admin Panel UI/UX İyileştirmesi (Yüksek Öncelik)

**Mevcut Durum:** Çalışıyor ama çok basit (tablo + modal).

**Yapılması Gerekenler:**
- Modern dashboard (grafikler, istatistikler, quick actions)
- Gelişmiş filtreleme (tarih aralığı, source, campaign type, vb.)
- Arama fonksiyonu
- Pagination iyileştirmesi (sayfa numarası, "X-Y of Z" gösterimi)
- Loading skeletons
- Toast notifications (başarı/hata mesajları)
- Responsive tasarım (mobil uyum)
- Dark mode desteği
- Export (CSV, JSON)
- Bulk operations (toplu işlemler)

**Etki:** Admin panel kullanımı zorlaşıyor, verimlilik düşüyor.

---

### 2. Bot Deploy (Orta Öncelik)

**Mevcut Durum:** Bot kodu var ama production'da çalışmıyor.

**Yapılması Gerekenler:**
- Bot'u Railway'de veya sunucuda ayrı servis olarak deploy et
- Cron job ayarları (her X dakikada çalıştır)
- Monitoring (log aggregation, alerting)
- Error tracking (Sentry veya benzeri)

**Etki:** Kampanyalar otomatik scrape edilmiyor, sistem manuel çalışıyor.

---

### 3. Migration'ları Çalıştırma (Yüksek Öncelik)

**Mevcut Durum:** Veritabanı boş (sadece `db_1indirim` oluşturuldu).

**Yapılması Gerekenler:**
- Migration'ları sırayla çalıştır (`backend/src/scripts/migrations/README.md`'ye göre)
- İlk admin user ekle (`admin_users` tablosuna)
- Test verisi ekle (isteğe bağlı)

**Etki:** Backend API çalışıyor ama tablolar yok, admin panel kullanılamaz.

---

### 4. Landing Sayfası (Düşük Öncelik)

**Mevcut Durum:** Geçici bir sayfa var ("1indirim landing (gecici)").

**Yapılması Gerekenler:**
- Gerçek landing sayfası tasarla (tanıtım, indirme linkleri)
- App Store / Play Store linkleri ekle
- SEO optimizasyonu

**Etki:** `1indirim.birdir1.com` profesyonel görünmüyor.

---

### 5. Monitoring ve Logging (Orta Öncelik)

**Mevcut Durum:** Sadece console.log ve PM2 logs var.

**Yapılması Gerekenler:**
- Log aggregation (Loki, ELK, veya basit file-based)
- Error tracking (Sentry)
- Uptime monitoring (UptimeRobot veya benzeri)
- Performance monitoring (APM)

**Etki:** Sorunları tespit etmek zor, production'da kör uçuyoruz.

---

### 6. Flutter App Store Deploy (Yüksek Öncelik)

**Mevcut Durum:** App hazır ama store'a çıkmamış.

**Yapılması Gerekenler:**
- Apple Developer Program ($99/yıl) veya Google Play Developer ($25 tek seferlik)
- App Store Connect / Play Console setup
- Privacy policy, terms of use hazırla
- App icon, screenshots hazırla
- Store listing yaz
- TestFlight / Internal testing
- Production release

**Etki:** Kullanıcılar uygulamayı indiremez, para kazanamazsın.

---

## 📋 SONRAKI ADIMLAR (Öncelik Sırasıyla)

### Faz 1: Kritik Eksikler (1-2 Hafta)

1. **Migration'ları çalıştır**
   ```bash
   cd /var/www/1indirim-api/backend
   # Migration'ları sırayla çalıştır (README.md'ye göre)
   ```

2. **İlk admin user ekle**
   ```sql
   INSERT INTO admin_users (email, role) VALUES ('senin@email.com', 'super_admin');
   ```

3. **Admin panel'i deploy et**
   - Admin panel'i build et (`npm run build`)
   - Sunucuya kopyala
   - PM2 ile çalıştır veya static export kullan
   - Nginx'te `admin.1indirim.birdir1.com` yapılandırmasını kontrol et

4. **Bot'u deploy et**
   - Bot'u Railway'de veya sunucuda ayrı servis olarak çalıştır
   - Cron job ayarla (her 30 dakikada bir scrape)

---

### Faz 2: UI/UX İyileştirmeleri (2-3 Hafta)

1. **Admin panel dashboard**
   - Grafikler (Chart.js veya Recharts)
   - İstatistik kartları
   - Quick actions

2. **Admin panel filtreleme/arama**
   - Tarih aralığı picker
   - Source dropdown
   - Campaign type filter
   - Arama input

3. **Admin panel responsive**
   - Mobil uyum
   - Tablet uyum

4. **Loading/error states**
   - Skeleton loaders
   - Toast notifications
   - Error boundaries

---

### Faz 3: Production Hazırlık (1-2 Hafta)

1. **Monitoring**
   - Log aggregation
   - Error tracking (Sentry)
   - Uptime monitoring

2. **Landing sayfası**
   - Profesyonel tasarım
   - App Store linkleri
   - SEO

3. **Flutter app store deploy**
   - Apple Developer Program
   - Google Play Developer
   - Store listing
   - Release

---

## 🎨 KALİTE DEĞERLENDİRMESİ (0-10 Puan)

### 1. UI/UX (Frontend Tasarım) — **5/10**

**Güçlü Yanlar:**
- ✅ Flutter app tutarlı renk paleti (mavi tonları)
- ✅ Material 3 kullanımı
- ✅ Admin panel çalışıyor

**Zayıf Yanlar:**
- ❌ Admin panel çok basit (tablo + modal, modern değil)
- ❌ Responsive değil
- ❌ Loading/error states minimal
- ❌ Dashboard yok
- ❌ Grafik/istatistik görselleştirme yok

**İyileştirme Potansiyeli:** Yüksek. Admin panel'e modern UI kütüphanesi (shadcn/ui, Ant Design) eklenebilir, dashboard eklenebilir.

---

### 2. Backend Mimari — **9/10**

**Güçlü Yanlar:**
- ✅ Modüler yapı (routes, services, middleware ayrımı)
- ✅ Güvenlik katmanları (auth, guards, assertions)
- ✅ Audit logging (immutable, tam izlenebilirlik)
- ✅ Quality filter sistemi
- ✅ Admin control layer (FAZ 10)
- ✅ Governance timeline
- ✅ Campaign explainability

**Zayıf Yanlar:**
- ⚠️ Migration sırası tam dokümante değil
- ⚠️ Bazı migration'lar idempotent değil

**Not:** Backend mimarisi çok güçlü, production-ready seviyede.

---

### 3. Kullanış (İşlevsellik) — **7/10**

**Güçlü Yanlar:**
- ✅ Admin panel temel işlevleri yapıyor (sources, campaigns, suggestions)
- ✅ Backend API'ler tam fonksiyonel
- ✅ Flutter app temel akışları çalışıyor

**Zayıf Yanlar:**
- ❌ Admin panel'de filtreleme/arama yok
- ❌ Bulk operations yok
- ❌ Export yok
- ❌ Dashboard/metrics görselleştirme yok
- ❌ Bot production'da çalışmıyor

**İyileştirme Potansiyeli:** Orta. Temel işlevler var, gelişmiş özellikler eklenebilir.

---

### 4. Tasarım Tutarlılığı — **6/10**

**Güçlü Yanlar:**
- ✅ Flutter app tutarlı (renk paleti, typography, spacing)
- ✅ Admin panel basit ama tutarlı (Tailwind CSS)

**Zayıf Yanlar:**
- ❌ Admin panel ve Flutter app arasında tasarım tutarsızlığı (farklı stiller)
- ❌ Landing sayfası yok (tutarlılık değerlendirilemez)
- ❌ Brand identity net değil (logo, renkler, tipografi standartları)

**İyileştirme Potansiyeli:** Yüksek. Design system oluşturulabilir, brand guidelines hazırlanabilir.

---

### 5. Tercih Edilme Potansiyeli — **6/10**

**Güçlü Yanlar:**
- ✅ Konsept iyi (indirimleri toplama, kaynak seçimi)
- ✅ Backend güvenilir (quality filter, safety guards)
- ✅ Flutter app modern görünüyor

**Zayıf Yanlar:**
- ❌ App Store'da yok (erişilebilirlik düşük)
- ❌ Landing sayfası yok (SEO/marketing yok)
- ❌ Kullanıcı sayısı bilinmiyor (henüz launch edilmemiş)
- ❌ Rekabet analizi yok (benzer uygulamalar var mı?)

**İyileştirme Potansiyeli:** Orta-Yüksek. Store'a çıkınca ve marketing yapınca potansiyel artar.

---

### 6. Para Kazandırma Potansiyeli — **4/10**

**Mevcut Durum:**
- ❌ Monetization modeli net değil
- ❌ Reklam entegrasyonu yok
- ❌ Premium subscription yok
- ❌ Affiliate link tracking var ama gelir modeli belirsiz

**Potansiyel Modeller:**
1. **Affiliate komisyonları** (kampanyalara tıklama → komisyon)
2. **Premium subscription** (daha fazla kaynak, özel kampanyalar)
3. **Reklamlar** (banner, native ads)
4. **B2B** (bankalara/kurumlara veri satışı)

**İyileştirme Potansiyeli:** Yüksek. Monetization modeli belirlenip implement edilmeli.

---

## 📈 GENEL PUANLAMA ÖZETİ

| Kriter | Puan | Açıklama |
|--------|------|----------|
| **UI/UX (Frontend)** | **5/10** | Admin panel basit, Flutter app iyi ama store'da yok |
| **Backend Mimari** | **9/10** | Çok güçlü, production-ready, güvenlik katmanları mükemmel |
| **Kullanış (İşlevsellik)** | **7/10** | Temel işlevler var, gelişmiş özellikler eksik |
| **Tasarım Tutarlılığı** | **6/10** | Flutter app tutarlı, admin panel farklı stil |
| **Tercih Edilme Potansiyeli** | **6/10** | Konsept iyi ama launch edilmemiş, rekabet analizi yok |
| **Para Kazandırma Potansiyeli** | **4/10** | Monetization modeli belirsiz, implement edilmemiş |
| **GENEL ORTALAMA** | **6.2/10** | ⚠️ **İYİ AMA EKSİKLER VAR** |

---

## 💡 ÖNERİLER VE FİKİRLER

### Kısa Vadeli (1 Ay)

1. **Migration'ları çalıştır + İlk admin ekle**
   - **Süre:** 1 gün
   - **Öncelik:** Kritik
   - **Etki:** Admin panel kullanılabilir hale gelir

2. **Admin panel'i deploy et**
   - **Süre:** 1 gün
   - **Öncelik:** Yüksek
   - **Etki:** Admin panel erişilebilir olur

3. **Bot'u deploy et**
   - **Süre:** 1-2 gün
   - **Öncelik:** Yüksek
   - **Etki:** Kampanyalar otomatik scrape edilir

4. **Admin panel dashboard ekle**
   - **Süre:** 3-5 gün
   - **Öncelik:** Orta
   - **Etki:** Admin panel daha kullanışlı olur

---

### Orta Vadeli (2-3 Ay)

1. **Flutter app'i store'a çıkar**
   - **Süre:** 2-3 hafta (Apple Developer + Google Play setup)
   - **Öncelik:** Yüksek
   - **Etki:** Kullanıcılar uygulamayı indirebilir

2. **Landing sayfası tasarla**
   - **Süre:** 1 hafta
   - **Öncelik:** Orta
   - **Etki:** Profesyonel görünüm, SEO

3. **Admin panel UI/UX iyileştir**
   - **Süre:** 2-3 hafta
   - **Öncelik:** Orta
   - **Etki:** Admin verimliliği artar

4. **Monitoring ekle**
   - **Süre:** 1 hafta
   - **Öncelik:** Orta
   - **Etki:** Sorunları erken tespit

---

### Uzun Vadeli (3-6 Ay)

1. **Monetization modeli belirle ve implement et**
   - **Süre:** 1-2 ay
   - **Öncelik:** Yüksek
   - **Etki:** Gelir akışı başlar

2. **Kullanıcı sayısını artır (marketing)**
   - **Süre:** Sürekli
   - **Öncelik:** Yüksek
   - **Etki:** Daha fazla kullanıcı = daha fazla gelir

3. **Rekabet analizi yap**
   - **Süre:** 1 hafta
   - **Öncelik:** Orta
   - **Etki:** Farklılaşma stratejisi belirlenir

---

## 🎯 SONUÇ VE TAVSİYELER

### Güçlü Yanlar

1. **Backend mimarisi mükemmel** — Production-ready, güvenli, ölçeklenebilir
2. **Altyapı hazır** — Sunucu, domain, SSL, deploy tamamlandı
3. **Flutter app modern** — Tutarlı tasarım, iyi UX
4. **Bot sistemi gelişmiş** — Quality filter, trust scoring, admin integration

### Zayıf Yanlar

1. **Admin panel UI/UX basit** — Çalışıyor ama modern değil
2. **Monetization belirsiz** — Para kazanma modeli net değil
3. **App store'da yok** — Kullanıcılar erişemiyor
4. **Migration'lar çalıştırılmamış** — Veritabanı boş

### En Kritik 3 Adım (Şimdi Yapılmalı)

1. **Migration'ları çalıştır + İlk admin ekle** (1 gün)
2. **Admin panel'i deploy et** (1 gün)
3. **Bot'u deploy et** (1-2 gün)

Bu 3 adım tamamlanınca sistem **%90 production-ready** olur.

---

### Para Kazandırma İçin Öneriler

1. **Affiliate modeli** — Kampanyalara tıklama → komisyon (en kolay)
2. **Premium subscription** — Daha fazla kaynak, özel kampanyalar
3. **B2B veri satışı** — Bankalara/kurumlara aggregated data

**En mantıklısı:** Affiliate + Premium hybrid model.

---

## 📝 CHECKLIST (Sırayla Yapılacaklar)

### ✅ Tamamlananlar (Bu Hafta - 27 Ocak 2026)

- [x] Migration'ları çalıştır ✅ (14 migration başarıyla çalıştırıldı)
- [x] İlk admin user ekle ✅ (umitgulcuk680@gmail.com, super_admin)
- [x] Admin panel'i build et ve deploy et ✅ (https://admin.1indirim.birdir1.com)
- [x] Bot'u deploy et ✅ (PM2 ile çalışıyor, her 30 dakikada bir)
- [x] Puppeteer bağımlılıkları kur ✅ (Tüm kütüphaneler kuruldu)
- [x] Kaynakları veritabanına ekle ✅ (24 kaynak eklendi)
- [x] **Admin panel dashboard ekle** ✅ (27 Ocak 2026) — İstatistikler, grafikler, quick actions eklendi

### Kısa Vadeli (1-2 Hafta) — YÜKSEK ÖNCELİK
- [x] **Admin panel filtreleme/arama ekle** ✅ (27 Ocak 2026) — Campaigns ve Sources sayfalarına filtreleme, arama ve pagination eklendi
- [ ] **Admin panel responsive tasarım** (3-5 gün) — Mobil uyum
- [ ] **Loading/error states iyileştir** (2-3 gün) — Skeleton loaders, toast notifications

### Orta Vadeli (1-2 Ay) — ÇOK YÜKSEK ÖNCELİK

- [ ] **Flutter app'i store'a çıkar** (2-3 hafta) — Apple Developer + Google Play
- [ ] **Monitoring ekle** (1 hafta) — Sentry, uptime monitoring
- [ ] **Landing sayfası tasarla** (1 hafta) — Profesyonel tasarım, SEO
- [ ] **Monetization modeli belirle ve implement et** (1-2 ay) — Affiliate + Premium

### Uzun Vadeli (3-6 Ay)

- [ ] Marketing stratejisi (kullanıcı kazanma)
- [ ] Rekabet analizi
- [ ] Ölçekleme planı (daha fazla kaynak, daha fazla kullanıcı)

---

---

## 🎯 SIRADAKİ İŞLEM (EN ÖNCELİKLİ)

### Admin Panel Filtreleme ve Arama Özellikleri

**Öncelik:** Yüksek  
**Süre:** 1 hafta (5-7 gün)  
**Etki:** Admin verimliliği artar, kampanya ve kaynak yönetimi kolaylaşır

**Yapılacaklar:**
1. **Campaigns sayfasına filtreleme ekle:**
   - Tarih aralığı filtresi (başlangıç-bitiş tarihi)
   - Source filtresi (dropdown ile kaynak seçimi)
   - Campaign type filtresi (main, light, category, low, hidden)
   - Status filtresi (active, inactive, expired)
   - Arama kutusu (başlık, açıklama içinde arama)
2. **Sources sayfasına filtreleme ekle:**
   - Source type filtresi (bank, operator)
   - Status filtresi (active, backlog, hard_backlog)
   - Arama kutusu (kaynak adı içinde arama)
3. **Suggestions sayfasına gelişmiş filtreleme:**
   - Confidence score filtresi (min-max slider)
   - Tarih filtresi
   - Action type filtresi
4. **Pagination iyileştirme:**
   - Sayfa numarası gösterimi
   - "İlk", "Önceki", "Sonraki", "Son" butonları
   - Sayfa başına kayıt sayısı seçimi
   - Kaynak bazlı kampanya dağılımı (pie chart)
   - Kampanya tipi dağılımı
4. Quick actions:
   - Yeni kampanya ekle (manuel)
   - Kaynak durumu değiştir
   - Toplu işlemler
5. Son eklenen kampanyalar listesi (widget)

**Başlangıç:** Hemen başlanabilir, admin panel zaten çalışıyor.

---

**Rapor Hazırlayan:** Teknik Değerlendirme  
**Tarih:** 27 Ocak 2026  
**Son Güncelleme:** Bot deploy ve kampanya ekleme sonrası (27 Ocak 2026, 13:30 UTC)
