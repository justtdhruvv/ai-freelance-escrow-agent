# SESSION 20 — AI Data Quality: Milestone Descriptions + Wallet Controller

## Priority: MEDIUM
## Estimated effort: 30-40 min
## Independent: YES — only touches 2 backend files

---

## Project Context
This is an AI Freelance Escrow platform. The backend uses Google Gemini AI to generate
SOPs and milestones from client briefs. There are two data quality bugs in the backend:

1. **ai.service.ts**: When mapping SOP milestones to `GeneratedMilestone` objects, the
   `description` field is hardcoded to `''` (empty string). The SOP milestones from Gemini
   DO have a `checks` array with descriptions that can serve as the milestone description.
   Every AI-generated milestone is stored with a blank description.

2. **wallet.controller.ts**: The conversion response hardcodes `estimated_arrival: '2-3 business days'`.
   This string is shown in the UI as a promise to the user. It should either be a configurable
   constant (not a magic string inline in the code) or removed.

---

## Your Scope
**Only touch:**
- `escrow-service/src/modules/ai/ai.service.ts`
- `escrow-service/src/modules/wallets/wallet.controller.ts`

**Do NOT touch:** sop.generator.ts, any other service, or any frontend files.

---

## Read These Files First (in order)
1. `escrow-service/src/modules/ai/ai.service.ts` — find the hardcoded empty description
2. `escrow-service/src/modules/ai/sop.generator.ts` — understand what fields a SOPMilestone has
3. `escrow-service/src/modules/wallets/wallet.controller.ts` — find hardcoded arrival string

---

## TASK 1: Fix Milestone Descriptions in ai.service.ts

### The Bug
In `ai.service.ts`, inside `generateMilestonesFromBrief()`, there is a `.map()` call
that builds `GeneratedMilestone` objects:

```typescript
milestones = sop.milestones.map((m: any) => {
  const deadline = m.deadline ? new Date(m.deadline) : ...;
  const estimatedDays = ...;
  return {
    title: m.title || '',
    description: '',           // ← BUG: always empty
    amount: m.payment_amount || 0,
    estimated_days: estimatedDays
  };
});
```

### What SOPMilestone Contains
From `sop.generator.ts`, `SOPMilestone` has:
```typescript
interface SOPMilestone {
  title: string;
  deadline: string;
  payment_amount: number;
  checks: SOPCheck[];  // each check has a `description: string` field
}
```

There is no top-level `description` field on a `SOPMilestone`, but there IS a `checks`
array where each check has `type`, `description`, and `params`.

### How to Fix
Build a description from the checks array. Join the check descriptions into a readable
summary:

```typescript
return {
  title: m.title || '',
  description: m.checks && m.checks.length > 0
    ? m.checks.map((c: any) => c.description).filter(Boolean).join('; ')
    : m.title || '',
  amount: m.payment_amount || 0,
  estimated_days: estimatedDays
};
```

This produces a description like:
`"API endpoints functional and responding correctly; User authentication implemented; Database migrations complete"`

If there are no checks (edge case), it falls back to using the title as description.

### Also Fix the Fallback Milestones
Lower in the same method, the fallback milestones (used when AI generation fails) also
have hardcoded empty descriptions:

```typescript
milestones = [
  { title: 'Phase 1 - Setup & Planning', description: '', amount: ..., estimated_days: 7 },
  { title: 'Phase 2 - Core Development', description: '', amount: ..., estimated_days: 21 },
  { title: 'Phase 3 - Testing & Delivery', description: '', amount: ..., estimated_days: totalDays }
];
```

Replace these empty descriptions with sensible defaults:
```typescript
milestones = [
  {
    title: 'Phase 1 - Setup & Planning',
    description: 'Project setup, requirements finalization, architecture planning, and environment configuration.',
    amount: Math.round(totalPrice * 0.2),
    estimated_days: 7
  },
  {
    title: 'Phase 2 - Core Development',
    description: 'Implementation of core features, integration of main components, and iterative development.',
    amount: Math.round(totalPrice * 0.6),
    estimated_days: 21
  },
  {
    title: 'Phase 3 - Testing & Delivery',
    description: 'Quality assurance, bug fixes, documentation, deployment, and final handover.',
    amount: Math.round(totalPrice * 0.2),
    estimated_days: totalDays
  }
];
```

### Also Fix the Hardcoded confidence: 0.85
The result object has:
```typescript
const result: AIGenerationResult = {
  milestones,
  confidence: 0.85,   // hardcoded
  processing_time: Date.now() - startTime
};
```

Replace with a simple heuristic: if AI generation succeeded use 0.85, if fallback was used
use 0.5. To do this, track whether fallback was used:

```typescript
let usedFallback = false;
try {
  // ... AI generation
} catch (aiError) {
  usedFallback = true;
  // ... fallback milestones
}

const result: AIGenerationResult = {
  milestones,
  confidence: usedFallback ? 0.5 : 0.85,
  processing_time: Date.now() - startTime
};
```

---

## TASK 2: Fix Hardcoded Arrival Time in wallet.controller.ts

### The Bug
In `wallet.controller.ts`, find the conversion response. It contains:
```typescript
estimated_arrival: '2-3 business days'
```
This is a magic string hardcoded inline in the controller response.

### How to Fix
Extract it as a module-level constant so it is easy to find and change:

At the top of the file (after imports), add:
```typescript
const CONVERSION_ESTIMATED_ARRIVAL = '2-3 business days';
```

Then replace the inline string in the response with the constant:
```typescript
estimated_arrival: CONVERSION_ESTIMATED_ARRIVAL,
```

This is a minimal change — it does not change behavior but makes the value explicitly
configurable and easy to update.

---

## Completion Checklist
- [ ] Read ai.service.ts fully before changing
- [ ] Read sop.generator.ts to understand SOPMilestone.checks structure
- [ ] Read wallet.controller.ts fully before changing
- [ ] AI milestones: description built from m.checks[].description joined with '; '
- [ ] AI milestones: fallback to m.title if checks array is empty
- [ ] Fallback milestones: all 3 have meaningful description strings
- [ ] Confidence tracking: usedFallback variable added, confidence is 0.5 when fallback
- [ ] wallet.controller.ts: CONVERSION_ESTIMATED_ARRIVAL constant extracted
- [ ] wallet.controller.ts: inline string replaced with constant
- [ ] TypeScript compiles: run `cd escrow-service && npx tsc --noEmit` to verify

---

## PROMPT TO USE (paste this into your Claude session)

```
You are working on an AI Freelance Escrow platform backend (Express/TypeScript).
This session has 2 data quality fixes:

1. Fix ai.service.ts: AI-generated milestones always have description: '' (empty string).
   Build the description from m.checks[].description joined with '; '. Also fix fallback
   milestone descriptions and make confidence dynamic (0.85 if AI succeeded, 0.5 if fallback).

2. Fix wallet.controller.ts: hardcoded '2-3 business days' inline string in the conversion
   response. Extract it as a module-level constant CONVERSION_ESTIMATED_ARRIVAL.

Read the full session file at SESSIONS/SESSION_20_AI_DATA_QUALITY.md first — it has
the exact code for each fix.

RULES:
- Read ai.service.ts, sop.generator.ts, and wallet.controller.ts before making changes
- Only touch escrow-service/src/modules/ai/ai.service.ts and wallet.controller.ts
- sop.generator.ts is READ ONLY — do not change it
- After changes, run: cd escrow-service && npx tsc --noEmit
- Do NOT touch any other files
```
