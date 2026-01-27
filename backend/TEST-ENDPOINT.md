# Backend Endpoint Test Rehberi

## Sunucuda Test Komutları

### 1. Basit Test (Tüm Kampanyalar)
```bash
curl "https://api.1indirim.birdir1.com/api/campaigns/all" | head -c 500
```

### 2. SourceNames ile Test
```bash
curl "https://api.1indirim.birdir1.com/api/campaigns/all?sourceNames=Ziraat%20Bankası" | head -c 500
```

### 3. Birden Fazla Source ile Test
```bash
curl "https://api.1indirim.birdir1.com/api/campaigns/all?sourceNames=Ziraat%20Bankası,Halkbank,Akbank" | head -c 500
```

### 4. Health Check
```bash
curl "https://api.1indirim.birdir1.com/api/health"
```

## Beklenen Sonuç

Başarılı istek için:
- Status code: `200`
- Response format:
```json
{
  "success": true,
  "data": [...],
  "count": 71
}
```

## Sorun Giderme

### Hata: 500 Internal Server Error
1. PM2 loglarını kontrol et: `pm2 logs 1indirim-api --lines 50`
2. "Campaigns/all list error" veya "Campaigns/all stack" satırlarını ara
3. Hata mesajını kaydet

### Hata: Route Not Found (404)
- Route sıralamasını kontrol et - `/all` route'u `/:id` route'undan önce olmalı

### Hata: Invalid UUID
- Bu hata `/campaigns/:id` route'una "all" string'i geldiğinde oluşur
- Route sıralaması yanlış olabilir
