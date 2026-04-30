# SESSION 16 — Backend Role Enforcement + Wallet Fee Bug

## Priority: HIGH
## Estimated effort: 30-45 min
## Independent: YES — only touches backend route and service files

---

## Project Context
This is an AI Freelance Escrow platform with Express/TypeScript backend.
There are two problems:

1. The wallet routes, SOP routes, and AQA routes are protected by `authenticateToken` (JWT
   validation) but NOT by `requireRole('freelancer')`. An employer account can send a request
   with their valid JWT directly to `GET /wallet`, `POST /sops/generate`, etc. and the server
   will not reject it with 403 — it will process the request or return empty data silently.
   The `requireRole` middleware already exists in `auth.middleware.ts`, it's just not applied.

2. In `wallet.service.ts`, the `convertCreditsToRealMoney()` method receives a `fees` parameter
   but immediately shadows it with a hardcoded recalculation. The caller can never override
   the fee amount because the parameter is unused.

---

## Your Scope
**Only touch:**
- `escrow-service/src/modules/wallets/wallet.routes.ts`
- `escrow-service/src/modules/wallets/wallet.service.ts`
- `escrow-service/src/modules/sops/sop.routes.ts`
- `escrow-service/src/modules/aqa/aqa.routes.ts`

**Do NOT touch:** any controller files, service logic (except the fee bug), or frontend files.

---

## Read These Files First (in order)
1. `escrow-service/src/middlewares/auth.middleware.ts` — understand requireRole signature
2. `escrow-service/src/modules/wallets/wallet.routes.ts` — current state
3. `escrow-service/src/modules/wallets/wallet.service.ts` — find the fee shadowing bug
4. `escrow-service/src/modules/sops/sop.routes.ts` — check current middleware usage
5. `escrow-service/src/modules/aqa/aqa.routes.ts` — check current middleware usage

---

## TASK 1: Add requireRole to Wallet Routes

### The Problem
`wallet.routes.ts` currently only applies `authenticateToken`:
```typescript
router.use(authenticateToken);
```
An employer with a valid JWT can call `GET /wallet` and the server will try to look up
a wallet for their user_id. No 403 is returned.

### How to Fix
Import `requireRole` from the auth middleware and add it after `authenticateToken`:

```typescript
import { authenticateToken, requireRole } from '../../middlewares/auth.middleware';

// Apply authentication + role guard to all wallet routes
router.use(authenticateToken);
router.use(requireRole('freelancer'));
```

The `requireRole` function signature is:
```typescript
export const requireRole = (roles: string | string[]) => middleware
```
It reads `req.user.role` (set by `authenticateToken`) and returns 403 if the role
is not in the allowed list.

---

## TASK 2: Add requireRole to SOP Routes

### The Problem
Read `sop.routes.ts` first. SOPs are created and managed by freelancers only.
Employers should be able to VIEW (GET) SOPs for their projects but NOT generate them.

### How to Fix
After reading `sop.routes.ts`, determine which routes need role protection:
- `POST /sops/generate` → freelancer only (add `requireRole('freelancer')` to this route)
- `POST /sops/:id/approve` → both roles can approve (no role guard needed)
- `GET /sops/project/:id` → both roles can view (no role guard needed)
- `GET /sops/:id/milestones` → both roles can view (no role guard needed)

Apply `requireRole('freelancer')` only to the generate endpoint, not to all SOP routes.
Example pattern:
```typescript
router.post('/generate', requireRole('freelancer'), sopController.generateSOP);
```

Do NOT use `router.use(requireRole(...))` globally on sop routes — employers need
read access to SOPs.

---

## TASK 3: Add requireRole to AQA Routes

### The Problem
Read `aqa.routes.ts` first. AQA (Automated Quality Assurance) runs are triggered by
freelancers after they submit work. Employers have no reason to trigger AQA directly.

### How to Fix
After reading `aqa.routes.ts`, add `requireRole('freelancer')` to POST routes that
trigger AQA runs. GET routes for viewing AQA results can remain accessible to both.

---

## TASK 4: Fix Wallet Fee Calculation Bug

### The Bug
In `wallet.service.ts`, find the method that handles credit conversion (look for a method
with a `fees` parameter). Inside that method, there will be a line like:
```typescript
const fees = Math.floor(realAmount * 0.02)
```
This line creates a NEW local variable named `fees` that shadows the `fees` parameter
passed in. The parameter is ignored and the fee is always recalculated as 2% hardcoded.

### How to Fix
Delete the line that shadows the `fees` parameter. The parameter value should be used
directly in subsequent calculations.

Before fixing: search the method for all lines that use the `fees` variable to make
sure you understand what `fees` is used for after this line. You'll likely see something like:
```typescript
const amountAfterFees = realAmount - fees;
// or
net_amount: realAmount - fees,
```
Just remove the shadowing assignment — keep all uses of `fees` as-is since they should
now correctly use the passed-in parameter value.

---

## Completion Checklist
- [ ] Read all 5 files before making any changes
- [ ] `requireRole` imported in wallet.routes.ts
- [ ] `router.use(requireRole('freelancer'))` added in wallet.routes.ts after authenticateToken
- [ ] sop.routes.ts read and generate endpoint has requireRole('freelancer')
- [ ] sop.routes.ts GET/approve routes NOT blocked (both roles need them)
- [ ] aqa.routes.ts read and POST trigger route has requireRole('freelancer')
- [ ] Fee shadowing line removed in wallet.service.ts
- [ ] TypeScript compiles: run `cd escrow-service && npx tsc --noEmit` to verify

---

## PROMPT TO USE (paste this into your Claude session)

```
You are working on an AI Freelance Escrow platform backend (Express/TypeScript).
This session has 4 related tasks:

1. Add requireRole('freelancer') middleware to wallet.routes.ts (currently anyone with
   a valid JWT can call wallet endpoints regardless of role)
2. Add requireRole('freelancer') to the SOP generate endpoint only (GET/approve stay open)
3. Add requireRole('freelancer') to AQA trigger endpoints  
4. Fix a fee calculation bug in wallet.service.ts where the fees parameter is shadowed
   by a hardcoded recalculation (const fees = Math.floor(realAmount * 0.02))

Read the full session file at SESSIONS/SESSION_16_BACKEND_ROLE_ENFORCEMENT.md first.

RULES:
- Read ALL 5 files in the "Read First" list before making changes
- Only touch the 4 route/service files listed in Your Scope
- For SOPs: only block POST /generate — employers need read access to SOPs
- For wallet: block ALL routes (employers have no wallet functionality)
- After all changes, run: cd escrow-service && npx tsc --noEmit
- Do NOT touch controllers, other services, or any frontend files
```
