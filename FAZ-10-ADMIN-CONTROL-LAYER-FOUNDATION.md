# FAZ 10 – ADMIN & CONTROL LAYER FOUNDATION

**Tarih:** 25 Ocak 2026  
**Versiyon:** 1.0  
**Durum:** ✅ **FOUNDATION READY**

---

## 📊 FOUNDATION STRUCTURE

### Created Files

1. **`backend/src/middleware/adminAuth.js`**
   - Admin authentication middleware
   - `requireAdmin()` - Admin authentication kontrolü
   - `requireAdminRole()` - Role-based access control

2. **`backend/src/services/auditLogService.js`**
   - Audit logging service
   - Tüm admin action'ları loglar
   - Explicit ve auditable

3. **`backend/src/services/adminCampaignService.js`**
   - Admin-only campaign management
   - Campaign type değiştirme (explicit)
   - Pin/unpin işlemleri
   - Activate/deactivate işlemleri
   - Campaign silme (soft delete)

4. **`backend/src/routes/admin.js`**
   - Admin-only endpoints
   - Bot logic'ten tamamen izole
   - Explicit ve auditable actions

5. **`backend/src/scripts/migrations/add_admin_control_layer.js`**
   - Admin audit logs tablosu
   - Campaign is_pinned kolonu
   - Index'ler

---

## 🔒 SEPARATION RULES

### Bot Logic vs Admin Logic

**Bot Logic (Mevcut):**
- `POST /api/campaigns` - Bot kampanya ekler
- Campaign type bot tarafından belirlenir
- Otomatik işlemler

**Admin Logic (Yeni):**
- `PATCH /api/admin/campaigns/:id/type` - Admin campaign type değiştirir
- `PATCH /api/admin/campaigns/:id/pin` - Admin pin/unpin yapar
- `PATCH /api/admin/campaigns/:id/active` - Admin aktif/pasif yapar
- `DELETE /api/admin/campaigns/:id` - Admin siler
- Explicit işlemler, reason zorunlu

---

## 🚫 SAFETY RULES

### Rule 1: No Automatic Promotion

**Kural:**
- Light/category/low'dan main'e otomatik promotion YOK
- Sadece admin explicit olarak değiştirebilir
- Reason zorunlu

**Uygulama:**
```javascript
// AdminCampaignService.changeCampaignType()
// Main feed'e geçiş için ekstra validation
if (newCampaignType === 'main') {
  const hasValueInfo = oldCampaign.value || oldCampaign.discount_percentage;
  if (!hasValueInfo) {
    throw new Error('Cannot promote to main feed: Campaign has no value information');
  }
}
```

---

### Rule 2: Main Feed Query Protection

**Kural:**
- Main feed query logic ASLA değiştirilmedi
- Mevcut `Campaign.findAll()` korunuyor
- Admin service main feed query'yi kullanmıyor

**Uygulama:**
- `Campaign.findAll()` - Değiştirilmedi ✅
- `AdminCampaignService.getAllCampaigns()` - Yeni, feed filtresi olmadan
- Main feed query isolation korunuyor ✅

---

### Rule 3: Explicit Actions Only

**Kural:**
- Tüm admin action'lar explicit
- Reason zorunlu (campaign type change, active toggle, delete)
- Audit log zorunlu

**Uygulama:**
```javascript
// Reason zorunlu kontrolü
if (!reason || reason.trim().length === 0) {
  throw new Error('Reason is required for campaign type change');
}
```

---

## 📋 ADMIN ENDPOINTS

### Campaign Management

**GET `/api/admin/campaigns`**
- Tüm kampanyaları getirir (feed filtresi olmadan)
- Query params: `campaignType`, `isActive`, `sourceId`, `limit`, `offset`
- Admin-only

**GET `/api/admin/campaigns/:id`**
- Campaign detaylarını getirir
- Admin-only

**PATCH `/api/admin/campaigns/:id/type`**
- Campaign type'ı değiştirir
- Body: `{ campaignType: 'main'|'light'|'category'|'low', reason: string }`
- Reason zorunlu
- Main feed'e geçiş için value info kontrolü
- Admin-only, auditable

**PATCH `/api/admin/campaigns/:id/pin`**
- Campaign'i pin'ler/unpin'ler
- Body: `{ isPinned: boolean, reason?: string }`
- Admin-only, auditable

**PATCH `/api/admin/campaigns/:id/active`**
- Campaign'i aktif/pasif yapar
- Body: `{ isActive: boolean, reason: string }`
- Reason zorunlu
- Admin-only, auditable

**DELETE `/api/admin/campaigns/:id`**
- Campaign'i siler (soft delete)
- Body: `{ reason: string }`
- Reason zorunlu
- Admin-only, auditable

---

### Audit Logs

**GET `/api/admin/audit-logs`**
- Audit log'ları getirir
- Query params: `adminId`, `action`, `entityType`, `entityId`, `limit`, `offset`
- Admin-only

---

## 🔐 AUTHENTICATION

### Current Implementation (Development)

**API Key Based:**
```javascript
// Header: x-admin-api-key
const adminApiKey = req.headers['x-admin-api-key'];
const validApiKey = process.env.ADMIN_API_KEY || 'dev-admin-key';
```

**Environment Variable:**
```bash
ADMIN_API_KEY=your-secure-api-key
```

---

### Future Implementation (Production)

**JWT Token Based:**
```javascript
// Header: Authorization: Bearer <token>
const adminToken = req.headers['authorization'];
// JWT token validation
// Role-based access control
```

---

## 📊 AUDIT LOG STRUCTURE

### Audit Log Table

```sql
CREATE TABLE admin_audit_logs (
  id UUID PRIMARY KEY,
  admin_id VARCHAR(255) NOT NULL,
  action VARCHAR(100) NOT NULL,
  entity_type VARCHAR(50) NOT NULL,
  entity_id UUID NOT NULL,
  old_value JSONB,
  new_value JSONB,
  reason TEXT,
  metadata JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  ip_address VARCHAR(45),
  user_agent TEXT
);
```

### Audit Log Actions

- `update_campaign_type` - Campaign type değişikliği
- `pin_campaign` - Campaign pin
- `unpin_campaign` - Campaign unpin
- `activate_campaign` - Campaign aktivasyon
- `deactivate_campaign` - Campaign deaktivasyon
- `delete_campaign` - Campaign silme

---

## ✅ SAFETY CHECKS

### Main Feed Protection

**Check 1: Main Feed Query Unchanged**
- ✅ `Campaign.findAll()` değiştirilmedi
- ✅ Main feed query logic korunuyor
- ✅ Feed separation korunuyor

**Check 2: No Automatic Promotion**
- ✅ Light/category/low'dan main'e otomatik promotion YOK
- ✅ Sadece admin explicit değiştirebilir
- ✅ Reason zorunlu

**Check 3: Value Info Check**
- ✅ Main feed'e geçiş için value info kontrolü
- ✅ Value info yoksa main feed'e geçiş engellenir

---

### Bot Logic Isolation

**Check 1: Bot Endpoints Unchanged**
- ✅ `POST /api/campaigns` değiştirilmedi
- ✅ Bot logic korunuyor
- ✅ Bot → data flow korunuyor

**Check 2: Admin Endpoints Separate**
- ✅ Admin endpoints `/api/admin/*` altında
- ✅ Bot endpoints `/api/campaigns` altında
- ✅ Separation korunuyor

---

## 🚀 IMPLEMENTATION STATUS

### ✅ Completed

1. ✅ Admin authentication middleware
2. ✅ Audit log service
3. ✅ Admin campaign service
4. ✅ Admin routes
5. ✅ Database migration
6. ✅ Server integration

### ⚠️ TODO (Future)

1. ⚠️ JWT token authentication (production)
2. ⚠️ Role-based access control (production)
3. ⚠️ IP address logging
4. ⚠️ User agent logging
5. ⚠️ Admin UI (frontend)

---

## 📝 USAGE EXAMPLES

### Change Campaign Type

```bash
# Light campaign'ı main feed'e geçir (admin-only)
curl -X PATCH http://localhost:3000/api/admin/campaigns/{id}/type \
  -H "x-admin-api-key: dev-admin-key" \
  -H "Content-Type: application/json" \
  -d '{
    "campaignType": "main",
    "reason": "Campaign now has value information and passes quality filter"
  }'
```

### Pin Campaign

```bash
# Campaign'i pin'le
curl -X PATCH http://localhost:3000/api/admin/campaigns/{id}/pin \
  -H "x-admin-api-key: dev-admin-key" \
  -H "Content-Type: application/json" \
  -d '{
    "isPinned": true,
    "reason": "Featured campaign"
  }'
```

### Get Audit Logs

```bash
# Audit log'ları getir
curl -X GET http://localhost:3000/api/admin/audit-logs \
  -H "x-admin-api-key: dev-admin-key"
```

---

## 🔒 CRITICAL RULES (KIRMIZI ÇİZGİLER)

### Rule 1: Main Feed Query Protection

**Kural:**
- Main feed query logic ASLA değiştirilmemeli
- `Campaign.findAll()` korunmalı
- Main feed kalitesi korunmalı

**Status:** ✅ **KORUNUYOR**

---

### Rule 2: No Automatic Promotion

**Kural:**
- Light/category/low'dan main'e otomatik promotion YOK
- Sadece admin explicit değiştirebilir
- Reason zorunlu

**Status:** ✅ **UYGULANMIŞ**

---

### Rule 3: Bot Logic Isolation

**Kural:**
- Bot logic admin logic'ten izole
- Bot endpoints değiştirilmedi
- Admin endpoints ayrı

**Status:** ✅ **UYGULANMIŞ**

---

## ✅ FOUNDATION CONFIRMATION

### Structure Ready

- ✅ Admin authentication middleware
- ✅ Audit log service
- ✅ Admin campaign service
- ✅ Admin routes
- ✅ Database migration
- ✅ Server integration

### Safety Rules Enforced

- ✅ Main feed query protection
- ✅ No automatic promotion
- ✅ Explicit actions only
- ✅ Bot logic isolation

### Breaking Changes

- ❌ **YOK** - Mevcut API'ler değiştirilmedi
- ❌ **YOK** - Main feed query değiştirilmedi
- ❌ **YOK** - Bot logic değiştirilmedi

---

**Rapor Tarihi:** 25 Ocak 2026  
**Hazırlayan:** AI Assistant (Senior Backend Engineer Mode)  
**Versiyon:** 1.0  
**Durum:** ✅ **FOUNDATION READY - NO BREAKING CHANGES**
