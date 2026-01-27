# Backend Deploy Rehberi

Bu rehber, backend API'yi sunucuda deploy etmek için adım adım talimatlar içerir.

---

## 📋 Ön Gereksinimler

- ✅ Sunucuya SSH erişimi (`ssh root@37.140.242.105`)
- ✅ PM2 kurulu (`npm install -g pm2`)
- ✅ PostgreSQL çalışıyor ve `.env` dosyasında doğru DB bilgileri var

---

## 📋 Adım 1: Sunucuya Bağlan

```bash
ssh root@37.140.242.105
```

---

## 📋 Adım 2: Backend Dizinine Git

```bash
cd /var/www/1indirim-api
```

---

## 📋 Adım 3: Repository'yi Güncelle

```bash
git pull origin main
```

**Not:** Eğer git pull hata verirse (değişiklikler commit edilmemiş olabilir), önce local'de commit et:

```bash
# Local'de (Mac'te)
cd /Users/shadow/birdir1/1ndirim/backend
git add .
git commit -m "Fix: campaigns/all endpoint error handling"
git push origin main
```

---

## 📋 Adım 4: Bağımlılıkları Güncelle (Gerekirse)

```bash
npm install
```

---

## 📋 Adım 5: PM2 ile Restart Et

```bash
pm2 restart 1indirim-api
```

**Alternatif:** Eğer restart çalışmazsa:

```bash
pm2 stop 1indirim-api
pm2 start npm --name "1indirim-api" -- start
pm2 save
```

---

## 📋 Adım 6: Logları Kontrol Et

```bash
pm2 logs 1indirim-api --lines 50
```

Şu mesajları görmelisin:
- `✅ PostgreSQL bağlantısı başarılı`
- `🚀 1ndirim Backend API çalışıyor: http://localhost:3001`

Eğer hata varsa, loglarda "Campaigns/all list error" veya "Campaigns/all stack" satırlarını ara.

---

## 📋 Adım 7: Health Check

```bash
curl https://api.1indirim.birdir1.com/api/health
```

Şu yanıtı görmelisin:
```json
{"success":true,"status":"healthy","database":"connected"}
```

---

## 📋 Adım 8: Test Endpoint

```bash
curl "https://api.1indirim.birdir1.com/api/campaigns/all"
```

200 status code ve kampanya listesi görmelisin (boş liste de olabilir).

---

## ✅ Tamamlandı!

Artık:
- ✅ Backend güncellendi
- ✅ Hata loglama aktif
- ✅ Source filter hatası durumunda fallback aktif

---

## 🆘 Sorun Giderme

### Hata: "Cannot find module"
**Çözüm:** `npm install` çalıştır.

### Hata: "Port 3001 already in use"
**Çözüm:** PM2 zaten çalışıyor olabilir, `pm2 list` ile kontrol et.

### Hata: "PostgreSQL bağlantı hatası"
**Çözüm:** `.env` dosyasındaki DB bilgilerini kontrol et:
```bash
cd /var/www/1indirim-api
cat .env | grep DB_
```

### API hala 500 hatası veriyor
**Çözüm:** 
1. PM2 loglarını kontrol et: `pm2 logs 1indirim-api --lines 100`
2. "Campaigns/all list error" veya "Campaigns/all stack" satırlarını ara
3. Hata mesajını ve stack trace'i kaydet

---

**Hazırlayan:** Teknik Destek  
**Tarih:** 27 Ocak 2026
