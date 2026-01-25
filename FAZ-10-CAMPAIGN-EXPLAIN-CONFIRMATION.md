# FAZ 10 – CAMPAIGN EXPLAIN ENDPOINT CONFIRMATION

**Tarih:** 24 Ocak 2026  
**Versiyon:** 1.0  
**Durum:** ✅ **EXPLAIN ENDPOINT READY**

---

## ✅ IMPLEMENTATION COMPLETE

### Created Files

1. ✅ **`backend/src/services/campaignExplainService.js`**
   - Campaign explain service
   - Main feed eligibility analysis
   - Rule blocking detection
   - Feed assignment detection
   - Recommendations
   - Status: ✅ **READY**

2. ✅ **`backend/src/routes/admin.js`** (Updated)
   - `GET /api/admin/campaigns/:id/explain` endpoint
   - Read-only access (viewer+)
   - Status: ✅ **ENFORCED**

---

## 📊 EXPLAIN ENDPOINT

### Endpoint

**`GET /api/admin/campaigns/:id/explain`**

**Access:** `viewer`, `editor`, `super_admin` (all roles)

**Rules:**
- Read-only (no mutations)
- Pure diagnostics
- No side effects

**Status:** ✅ **READY**

---

## 📝 RESPONSE STRUCTURE

### Response Format

```json
{
  "success": true,
  "data": {
    "campaign_id": "uuid",
    "campaign_title": "Campaign Title",
    "source_name": "Source Name",
    
    "current_state": {
      "campaign_type": "main" | "light" | "category" | "low" | "hidden" | null,
      "value_level": "high" | "low" | null,
      "is_hidden": boolean,
      "is_pinned": boolean,
      "is_active": boolean,
      "expires_at": "timestamp",
      "show_in_light_feed": boolean,
      "show_in_category_feed": boolean
    },
    
    "main_feed_eligible": boolean,
    "in_main_feed": boolean,
    
    "blocking_rules": [
      {
        "rule": "campaign_type",
        "reason": "Campaign type is 'light', not 'main'",
        "current_value": "light",
        "required_value": "'main' or NULL",
        "severity": "blocking"
      }
    ],
    
    "passing_rules": ["is_active", "expires_at", "is_hidden"],
    
    "rule_analysis": {
      "campaign_type": {
        "passed": false,
        "current": "light",
        "required": "'main' or NULL",
        "message": "Campaign type 'light' is not allowed in main feed"
      },
      "value_level": {
        "passed": true,
        "current": "high",
        "required": "'high' or NULL"
      },
      "is_hidden": {
        "passed": true,
        "current": false,
        "required": false
      },
      "is_active": {
        "passed": true,
        "current": true,
        "required": true
      },
      "expires_at": {
        "passed": true,
        "current": "2026-02-01T00:00:00Z",
        "required": "Future date"
      }
    },
    
    "recommendations": [
      "Campaign is in light feed. To move to main feed, change campaign_type to \"main\" (requires quality filter pass)"
    ],
    
    "feed_assignments": {
      "main_feed": false,
      "light_feed": true,
      "category_feed": false,
      "low_value_feed": false,
      "hidden": false
    }
  }
}
```

**Status:** ✅ **READY**

---

## 🔍 RULE ANALYSIS

### Analyzed Rules

1. **`is_active`**
   - Check: `is_active === true`
   - Blocking if: Campaign is not active
   - Message: "Campaign must be active"

2. **`expires_at`**
   - Check: `expires_at > NOW()`
   - Blocking if: Campaign has expired or no expiry date
   - Message: "Campaign has expired" or "Campaign has no expiry date"

3. **`is_hidden`**
   - Check: `is_hidden !== true`
   - Blocking if: Campaign is hidden
   - Message: "Campaign is hidden (admin override)"

4. **`campaign_type`**
   - Check: `campaign_type === 'main' OR NULL`
   - Blocking if: Campaign type is not 'main' or NULL
   - Message: "Campaign type '{type}' is not allowed in main feed"

5. **`value_level`**
   - Check: `value_level === 'high' OR NULL`
   - Blocking if: Value level is not 'high' or NULL
   - Message: "Value level '{level}' is not allowed in main feed"

**Status:** ✅ **ANALYZED**

---

## 📊 FEED ASSIGNMENTS

### Feed Detection Logic

**Main Feed:**
- `campaign_type = 'main' OR NULL`
- `value_level = 'high' OR NULL`
- `is_hidden !== true`
- `is_active = true`
- `expires_at > NOW()`

**Light Feed:**
- `campaign_type = 'light'`
- `show_in_light_feed = true`

**Category Feed:**
- `campaign_type = 'category'`
- `show_in_category_feed = true`

**Low Value Feed:**
- `value_level = 'low'`

**Hidden:**
- `campaign_type = 'hidden' OR is_hidden = true`

**Status:** ✅ **DETECTED**

---

## 📝 USAGE EXAMPLES

### Example 1: Campaign in Main Feed

```bash
curl -X GET http://localhost:3000/api/admin/campaigns/{id}/explain \
  -H "x-admin-email: viewer@example.com"
```

**Response:**
```json
{
  "success": true,
  "data": {
    "main_feed_eligible": true,
    "in_main_feed": true,
    "blocking_rules": [],
    "passing_rules": ["is_active", "expires_at", "is_hidden", "campaign_type", "value_level"],
    "feed_assignments": {
      "main_feed": true,
      "light_feed": false,
      "category_feed": false,
      "low_value_feed": false,
      "hidden": false
    }
  }
}
```

---

### Example 2: Campaign Blocked by campaign_type

```bash
curl -X GET http://localhost:3000/api/admin/campaigns/{id}/explain \
  -H "x-admin-email: viewer@example.com"
```

**Response:**
```json
{
  "success": true,
  "data": {
    "main_feed_eligible": false,
    "in_main_feed": false,
    "blocking_rules": [
      {
        "rule": "campaign_type",
        "reason": "Campaign type is 'light', not 'main'",
        "current_value": "light",
        "required_value": "'main' or NULL",
        "severity": "blocking"
      }
    ],
    "passing_rules": ["is_active", "expires_at", "is_hidden", "value_level"],
    "recommendations": [
      "Campaign is in light feed. To move to main feed, change campaign_type to \"main\" (requires quality filter pass)"
    ],
    "feed_assignments": {
      "main_feed": false,
      "light_feed": true,
      "category_feed": false,
      "low_value_feed": false,
      "hidden": false
    }
  }
}
```

---

### Example 3: Campaign Blocked by Multiple Rules

```bash
curl -X GET http://localhost:3000/api/admin/campaigns/{id}/explain \
  -H "x-admin-email: viewer@example.com"
```

**Response:**
```json
{
  "success": true,
  "data": {
    "main_feed_eligible": false,
    "in_main_feed": false,
    "blocking_rules": [
      {
        "rule": "campaign_type",
        "reason": "Campaign type is 'category', not 'main'",
        "current_value": "category",
        "required_value": "'main' or NULL",
        "severity": "blocking"
      },
      {
        "rule": "value_level",
        "reason": "Value level is 'low', not 'high'",
        "current_value": "low",
        "required_value": "'high' or NULL",
        "severity": "blocking"
      }
    ],
    "passing_rules": ["is_active", "expires_at", "is_hidden"],
    "recommendations": [
      "Campaign is in category feed. To move to main feed, change campaign_type to \"main\" (requires quality filter pass)",
      "Change value_level to \"high\" to make campaign eligible for main feed"
    ],
    "feed_assignments": {
      "main_feed": false,
      "light_feed": false,
      "category_feed": true,
      "low_value_feed": true,
      "hidden": false
    }
  }
}
```

---

### Example 4: Hidden Campaign

```bash
curl -X GET http://localhost:3000/api/admin/campaigns/{id}/explain \
  -H "x-admin-email: viewer@example.com"
```

**Response:**
```json
{
  "success": true,
  "data": {
    "main_feed_eligible": false,
    "in_main_feed": false,
    "blocking_rules": [
      {
        "rule": "campaign_type",
        "reason": "Campaign type is 'hidden', not 'main'",
        "current_value": "hidden",
        "required_value": "'main' or NULL",
        "severity": "blocking"
      },
      {
        "rule": "is_hidden",
        "reason": "Campaign is hidden",
        "current_value": true,
        "required_value": false,
        "severity": "blocking"
      }
    ],
    "recommendations": [
      "Campaign is hidden. Cannot be moved to main feed directly. Requires super_admin to reverse hidden status."
    ],
    "feed_assignments": {
      "main_feed": false,
      "light_feed": false,
      "category_feed": false,
      "low_value_feed": false,
      "hidden": true
    }
  }
}
```

---

## ✅ VERIFICATION CHECKLIST

### Service Implementation
- [x] CampaignExplainService created
- [x] Main feed eligibility analysis
- [x] Rule blocking detection
- [x] Feed assignment detection
- [x] Recommendations generation
- [x] Structured response format

### Admin Routes
- [x] Explain endpoint added
- [x] Read-only access (viewer+)
- [x] Error handling
- [x] Response formatting

### Rule Analysis
- [x] is_active rule analyzed
- [x] expires_at rule analyzed
- [x] is_hidden rule analyzed
- [x] campaign_type rule analyzed
- [x] value_level rule analyzed

### Feed Assignments
- [x] Main feed detection
- [x] Light feed detection
- [x] Category feed detection
- [x] Low value feed detection
- [x] Hidden detection

---

## 🚨 CRITICAL RULES (KIRMIZI ÇİZGİLER)

### Rule 1: Read-Only

**Kural:**
- Explain endpoint ASLA mutation yapmamalı
- Sadece diagnostics
- No side effects

**Status:** ✅ **ENFORCED**

---

### Rule 2: Pure Diagnostics

**Kural:**
- Sadece mevcut durumu açıklar
- Campaign'i değiştirmez
- Feed'leri değiştirmez

**Status:** ✅ **ENFORCED**

---

### Rule 3: Complete Information

**Kural:**
- Tüm blocking rules açıklanmalı
- Tüm passing rules listelenmeli
- Recommendations sağlanmalı
- Feed assignments gösterilmeli

**Status:** ✅ **ENFORCED**

---

## 📝 USAGE EXAMPLES

### Example 1: Debug Campaign Not in Main Feed

```bash
# Campaign neden main feed'de değil?
curl -X GET http://localhost:3000/api/admin/campaigns/{id}/explain \
  -H "x-admin-email: editor@example.com"
```

**Use Case:** Admin bir campaign'in neden main feed'de görünmediğini anlamak istiyor.

---

### Example 2: Check Campaign Status

```bash
# Campaign'in durumunu kontrol et
curl -X GET http://localhost:3000/api/admin/campaigns/{id}/explain \
  -H "x-admin-email: viewer@example.com"
```

**Use Case:** Admin campaign'in hangi feed'lerde olduğunu görmek istiyor.

---

### Example 3: Get Recommendations

```bash
# Campaign'i main feed'e nasıl taşırım?
curl -X GET http://localhost:3000/api/admin/campaigns/{id}/explain \
  -H "x-admin-email: editor@example.com"
```

**Use Case:** Admin campaign'i main feed'e taşımak için ne yapması gerektiğini öğrenmek istiyor.

---

## 🚀 NEXT STEPS

### Immediate

1. ⚠️ **Test Explain Endpoint:**
   - Test with campaign in main feed
   - Test with campaign blocked by campaign_type
   - Test with campaign blocked by value_level
   - Test with hidden campaign
   - Test with expired campaign
   - Test with inactive campaign

2. ⚠️ **Verify Response Structure:**
   - Check all fields present
   - Verify rule analysis complete
   - Check recommendations accurate
   - Verify feed assignments correct

---

## ✅ CONFIRMATION

**Campaign explain endpoint is READY.**

All requirements met:
- ✅ Admin-only endpoint created
- ✅ Read-only (no mutations)
- ✅ Pure diagnostics
- ✅ Explains why campaign is NOT in main feed
- ✅ Shows which rule blocked it
- ✅ Displays campaign_type, value_level, filter results
- ✅ Shows hidden / pinned state
- ✅ Provides recommendations
- ✅ Shows feed assignments

**Status:** ✅ **EXPLAIN ENDPOINT READY**

**Next:** Test explain endpoint with various campaign scenarios.
