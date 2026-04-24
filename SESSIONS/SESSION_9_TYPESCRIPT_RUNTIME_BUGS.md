# SESSION 9 — Fix TypeScript Errors + Critical Runtime Bugs

## Priority: CRITICAL — app cannot build or deploy without this
## Estimated effort: 45-60 min

---

## Project Context
Express/TypeScript backend at `escrow-service/`. Currently has 12 TypeScript compilation errors
across 3 files that prevent `npm run build` from succeeding. There is also one runtime bug in
wallet.service.ts that causes a silent crash whenever a milestone is marked paid.

---

## Your Scope
**Only touch:**
- `escrow-service/src/modules/aqa/aqa.service.ts`
- `escrow-service/src/modules/projects/project.controller.ts`
- `escrow-service/src/modules/sops/sop.service.ts`
- `escrow-service/src/modules/wallets/wallet.service.ts`

**Do NOT touch:** any other files

---

## Read These Files First (in order)
1. `escrow-service/src/modules/aqa/aqa.service.ts` — full file
2. `escrow-service/src/modules/projects/project.controller.ts` — full file
3. `escrow-service/src/modules/sops/sop.service.ts` — full file
4. `escrow-service/src/modules/wallets/wallet.service.ts` — full file

Then run this to see all errors before touching anything:
```bash
cd escrow-service && npx tsc --noEmit 2>&1
```

---

## Exact Errors to Fix

### ERRORS IN aqa.service.ts (7 errors)

**Error group 1 — `response.data` typed as `unknown` (lines ~286-293)**
The axios response data is typed as `unknown`, so accessing `.status`, `.model_used`, `.output`
fails. Fix by casting `response.data` to `any` (same pattern used in ai.service.ts after Session 2):
```typescript
const data = response.data as any;
// then use data.status, data.output, data.model_used, etc.
```

**Error group 2 — `axios.isAxiosError` doesn't exist on `AxiosStatic` (line ~298)**
This is an axios v1 API issue. Fix:
```typescript
// Change:
if (axios.isAxiosError(error))
// To:
import axios, { isAxiosError } from 'axios';
// then:
if (isAxiosError(error))
```
OR simply cast to `any`:
```typescript
if ((error as any).response) { ... }
```

**Error group 3 — Type '{}' missing properties from 'AIResponse' (line ~293)**
An empty object `{}` is returned as an `AIResponse` but is missing required fields.
Cast it to satisfy the type:
```typescript
return {} as AIResponse;
```
OR add the minimum required fields. Read the AIResponse interface first to see what's required.

### ERRORS IN project.controller.ts (3 errors)

**Error — `repo_link` doesn't exist on `CreateProjectInput` / `CreateProjectData` / `Project`**
The controller reads `req.body.repo_link` and passes it to the service, but `repo_link` is not
in any of those TypeScript interfaces.

Fix by adding `repo_link` to the relevant interfaces. Find where `CreateProjectInput`,
`CreateProjectData`, and `Project` types are defined (likely in a types file or at the top of
the service/controller). Add:
```typescript
repo_link?: string;  // optional field
```
to all three type definitions.

### ERRORS IN sop.service.ts (2 errors)

**Error group — Type '{}' missing properties from AIResponse + axios.isAxiosError**
Same pattern as aqa.service.ts. Fix with the same approach:
- Cast `{}` to `as AIResponse` in the catch block
- Fix `axios.isAxiosError` to `isAxiosError` from named import

---

## TASK: Fix wallet.service.ts Runtime Bug

**File:** `escrow-service/src/modules/wallets/wallet.service.ts`
**Line:** ~130
**Problem:** `trx('milestones')` — the table is named `milestone_checks` not `milestones`.
This causes a silent DB error whenever a milestone is marked as paid.

**Fix:**
```typescript
// Change:
await trx('milestones')
// To:
await trx('milestone_checks')
```

Read the full method context to make sure you change the right line and don't break the query.
Also scan the entire wallet.service.ts for any other references to `'milestones'` — change all of them.

---

## Completion Checklist
- [ ] Run `npx tsc --noEmit` first to see all 12 errors
- [ ] aqa.service.ts: response.data cast to `any`
- [ ] aqa.service.ts: axios.isAxiosError fixed to named import or cast
- [ ] aqa.service.ts: empty AIResponse object cast properly
- [ ] project.controller.ts: repo_link added to all 3 type definitions
- [ ] sop.service.ts: same AIResponse + isAxiosError fixes applied
- [ ] wallet.service.ts: `trx('milestones')` → `trx('milestone_checks')` fixed
- [ ] wallet.service.ts: no other `'milestones'` table references remain
- [ ] Final check: `npx tsc --noEmit` returns ZERO errors

---

## PROMPT TO USE

```
Working directory: d:/khyber/ai-freelance-escrow-agent
Session: SESSIONS/SESSION_9_TYPESCRIPT_RUNTIME_BUGS.md

Read SESSIONS/INDEX.md then read the session file above completely, then read every file in its "Read These Files First" list. Only then start making changes.

Rules:
- Only touch files listed in "Your Scope" in the session file
- Work through the checklist one item at a time
- Do not refactor, add comments, or touch files outside your scope
- After backend changes run: cd escrow-service && npx tsc --noEmit
- End by confirming every checklist item is complete
```
