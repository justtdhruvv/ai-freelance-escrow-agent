# SESSION 18 — Dashboard: Remove Hardcoded Growth Metrics

## Priority: LOW-MEDIUM
## Estimated effort: 20-30 min
## Independent: YES — only touches dashboard/page.tsx

---

## Project Context
This is an AI Freelance Escrow platform with Next.js frontend.
The main dashboard at `/dashboard` shows summary stats cards (Total Projects, Active Projects,
Total Value, etc.). Each stat card has a `growth` field shown as a small percentage badge
(e.g., "+12% this month"). These growth values are hardcoded fake strings that never change
regardless of actual project data.

Real growth calculation would require historical data (e.g., comparing this month vs last month)
which the current API does not return. The fix is to remove the fake growth percentages entirely
and show a neutral "--" or remove the growth badge altogether.

---

## Your Scope
**Only touch:**
- `frontend/app/dashboard/page.tsx`

**Do NOT touch:** any other files, API files, or backend files.

---

## Read These Files First
1. `frontend/app/dashboard/page.tsx` — find all hardcoded growth strings

---

## The Bug in Detail

In `dashboard/page.tsx`, look for the stats array that looks like:

```tsx
{ label: 'Total Projects', value: totalProjects, growth: '+12%' },
{ label: 'Active Projects', value: activeProjects, growth: '' },
{ label: 'Total Value', value: ..., growth: '+18%' },
```

The `growth: '+12%'` and `growth: '+18%'` values are hardcoded strings. They are not
calculated from any data and will always show these same values forever. There may also
be other places in the file where growth percentages are shown for individual project rows
or summary sections.

---

## How to Fix

### Step 1: Find all hardcoded growth values
Search the file for:
- `'+12%'`
- `'+18%'`
- Any string that looks like `'+XX%'` or `'-XX%'`
- Any variable or property named `growth` with a hardcoded string value

### Step 2: Replace hardcoded values with null/empty

For each stats object, change the hardcoded growth string to `null` or `''`:

```tsx
// Before
{ label: 'Total Projects', value: totalProjects, growth: '+12%' },

// After
{ label: 'Total Projects', value: totalProjects, growth: null },
```

### Step 3: Update the growth badge rendering

Find where the `growth` value is rendered in the JSX. It likely looks like:

```tsx
{growth && (
  <span className="...">
    {growth}
  </span>
)}
```

This already handles `null`/`''` correctly — the badge simply won't render. If the
rendering doesn't have a conditional, add one:

```tsx
{growth ? (
  <span className="text-xs font-medium text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
    {growth}
  </span>
) : null}
```

### Step 4: Check for growth in other parts of the file

Also check if there are other hardcoded growth strings in sections that show individual
project summaries or analytics. Apply the same fix: replace with `null` and ensure the
rendering handles null gracefully.

---

## What NOT to Do
- Do NOT try to calculate real growth from the API data — the API doesn't return historical
  data and this would require a backend change that is out of scope for this session.
- Do NOT remove the `growth` property from the stats objects — other code may reference it
  and removing it could cause TypeScript errors. Set it to `null` instead.
- Do NOT change any stats values (totalProjects, activeProjects, totalValue) — those ARE
  calculated from real data and should remain.

---

## Completion Checklist
- [ ] Read dashboard/page.tsx fully before changing
- [ ] Found all hardcoded growth strings ('+12%', '+18%', any others)
- [ ] All hardcoded growth values replaced with null or ''
- [ ] Growth badge rendering is conditional (won't show when null/empty)
- [ ] Real stat values (counts, totals) are NOT changed
- [ ] No TypeScript errors introduced

---

## PROMPT TO USE (paste this into your Claude session)

```
You are working on an AI Freelance Escrow platform frontend (Next.js/TypeScript).
This session has one focused task:

Fix the hardcoded fake growth metrics in the dashboard at frontend/app/dashboard/page.tsx.
The stats cards show '+12%', '+18%' etc as growth badges but these are hardcoded strings
that never change — they are not calculated from real data. The fix is to set them all to
null and make the growth badge conditional so it simply doesn't render when null.

Read the full session file at SESSIONS/SESSION_18_DASHBOARD_REAL_STATS.md first.

RULES:
- Read dashboard/page.tsx fully before making changes
- Only touch frontend/app/dashboard/page.tsx
- Replace all hardcoded growth strings with null
- Do NOT try to calculate real growth — just remove the fake values
- Do NOT change any actual stats values (project counts, totals)
- Do NOT touch any other files
```
