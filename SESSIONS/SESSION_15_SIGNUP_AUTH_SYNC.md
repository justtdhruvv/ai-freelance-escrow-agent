# SESSION 15 — Signup Auth Sync + Name Field Fix

## Priority: HIGH
## Estimated effort: 30-45 min
## Independent: YES — only touches SignupForm.tsx and authService.ts

---

## Project Context
This is an AI Freelance Escrow platform with Next.js frontend + Express/TypeScript backend.
Users sign up as either "freelancer" or "employer". After signup, the user lands on the
dashboard. There are two bugs in the signup flow:

1. The Name input field was deleted from the SignupForm UI, but `formData.name` is still sent
   to the backend — every user gets created with an empty string as their name.

2. After signup, the frontend calls `authService.signup()` and then does
   `window.location.href = '/dashboard?message=...'` but NEVER dispatches the Redux
   `loginSuccess` action. The Redux store has `user: null` until the user refreshes the page.
   This causes `projects/page.tsx` to see `user?.role` as undefined and render the wrong
   table component for newly signed-up employers.

---

## Your Scope
**Only touch:**
- `frontend/app/components/SignupForm.tsx`
- `frontend/app/services/authService.ts`

**Do NOT touch:** any other files.

---

## Read These Files First (in order)
1. `frontend/app/components/SignupForm.tsx` — current state, find where Name Field was removed
2. `frontend/app/services/authService.ts` — understand what signup() stores and returns
3. `frontend/app/store/slices/authSlice.ts` — understand loginSuccess action shape
4. `frontend/app/store/index.ts` — confirm store export shape for useDispatch typing

---

## TASK 1: Restore Name Input Field

### The Bug
In `SignupForm.tsx`, between the role toggle and email field, there is this dead code:
```tsx
{/* Name Field */}


```
The input was deleted but `formData.name` in state defaults to `''` and is passed to
`authService.signup({ name: formData.name, ... })`. Every user is created with a blank name.

### How to Fix
Add a working name input between the role toggle and email field.

The `formData` state already has `name: ''`. The `handleInputChange` handler already works
for any named input. Just add the JSX:

```tsx
{/* Name Field */}
<div>
  <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
    Full Name
  </label>
  <input
    type="text"
    id="name"
    name="name"
    value={formData.name}
    onChange={handleInputChange}
    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:outline-none transition-colors ${
      errors.name
        ? 'border-red-500 focus:ring-red-500 focus:border-red-500'
        : 'border-gray-300 focus:border-[#AD7D56] focus:ring-[#AD7D56]'
    }`}
    placeholder="Enter your full name"
    disabled={isLoading}
  />
  {errors.name && (
    <motion.p
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="text-red-500 text-sm mt-1"
    >
      {errors.name}
    </motion.p>
  )}
</div>
```

Also add name validation to `validateForm()`:
```ts
if (!formData.name.trim()) {
  newErrors.name = 'Full name is required'
}
```

---

## TASK 2: Dispatch loginSuccess After Signup

### The Bug
`SignupForm.tsx` handleSubmit currently does:
```ts
const response = await authService.signup({ name, email, password, role })
window.location.href = '/dashboard?message=Account created successfully! Welcome!'
```

This redirects before Redux state is updated. `authService.signup()` does store data in
localStorage (token, user, role) but Redux `auth.user` is still `null`. Pages that read
from Redux (`useSelector(state => state.auth.user)`) see `null` until the page reloads
and `initializeAuth` restores state.

### How to Fix

**Step 1:** Add the needed imports at the top of `SignupForm.tsx`:
```tsx
import { useDispatch } from 'react-redux'
import { useRouter } from 'next/navigation'
import { loginSuccess } from '../store/slices/authSlice'
```

**Step 2:** Inside the component, initialize dispatch and router:
```tsx
const dispatch = useDispatch()
const router = useRouter()
```

**Step 3:** After successful signup, dispatch `loginSuccess` before navigating:
```tsx
const response = await authService.signup({
  name: formData.name,
  email: formData.email,
  password: formData.password,
  role
})

// Sync Redux state immediately — don't wait for page reload + initializeAuth
dispatch(loginSuccess({
  user: {
    id: response.user.user_id,
    name: response.user.name,
    email: response.user.email,
    role: response.user.role,
  },
  token: response.token,
}))

router.push('/dashboard?message=Account created successfully! Welcome!')
```

Note: `loginSuccess` expects `user.id` but the backend returns `user.user_id`. Map it
as shown above.

---

## TASK 3: Fix Role Fallback in authService.ts

### The Bug
In `authService.ts` the signup method stores:
```ts
localStorage.setItem("role", result.user.role || "user")
```
The fallback `"user"` is not a valid role in this system (only `"freelancer"` and `"employer"`
are valid). If the backend ever omits the role field, the user would be stored as `"user"`
and `getUserRole()` in `roleGuard.ts` would not match any restricted routes.

### How to Fix
Change the fallback from `"user"` to `"freelancer"` in both the login and signup methods:
```ts
localStorage.setItem("role", result.user.role || "freelancer")
```
There are 2 places: in `login()` (line ~53) and in `signup()` (line ~100). Fix both.

---

## Completion Checklist
- [ ] Read all 4 files before making any changes
- [ ] Name input field restored between role toggle and email field
- [ ] Name validation added to validateForm()
- [ ] `useDispatch`, `useRouter`, `loginSuccess` imported in SignupForm
- [ ] dispatch and router initialized inside the component
- [ ] `loginSuccess` dispatched with mapped user (user_id → id) after successful signup
- [ ] `router.push()` used instead of `window.location.href`
- [ ] authService.ts `"user"` fallback changed to `"freelancer"` in both login and signup
- [ ] TypeScript compiles with no errors (no need to run build, just verify imports resolve)

---

## PROMPT TO USE (paste this into your Claude session)

```
You are working on an AI Freelance Escrow platform. This session has 3 related tasks
all in the frontend signup flow:

1. Restore the missing Name input field in SignupForm.tsx (it was deleted but name is
   still passed to the API as empty string — every user is created with blank name)
2. Dispatch Redux loginSuccess after signup so Redux state is immediately in sync
   (currently signup stores to localStorage but Redux stays null until page reload)
3. Fix the role fallback in authService.ts from "user" to "freelancer"

Read the full session file at SESSIONS/SESSION_15_SIGNUP_AUTH_SYNC.md first — it has
the exact code for each fix.

RULES:
- Read ALL 4 files in the "Read First" list before making changes
- Only touch frontend/app/components/SignupForm.tsx and frontend/app/services/authService.ts
- The loginSuccess action expects user.id but backend returns user.user_id — map it explicitly
- Use router.push() not window.location.href after signup
- Do NOT touch any other files
```
