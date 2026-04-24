# SESSION 2 — Fix Backend AI Module (Stub → Real AI Calls)

## Priority: CRITICAL
## Estimated effort: 45-90 min

---

## Project Context
This is an AI Freelance Escrow platform with 3 services:
- Frontend (Next.js) on port 3001
- Backend (Express/TypeScript) on port 3000
- AI Service (Python/FastAPI) on port 8001

The backend has a module called `ai` at `escrow-service/src/modules/ai/`. Despite being called "AI",
it currently contains ZERO real AI calls. It uses hardcoded keyword-based logic to "generate"
milestones. The Python AI service (port 8001) exists and has real agents, but this backend module
never calls them.

Meanwhile, the SOP module (`escrow-service/src/modules/sops/sop.service.ts`) already has a working
example of how to call the AI service — it uses axios to POST to `http://127.0.0.1:8000/ai/generate-sop`.
Your job is to replace the stub logic in the AI module with real HTTP calls to the Python service.

---

## Your Scope
**Only touch files in:** `escrow-service/src/modules/ai/`
**Do NOT touch:** anything in `frontend/`, `ai-agent/`, or other backend modules

---

## Read These Files First (in order)
1. `escrow-service/src/modules/ai/ai.service.ts` — the stub you're replacing
2. `escrow-service/src/modules/ai/ai.controller.ts` — to understand the API contract
3. `escrow-service/src/modules/ai/ai.routes.ts` — to understand the routes
4. `escrow-service/src/modules/sops/sop.service.ts` — the WORKING EXAMPLE of how to call AI service
5. `escrow-service/src/modules/projects/project.service.ts` — see how it calls `this.aiService.generateMilestonesFromBrief()`
6. `ai-agent/main.py` — to understand AI service endpoints and request/response shapes
7. `escrow-service/.env.example` — current env vars

---

## What Needs to Change

### The Core Problem
`ai.service.ts` has `generateMilestonesFromBrief()` which does this:
```typescript
// CURRENT STUB — local keyword matching, no AI
analyzeProjectComplexity(briefText) {
  // checks for keywords like 'website', 'mobile', etc.
  // returns hardcoded milestone templates
}
```

### What It Should Do
Call the Python AI service's `/ai/generate-sop` endpoint (which generates milestones + checks),
then extract just the milestones from the response and return them in the format the caller expects.

### How the SOP Module Does It (COPY THIS PATTERN)
In `sop.service.ts`, look for the `callAIAPI()` method and `generateAndStoreSOP()` method.
It uses:
```typescript
const response = await axios.post(
  `http://127.0.0.1:8000/ai/generate-sop`,
  payload,
  { timeout: 600000 }
);
```

### AI Service Request Shape for /ai/generate-sop
```json
{
  "project_id": "uuid",
  "raw_text": "the brief text",
  "domain": "web_development",
  "timeline_days": 30
}
```

### AI Service Response Shape
```json
{
  "status": "success",
  "output": {
    "milestones": [
      {
        "title": "Milestone Name",
        "deadline": "2026-04-20T00:00:00",
        "payment_amount": 5000,
        "checks": [...]
      }
    ]
  }
}
```

### What `generateMilestonesFromBrief()` Should Return
The caller (project.service.ts) expects an array of milestone objects. Return the
`response.data.output.milestones` array, or a safe fallback if the AI call fails.

### Required Changes

1. **Add axios import** to ai.service.ts (check if already imported, if not add it —
   run `npm list axios` in escrow-service/ to verify it's available, it should be)

2. **Replace `generateMilestonesFromBrief()`** with real HTTP call to AI service

3. **Add `AI_API_BASE_URL` env var usage** — use `process.env.AI_API_BASE_URL || 'http://127.0.0.1:8000'`
   as the base URL (NOT hardcoded, the env var will be added in Session 4)

4. **Add a fallback** — if the AI service is unreachable or returns an error, fall back to
   generating 3 basic milestone placeholders so the project creation doesn't crash:
   ```typescript
   // Fallback milestones if AI is unavailable
   [
     { title: 'Phase 1 - Setup & Planning', deadline: <now + 7 days>, payment_amount: Math.round(totalPrice * 0.2) },
     { title: 'Phase 2 - Core Development', deadline: <now + 21 days>, payment_amount: Math.round(totalPrice * 0.6) },
     { title: 'Phase 3 - Testing & Delivery', deadline: <now + totalDays>, payment_amount: Math.round(totalPrice * 0.2) }
   ]
   ```

5. **Remove** `analyzeProjectComplexity()` and `generateMilestonesFromText()` stub functions
   if they become unused after the replacement.

---

## Completion Checklist
- [ ] Read all files in "Read First" list
- [ ] ai.service.ts: `generateMilestonesFromBrief()` makes real HTTP call to AI service
- [ ] Uses `process.env.AI_API_BASE_URL` with fallback, not hardcoded URL
- [ ] Has try/catch with fallback milestones on AI service failure
- [ ] axios is properly imported and available
- [ ] Stub functions removed (if unused)
- [ ] TypeScript compiles without errors (run `npx tsc --noEmit` in escrow-service/)

---

## PROMPT TO USE (paste this into your Claude session)

```
You are working on the backend of an AI Freelance Escrow platform. The backend is a Node.js/Express/
TypeScript app at escrow-service/. It has a module called "ai" at escrow-service/src/modules/ai/
that is currently a stub — it uses hardcoded keyword logic instead of calling the real Python AI
service (FastAPI, port 8001).

Your job is to replace the stub with real HTTP calls to the AI service.

Read the full session file at SESSIONS/SESSION_2_BACKEND_AI_MODULE.md first — it has the exact
request/response shapes, the working example in sop.service.ts to copy from, and the fallback
strategy to implement.

RULES:
- Read every file in the "Read First" list before making changes
- Only modify files in escrow-service/src/modules/ai/
- Do NOT touch frontend/, ai-agent/, or other backend modules
- Use process.env.AI_API_BASE_URL (not hardcoded URL)
- Add proper error handling with fallback milestones
- After changes, run: cd escrow-service && npx tsc --noEmit to verify TypeScript compiles
- Work through the completion checklist one item at a time
```
