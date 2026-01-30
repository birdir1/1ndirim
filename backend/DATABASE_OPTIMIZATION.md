# Database Optimization Guide

Bu dokümanda database performans iyileştirmeleri ve best practices açıklanmaktadır.

## 🚀 Hızlı Başlangıç

### Optimization Script'i Çalıştır

```bash
# Index'leri oluştur ve database'i optimize et
node src/scripts/run_optimization.js
```

Bu script:
- ✅ Tüm gerekli index'leri oluşturur
- ✅ Table istatistiklerini günceller (ANALYZE)
- ✅ Index listesini gösterir
- ✅ Table boyutlarını gösterir

---

## 📊 Oluşturulan Index'ler

### Campaigns Table
```sql
- idx_campaigns_source_id          -- Foreign key
- idx_campaigns_status_active      -- Status + Active filter
- idx_campaigns_expires_at         -- Expiration check
- idx_campaigns_type               -- Campaign type
- idx_campaigns_value_level        -- Value level
- idx_campaigns_is_hidden          -- Hidden flag
- idx_campaigns_pinned             -- Pinned campaigns
- idx_campaigns_created_at         -- Sorting
- idx_campaigns_main_feed          -- Main feed composite (CRITICAL)
- idx_campaigns_active             -- Active campaigns composite
```

### Sources Table
```sql
- idx_sources_name                 -- Search
- idx_sources_type                 -- Filter
- idx_sources_active               -- Active sources
```

### User_Favorites Table
```sql
- idx_user_favorites_user_id       -- User lookup
- idx_user_favorites_campaign_id   -- Campaign lookup
- idx_user_favorites_user_campaign -- Unique constraint (composite)
- idx_user_favorites_created_at    -- Sorting
```

### Campaign_Comments Table
```sql
- idx_campaign_comments_campaign_id -- Campaign lookup
- idx_campaign_comments_user_id     -- User lookup
- idx_campaign_comments_deleted     -- Soft delete filter
- idx_campaign_comments_created_at  -- Sorting
```

### Campaign_Ratings Table
```sql
- idx_campaign_ratings_campaign_id  -- Campaign lookup
- idx_campaign_ratings_user_id      -- User lookup
- idx_campaign_ratings_user_campaign -- Unique constraint (composite)
- idx_campaign_ratings_rating       -- Aggregation
```

---

## 🔧 Connection Pooling

### Ayarlar (.env)

```env
DB_POOL_MAX=20                    # Maximum connections
DB_POOL_MIN=5                     # Minimum connections
DB_IDLE_TIMEOUT=30000             # Close idle after 30s
DB_CONNECTION_TIMEOUT=10000       # Connection timeout 10s
DB_STATEMENT_TIMEOUT=30000        # Query timeout 30s
```

### Pool Monitoring

```javascript
const pool = require('./config/database');

// Pool stats
console.log('Total clients:', pool.totalCount);
console.log('Idle clients:', pool.idleCount);
console.log('Waiting clients:', pool.waitingCount);
```

---

## 📈 Performans Beklentileri

### Öncesi (Index'siz)
```
Main feed query:      500ms
Campaign search:      300ms
Favorites list:       200ms
Comments list:        150ms
Ratings aggregation:  100ms
```

### Sonrası (Index'li)
```
Main feed query:      50ms   (10x faster) ⚡
Campaign search:      30ms   (10x faster) ⚡
Favorites list:       20ms   (10x faster) ⚡
Comments list:        15ms   (10x faster) ⚡
Ratings aggregation:  10ms   (10x faster) ⚡
```

---

## 🔍 Query Optimization

### EXPLAIN ANALYZE Kullanımı

```sql
-- Query performansını ölç
EXPLAIN ANALYZE
SELECT c.*, s.name as source_name
FROM campaigns c
INNER JOIN sources s ON c.source_id = s.id
WHERE c.is_active = true
  AND c.expires_at > NOW()
  AND c.campaign_type = 'main'
ORDER BY c.created_at DESC
LIMIT 20;
```

### Index Kullanımını Kontrol Et

```sql
-- Index scan mı, seq scan mi?
-- Index Scan = ✅ Good
-- Seq Scan = ❌ Bad (index eksik)
```

---

## 🛠️ Bakım İşlemleri

### 1. ANALYZE (İstatistik Güncelleme)

```sql
-- Tüm table'lar için
ANALYZE;

-- Belirli bir table için
ANALYZE campaigns;
```

**Ne zaman çalıştırılmalı:**
- Büyük veri değişikliklerinden sonra
- Haftada bir (cron job)
- Query performansı düştüğünde

### 2. VACUUM (Disk Temizleme)

```sql
-- Tüm table'lar için
VACUUM;

-- Analyze ile birlikte
VACUUM ANALYZE;

-- Belirli bir table için
VACUUM ANALYZE campaigns;
```

**Ne zaman çalıştırılmalı:**
- Ayda bir (cron job)
- Büyük DELETE işlemlerinden sonra
- Disk alanı dolduğunda

### 3. REINDEX (Index Yenileme)

```sql
-- Tüm index'leri yenile
REINDEX DATABASE indirim_db;

-- Belirli bir table'ın index'lerini yenile
REINDEX TABLE campaigns;
```

**Ne zaman çalıştırılmalı:**
- Index corruption şüphesi
- 6 ayda bir (opsiyonel)

---

## 📊 Monitoring

### 1. Slow Query Detection

```sql
-- pg_stat_statements extension gerekli
CREATE EXTENSION IF NOT EXISTS pg_stat_statements;

-- En yavaş query'ler
SELECT 
  query,
  calls,
  total_time,
  mean_time,
  max_time
FROM pg_stat_statements
ORDER BY mean_time DESC
LIMIT 10;
```

### 2. Index Usage Stats

```sql
-- Index kullanım istatistikleri
SELECT 
  schemaname,
  tablename,
  indexname,
  idx_scan,
  idx_tup_read,
  idx_tup_fetch
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
ORDER BY idx_scan DESC;
```

### 3. Table Stats

```sql
-- Table istatistikleri
SELECT 
  schemaname,
  tablename,
  n_tup_ins,
  n_tup_upd,
  n_tup_del,
  n_live_tup,
  n_dead_tup,
  last_vacuum,
  last_autovacuum,
  last_analyze,
  last_autoanalyze
FROM pg_stat_user_tables
WHERE schemaname = 'public';
```

### 4. Connection Stats

```sql
-- Aktif bağlantılar
SELECT 
  datname,
  usename,
  application_name,
  client_addr,
  state,
  query
FROM pg_stat_activity
WHERE datname = 'indirim_db';
```

---

## 🎯 Best Practices

### 1. Query Optimization

✅ **DO:**
- WHERE clause'da index'li kolonları kullan
- LIMIT kullan (pagination)
- JOIN yerine EXISTS kullan (uygun yerlerde)
- Composite index'leri kullan
- EXPLAIN ANALYZE ile test et

❌ **DON'T:**
- SELECT * kullanma (sadece gerekli kolonları seç)
- WHERE clause'da function kullanma (index kullanılamaz)
- OR yerine UNION kullan (uygun yerlerde)
- N+1 query problemi yaratma

### 2. Index Strategy

✅ **DO:**
- Sık kullanılan WHERE kolonlarına index ekle
- Foreign key'lere index ekle
- Composite index'leri akıllıca kullan
- Partial index'leri kullan (WHERE clause ile)

❌ **DON'T:**
- Her kolona index ekleme (write performance düşer)
- Çok fazla composite index ekleme
- Kullanılmayan index'leri tutma

### 3. Connection Management

✅ **DO:**
- Connection pooling kullan
- Idle timeout ayarla
- Graceful shutdown yap
- Connection leak'leri önle

❌ **DON'T:**
- Her request için yeni connection açma
- Connection'ları kapatmayı unutma
- Pool size'ı çok büyük tutma

---

## 🚨 Troubleshooting

### Problem: Slow Queries

**Çözüm:**
1. EXPLAIN ANALYZE ile query'yi analiz et
2. Index eksikliğini kontrol et
3. Query'yi optimize et
4. ANALYZE çalıştır

### Problem: High CPU Usage

**Çözüm:**
1. Slow query'leri tespit et
2. Index'leri kontrol et
3. Connection pool size'ı azalt
4. VACUUM çalıştır

### Problem: High Memory Usage

**Çözüm:**
1. work_mem ayarını düşür
2. Connection pool size'ı azalt
3. Büyük query'leri parçala
4. VACUUM çalıştır

### Problem: Connection Pool Exhausted

**Çözüm:**
1. Pool size'ı artır (DB_POOL_MAX)
2. Connection leak'leri kontrol et
3. Idle timeout'u azalt
4. Query timeout'u azalt

---

## 📚 Kaynaklar

- [PostgreSQL Performance Tips](https://wiki.postgresql.org/wiki/Performance_Optimization)
- [pg_stat_statements](https://www.postgresql.org/docs/current/pgstatstatements.html)
- [Index Types](https://www.postgresql.org/docs/current/indexes-types.html)
- [Connection Pooling](https://node-postgres.com/features/pooling)

---

**Son Güncelleme**: 30 Ocak 2026  
**Versiyon**: 1.0.0
