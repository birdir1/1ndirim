# Sunucuda Backend Güncelleme Adımları

## Sorun
Loglarda `/api/campaigns/all?sourceNames=...` isteği 500 hatası veriyor. Backend kodunun güncellenmesi gerekiyor.

## Adımlar

### 1. Sunucuya Bağlan
```bash
ssh root@37.140.242.105
```

### 2. Backend Dizinine Git
```bash
cd /var/www/1indirim-api
# Eğer backend alt dizinde ise:
cd /var/www/1indirim-api/backend
```

### 3. Git Durumunu Kontrol Et
```bash
git status
git log --oneline -5
```

### 4. Güncellemeleri Çek
```bash
git pull origin main
```

### 5. PM2'yi Restart Et
```bash
pm2 restart 1indirim-api
```

### 6. Logları Kontrol Et
```bash
pm2 logs 1indirim-api --lines 20
```

### 7. Test Et
```bash
curl "https://api.1indirim.birdir1.com/api/campaigns/all?sourceNames=Ziraat%20Bankası"
```

## Not
Eğer `git pull` "Already up to date" derse, kod zaten güncel ama PM2 eski kodu çalıştırıyor olabilir. `pm2 restart 1indirim-api` yeterli olmalı.
