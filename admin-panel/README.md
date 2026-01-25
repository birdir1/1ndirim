# 1ndirim Admin Panel

Production-grade admin UI: sources, campaigns, suggestions, governance timeline. Human-in-the-loop only; no automation.

## Tech

- Next.js 14 (App Router), React 18, TypeScript, Tailwind CSS
- No external UI libraries. Fetch API only. Auth via headers.

## Run

```bash
cp .env.local.example .env.local
# set NEXT_PUBLIC_BACKEND_BASE_URL e.g. http://localhost:3000
npm install
npm run dev
```

App listens on port 3001.

## Auth

- Login stores `admin_email` and `admin_api_key` in localStorage.
- Every request sends `x-admin-email` and `x-admin-api-key`.
- Missing auth → redirect to `/login`. Logout clears localStorage.

## Pages

| Route | Description |
|-------|-------------|
| `/login` | Email + API key → redirect to `/sources` on success |
| `/sources` | GET /api/admin/sources; change source_status (confirmation + reason) |
| `/campaigns` | GET /api/admin/campaigns; hide/unhide, activate/deactivate, type low/hidden (confirmation + reason) |
| `/suggestions` | GET /api/admin/suggestions?state=new; table; View Context → detail |
| `/suggestions/[id]` | GET context; Apply / Reject / Execute (confirmed + admin_note min 10 chars) |
| `/governance/timeline` | GET /api/admin/governance/timeline; read-only; pagination |

Backend and APIs are unchanged. This is view + action trigger only.
