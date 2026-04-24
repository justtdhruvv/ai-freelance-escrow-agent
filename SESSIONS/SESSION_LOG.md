# Session Log — AI Freelance Escrow Agent

---

## SESSION 3 — Fix Missing Database Migrations ✅

**Status:** COMPLETE
**Files created:** `escrow-service/src/db/migrations/` (6 new files)

### What was broken
The repo had 11 migration files but they were **all ALTER TABLE statements**. Zero CREATE TABLE migrations existed for the core tables. Running `npm run knex:migrate` on a fresh DB would fail immediately because the base tables didn't exist.

### What we built
6 new CREATE TABLE migrations with timestamps `20260301000000–000005` (earlier than all existing ALTERs, so they run first):

| File | Table created |
|------|--------------|
| `20260301000000_create_users_table.ts` | `users` — uuid PK, email, password_hash, role enum, pfi_score, trust_score, github_token, razorpay/stripe fields |
| `20260301000001_create_projects_table.ts` | `projects` — uuid PK, name, employer_id/freelancer_id FKs, status enum, total_price, escrow_balance |
| `20260301000002_create_client_briefs_table.ts` | `client_briefs` — uuid PK, project_id FK, raw_text, domain, ai_processed flag |
| `20260301000003_create_freelancer_wallets_table.ts` | `freelancer_wallets` — uuid PK, freelancer_id FK (unique), balance/available/pending, wallet_type enum |
| `20260301000004_create_wallet_transactions_table.ts` | `wallet_transactions` — uuid PK, wallet_id FK, type enum, amount, description, reference_id |
| `20260301000005_create_wallet_conversions_table.ts` | `wallet_conversions` — uuid PK, wallet_id FK, amount_credits, amount_real decimal, fee, status enum |

### How we fixed it
- Inferred column sets by reading each service file (`auth.service.ts`, `project.service.ts`, `wallet.service.ts`, `client.service.ts`)
- Cross-referenced the ALTER TABLE files to know which columns were added later (so they could be baked into the CREATE from the start)
- Used timestamps predating all existing migrations so `knex:migrate` runs CREATEs before ALTERs

### Result
A fresh clone can now run `npm run knex:migrate` and the full database schema stands up from scratch.

---

## SESSION 4 — Fix Hardcoded URLs & Environment Config ✅

**Status:** COMPLETE
**Files modified:** 9 files | **Files created:** 2 files

### What was broken
Backend and frontend had `http://localhost:3000` and `http://127.0.0.1:8000` hardcoded as string literals. App broke in any environment that wasn't localhost (staging, prod, any teammate's machine).

### What we fixed

**Backend (escrow-service):**
- `sop.service.ts` — `AI_API_BASE_URL` class field now reads `process.env.AI_API_BASE_URL || 'http://127.0.0.1:8000'`
- `aqa.service.ts` — same fix
- `.env.example` — added `AI_API_BASE_URL=http://127.0.0.1:8000`

**Frontend (Next.js):**
- `store/api/baseApi.ts` — `baseUrl` now uses `process.env.NEXT_PUBLIC_API_URL` (client-side, needs `NEXT_PUBLIC_` prefix)
- `services/authService.ts` — `API_BASE_URL` now uses `process.env.NEXT_PUBLIC_API_URL`
- `app/api/login/route.ts` — `BACKEND_URL` env var (server-side route)
- `app/api/signup/route.ts` — same
- `app/api/projects/routes.ts` — same
- `app/api/projects/[id]/routes.ts` — same (file was missed by glob but caught by grep)
- `app/api/validate/route.ts` — same

**Env files created:**
- `frontend/.env.local` — `NEXT_PUBLIC_API_URL` + `BACKEND_URL` (gitignored by Next.js default)
- `frontend/.env.example` — same (committed, template for others)

### Key distinction applied
Next.js browser-side code needs `NEXT_PUBLIC_*` prefix. Server-side API routes use plain `BACKEND_URL`. Got both right.

### Result
No hardcoded localhost URLs remain in any touched file. All URLs have env var + fallback default pattern.

---
