# SESSION 4 — Fix Hardcoded URLs & Environment Config

## Priority: CRITICAL
## Estimated effort: 30-45 min

---

## Project Context
This is an AI Freelance Escrow platform with 3 services:
- Frontend (Next.js 16) on port 3001
- Backend (Express/TypeScript) on port 3000
- AI Service (Python/FastAPI) on port 8001

Currently, backend URLs and API base URLs are hardcoded as strings throughout the codebase.
This means: the app breaks in production, staging, or any environment that isn't localhost.
This session fixes ALL hardcoded URLs by replacing them with environment variables.

---

## Your Scope
**Files to touch:**
- `escrow-service/src/modules/sops/sop.service.ts`
- `escrow-service/src/modules/aqa/aqa.service.ts`
- `escrow-service/.env.example`
- `frontend/app/store/api/baseApi.ts`
- `frontend/app/services/authService.ts`
- `frontend/app/api/login/route.ts`
- `frontend/app/api/signup/route.ts`
- `frontend/app/api/projects/routes.ts`
- `frontend/app/api/projects/[id]/routes.ts` (if it exists)
- `frontend/app/api/validate/route.ts`
- `frontend/.env.local` (CREATE this file if it doesn't exist)
- `frontend/.env.example` (CREATE or UPDATE)

**Do NOT touch:** ai-agent/, other backend modules, or any component/page files

---

## Read These Files First (in order)
1. `escrow-service/src/modules/sops/sop.service.ts` — find the hardcoded AI URL
2. `escrow-service/src/modules/aqa/aqa.service.ts` — find the hardcoded AI URL
3. `escrow-service/.env.example` — current backend env vars
4. `frontend/app/store/api/baseApi.ts` — hardcoded backend URL
5. `frontend/app/services/authService.ts` — hardcoded backend URL
6. `frontend/app/api/login/route.ts`
7. `frontend/app/api/signup/route.ts`
8. `frontend/app/api/projects/routes.ts`
9. `frontend/app/api/validate/route.ts`
10. Check if `frontend/.env.local` exists

---

## Exact Changes Required

### BACKEND: sop.service.ts
Find the hardcoded string `http://127.0.0.1:8000` (in the `callAIAPI()` method or `generateAndStoreSOP()`)
Replace with:
```typescript
const AI_BASE = process.env.AI_API_BASE_URL || 'http://127.0.0.1:8000';
// then use: `${AI_BASE}/ai/generate-sop`
```

### BACKEND: aqa.service.ts
Same as above — find `http://127.0.0.1:8000` and replace with env var:
```typescript
const AI_BASE = process.env.AI_API_BASE_URL || 'http://127.0.0.1:8000';
// then use: `${AI_BASE}/ai/run-aqa`
```

### BACKEND: .env.example
Add this line:
```
AI_API_BASE_URL=http://127.0.0.1:8000
```

### FRONTEND: baseApi.ts
Find: `baseUrl: 'http://localhost:3000/'` (or similar)
Replace with: `baseUrl: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'`
Note: In Next.js, browser-accessible env vars MUST be prefixed with `NEXT_PUBLIC_`

### FRONTEND: authService.ts
Find: `const API_BASE_URL = "http://localhost:3000"`
Replace with: `const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'`

### FRONTEND: app/api/login/route.ts
Find the hardcoded `http://localhost:3000` in the fetch/axios call
Replace with: `process.env.BACKEND_URL || 'http://localhost:3000'`
Note: In Next.js API routes (server-side), use `BACKEND_URL` (no NEXT_PUBLIC_ prefix needed)

### FRONTEND: app/api/signup/route.ts
Same pattern as login/route.ts

### FRONTEND: app/api/projects/routes.ts
Same pattern — find and replace hardcoded backend URL

### FRONTEND: app/api/projects/[id]/routes.ts (if it exists)
Same pattern

### FRONTEND: app/api/validate/route.ts
Same pattern

### CREATE: frontend/.env.local
Create this file if it doesn't exist:
```
NEXT_PUBLIC_API_URL=http://localhost:3000
BACKEND_URL=http://localhost:3000
```

### CREATE/UPDATE: frontend/.env.example
```
NEXT_PUBLIC_API_URL=http://localhost:3000
BACKEND_URL=http://localhost:3000
```

---

## Important Notes
- In Next.js: browser-side code (components, store) uses `NEXT_PUBLIC_*` env vars
- In Next.js: server-side code (API routes in app/api/) uses regular env vars
- `baseApi.ts` is used client-side → needs `NEXT_PUBLIC_API_URL`
- `authService.ts` may be used client-side → needs `NEXT_PUBLIC_API_URL`
- `app/api/*.ts` routes are server-side → use `BACKEND_URL`
- `.env.local` is gitignored by Next.js by default — check `.gitignore`
- `.env.example` should NOT be gitignored (it's the template for others)

---

## Completion Checklist
- [ ] sop.service.ts: hardcoded AI URL replaced with env var
- [ ] aqa.service.ts: hardcoded AI URL replaced with env var
- [ ] escrow-service/.env.example: AI_API_BASE_URL added
- [ ] baseApi.ts: URL uses NEXT_PUBLIC_API_URL env var
- [ ] authService.ts: URL uses NEXT_PUBLIC_API_URL env var
- [ ] app/api/login/route.ts: URL uses BACKEND_URL env var
- [ ] app/api/signup/route.ts: URL uses BACKEND_URL env var
- [ ] app/api/projects/routes.ts: URL uses BACKEND_URL env var
- [ ] app/api/validate/route.ts: URL uses BACKEND_URL env var
- [ ] frontend/.env.local created with both vars
- [ ] frontend/.env.example created/updated
- [ ] No hardcoded localhost URLs remain in any of the touched files

---

## PROMPT TO USE (paste this into your Claude session)

```
You are working on an AI Freelance Escrow platform that has hardcoded localhost URLs scattered
across the backend and frontend. This prevents the app from running in any environment except
localhost. Your job is to replace all hardcoded URLs with environment variables.

Read the full session file at SESSIONS/SESSION_4_HARDCODED_URLS.md first — it lists every
file to change, exactly what to find, and exactly what to replace it with.

RULES:
- Read every file in the "Read First" list before making changes
- Only touch the specific files listed in "Your Scope"
- Do NOT touch any other files (no components, no controllers, no agents)
- For Next.js: browser-side code needs NEXT_PUBLIC_ prefix, server-side doesn't
- Always keep a fallback default: process.env.VAR || 'http://localhost:3000'
- Create frontend/.env.local if it doesn't exist
- After changes, grep the modified files to confirm no http://localhost:3000 strings remain
- Work through the checklist one item at a time
```
