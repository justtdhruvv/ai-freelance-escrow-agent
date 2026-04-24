# SESSION 5 — Fix Frontend Wallet Page

## Priority: HIGH
## Estimated effort: 30-45 min

---

## Project Context
This is an AI Freelance Escrow platform. Freelancers earn money by completing milestones — funds
are held in escrow and released to their wallet after AQA (AI quality check) passes.

The wallet page at `frontend/app/dashboard/wallet/page.tsx` is BROKEN in a specific way:
- RTK Query IS correctly set up and fetching real data from the backend
- But the UI displays HARDCODED values (25000) instead of the fetched data
- The `formatCurrency()` helper exists but its calls are commented out
- Real data is fetched but thrown away

---

## Your Scope
**Only touch:** `frontend/app/dashboard/wallet/page.tsx`
**Do NOT touch:** any store files, API files, other pages, or backend

---

## Read These Files First (in order)
1. `frontend/app/dashboard/wallet/page.tsx` — the broken file, read the entire thing
2. `frontend/app/store/api/walletApi.ts` — understand what data the API returns
3. `escrow-service/src/modules/wallets/wallet.service.ts` — understand backend response shape

---

## What the Backend Returns

### GET /wallet response shape:
```json
{
  "wallet": {
    "wallet_id": "uuid",
    "freelancer_id": "uuid",
    "balance": 25000,
    "available_balance": 20000,
    "pending_balance": 5000,
    "wallet_type": "internal",
    "total_earned": 50000,
    "created_at": "..."
  }
}
```

### GET /wallet/transactions response shape:
```json
{
  "transactions": [
    {
      "transaction_id": "uuid",
      "type": "milestone_credit",
      "amount": 5000,
      "description": "Payment for milestone X",
      "created_at": "..."
    }
  ],
  "total": 10,
  "page": 1
}
```

### POST /wallet/convert response shape:
```json
{
  "conversion_id": "uuid",
  "amount_credits": 10000,
  "amount_real": 9800,
  "fee": 200,
  "status": "pending"
}
```

---

## What Needs to Change

### 1. Replace all hardcoded `25000` values
Find every instance of hardcoded numbers (25000, or any other magic numbers) used in JSX
display and replace them with real data from the wallet RTK Query result.

The RTK Query hook should already be something like:
```typescript
const { data: walletData, isLoading } = useGetWalletQuery();
```

Use: `walletData?.wallet?.balance`, `walletData?.wallet?.available_balance`, etc.

### 2. Fix `formatCurrency()` calls
The `formatCurrency()` function formats numbers as INR. Calls to it are commented out.
Uncomment them and use them wherever currency is displayed.

If the function doesn't exist in the file, add it:
```typescript
const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0
  }).format(amount / 100); // amounts are in paise
};
```
Note: Check if amounts are stored in paise (1/100 rupee) or rupees — check wallet.service.ts

### 3. Fix transactions display
The transactions list should map over `walletData?.transactions` (or the transactions query result)
instead of showing placeholder/static data.

### 4. Fix conversion form
The conversion form's submit handler uses a magic number `0.98 / 100`.
The fee is 2% (from wallet.service.ts). Make this clear:
```typescript
const FEE_PERCENT = 0.02;
const amountAfterFee = amount * (1 - FEE_PERCENT);
```

### 5. Handle loading and empty states
- Show a loading spinner when `isLoading` is true
- Show "No wallet found" or "No transactions yet" when data is empty
- Don't show undefined/NaN in the UI

---

## Completion Checklist
- [ ] Read wallet/page.tsx fully before making any changes
- [ ] Understand the RTK Query hook names and response shape
- [ ] All hardcoded number values replaced with real API data
- [ ] formatCurrency() is used consistently for all currency display
- [ ] Transactions list shows real data from API
- [ ] Conversion form uses clear fee calculation (no magic numbers)
- [ ] Loading state handled (spinner or skeleton)
- [ ] Empty state handled (no NaN or undefined in UI)
- [ ] No TypeScript errors in the file

---

## PROMPT TO USE (paste this into your Claude session)

```
You are working on the frontend of an AI Freelance Escrow platform. The wallet page at
frontend/app/dashboard/wallet/page.tsx fetches real data via RTK Query but displays hardcoded
values (like 25000) instead of showing the actual API response. The formatCurrency() helper
exists but its calls are commented out.

Your job is to fix the wallet page so it shows real data.

Read the full session file at SESSIONS/SESSION_5_WALLET_PAGE.md first — it has the exact
backend response shapes, what values to display, and what's hardcoded vs real.

RULES:
- Read wallet/page.tsx completely before making any changes
- Also read walletApi.ts and wallet.service.ts to understand data shapes
- Only modify frontend/app/dashboard/wallet/page.tsx
- Do NOT touch any store files, other pages, or backend
- Replace every hardcoded number with real API data
- Handle loading and empty states properly
- After changes, verify no hardcoded numbers remain for balance/transaction display
- Work through the checklist one item at a time
```
