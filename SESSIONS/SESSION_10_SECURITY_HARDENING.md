# SESSION 10 — Security Hardening

## Priority: CRITICAL for production
## Estimated effort: 45-60 min

---

## Project Context
Express backend at `escrow-service/`. Currently has zero security middleware — no helmet,
no rate limiting, and webhook signature verification is hardcoded to always return `true`
(meaning anyone can forge webhook events and trigger fake payments).

---

## Your Scope
**Only touch:**
- `escrow-service/src/app.ts`
- `escrow-service/src/modules/payments/webhook.service.ts`
- `escrow-service/package.json`

**Do NOT touch:** any other files

---

## Read These Files First (in order)
1. `escrow-service/src/app.ts` — full file
2. `escrow-service/src/modules/payments/webhook.service.ts` — full file
3. `escrow-service/package.json` — check existing dependencies
4. `escrow-service/.env.example` — check RAZORPAY_WEBHOOK_SECRET exists

---

## TASK 1: Install Security Packages

Run these commands in `escrow-service/`:
```bash
npm install helmet
npm install express-rate-limit
```

---

## TASK 2: Add helmet to app.ts

After reading app.ts, add helmet right after the express app is created:
```typescript
import helmet from 'helmet';

// Add this early in middleware chain, before CORS and routes:
app.use(helmet());
```

Helmet sets security headers: X-Frame-Options, X-XSS-Protection, Content-Security-Policy, etc.

---

## TASK 3: Add Rate Limiting to app.ts

Add a general rate limiter for all API routes:
```typescript
import rateLimit from 'express-rate-limit';

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: { error: 'Too many requests, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api', limiter);
// OR apply globally:
app.use(limiter);
```

Also add a stricter limiter for auth endpoints:
```typescript
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10, // only 10 login attempts per 15 min
  message: { error: 'Too many login attempts, please try again later.' },
});

// Apply to auth routes — find where auth routes are mounted in app.ts
app.use('/auth', authLimiter);
```

---

## TASK 4: Fix Webhook Signature Verification

**File:** `escrow-service/src/modules/payments/webhook.service.ts`

The `verifyWebhookSignature()` method currently returns `true` unconditionally.
This is a critical security bug — anyone can send fake Razorpay webhooks and trigger
payment releases without paying.

**Fix:** Implement real HMAC-SHA256 verification using Node's built-in `crypto` module:

```typescript
import crypto from 'crypto';

verifyWebhookSignature(
  webhookBody: string,
  webhookSignature: string,
  webhookSecret: string
): boolean {
  try {
    if (!webhookSecret) {
      logger.warn('Webhook secret not configured — skipping signature verification');
      return process.env.NODE_ENV !== 'production'; // allow in dev, block in prod
    }

    const expectedSignature = crypto
      .createHmac('sha256', webhookSecret)
      .update(webhookBody)
      .digest('hex');

    return crypto.timingSafeEqual(
      Buffer.from(expectedSignature),
      Buffer.from(webhookSignature)
    );
  } catch (error) {
    logger.error('Webhook signature verification failed', { error });
    return false;
  }
}
```

Notes:
- `crypto` is a Node built-in — no npm install needed
- `timingSafeEqual` prevents timing attacks
- In dev (NODE_ENV !== 'production') allow unsigned webhooks so testing still works
- In production, a missing/wrong signature returns false and the webhook is rejected

---

## Completion Checklist
- [ ] `npm install helmet express-rate-limit` run in escrow-service/
- [ ] helmet imported and `app.use(helmet())` added in app.ts
- [ ] General rate limiter added (100 req / 15 min)
- [ ] Auth-specific rate limiter added (10 req / 15 min) on `/auth` route
- [ ] webhook.service.ts: `verifyWebhookSignature()` uses real HMAC-SHA256
- [ ] Webhook allows unsigned in dev (NODE_ENV !== 'production'), blocks in prod
- [ ] `npx tsc --noEmit` runs clean after changes

---

## PROMPT TO USE

```
Working directory: d:/khyber/ai-freelance-escrow-agent
Session: SESSIONS/SESSION_10_SECURITY_HARDENING.md

Read SESSIONS/INDEX.md then read the session file above completely, then read every file in its "Read These Files First" list. Only then start making changes.

Rules:
- Only touch files listed in "Your Scope" in the session file
- Work through the checklist one item at a time
- Do not refactor, add comments, or touch files outside your scope
- After backend changes run: cd escrow-service && npx tsc --noEmit
- End by confirming every checklist item is complete
```
