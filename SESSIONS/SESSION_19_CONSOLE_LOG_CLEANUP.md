# SESSION 19 — Console.log & Security Cleanup

## Priority: HIGH (security issue — JWT tokens are logged)
## Estimated effort: 30-40 min
## Independent: YES — only touches 3 frontend files

---

## Project Context
This is an AI Freelance Escrow platform with Next.js frontend.
Three files contain extensive `console.log` debug statements that were left in from
development. Two of them log JWT authentication tokens (even partial tokens are a security
risk in production). One logs on every single render.

Files affected:
1. `frontend/app/store/api/baseApi.ts` — logs the auth token on every single API call
2. `frontend/app/store/slices/authSlice.ts` — logs token preview on login/refresh
3. `frontend/app/components/Sidebar.tsx` — logs role data on every render (8+ console.logs)

---

## Your Scope
**Only touch:**
- `frontend/app/store/api/baseApi.ts`
- `frontend/app/store/slices/authSlice.ts`
- `frontend/app/components/Sidebar.tsx`

**Do NOT touch:** any other files.

---

## Read These Files First (in order)
1. `frontend/app/store/api/baseApi.ts` — find all console.log calls
2. `frontend/app/store/slices/authSlice.ts` — find all console.log calls
3. `frontend/app/components/Sidebar.tsx` — find all console.log calls

---

## TASK 1: Clean baseApi.ts

### What to Remove
In `baseApi.ts`, inside the `prepareHeaders` function, there is a debug block:
```ts
console.log(`=== API Call Debug ===`)
console.log(`Endpoint: ${endpoint}`)
console.log(`Type: ${type}`)
console.log(`Base URL: ${process.env.NEXT_PUBLIC_API_URL || '...'}`)
console.log(`Full URL: ${process.env.NEXT_PUBLIC_API_URL || '...'}/${endpoint}`)
console.log(`Has Auth Header: ${headers.has('authorization')}`)
console.log(`Auth Header: ${headers.get('authorization')?.substring(0, 30) || 'None'}...`)
console.log(`Accept Header: ${headers.get('accept')}`)
console.log(`=====================`)
```

In `baseQueryWithAuth`, there are response debug blocks:
```ts
console.log('=== API Response Debug ===')
console.log('Response Type:', ...)
console.log('Is Array:', ...)
console.log('Has Clients Property:', ...)
console.log('Response Data:', result.data)
console.log('========================')
```

And error debug blocks:
```ts
console.log('401 Error Details:', {
  endpoint: ...,
  hasToken: ...,
  tokenPreview: TokenManager.getToken()?.substring(0, 20) + '...',
})
```

### What to Keep
Keep genuine error handling behavior (the actual `return { error: ... }` responses).
Remove only the `console.log`, `console.warn`, `console.error` calls.

Exception: keep the single `console.error('API Error: Received HTML response...')` call
because it signals a genuine misconfiguration and is worth keeping for debugging.

The HTML detection logic and 401 handling logic should remain — just remove the logging.

### After cleanup, baseQueryWithAuth should look like:
```ts
export const baseQueryWithAuth = async (args: any, api: any, extraOptions: any) => {
  const url = typeof args === 'string' ? args : args?.url ?? ''
  const isPublic = PUBLIC_ENDPOINTS.some(e => url.includes(e))

  if (!isPublic && !TokenManager.hasValidToken()) {
    return {
      error: { status: 401, data: { message: 'No valid authentication token available' } }
    }
  }
  
  const result = await baseQuery(args, api, extraOptions)
  
  if (result.data) {
    if (typeof result.data === 'string' && result.data.includes('<!DOCTYPE html>')) {
      console.error('API Error: Received HTML response - check backend URL configuration')
      return {
        error: { status: 500, data: { message: 'API endpoint returned HTML instead of JSON.' } }
      }
    }
  }
  
  return result
}
```

---

## TASK 2: Clean authSlice.ts

### What to Remove
In `authSlice.ts`, remove all `console.log` calls in the reducers:
- `loginSuccess`: remove the log that prints userId, role, tokenPreview
- `logout`: remove `console.log('AuthSlice: Logout successful')`
- `initializeAuth`: remove the logs about initialization status
- `refreshToken`: remove `console.log('AuthSlice: Token refreshed')`

### What to Keep
Keep `console.error('AuthSlice: Error parsing user data:', error)` in the `initializeAuth`
catch block — that is a genuine error worth logging.

---

## TASK 3: Clean Sidebar.tsx

### What to Remove
The Sidebar component has debug logging that fires on every render:
```ts
console.log('🔥 SIDEBAR COMPONENT RENDERING!')
console.log('🔥 getUserRole() called:', userRole)
console.log('🔥 localStorage role directly:', localStorage.getItem('role'))

console.log('=== SIDEBAR DEBUG ===')
console.log('Raw userRole from getUserRole():', getUserRole())
console.log('Type-cast userRole:', userRole)
console.log('localStorage role:', localStorage.getItem('role'))
console.log('All menu items:', menuItems.map(...))
console.log('Filtered menu items:', filteredMenuItems.map(item => item.label))
console.log('=== END SIDEBAR DEBUG ===')
```

Remove all of these. There are no exceptions — none of these are useful in production.

Also remove any `useEffect` that was added purely for logging (if one exists). Keep the
core rendering logic, the `filteredMenuItems` calculation, and all JSX unchanged.

---

## Completion Checklist
- [ ] Read all 3 files before making any changes
- [ ] baseApi.ts: All console.log/warn blocks in prepareHeaders removed
- [ ] baseApi.ts: All console.log blocks in baseQueryWithAuth removed
- [ ] baseApi.ts: console.error for HTML response kept (it's a genuine error signal)
- [ ] baseApi.ts: All return { error: ... } logic kept intact
- [ ] authSlice.ts: console.log in loginSuccess removed
- [ ] authSlice.ts: console.log in logout removed
- [ ] authSlice.ts: console.log in initializeAuth removed
- [ ] authSlice.ts: console.log in refreshToken removed
- [ ] authSlice.ts: console.error in initializeAuth catch block kept
- [ ] Sidebar.tsx: All 8+ console.log calls removed
- [ ] Sidebar.tsx: Core rendering logic (filteredMenuItems, JSX) unchanged
- [ ] No TypeScript errors introduced

---

## PROMPT TO USE (paste this into your Claude session)

```
You are working on an AI Freelance Escrow platform frontend (Next.js/TypeScript).
This session has one focused task: remove debug console.log statements from 3 files.

Two of these files log JWT authentication tokens (security issue). One logs on every render.

Files:
1. frontend/app/store/api/baseApi.ts — logs token on every API call
2. frontend/app/store/slices/authSlice.ts — logs token preview on login/refresh
3. frontend/app/components/Sidebar.tsx — 8+ debug logs on every render

Read the full session file at SESSIONS/SESSION_19_CONSOLE_LOG_CLEANUP.md first — it
has the exact list of what to remove and what to keep.

RULES:
- Read all 3 files before making changes
- Remove console.log/warn calls — keep console.error for HTML detection in baseApi.ts
  and keep console.error in authSlice.ts initializeAuth catch block
- Keep ALL business logic intact (token validation, error returns, menu filtering)
- Do NOT touch any other files
```
