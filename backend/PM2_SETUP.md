# PM2 Setup Guide

PM2 ile production monitoring ve process management kurulumu.

## 1. PM2 Kurulumu

```bash
# Global PM2 kurulumu
npm install -g pm2

# PM2 versiyonunu kontrol et
pm2 --version
```

## 2. Uygulama Başlatma

```bash
# Production modda başlat
pm2 start ecosystem.config.js --env production

# Development modda başlat
pm2 start ecosystem.config.js --env development

# Sadece API'yi başlat
pm2 start ecosystem.config.js --only 1ndirim-api

# Sadece backup job'ı başlat
pm2 start ecosystem.config.js --only 1ndirim-backup
```

## 3. Process Yönetimi

```bash
# Tüm process'leri listele
pm2 list

# Detaylı bilgi
pm2 show 1ndirim-api

# Process'i durdur
pm2 stop 1ndirim-api

# Process'i yeniden başlat
pm2 restart 1ndirim-api

# Process'i sil
pm2 delete 1ndirim-api

# Tüm process'leri durdur
pm2 stop all

# Tüm process'leri yeniden başlat
pm2 restart all

# Tüm process'leri sil
pm2 delete all
```

## 4. Monitoring

```bash
# Real-time monitoring
pm2 monit

# Dashboard (web interface)
pm2 plus

# CPU ve Memory kullanımı
pm2 list

# Logs
pm2 logs
pm2 logs 1ndirim-api
pm2 logs 1ndirim-api --lines 100
pm2 logs 1ndirim-api --err  # Sadece error logs
```

## 5. Log Yönetimi

```bash
# Log dosyalarını temizle
pm2 flush

# Log rotation setup
pm2 install pm2-logrotate

# Log rotation ayarları
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 30
pm2 set pm2-logrotate:compress true
```

## 6. Startup Script (Otomatik Başlatma)

```bash
# Sistem başlangıcında otomatik başlat
pm2 startup

# Mevcut process'leri kaydet
pm2 save

# Kaydedilmiş process'leri geri yükle
pm2 resurrect

# Startup script'i kaldır
pm2 unstartup
```

## 7. Cluster Mode

Ecosystem config'de `instances: 'max'` ayarı ile tüm CPU core'ları kullanılır.

```bash
# Cluster bilgisi
pm2 list

# Instance sayısını değiştir
pm2 scale 1ndirim-api 4  # 4 instance'a çıkar
pm2 scale 1ndirim-api +2  # 2 instance ekle
pm2 scale 1ndirim-api -1  # 1 instance azalt
```

## 8. Zero-Downtime Deployment

```bash
# Yeni kodu deploy et (zero-downtime)
git pull
npm install
pm2 reload ecosystem.config.js --env production

# Veya
pm2 reload 1ndirim-api
```

## 9. Environment Variables

```bash
# .env dosyasını kullan
pm2 start ecosystem.config.js --env production

# Veya manuel
pm2 start src/server.js --name 1ndirim-api -i max --env NODE_ENV=production
```

## 10. Backup Cron Job

Ecosystem config'de `cron_restart: '0 2 * * *'` ayarı ile her gün saat 02:00'de backup alınır.

```bash
# Backup job'ı manuel çalıştır
pm2 restart 1ndirim-backup

# Backup logs
pm2 logs 1ndirim-backup
```

## 11. Health Check

```bash
# API health check
curl http://localhost:3000/api/health

# PM2 health check
pm2 ping
```

## 12. Troubleshooting

```bash
# Process çöktüyse
pm2 restart 1ndirim-api

# Memory leak varsa
pm2 restart 1ndirim-api

# Logs kontrol et
pm2 logs 1ndirim-api --err --lines 100

# Process bilgisi
pm2 describe 1ndirim-api

# PM2'yi tamamen sıfırla
pm2 kill
pm2 start ecosystem.config.js --env production
```

## 13. Production Checklist

- [x] PM2 global kurulumu
- [x] ecosystem.config.js oluşturuldu
- [x] Logs klasörü oluşturuldu
- [x] Startup script ayarlandı
- [x] Process'ler kaydedildi (pm2 save)
- [x] Log rotation kuruldu
- [x] Backup cron job ayarlandı
- [x] Monitoring aktif

## 14. Useful Commands

```bash
# Tüm process'leri yeniden yükle (zero-downtime)
pm2 reload all

# Process'i graceful shutdown ile durdur
pm2 stop 1ndirim-api

# Process'i force kill
pm2 kill

# PM2 daemon'ı yeniden başlat
pm2 update

# PM2 versiyonunu güncelle
npm install -g pm2@latest
pm2 update
```

## 15. Monitoring Dashboard (PM2 Plus)

PM2 Plus ile gelişmiş monitoring:

```bash
# PM2 Plus'a kayıt ol
pm2 plus

# Dashboard: https://app.pm2.io
```

Özellikler:
- Real-time monitoring
- Error tracking
- Custom metrics
- Alerting
- Transaction tracing

---

**Not**: Production'da mutlaka `pm2 save` ve `pm2 startup` komutlarını çalıştırın!
