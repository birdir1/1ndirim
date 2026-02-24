# Admin Panel Deploy Rehberi

Bu rehber, admin panel'i sunucuda deploy etmek için adım adım talimatlar içerir.

---

## 📋 Ön Gereksinimler

- ✅ Migration'lar çalıştırıldı
- ✅ İlk admin kullanıcısı eklendi
- ✅ Backend API çalışıyor (`https://api.1ndirim.birdir1.com`)

---

## 📋 Adım 1: Sunucuya Bağlan

```bash
ssh <deploy-user>@<server-host>
```

---

## 📋 Adım 2: Admin Panel Dizini Oluştur

```bash
mkdir -p /var/www/1indirim-admin
cd /var/www/1indirim-admin
```

---

## 📋 Adım 3: Repository'yi Clone Et

```bash
git clone https://github.com/birdir1/1ndirim.git .
cd admin-panel
```

---

## 📋 Adım 4: Node.js Bağımlılıklarını Yükle

```bash
npm install
```

---

## 📋 Adım 5: Environment Variables Ayarla

`.env.production` dosyası oluştur:

```bash
nano .env.production
```

İçine şunu yaz:

```bash
NEXT_PUBLIC_BACKEND_BASE_URL=https://api.1ndirim.birdir1.com
NODE_ENV=production
PORT=3002
```

**Not:** Port 3002 çünkü Nginx config'de `admin.1ndirim.birdir1.com` → `localhost:3002` yapılandırılmış.

Kaydet (`Ctrl+X`, `Y`, `Enter`).

---

## 📋 Adım 6: Build Et

```bash
npm run build
```

Bu işlem birkaç dakika sürebilir. Başarılı olursa şu çıktıyı görürsün:

```
✓ Compiled successfully
```

---

## 📋 Adım 7: PM2 ile Çalıştır

```bash
pm2 start npm --name "1indirim-admin" -- start
pm2 save
pm2 startup
```

**Not:** `pm2 startup` komutu bir çıktı verecek, o komutu çalıştırman gerekecek (örnek: `sudo env PATH=$PATH:/usr/bin pm2 startup systemd -u root --hp /root`).

---

## 📋 Adım 8: Nginx Config'i Kontrol Et

Nginx config'de admin panel için reverse proxy ayarı olmalı:

```bash
cat /etc/nginx/sites-available/1indirim.conf | grep -A 10 "admin.1indirim"
```

Şöyle bir şey görmelisin:

```nginx
# 1indirim Admin - admin.1ndirim.birdir1.com
server {
    listen 80;
    server_name admin.1ndirim.birdir1.com;
    
    location / {
        proxy_pass http://localhost:3002;
        ...
    }
}
```

Eğer port 3001 ise, 3002'ye güncelle:

```bash
nano /etc/nginx/sites-available/1indirim.conf
```

`proxy_pass http://localhost:3001;` → `proxy_pass http://localhost:3002;` olarak değiştir.

Sonra Nginx'i reload et:

```bash
nginx -t
systemctl reload nginx
```

---

## 📋 Adım 9: Test Et

Tarayıcıda şu adrese git:

```
https://admin.1ndirim.birdir1.com
```

Login sayfasını görmelisin. Üretim ortamında kullanıcı bilgilerini
gizli değişkenlerden/şifre kasasından al ve panelde test et.

---

## ✅ Tamamlandı!

Artık:
- ✅ Admin panel deploy edildi
- ✅ `https://admin.1ndirim.birdir1.com` adresinden erişilebilir
- ✅ PM2 ile otomatik başlatma aktif

---

## 🆘 Sorun Giderme

### Hata: "Cannot find module"
**Çözüm:** `npm install` çalıştır.

### Hata: "Port 3002 already in use"
**Çözüm:** Başka bir port kullan veya mevcut process'i durdur:
```bash
pm2 list
pm2 stop <process-id>
```

### Hata: "NEXT_PUBLIC_BACKEND_BASE_URL is not set"
**Çözüm:** `.env.production` dosyasını kontrol et.

### Admin panel açılmıyor
**Çözüm:** 
1. PM2 logları kontrol et: `pm2 logs 1indirim-admin`
2. Nginx logları kontrol et: `tail -f /var/log/nginx/error.log`
3. Backend API'nin çalıştığından emin ol: `curl https://api.1ndirim.birdir1.com/api/health`

---

**Hazırlayan:** Teknik Destek  
**Tarih:** 27 Ocak 2026
