# SESSION 11 — Payment Flow Production Fix

## Priority: HIGH
## Estimated effort: 45-60 min

---

## Project Context
The payment module uses Razorpay. There are two Razorpay service files:
- `razorpay.service.ts` — real Razorpay API calls (requires live credentials)
- `mockRazorpay.service.ts` — mock service for development/testing

Currently `payment.service.ts` ALWAYS uses the real `RazorpayService` with no environment-based
switching. In development without real Razorpay credentials the app crashes. The mock service
exists but is orphaned — never used by the main payment service.

---

## Your Scope
**Only touch:**
- `escrow-service/src/modules/payments/payment.service.ts`
- `escrow-service/src/modules/payments/razorpay.service.ts`

**Do NOT touch:** webhook.service.ts, mockRazorpay.service.ts, any other files

---

## Read These Files First (in order)
1. `escrow-service/src/modules/payments/payment.service.ts` — full file
2. `escrow-service/src/modules/payments/razorpay.service.ts` — full file
3. `escrow-service/src/modules/payments/mockRazorpay.service.ts` — full file
4. `escrow-service/.env.example` — check RAZORPAY vars and NODE_ENV

---

## TASK 1: Add Environment-Based Mock/Real Switch

In `payment.service.ts`, the constructor does:
```typescript
constructor() {
  this.razorpayService = new RazorpayService();
}
```

Change it to check `NODE_ENV` or a `USE_MOCK_RAZORPAY` flag:
```typescript
import { RazorpayService } from './razorpay.service';
import { MockRazorpayService } from './mockRazorpay.service';

constructor() {
  const useMock = process.env.NODE_ENV !== 'production' &&
                  process.env.USE_MOCK_RAZORPAY !== 'false';
  this.razorpayService = useMock ? new MockRazorpayService() : new RazorpayService();
}
```

This means:
- In development → uses mock (safe, no real credentials needed)
- In production → uses real Razorpay
- Override: set `USE_MOCK_RAZORPAY=false` in dev `.env` to test real Razorpay locally

**Important:** Read `mockRazorpay.service.ts` first to confirm it implements the same interface/methods
as `RazorpayService`. If there's a shared interface, both should implement it. If not, check that
the mock has all the same method names — `createOrder`, `verifyPaymentSignature`, etc.

---

## TASK 2: Ensure MockRazorpayService Implements Same Interface

Read both `razorpay.service.ts` and `mockRazorpay.service.ts`. List all public methods in
the real service. Verify the mock has matching method signatures.

If the mock is missing any method that the real service has, add a stub to the mock:
```typescript
async missingMethod(params: any): Promise<any> {
  return { mock: true, ...params };
}
```

Do NOT modify the mock file unless it's missing a method used by payment.service.ts.
If the mock is already complete, skip this task.

---

## TASK 3: Add USE_MOCK_RAZORPAY to .env.example

Add to `escrow-service/.env.example`:
```
# Payment
USE_MOCK_RAZORPAY=true   # set to false in production
```

---

## Completion Checklist
- [ ] Read both razorpay.service.ts and mockRazorpay.service.ts fully
- [ ] payment.service.ts constructor uses NODE_ENV/USE_MOCK_RAZORPAY to choose service
- [ ] Mock used by default in development, real used in production
- [ ] MockRazorpayService has all methods that payment.service.ts calls
- [ ] USE_MOCK_RAZORPAY documented in .env.example
- [ ] `npx tsc --noEmit` clean after changes

---

## PROMPT TO USE

```
Working directory: d:/khyber/ai-freelance-escrow-agent
Session: SESSIONS/SESSION_11_PAYMENT_FLOW.md

Read SESSIONS/INDEX.md then read the session file above completely, then read every file in its "Read These Files First" list. Only then start making changes.

Rules:
- Only touch files listed in "Your Scope" in the session file
- Work through the checklist one item at a time
- Do not refactor, add comments, or touch files outside your scope
- After backend changes run: cd escrow-service && npx tsc --noEmit
- End by confirming every checklist item is complete
```
