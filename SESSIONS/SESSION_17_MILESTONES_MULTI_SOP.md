# SESSION 17 — Milestones Page: Multi-SOP Fix

## Priority: MEDIUM
## Estimated effort: 20-30 min
## Independent: YES — only touches milestones/page.tsx

---

## Project Context
This is an AI Freelance Escrow platform with Next.js frontend.
A project can have multiple SOPs (Standard Operating Procedures). Each SOP has milestones.
The milestones page at `/dashboard/milestones` lets the freelancer select a project and see
all of its milestones.

**The Bug:** The milestones page fetches the list of SOPs for the selected project
(`useGetProjectSOPsQuery`), extracts their IDs into `sopIds`, then calls
`useGetSOPMilestonesQuery(sopIds[0])` — using only the FIRST SOP ID. If a project has
2 or more SOPs, milestones from SOP 2+ are silently never shown.

**The Fix:** There is already a `useGetProjectMilestonesQuery(projectId)` hook available in
`projectsApi.ts` that calls `GET /projects/:projectId/milestones` directly. This endpoint
returns ALL milestones for the project regardless of how many SOPs exist. Switch to this hook.

---

## Your Scope
**Only touch:**
- `frontend/app/dashboard/milestones/page.tsx`

**Do NOT touch:** any other files.

---

## Read These Files First (in order)
1. `frontend/app/dashboard/milestones/page.tsx` — full current implementation
2. `frontend/app/store/api/projectsApi.ts` — confirm useGetProjectMilestonesQuery exists
   and what it returns (look for `getProjectMilestones` builder entry and the exported hook)

---

## The Fix in Detail

### Current (broken) code in milestones/page.tsx:

```tsx
// Get SOPs for the selected project to find SOP IDs
const { data: projectSOPs, isLoading: sopsLoading, error: sopsError } = useGetProjectSOPsQuery(
  selectedProjectId,
  { skip: !selectedProjectId }
)

// Get milestones for all SOPs in the project (we'll filter by project_id)
const sopIds = projectSOPs?.map((sop, index) => sop.sop_id) || []

const { data: allMilestones, isLoading: milestonesLoading, error: milestonesError } = useGetSOPMilestonesQuery(
  sopIds.length > 0 ? sopIds[0] : '',  // ← BUG: only uses first SOP
  { skip: sopIds.length === 0 }
)

// Filter milestones by the selected project ID
const filteredMilestones = allMilestones?.filter(
  milestone => milestone.project_id === selectedProjectId
) || []
```

### Fixed code:

Replace the entire block above (the SOP query + sopIds + SOPMilestones query + filteredMilestones)
with a single direct query:

```tsx
// Fetch all milestones for the selected project directly
const {
  data: filteredMilestones = [],
  isLoading: milestonesLoading,
  error: milestonesError
} = useGetProjectMilestonesQuery(
  selectedProjectId,
  { skip: !selectedProjectId }
)
```

### What else to update after this change:

1. **Remove unused state/variables**: The `projectSOPs`, `sopsLoading`, `sopsError`, `sopIds`
   variables no longer exist. Find every place they are referenced in the JSX and remove
   those references:
   - The "SOPs Loading" loading block (shows spinner while `sopsLoading`)
   - The "SOPs Error" error block (shows error when `sopsError`)
   - Any conditional that references `sopsLoading` or `sopsError`

2. **Remove unused import**: `useGetProjectSOPsQuery` and `useGetSOPMilestonesQuery` may no
   longer be needed. Remove them from the import line at the top if they are no longer used
   anywhere else in the file. Check carefully — `useGetProjectMilestonesQuery` must remain.

3. **The `filteredMilestones` variable already has the right name** — the rest of the JSX
   that renders the milestones table and "No Milestones Found" empty state references
   `filteredMilestones` which still works.

4. **Loading and error states still work** — `milestonesLoading` and `milestonesError`
   are still available from the new query and the corresponding JSX blocks can stay.

### Verify the import line
After the fix, the import from `projectsApi` should include `useGetProjectMilestonesQuery`
and NOT include `useGetProjectSOPsQuery` or `useGetSOPMilestonesQuery` (unless they are
used elsewhere in the file, which they are not).

---

## Completion Checklist
- [ ] Read milestones/page.tsx fully before changing
- [ ] Confirmed useGetProjectMilestonesQuery exists in projectsApi.ts and returns Milestone[]
- [ ] Replaced the SOP-based milestone fetching with useGetProjectMilestonesQuery(selectedProjectId)
- [ ] Removed projectSOPs, sopsLoading, sopsError, sopIds variables
- [ ] Removed "SOPs Loading" JSX block
- [ ] Removed "SOPs Error" JSX block
- [ ] Removed useGetProjectSOPsQuery and useGetSOPMilestonesQuery from imports (if unused)
- [ ] useGetProjectMilestonesQuery is in the import line
- [ ] filteredMilestones is still available for the table rendering JSX
- [ ] No TypeScript errors (variable references still work)

---

## PROMPT TO USE (paste this into your Claude session)

```
You are working on an AI Freelance Escrow platform frontend (Next.js/TypeScript).
This session has one focused task:

Fix the milestones page at frontend/app/dashboard/milestones/page.tsx. Currently it fetches
milestones using useGetSOPMilestonesQuery(sopIds[0]) which only gets milestones from the FIRST
SOP of a project. Projects can have multiple SOPs, so milestones from SOP 2+ are never shown.

The fix: replace the SOP-based fetching with useGetProjectMilestonesQuery(selectedProjectId)
which already exists in projectsApi.ts and fetches ALL milestones for a project directly.

Read the full session file at SESSIONS/SESSION_17_MILESTONES_MULTI_SOP.md first — it has
the exact before/after code.

RULES:
- Read milestones/page.tsx and projectsApi.ts before making changes
- Only touch frontend/app/dashboard/milestones/page.tsx
- Remove the SOP query + sopIds + SOPMilestones query + filteredMilestones filter block
- Replace with a single useGetProjectMilestonesQuery(selectedProjectId) call
- Remove the "SOPs Loading" and "SOPs Error" JSX blocks (they're no longer needed)
- Remove now-unused imports (useGetProjectSOPsQuery, useGetSOPMilestonesQuery)
- Do NOT touch any other files
```
