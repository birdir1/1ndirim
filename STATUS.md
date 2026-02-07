# Status

Deprecated audits removed as of 2026-02-08; use current code and commits as truth.

Canonical backend: `/Users/shadow/birdir1/1ndirim/backend`

## Verified fixes present

- Bot auth gate (backend write protection): `backend/src/middleware/botAuth.js`
- Bot overlap locks (in-memory + filesystem): `bot/src/scheduler.js`, `bot/src/utils/runLock.js`
- Main feed hard guard (prevents feed pollution by type/value/hidden): `backend/src/utils/mainFeedGuard.js`

## Unverified / not guaranteed

- Discover categories DB-backed at runtime (a DB migration exists at `backend/migrations/002_create_campaign_categories.sql`,
  but the API route still uses a hardcoded list in `backend/src/routes/campaigns-discover.js`)
- Production deploy/env wiring (e.g., `INTERNAL_BOT_TOKEN`, Redis service, Firebase Admin credentials)
- Admin authentication is safe against header spoofing (current implementation relies on request headers + DB state in `backend/src/middleware/adminAuth.js`)

