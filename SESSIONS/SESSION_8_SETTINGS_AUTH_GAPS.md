# SESSION 8 — Build Settings Page + Fix Auth/Schema Gaps

## Priority: MEDIUM
## Estimated effort: 60-90 min

---

## Project Context
This is an AI Freelance Escrow platform. This session handles 3 independent cleanup tasks:
1. Build the Settings page (currently "coming soon..." placeholder)
2. Fix a missing authorization check in submission.service.ts
3. Fix a hardcoded contract_id in verificationContract.service.ts

---

## Your Scope
**Only touch:**
- `frontend/app/dashboard/settings/page.tsx`
- `escrow-service/src/modules/submissions/submission.service.ts`
- `escrow-service/src/modules/verification-contracts/verificationContract.service.ts`

**Do NOT touch:** any other files

---

## Read These Files First (in order)
1. `frontend/app/dashboard/settings/page.tsx` — current placeholder
2. `frontend/app/dashboard/profile/page.tsx` — for design reference and RTK Query patterns
3. `frontend/app/store/api/projectsApi.ts` — find getUserProfile and updateUserProfile endpoints
4. `frontend/app/dashboard/clients/page.tsx` — for design style reference
5. `escrow-service/src/modules/submissions/submission.service.ts` — find the TODO
6. `escrow-service/src/modules/verification-contracts/verificationContract.service.ts` — find the hardcoded ID

---

## TASK 1: Build Settings Page

### What to Build
A settings page at `/dashboard/settings` that lets users update their account info.

### What the Backend Supports
Check `projectsApi.ts` for `getUserProfile` and `updateUserProfile` endpoints.
The user object has: user_id, email, role, pfi_score, trust_score, github_token (or github_url),
razorpay_account_id, created_at

### Sections to Include

**Section 1: Account Information (read-only display)**
- Email address (cannot be changed — just display it)
- Role (Employer / Freelancer — just display it)
- Account created date

**Section 2: Profile Settings (editable)**
- GitHub URL / GitHub username (freelancers link their GitHub for AQA checks)
  - Input field for github_url or github_token
  - Save button that calls updateUserProfile

**Section 3: Payment Settings (display only)**
- Razorpay Account ID (display current value if set, "Not connected" if null)
- Note: "Contact support to update payment account"

**Section 4: Security**
- A static section explaining: "To change your password, log out and use the forgot password flow"
  (no actual password change functionality needed — backend doesn't have that endpoint)

### Design Rules
- Match the design style of other dashboard pages
- Look at profile/page.tsx and clients/page.tsx for the card/form patterns used
- Use the same color scheme (charcoal black, French beige, consistent with the luxury theme)
- Use RTK Query hooks: `useGetUserProfileQuery()` for display, mutation for save
- Show loading state while fetching
- Show success/error toast or inline message after save
- Keep it simple — no complex interactions needed

### Important: Check What updateUserProfile Actually Accepts
Before building the form, check if `updateUserProfile` endpoint exists in projectsApi.ts
and what fields it accepts. If the update endpoint doesn't exist, make the whole page
read-only (just display the data, no edit functionality).

---

## TASK 2: Fix Submission Authorization Gap

### The Bug
**File:** `escrow-service/src/modules/submissions/submission.service.ts`
**Location:** `getSubmission()` method / `getSubmissionById()` method
**Problem:** There is a TODO comment: "Add authorization check - user can only view their own submissions"
The method returns a submission to anyone who knows the submission_id — no ownership check.

### How to Fix
After fetching the submission, add an authorization check:
```typescript
async getSubmissionById(submissionId: string, requestingUserId: string): Promise<Submission> {
  const submission = await db('submissions').where('submission_id', submissionId).first();
  if (!submission) throw new Error('Submission not found');
  
  // Authorization: only the freelancer who submitted can view it
  if (submission.user_id !== requestingUserId) {
    throw new Error('Unauthorized: you do not own this submission');
  }
  
  return submission;
}
```

**Also update the controller** that calls this method to pass the authenticated user's ID.
In the controller: `req.user.user_id` should be available (set by `authenticateToken` middleware).

Read the submission controller to understand how to pass the user_id. The pattern is used
in other controllers (e.g., project.controller.ts or wallet.controller.ts).

---

## TASK 3: Fix Hardcoded contract_id in VerificationContract

### The Bug
**File:** `escrow-service/src/modules/verification-contracts/verificationContract.service.ts`
**Location:** The `createVerificationContract()` method insert
**Problem:** `contract_id` is hardcoded to `1` on insert (should be a UUID)

### How to Fix
Look at how other services generate UUIDs. They likely use the `uuid` npm package:
```typescript
import { v4 as uuidv4 } from 'uuid';

// In createVerificationContract():
await db('verification_contracts').insert({
  verification_contract_id: uuidv4(),  // was hardcoded to 1
  // ... other fields
});
```

Read the file first to see the exact field name used for the primary key
(it might be `verification_contract_id`, `contract_id`, or similar).
Then replace the hardcoded value with `uuidv4()`.

---

## Completion Checklist
### Settings Page
- [ ] Read settings/page.tsx, profile/page.tsx, projectsApi.ts before building
- [ ] Account info section built (email, role, created_at — read only)
- [ ] Profile settings section built (github_url editable if updateUserProfile exists)
- [ ] Payment settings section built (razorpay_account_id display only)
- [ ] Security section built (static text, no functionality)
- [ ] Loading state handled
- [ ] Save feedback handled (success/error message)
- [ ] Design matches other dashboard pages

### Auth Gap
- [ ] Read submission.service.ts fully before changing
- [ ] getSubmissionById() has user ownership check
- [ ] Controller passes requestingUserId to service
- [ ] Throws proper error on unauthorized access
- [ ] TypeScript compiles

### Contract ID
- [ ] Read verificationContract.service.ts before changing
- [ ] Hardcoded ID replaced with uuidv4()
- [ ] uuid import added if not present
- [ ] TypeScript compiles

---

## PROMPT TO USE (paste this into your Claude session)

```
You are working on an AI Freelance Escrow platform. This session has 3 independent tasks:

1. Build the settings page at frontend/app/dashboard/settings/page.tsx (currently placeholder)
2. Add an authorization check to submission.service.ts (has a TODO for this)
3. Fix a hardcoded contract_id (value: 1) in verificationContract.service.ts

Read the full session file at SESSIONS/SESSION_8_SETTINGS_AUTH_GAPS.md first — it has exact
descriptions of each task, what to build, and what the fixes should look like.

RULES:
- Read ALL files in the "Read First" list before making any changes
- Only touch the 3 files listed in "Your Scope"
- For the settings page: check what API endpoints actually exist before building forms
- For the submission auth fix: follow the same pattern as other controllers for user_id passing
- For the contract ID: use uuid v4, match the import style of other service files
- After backend changes: run npx tsc --noEmit in escrow-service/ to verify TypeScript
- Do NOT touch any files outside your scope
- Work through tasks in order: settings page → auth gap → contract ID
```
