# SESSION 12 — Frontend Final Polish

## Priority: MEDIUM
## Estimated effort: 30-45 min

---

## Project Context
Frontend Next.js app at `frontend/`. Two specific issues remain:
1. `ProjectTable.tsx` uses `window.location.reload()` causing a full page refresh instead of
   a clean RTK Query refetch
2. The Next.js API route at `app/api/projects/[id]/routes.ts` only has a `PUT` handler —
   missing `GET` and `DELETE`

---

## Your Scope
**Only touch:**
- `frontend/app/components/ProjectTable.tsx`
- `frontend/app/api/projects/[id]/routes.ts`

**Do NOT touch:** any other files

---

## Read These Files First (in order)
1. `frontend/app/components/ProjectTable.tsx` — full file
2. `frontend/app/api/projects/[id]/routes.ts` — full file
3. `frontend/app/api/projects/routes.ts` — for GET pattern reference
4. `frontend/app/store/api/projectsApi.ts` — to see what RTK Query hooks exist

---

## TASK 1: Fix window.location.reload() in ProjectTable.tsx

**Current code at line ~141:**
```typescript
const handleBriefSuccess = () => {
  window.location.reload()
}
```

**Fix:** Use RTK Query's `refetch` instead of reloading the whole page.

The component already calls `useGetProjectsQuery()` somewhere. That hook returns a `refetch`
function. Extract it and use it:

```typescript
const { data: projectsData, isLoading, refetch } = useGetProjectsQuery();

const handleBriefSuccess = () => {
  refetch();
}
```

Read the file to find the exact variable name used for the projects query and extract `refetch`
from it. If the query is called multiple times or differently, find the right one.

Also check if `window.location.reload()` appears anywhere else in the file — replace all instances.

---

## TASK 2: Add GET and DELETE to projects/[id]/routes.ts

The file currently only exports `PUT`. Add `GET` and `DELETE` following the exact same pattern
as the existing `PUT` and as seen in the root `projects/routes.ts` file.

**GET handler:**
```typescript
export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const backendUrl = process.env.BACKEND_URL || 'http://localhost:3000';
    const authHeader = req.headers.get('Authorization');

    const response = await fetch(`${backendUrl}/projects/${params.id}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(authHeader ? { Authorization: authHeader } : {}),
      },
    });

    const data = await response.json();
    return Response.json(data, { status: response.status });
  } catch (error) {
    return Response.json({ error: 'Failed to fetch project' }, { status: 500 });
  }
}
```

**DELETE handler:**
```typescript
export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const backendUrl = process.env.BACKEND_URL || 'http://localhost:3000';
    const authHeader = req.headers.get('Authorization');

    const response = await fetch(`${backendUrl}/projects/${params.id}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        ...(authHeader ? { Authorization: authHeader } : {}),
      },
    });

    const data = await response.json();
    return Response.json(data, { status: response.status });
  } catch (error) {
    return Response.json({ error: 'Failed to delete project' }, { status: 500 });
  }
}
```

Read the existing PUT handler first — match its exact style for auth header forwarding and
error handling.

---

## Completion Checklist
- [ ] Read ProjectTable.tsx fully — find the useGetProjectsQuery hook call
- [ ] Extract `refetch` from the query hook
- [ ] All `window.location.reload()` calls replaced with `refetch()`
- [ ] Read projects/[id]/routes.ts fully
- [ ] GET handler added following existing PUT pattern
- [ ] DELETE handler added following existing PUT pattern
- [ ] Both handlers forward Authorization header
- [ ] Both handlers use BACKEND_URL env var

---

## PROMPT TO USE

```
Working directory: d:/khyber/ai-freelance-escrow-agent
Session: SESSIONS/SESSION_12_FRONTEND_POLISH.md

Read SESSIONS/INDEX.md then read the session file above completely, then read every file in its "Read These Files First" list. Only then start making changes.

Rules:
- Only touch files listed in "Your Scope" in the session file
- Work through the checklist one item at a time
- Do not refactor, add comments, or touch files outside your scope
- End by confirming every checklist item is complete
```
