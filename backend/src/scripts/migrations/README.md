# Migrations – Execution Order & Dependencies

Run migrations **in this order**. Dependencies are enforced only by documentation and manual execution.

---

## ⚠️ MUST RUN FIRST

**`000_init_core_schema.js`** must run before any other migration.

- Creates: `sources`, `source_segments`, `campaigns`.
- All other migrations assume these tables exist.

---

## Required Execution Order

| Order | File | Depends on | Creates / alters |
|-------|------|------------|------------------|
| 1 | `000_init_core_schema.js` | (none) | `sources`, `source_segments`, `campaigns`, core indexes |
| 2 | `add_admin_users.js` | (none) | `admin_role_enum`, `admin_users`, indexes, triggers |
| 3 | `add_light_campaign_mode.js` | `campaigns` | `campaign_type_enum`, `campaigns.campaign_type`, `campaigns.show_in_light_feed` |
| 4 | `add_category_campaign_mode.js` | `campaigns`, `campaign_type_enum` | `campaigns.show_in_category_feed` |
| 5 | `add_low_value_campaign_mode.js` | `campaigns` | `value_level_enum`, `campaigns.value_level` |
| 6 | `add_hidden_campaign_type.js` | `campaign_type_enum` | value `'hidden'` on `campaign_type_enum` |
| 7 | `add_affiliate_url.js` | `campaigns` | `campaigns.affiliate_url` |
| 8 | `add_admin_control_layer.js` | `campaigns` | `admin_audit_logs`, `campaigns.is_pinned` |
| 9 | `add_admin_overrides.js` | `campaigns` | `campaigns.is_hidden`, `campaigns.pinned_at` |
| 10 | `enhance_audit_logs.js` | `admin_audit_logs` | `before_state`, `after_state`, immutability trigger |
| 11 | `add_source_status.js` | `sources` | `source_status_enum`, `sources.source_status`, `sources.status_reason` |
| 12 | `create_campaign_clicks.js` | `campaigns` | `campaign_clicks` |

---

## Table / Enum Dependencies

- **`campaigns`** – required by: `add_light_campaign_mode`, `add_category_campaign_mode`, `add_low_value_campaign_mode`, `add_affiliate_url`, `add_admin_control_layer`, `add_admin_overrides`, `create_campaign_clicks`.
- **`sources`** – required by: `add_source_status`.
- **`admin_audit_logs`** – required by: `enhance_audit_logs`.
- **`campaign_type_enum`** – required by: `add_category_campaign_mode`, `add_hidden_campaign_type`.

---

## Idempotency

- **Safe to re-run** (use `IF NOT EXISTS` or equivalent):  
  `000_init_core_schema`, `add_admin_users`, `add_admin_control_layer`, `add_admin_overrides`, `add_source_status`, `add_light_campaign_mode`, `add_category_campaign_mode`, `add_low_value_campaign_mode`, `add_affiliate_url`, `create_campaign_clicks`.
- **Risky to re-run**:  
  `add_hidden_campaign_type` (enum value may already exist),  
  `enhance_audit_logs` (trigger create/drop).

---

## One-Liner (from repo root, DB already created)

```bash
cd backend
node src/scripts/migrations/000_init_core_schema.js && \
node src/scripts/migrations/add_admin_users.js && \
node src/scripts/migrations/add_light_campaign_mode.js && \
node src/scripts/migrations/add_category_campaign_mode.js && \
node src/scripts/migrations/add_low_value_campaign_mode.js && \
node src/scripts/migrations/add_hidden_campaign_type.js && \
node src/scripts/migrations/add_affiliate_url.js && \
node src/scripts/migrations/add_admin_control_layer.js && \
node src/scripts/migrations/add_admin_overrides.js && \
node src/scripts/migrations/enhance_audit_logs.js && \
node src/scripts/migrations/add_source_status.js && \
node src/scripts/migrations/create_campaign_clicks.js
```

Ensure `backend/.env` (or env) has correct `DB_*` settings and the database exists before running.
