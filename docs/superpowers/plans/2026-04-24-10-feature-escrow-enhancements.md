# 10-Feature Escrow Enhancements Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement 10 enhancements covering Figma check routing, revision enforcement, AQA resilience, escrow lifecycle completion, dispute visibility, submission type validation, and UI polish.

**Architecture:** Changes span three layers — (1) backend check/AQA/SOP logic in `escrow-service/src/modules/ai/` and `aqa/`, (2) backend domain services in `submissions/`, `disputes/`, `wallets/`, and (3) frontend pages and layout in `frontend/app/dashboard/`. All backend tasks produce TypeScript that must compile clean. No new DB migrations are needed (all referenced columns already exist).

**Tech Stack:** Node.js/Express/TypeScript, Next.js 14/RTK Query/Tailwind, SQLite/Knex, `@google/generative-ai`

---

## File Map

| File | Tasks |
|---|---|
| `escrow-service/src/modules/ai/check.runners.ts` | Task 1 (Figma + localhost) |
| `escrow-service/src/modules/ai/sop.generator.ts` | Task 2 (remove Figma from prompt) |
| `escrow-service/src/modules/wallets/wallet.service.ts` | Task 3 (add escrow_refund type) |
| `escrow-service/src/modules/submissions/submission.service.ts` | Task 4 (block revision_exhausted) |
| `escrow-service/src/modules/submissions/submission.controller.ts` | Task 5 (type validation) |
| `escrow-service/src/modules/aqa/aqa.service.ts` | Task 6 (revision logic + timeout + project completion) |
| `escrow-service/src/modules/disputes/dispute.service.ts` | Task 7 (getDisputesForUser) |
| `escrow-service/src/modules/disputes/dispute.controller.ts` | Task 7 (wire new method) |
| `frontend/app/dashboard/milestones/page.tsx` | Task 8 (disable exhausted + deadline badges) |
| `frontend/app/dashboard/settings/page.tsx` | Task 9 (simulated payments + wallet) |
| `frontend/app/dashboard/layout.tsx` | Task 10 (disputes badge) |

---

## Task 1: check.runners.ts — Figma handlers + localhost detection

**Files:**
- Modify: `escrow-service/src/modules/ai/check.runners.ts`

- [ ] **Step 1: Add localhost detection in `runHttpEndpoint` before the axios call**

Inside `runHttpEndpoint`, immediately after the `if (!baseUrl?.trim())` block and before `const url = ...`:

```typescript
const localhostPatterns = ['localhost', '127.0.0.1', '0.0.0.0'];
if (localhostPatterns.some(p => baseUrl.includes(p))) {
  check.result = 'partial';
  check.evidence = 'Server-side AQA cannot reach localhost endpoints. Deploy your server or provide a public URL. Manual verification required.';
  check.verified_by = 'manual';
  return check;
}
```

- [ ] **Step 2: Add Figma cases to the `runCheck` switch statement**

In the `switch (checkType)` block, before the `default:` case, add:

```typescript
case 'figma_frame_count':
case 'figma_color_palette':
case 'figma_component_names':
  check.result = 'partial';
  check.evidence = 'Figma metadata check requires manual verification. Freelancer should submit Figma link in submission content.';
  check.verified_by = 'manual';
  break;
```

- [ ] **Step 3: Verify the final shape of the affected sections matches**

The `runHttpEndpoint` function should now begin:
```typescript
async function runHttpEndpoint(check: VerificationCheck, baseUrl: string): Promise<VerificationCheck> {
  const { method = 'GET', endpoint = '', expected_status = 200, expected_field } = check.params;

  if (!baseUrl?.trim()) {
    check.result = 'partial';
    check.evidence = 'No server URL provided. Endpoint check skipped. Manual verification required.';
    check.verified_by = 'manual';
    return check;
  }

  const localhostPatterns = ['localhost', '127.0.0.1', '0.0.0.0'];
  if (localhostPatterns.some(p => baseUrl.includes(p))) {
    check.result = 'partial';
    check.evidence = 'Server-side AQA cannot reach localhost endpoints. Deploy your server or provide a public URL. Manual verification required.';
    check.verified_by = 'manual';
    return check;
  }

  const url = `${baseUrl.replace(/\/$/, '')}/${endpoint.replace(/^\//, '')}`;
  // ... rest unchanged
```

And the switch in `runCheck` should have the three Figma cases before `default`.

---

## Task 2: sop.generator.ts — Remove Figma types from prompt and validator

**Files:**
- Modify: `escrow-service/src/modules/ai/sop.generator.ts`

- [ ] **Step 1: Update the system prompt's allowed check types list**

In `buildSystemPrompt()`, replace the line:
```
   - figma_frame_count, figma_color_palette, figma_component_names (for design metadata)
```
with nothing (delete it entirely). The design row should become:
```
   - design_visual (for visual analysis of submitted design screenshots using AI Vision)
```

Also in the same prompt, remove the sentence:
```
- For "design" domain: Use "design_visual" checks for visual quality analysis. You may also use figma checks for metadata verification.
```
Replace with:
```
- For "design" domain: Use "design_visual" checks for visual quality analysis using AI Vision.
```

- [ ] **Step 2: Update `validateSOPQuality` to remove Figma types from design check**

Find this block in `validateSOPQuality`:
```typescript
} else if (domain.toLowerCase() === 'design') {
  const designTypes = new Set(['figma_frame_count', 'figma_color_palette', 'figma_component_names', 'design_visual']);
  const hasDesignCheck = allChecks.some((c: any) => designTypes.has(c.type));
  if (!hasDesignCheck) {
    return { valid: false, reason: 'Design project needs design_visual or Figma checks' };
  }
}
```

Replace with:
```typescript
} else if (domain.toLowerCase() === 'design') {
  const hasDesignCheck = allChecks.some((c: any) => c.type === 'design_visual');
  if (!hasDesignCheck) {
    return { valid: false, reason: 'Design project needs at least one design_visual check' };
  }
}
```

---

## Task 3: wallet.service.ts — Add escrow_refund type

**Files:**
- Modify: `escrow-service/src/modules/wallets/wallet.service.ts`

- [ ] **Step 1: Update `addCredits` type parameter to include `escrow_refund`**

Find:
```typescript
async addCredits(
  freelancerId: string, 
  amount: number, 
  description: string,
  milestoneId?: string,
  type: 'milestone_payment' | 'bonus' | 'refund' = 'milestone_payment'
): Promise<WalletTransaction> {
```

Replace with:
```typescript
async addCredits(
  freelancerId: string, 
  amount: number, 
  description: string,
  milestoneId?: string,
  type: 'milestone_payment' | 'bonus' | 'refund' | 'escrow_refund' = 'milestone_payment'
): Promise<WalletTransaction> {
```

---

## Task 4: submission.service.ts — Block revision_exhausted submissions

**Files:**
- Modify: `escrow-service/src/modules/submissions/submission.service.ts`

- [ ] **Step 1: Block new submissions on exhausted milestones**

In `createSubmission`, after the block that fetches the milestone and before the project authorization check, add:

```typescript
if (milestone.status === 'revision_exhausted') {
  await trx.rollback();
  throw new Error('Milestone revisions exhausted: no further submissions allowed');
}
```

The full section around it should look like:
```typescript
const milestone = await trx('milestone_checks')
  .where({ milestone_id: data.milestone_id, project_id: data.project_id })
  .first();

if (!milestone) {
  await trx.rollback();
  throw new Error('Milestone not found');
}

if (milestone.status === 'revision_exhausted') {
  await trx.rollback();
  throw new Error('Milestone revisions exhausted: no further submissions allowed');
}

const project = await trx('projects')
  .where({ project_id: data.project_id })
  .first();
```

- [ ] **Step 2: Handle revision_exhausted in error response in submission.controller.ts**

In `submission.controller.ts`, in the catch block of `createSubmission`, add a handler for the revisions exhausted message:

```typescript
if (error.message.includes('revisions exhausted')) {
  res.status(409).json({ error: error.message });
  return;
}
```

Place it after the `already exists` check block:
```typescript
if (error.message.includes('already exists')) {
  res.status(409).json({ error: error.message });
  return;
}

if (error.message.includes('revisions exhausted')) {
  res.status(409).json({ error: error.message });
  return;
}
```

---

## Task 5: submission.controller.ts — Type-specific validation

**Files:**
- Modify: `escrow-service/src/modules/submissions/submission.controller.ts`

- [ ] **Step 1: Expand allowed types and add per-type validation**

Find:
```typescript
if (!type || !['code', 'content', 'design', 'mixed'].includes(type)) {
  res.status(400).json({ error: 'type is required and must be one of: code, content, design, mixed' });
  return;
}
```

Replace with:
```typescript
const validTypes = ['code', 'content', 'design', 'mixed', 'documentation', 'other'];
if (!type || !validTypes.includes(type)) {
  res.status(400).json({ error: `type is required and must be one of: ${validTypes.join(', ')}` });
  return;
}

if (type === 'code' && !repo_url) {
  res.status(400).json({ error: 'Code submissions require a repository URL' });
  return;
}

if (type === 'design' && !content) {
  res.status(400).json({ error: 'Design submissions require an image URL in the content field' });
  return;
}

if (type === 'documentation' && !content) {
  res.status(400).json({ error: 'Documentation submissions require content text' });
  return;
}
```

Also update the generic validation that follows to not double-check:

Find:
```typescript
if (!content && !repo_url) {
  res.status(400).json({ error: 'Either content or repo_url must be provided' });
  return;
}
```

Keep this line as-is (it still catches 'other' and 'mixed' types).

---

## Task 6: aqa.service.ts — Revision logic + AQA timeout + project completion

**Files:**
- Modify: `escrow-service/src/modules/aqa/aqa.service.ts`

- [ ] **Step 1: Update `canRunAQA` with timeout reset**

Find the existing `aqa_running` guard:
```typescript
if (submission.status === 'aqa_running') return { canRun: false, reason: 'AQA already running for this submission' };
```

Replace with:
```typescript
if (submission.status === 'aqa_running') {
  const staleCutoff = 600000; // 10 minutes in ms
  const updatedAt = new Date(submission.updated_at).getTime();
  if (new Date().getTime() - updatedAt > staleCutoff) {
    await this.submissionService.updateSubmissionStatus(submission.submission_id, 'submitted');
  } else {
    return { canRun: false, reason: 'AQA already running for this submission' };
  }
}
```

- [ ] **Step 2: Add `applyRevisionLogic` private method**

Add this method to the `AQAService` class (place it before `storeAQAResult`):

```typescript
private async applyRevisionLogic(trx: any, milestoneId: string): Promise<void> {
  const milestone = await trx('milestone_checks').where({ milestone_id: milestoneId }).first();
  if (!milestone) return;

  if (milestone.revisions_used < milestone.max_revisions) {
    await trx('milestone_checks')
      .where({ milestone_id: milestoneId })
      .update({
        revisions_used: milestone.revisions_used + 1,
        status: 'pending'
      });
    logger.info('Revision applied, milestone reset to pending', {
      milestone_id: milestoneId,
      revisions_used: milestone.revisions_used + 1,
      max_revisions: milestone.max_revisions
    });
  } else {
    await trx('milestone_checks')
      .where({ milestone_id: milestoneId })
      .update({ status: 'revision_exhausted' });
    logger.info('Revision limit reached, milestone marked exhausted', {
      milestone_id: milestoneId
    });
  }
}
```

- [ ] **Step 3: Add `checkAndCompleteProject` private method**

Add this method after `applyRevisionLogic`:

```typescript
private async checkAndCompleteProject(trx: any, milestoneId: string): Promise<void> {
  try {
    const milestone = await trx('milestone_checks').where({ milestone_id: milestoneId }).first();
    if (!milestone) return;

    const allMilestones = await trx('milestone_checks').where({ project_id: milestone.project_id });
    const terminalStatuses = new Set(['paid', 'revision_exhausted']);
    const allDone = allMilestones.every((m: any) => terminalStatuses.has(m.status));

    if (!allDone) return;

    const project = await trx('projects').where({ project_id: milestone.project_id }).first();
    if (!project || project.status === 'completed') return;

    await trx('projects')
      .where({ project_id: project.project_id })
      .update({ status: 'completed' });

    if (project.escrow_balance > 0) {
      const { WalletService } = await import('../wallets/wallet.service');
      const walletService = new WalletService();
      await walletService.addCredits(
        project.employer_id,
        project.escrow_balance,
        `Escrow refund for completed project ${project.project_id}`,
        undefined,
        'escrow_refund'
      );
      await trx('projects')
        .where({ project_id: project.project_id })
        .update({ escrow_balance: 0 });
    }

    logger.info('Project marked completed and escrow balance refunded', {
      project_id: project.project_id,
      refund_amount: project.escrow_balance
    });
  } catch (error) {
    logger.error('Error in checkAndCompleteProject', error);
  }
}
```

- [ ] **Step 4: Wire `applyRevisionLogic` and `checkAndCompleteProject` into `runAQA`**

In `runAQA`, find these lines inside the transaction:
```typescript
await this.submissionService.updateMilestoneStatus(milestone.milestone_id, aqaResult.verdict);
await this.processPaymentTrigger(trx, aqaResult);
await this.updatePfiScore(submission.user_id, aqaResult.verdict);
```

Replace with:
```typescript
await this.submissionService.updateMilestoneStatus(milestone.milestone_id, aqaResult.verdict);
if (aqaResult.verdict === 'failed') {
  await this.applyRevisionLogic(trx, milestone.milestone_id);
}
await this.processPaymentTrigger(trx, aqaResult);
await this.checkAndCompleteProject(trx, milestone.milestone_id);
await this.updatePfiScore(submission.user_id, aqaResult.verdict);
```

---

## Task 7: dispute.service.ts + controller — Visibility fix

**Files:**
- Modify: `escrow-service/src/modules/disputes/dispute.service.ts`
- Modify: `escrow-service/src/modules/disputes/dispute.controller.ts`

- [ ] **Step 1: Add `getDisputesForUser` method to DisputeService**

Add this method after `getDisputesByUser`:

```typescript
async getDisputesForUser(userId: string): Promise<Dispute[]> {
  try {
    const userProjects = await db('projects')
      .where({ freelancer_id: userId })
      .orWhere({ employer_id: userId })
      .select('project_id');

    const projectIds = userProjects.map((p: any) => p.project_id);

    return await db('disputes')
      .where({ raised_by: userId })
      .orWhereIn('project_id', projectIds)
      .orderBy('created_at', 'desc');
  } catch (error) {
    logger.error('Error fetching disputes for user', error);
    throw new Error('Error fetching disputes');
  }
}
```

- [ ] **Step 2: Update `getMyDisputes` controller to use `getDisputesForUser`**

In `dispute.controller.ts`, find `getMyDisputes`:
```typescript
const disputes = await this.disputeService.getDisputesByUser(user.userId);
```

Replace with:
```typescript
const disputes = await this.disputeService.getDisputesForUser(user.userId);
```

---

## Task 8: Frontend milestones page — Disable exhausted submit + deadline badges

**Files:**
- Modify: `frontend/app/dashboard/milestones/page.tsx`

- [ ] **Step 1: Add deadline helper functions after `formatDate`**

Add these two functions after the `formatDate` function definition:

```typescript
const isOverdue = (deadline: string, status: string) => {
  if (status !== 'pending') return false
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return new Date(deadline) < today
}

const isDueSoon = (deadline: string, status: string) => {
  if (status !== 'pending') return false
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const deadline2 = new Date(deadline)
  const twoDays = new Date(today)
  twoDays.setDate(twoDays.getDate() + 2)
  return deadline2 >= today && deadline2 <= twoDays
}
```

- [ ] **Step 2: Add OVERDUE/DUE SOON badges to the deadline cell**

Find the deadline `<td>`:
```tsx
<td className="px-6 py-4 whitespace-nowrap">
  <div className="flex items-center text-sm text-gray-900">
    <Calendar className="w-4 h-4 text-gray-400 mr-2" />
    {formatDate(milestone.deadline)}
  </div>
</td>
```

Replace with:
```tsx
<td className="px-6 py-4 whitespace-nowrap">
  <div className="flex items-center gap-2">
    <div className="flex items-center text-sm text-gray-900">
      <Calendar className="w-4 h-4 text-gray-400 mr-2" />
      {formatDate(milestone.deadline)}
    </div>
    {isOverdue(milestone.deadline, milestoneStatuses[milestone.milestone_id] || milestone.status) && (
      <span className="px-1.5 py-0.5 text-xs font-bold rounded bg-red-100 text-red-700 uppercase tracking-wide">
        OVERDUE
      </span>
    )}
    {!isOverdue(milestone.deadline, milestoneStatuses[milestone.milestone_id] || milestone.status) &&
      isDueSoon(milestone.deadline, milestoneStatuses[milestone.milestone_id] || milestone.status) && (
      <span className="px-1.5 py-0.5 text-xs font-bold rounded bg-yellow-100 text-yellow-700 uppercase tracking-wide">
        DUE SOON
      </span>
    )}
  </div>
</td>
```

- [ ] **Step 3: Disable Submit button for revision_exhausted milestones**

Find the Submit button:
```tsx
<button
  onClick={() => handleOpenSubmissionModal(milestone)}
  className="inline-flex items-center gap-1 px-2 py-1 bg-[#AD7D56] text-white text-xs font-medium rounded hover:bg-[#8B6344] transition-colors"
>
  <Send className="w-3 h-3" />
  Submit
</button>
```

Replace with:
```tsx
<button
  onClick={() => handleOpenSubmissionModal(milestone)}
  disabled={(milestoneStatuses[milestone.milestone_id] || milestone.status) === 'revision_exhausted'}
  className="inline-flex items-center gap-1 px-2 py-1 bg-[#AD7D56] text-white text-xs font-medium rounded hover:bg-[#8B6344] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
  title={(milestoneStatuses[milestone.milestone_id] || milestone.status) === 'revision_exhausted' ? 'No revisions remaining' : undefined}
>
  <Send className="w-3 h-3" />
  Submit
</button>
```

- [ ] **Step 4: Add revision_exhausted to `getStatusColor`**

Find in `getStatusColor`:
```typescript
default:
  return 'bg-gray-100 text-gray-800'
```

Add before `default`:
```typescript
case 'revision_exhausted':
  return 'bg-red-100 text-red-800'
```

---

## Task 9: Frontend settings page — Simulated payments + wallet balance

**Files:**
- Modify: `frontend/app/dashboard/settings/page.tsx`

- [ ] **Step 1: Import wallet API hook**

Add to the imports at the top:
```typescript
import { useGetWalletQuery } from '../../store/api/walletApi'
```

- [ ] **Step 2: Add wallet query inside the component**

After the existing hooks (`useGetUserProfileQuery`, `useUpdateUserProfileMutation`), add:
```typescript
const { data: walletData } = useGetWalletQuery(undefined, {
  skip: userProfile?.role !== 'freelancer'
})
```

Note: `walletData` may be undefined during loading but the section handles that gracefully.

- [ ] **Step 3: Replace the Razorpay Payment Settings section**

Find the entire Payment Settings section:
```tsx
{/* Section 3: Payment Settings */}
<div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
  <div className="flex items-center gap-2 mb-4">
    <CreditCard className="w-5 h-5 text-[#AD7D56]" />
    <h2 className="text-lg font-semibold text-gray-900">Payment Settings</h2>
  </div>
  <div>
    <label className="block text-sm font-medium text-gray-500 mb-1">Razorpay Account ID</label>
    <p className="text-gray-900">
      {userProfile.razorpay_account_id ?? 'Not connected'}
    </p>
    <p className="text-xs text-gray-500 mt-2">Contact support to update your payment account</p>
  </div>
</div>
```

Replace with:
```tsx
{/* Section 3: Payment Settings */}
<div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
  <div className="flex items-center gap-2 mb-4">
    <CreditCard className="w-5 h-5 text-[#AD7D56]" />
    <h2 className="text-lg font-semibold text-gray-900">Payment Settings</h2>
  </div>
  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
    <p className="text-sm font-medium text-blue-900 mb-1">Simulated Payments</p>
    <p className="text-sm text-blue-700">
      Payments in this demo are fully simulated — no real payment account is needed.
      Escrow funds are credited automatically when AQA checks pass.
    </p>
  </div>
  {userProfile.role === 'freelancer' && (
    <div>
      <label className="block text-sm font-medium text-gray-500 mb-1">Wallet Balance</label>
      <p className="text-2xl font-bold text-gray-900">
        {walletData
          ? new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(walletData.balance / 100)
          : '—'}
      </p>
      <p className="text-xs text-gray-500 mt-1">Available credits from completed milestones</p>
    </div>
  )}
</div>
```

---

## Task 10: Frontend layout — Disputes badge

**Files:**
- Modify: `frontend/app/dashboard/layout.tsx`

- [ ] **Step 1: Import `useGetMyDisputesQuery`**

Find the existing imports from RTK/Redux and add below them:
```typescript
import { useGetMyDisputesQuery } from '../store/api/projectsApi'
```

(Place it after the `import { getUserRole }` line.)

- [ ] **Step 2: Add disputes query inside the component**

After `const userRole = getUserRole() as UserRole`, add:
```typescript
const { data: myDisputes } = useGetMyDisputesQuery()
const openDisputeCount = myDisputes?.filter(d => d.status === 'open').length ?? 0
```

- [ ] **Step 3: Update menu item rendering to show badge for Disputes**

Find the navigation button rendering inside `{filteredMenuItems.map(...)}`:
```tsx
<button
  key={item.href}
  onClick={() => handleMenuClick(item.href)}
  className={`${isActive
    ? 'bg-[#AD7D56] text-white'
    : 'text-gray-400 hover:text-white hover:bg-gray-800'
    } w-full flex items-center space-x-3 px-3 py-2 rounded-lg transition-all duration-200`}
>
  <item.icon className="w-5 h-5 flex-shrink-0" />
  {!sidebarCollapsed && (
    <span className="text-sm font-medium">{item.label}</span>
  )}
</button>
```

Replace with:
```tsx
<button
  key={item.href}
  onClick={() => handleMenuClick(item.href)}
  className={`${isActive
    ? 'bg-[#AD7D56] text-white'
    : 'text-gray-400 hover:text-white hover:bg-gray-800'
    } w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200`}
>
  <item.icon className="w-5 h-5 flex-shrink-0" />
  {!sidebarCollapsed && (
    <>
      <span className="text-sm font-medium flex-1 text-left">{item.label}</span>
      {item.href === '/dashboard/disputes' && openDisputeCount > 0 && (
        <span className="bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center flex-shrink-0">
          {openDisputeCount > 9 ? '9+' : openDisputeCount}
        </span>
      )}
    </>
  )}
</button>
```

---

## Task 11: TypeScript compile check

**Files:**
- `escrow-service/` — run `npx tsc --noEmit`
- `frontend/` — run `npx tsc --noEmit`

- [ ] **Step 1: Run TypeScript check on escrow-service**

Run from `escrow-service/` directory:
```bash
npx tsc --noEmit
```
Expected: no errors. Fix any errors before proceeding.

Common fixes:
- `submission.updated_at` is typed as `Date` but comparison needs `.getTime()` — wrap with `new Date(submission.updated_at).getTime()`
- If `Dispute` type in the frontend `projectsApi.ts` doesn't have a `status` field, check what fields are declared in that file and use the correct property name

- [ ] **Step 2: Run TypeScript check on frontend**

Run from `frontend/` directory:
```bash
npx tsc --noEmit
```
Expected: no errors. Fix any errors before proceeding.

Common fixes:
- `walletData.balance` — check the `WalletData` interface in `walletApi.ts` to confirm the field name (`balance` vs `balance_cents`)
- If `useGetMyDisputesQuery` is not exported by name from `projectsApi.ts`, find the correct export name by searching the file for `getMyDisputes`

- [ ] **Step 3: Commit all changes**

```bash
git add escrow-service/src/modules/ai/check.runners.ts \
        escrow-service/src/modules/ai/sop.generator.ts \
        escrow-service/src/modules/wallets/wallet.service.ts \
        escrow-service/src/modules/submissions/submission.service.ts \
        escrow-service/src/modules/submissions/submission.controller.ts \
        escrow-service/src/modules/aqa/aqa.service.ts \
        escrow-service/src/modules/disputes/dispute.service.ts \
        escrow-service/src/modules/disputes/dispute.controller.ts \
        frontend/app/dashboard/milestones/page.tsx \
        frontend/app/dashboard/settings/page.tsx \
        frontend/app/dashboard/layout.tsx
git commit -m "feat: implement 10 escrow enhancements (figma routing, revisions, AQA timeout, project completion, disputes visibility, type validation, UI polish)"
```

---

## Self-Review Checklist

- [x] **Feature 1** (Figma handlers): Covered in Tasks 1 and 2
- [x] **Feature 2** (Revision enforcement): Covered in Tasks 4, 6, 8
- [x] **Feature 3** (Localhost detection): Covered in Task 1
- [x] **Feature 4** (AQA timeout): Covered in Task 6
- [x] **Feature 5** (Escrow refund): Covered in Tasks 3 and 6
- [x] **Feature 6** (Disputes visibility): Covered in Task 7
- [x] **Feature 7** (Submission type validation): Covered in Tasks 4 and 5
- [x] **Feature 8** (Settings cleanup): Covered in Task 9
- [x] **Feature 9** (Deadline badges): Covered in Task 8
- [x] **Feature 10** (Disputes badge): Covered in Task 10
- [x] **Type consistency**: `applyRevisionLogic(trx, milestoneId)` and `checkAndCompleteProject(trx, milestoneId)` are called consistently throughout Tasks 6
- [x] **No placeholders**: All code is fully written out
- [x] **walletApi balance field**: Task 9 notes to verify `balance` vs `balance_cents` in the compile step
