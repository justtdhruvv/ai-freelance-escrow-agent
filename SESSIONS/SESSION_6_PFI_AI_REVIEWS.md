# SESSION 6 — Fix PFI Score Page + Build AI Reviews Page

## Priority: HIGH
## Estimated effort: 60-90 min

---

## Project Context
This is an AI Freelance Escrow platform. Two dashboard pages need work:

1. **PFI Score page** (`/dashboard/pfi-score`) — PFI (Performance & Fraud Indicator) is a trust
   score for freelancers (default 500, goes up when AQA passes, down when it fails). The page
   fetches real data but then IGNORES it and shows hardcoded mock arrays.

2. **AI Reviews page** (`/dashboard/ai-reviews`) — Currently just "coming soon..." placeholder.
   This should show AQA (Automated Quality Assurance) results — the AI verdicts on submitted
   freelancer work. The RTK Query endpoint already exists.

---

## Your Scope
**Only touch:**
- `frontend/app/dashboard/pfi-score/page.tsx`
- `frontend/app/dashboard/ai-reviews/page.tsx`

**Do NOT touch:** any store files, API files, other pages, or backend

---

## Read These Files First (in order)
1. `frontend/app/dashboard/pfi-score/page.tsx` — current broken implementation
2. `frontend/app/dashboard/ai-reviews/page.tsx` — current placeholder
3. `frontend/app/store/api/projectsApi.ts` — find AQA-related endpoints (runAQAs, getSOPMilestones)
4. `frontend/app/store/api/baseApi.ts` — understand base query setup
5. `escrow-service/src/modules/aqa/aqa.controller.ts` — understand AQA response shape
6. `escrow-service/src/modules/payments/payment.service.ts` — understand PFI score updates

---

## TASK A: Fix PFI Score Page

### What's Wrong
The page uses `useGetUserProfileQuery()` which returns the user object with `pfi_score`
and `trust_score`. BUT the page then has hardcoded mock data like:
```typescript
const mockData = {
  pfi_history: [],    // always empty
  recent_activity: [] // always empty
}
```
The real pfi_score from the API is being fetched but the surrounding UI context
(history, activity) is hardcoded empty.

### What to Fix
1. Display `userProfile?.pfi_score` properly (it's a number 0-1000, visualize as score out of 1000)
2. Display `userProfile?.trust_score` properly
3. For `pfi_history` and `recent_activity` — the backend doesn't have endpoints returning these
   arrays. Instead of showing empty arrays with misleading UI, either:
   - Remove those sections entirely, OR
   - Replace with static explanatory text like "Your score updates each time a milestone is reviewed"
   - Do NOT show empty activity feed UI that looks broken
4. Show a score visualization (could be a simple progress bar from 0-1000 with color coding:
   0-300 = red, 301-600 = yellow, 601-1000 = green)

---

## TASK B: Build AI Reviews Page

### What It Should Show
A list of AQA results — the AI quality checks performed on freelancer submissions.
Each result shows: which project, which milestone, verdict (passed/partial/failed), pass rate, feedback.

### Backend Data Available
**Endpoint:** `POST /submissions/:submission_id/run-aqa` (already in projectsApi.ts as `runAQAs`)
**Endpoint:** `GET /submissions/:submission_id/aqa-result` (check if this exists in projectsApi.ts)

AQA result shape (from aqa.controller.ts):
```json
{
  "aqa_id": "uuid",
  "submission_id": "uuid",
  "milestone_id": "uuid",
  "verdict": "passed | partial | failed | error",
  "pass_rate": 0.85,
  "payment_trigger": "full | prorated | none | error",
  "payment_status": "pending | processed",
  "audit_report": { ... },
  "created_at": "timestamp"
}
```

### What to Build
A page that:
1. Fetches projects using `useGetProjectsQuery()`
2. For each project, shows milestones and their AQA status
3. Displays verdict with color-coded badges:
   - "passed" → green badge
   - "partial" → yellow badge
   - "failed" → red badge
   - "error" → gray badge
4. Shows pass_rate as a percentage (e.g., "85%")
5. Shows payment_trigger status
6. Has a loading state and empty state ("No AQA reviews yet")

### How to Fetch AQA Data
Since there's no single "get all AQA results" endpoint, use the projects data:
```typescript
const { data: projects } = useGetProjectsQuery();
// For each project, user can see milestones
// Show milestones with status 'passed', 'failed', 'paid' as completed reviews
```

If `runAQAs` mutation exists in projectsApi.ts, you can also allow triggering an AQA from this page.

### Design Guidelines
- Match the design of other dashboard pages (check clients/page.tsx or projects/page.tsx for patterns)
- Use the same card/table style, same color scheme (charcoal black, French beige theme)
- Keep it simple — this is a view page, not a complex interaction

---

## Completion Checklist
### PFI Page
- [ ] Read pfi-score/page.tsx fully before changes
- [ ] Real pfi_score value displayed (not hardcoded)
- [ ] Real trust_score value displayed
- [ ] Score visualized with color-coded progress bar (0-1000 scale)
- [ ] Empty pfi_history array UI replaced with explanatory text OR removed
- [ ] Empty recent_activity array UI replaced with meaningful content OR removed
- [ ] Loading state handled
- [ ] No hardcoded mock data remaining

### AI Reviews Page
- [ ] Read ai-reviews/page.tsx and projectsApi.ts before building
- [ ] Page shows real project/milestone data
- [ ] AQA verdicts shown with color-coded badges
- [ ] Pass rate shown as percentage
- [ ] Loading state handled
- [ ] Empty state handled ("No reviews yet")
- [ ] Design matches other dashboard pages
- [ ] No TypeScript errors

---

## PROMPT TO USE (paste this into your Claude session)

```
You are working on the frontend dashboard of an AI Freelance Escrow platform. Two pages need work:

1. frontend/app/dashboard/pfi-score/page.tsx — Fetches real user data but ignores it,
   showing hardcoded empty mock arrays instead. Needs to display real pfi_score/trust_score
   and remove broken empty-state UI.

2. frontend/app/dashboard/ai-reviews/page.tsx — Currently just "coming soon..." placeholder.
   Needs to be built as a real page showing AQA (AI quality check) results.

Read the full session file at SESSIONS/SESSION_6_PFI_AI_REVIEWS.md first — it has exact
backend response shapes, what the pages should show, and design guidelines.

RULES:
- Read both page files AND projectsApi.ts AND baseApi.ts before writing any code
- Only modify the two page files listed
- Match the existing design style of other dashboard pages
- For the AI reviews page: use existing RTK Query hooks, don't invent new API calls
- Handle loading and empty states
- No TypeScript errors
- Work through the checklist one item at a time — complete PFI page first, then AI reviews
```
