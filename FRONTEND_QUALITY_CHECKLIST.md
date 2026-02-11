# Frontend Quality Checklist (10/10 Hedefi)

Bu dokuman "hizli puan" degil, tekrar edilebilir kalite kriteri olarak hazirlandi.

## 1) UI Tutarliligi
- [x] Ortak spacing/radius/surface tokenlari eklendi (`app_ui_tokens.dart`)
- [x] Ortak sayfa kabugu eklendi (`screen_shell.dart`)
- [x] Ortak kart/surface bileseni eklendi (`section_card.dart`)
- [x] Settings, Notifications, Compare, Community ekranlarinda ortak yapiya gecildi
- [x] How it works, Price tracking, Blog detail ekranlari ortak yapiya yaklastirildi
- [ ] Home, Discovery, Favorites, Profile icin kalan "magic number" spacingleri tamamen tokena tasima

## 2) Bilgi Mimarisi ve Navigasyon
- [x] Legal/language ekranlarinda tek tip app bar davranisi
- [x] Detay ekranlarinda geri donus deseninin standardizasyonu
- [ ] Tab kok ekranlarinda baslik/ust alan hiyerarsisini tek guideline ile sabitleme

## 3) Etkilesim ve Durumlar
- [x] Loading/error/empty durumlari bircok ana ekranda mevcut
- [x] Favorites ve listelerde yenileme (pull-to-refresh) davranisi mevcut
- [ ] Buton disabled/loading state gorunurlugunu tum formlarda standardize etme
- [ ] Snackbar/inline hata dili ve tonu icin tek standard metin seti

## 4) Performans
- [x] Tekrarlayan API cagrilarini azaltan duzeltmeler uygulandi (favorites/campaigns akisinda)
- [ ] Scroll agir ekranlarda rendering cost olcumu (profile mode + raster)
- [ ] Gorsel agir sayfalarda image cache/placeholder stratejisini tek standarda baglama

## 5) Erisilebilirlik
- [ ] Tum tappable alanlarda min 44x44 hedef kontrolu
- [ ] Semantics label/role taramasi (ozellikle ikon butonlari)
- [ ] Renk kontrast kontrolu (WCAG AA hedefi)
- [ ] Dynamic text scale testleri (1.0, 1.2, 1.4)

## 6) Lokalizasyon ve Metin Kalitesi
- [x] Cekirdek ekranlarda Turkce metinler tutarli
- [ ] Hard-coded stringlerin kademeli olarak `AppLocalizations` altina alinmasi
- [ ] Empty/error metinlerinin tek dil rehberiyle birlestirilmesi

## 7) Test ve Dogrulama
- [x] `flutter analyze` temiz
- [x] `flutter test` geciyor
- [ ] Kritik ekranlar icin golden/screenshot regression seti
- [ ] CI'da ekran goruntu diff kontrolu (opsiyonel ama onerilir)

## Puanlama Rubrigi (hedef)
- UI Tutarliligi: 25 puan
- UX Durumlari: 20 puan
- Performans: 15 puan
- Erisilebilirlik: 20 puan
- Lokalizasyon/Metin: 10 puan
- Test/CI: 10 puan

Toplam: 100 puan.
10/10 icin hedef: 95+ puan ve "kritik kalan madde yok".
