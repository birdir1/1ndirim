# Migration ve İlk Admin Ekleme Rehberi

Bu rehber, sunucuda migration'ları çalıştırıp ilk admin kullanıcısını eklemenizi sağlar.

---

## 📋 Adım 1: Sunucuya Bağlan

```bash
ssh root@37.140.242.105
```

Şifre sorulduğunda sunucu şifrenizi girin.

---

## 📋 Adım 2: Backend Dizinine Git

```bash
cd /var/www/1indirim-api/backend
```

---

## 📋 Adım 3: .env Dosyasını Kontrol Et

```bash
cat .env
```

Şu değişkenlerin olduğundan emin olun:
- `DB_HOST=localhost`
- `DB_PORT=5432`
- `DB_NAME=db_1indirim`
- `DB_USER=postgres`
- `DB_PASSWORD=051901Gs.`

Eğer `.env` dosyası yoksa veya eksikse, oluşturun:

```bash
nano .env
```

İçine şunu yazın:
```bash
NODE_ENV=production
PORT=3001
DB_HOST=localhost
DB_PORT=5432
DB_NAME=db_1indirim
DB_USER=postgres
DB_PASSWORD=051901Gs.
```

Kaydedip çıkın (`Ctrl+X`, `Y`, `Enter`).

---

## 📋 Adım 4: Migration'ları Çalıştır

Migration script'i hazır. Tek komutla tüm migration'ları çalıştırabilirsiniz:

```bash
node src/scripts/run-all-migrations.js
```

Bu komut:
1. Tüm migration'ları sırayla çalıştırır
2. Her birinin başarılı olup olmadığını kontrol eder
3. Hata olursa durur ve hata mesajını gösterir

**Beklenen çıktı:**
```
🚀 Migration'lar başlatılıyor...

📁 Migration dizini: /var/www/1indirim-api/backend/src/scripts/migrations

[1/14] Çalıştırılıyor: 000_init_core_schema.js
✅ 000_init_core_schema.js başarılı

[2/14] Çalıştırılıyor: add_admin_users.js
✅ add_admin_users.js başarılı

...

============================================================
✅ Toplam 14 migration başarıyla çalıştırıldı
============================================================
```

**Eğer hata alırsanız:**
- Hata mesajını okuyun
- Genellikle veritabanı bağlantı sorunu veya migration sırası hatası olabilir
- Hata mesajını bana gönderin, birlikte çözelim

---

## 📋 Adım 5: İlk Admin Kullanıcısını Ekle

Migration'lar başarıyla tamamlandıktan sonra, ilk admin kullanıcısını ekleyin:

```bash
node src/scripts/add-first-admin.js senin@email.com super_admin
```

**Örnek:**
```bash
node src/scripts/add-first-admin.js umitgulcuk680@gmail.com super_admin
```

**Beklenen çıktı:**
```
✅ Veritabanı bağlantısı başarılı

✅ Admin kullanıcısı başarıyla eklendi!

============================================================
📧 Email: umitgulcuk680@gmail.com
👤 Role: super_admin
🔑 API Key: abc123def456... (uzun bir string)
🆔 ID: 123e4567-e89b-12d3-a456-426614174000
📅 Oluşturulma: 2026-01-27 10:30:00
============================================================

⚠️ ÖNEMLİ: API Key'i güvenli bir yerde saklayın!
   Admin panel'e giriş yapmak için bu API Key'i kullanacaksınız.
```

**⚠️ ÖNEMLİ:** 
- API Key'i kopyalayın ve güvenli bir yerde saklayın
- Bu API Key'i admin panel'e giriş yaparken kullanacaksınız

---

## 📋 Adım 6: Doğrulama

Migration'ların başarıyla çalıştığını doğrulamak için:

```bash
psql -U postgres -d db_1indirim -c "\dt"
```

Bu komut tüm tabloları listeler. Şunları görmelisiniz:
- `sources`
- `source_segments`
- `campaigns`
- `admin_users`
- `admin_audit_logs`
- `admin_suggestions`
- `campaign_clicks`
- vb.

Admin kullanıcısını kontrol etmek için:

```bash
psql -U postgres -d db_1indirim -c "SELECT email, role FROM admin_users;"
```

Eklediğiniz email ve role'ü görmelisiniz.

---

## ✅ Tamamlandı!

Artık:
- ✅ Veritabanı tabloları hazır
- ✅ İlk admin kullanıcısı eklendi
- ✅ Admin panel'e giriş yapabilirsiniz

**Sonraki adım:** Admin panel'i deploy etmek.

---

## 🆘 Sorun Giderme

### Hata: "admin_users tablosu bulunamadı"
**Çözüm:** Migration'ları çalıştırın (Adım 4).

### Hata: "Email zaten mevcut"
**Çözüm:** Farklı bir email kullanın veya mevcut kullanıcıyı kullanın.

### Hata: "Veritabanı bağlantı hatası"
**Çözüm:** `.env` dosyasını kontrol edin, PostgreSQL'in çalıştığından emin olun:
```bash
systemctl status postgresql
```

### Hata: "Migration sırası hatası"
**Çözüm:** Migration'ları sırayla tek tek çalıştırın (README.md'deki sıraya göre).

---

**Hazırlayan:** Teknik Destek  
**Tarih:** 27 Ocak 2026
