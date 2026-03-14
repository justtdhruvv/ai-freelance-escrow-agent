# Backend Integration Guide

## Remove Mock Data - Connect to Real Backend

### Step 1: Update Backend URL

In `app/services/authService.ts`, change line 5:

```typescript
// Replace with your actual backend URL
const API_BASE_URL = 'https://your-backend-api.com/auth'
```

**Change to:**
```typescript
const API_BASE_URL = 'https://your-actual-backend-url.com/auth'
```

### Step 2: Your Backend Endpoints

Your frontend expects these endpoints:

#### POST `/auth/login`
```json
Request: {
  "email": "user@example.com",
  "password": "password123"
}

Response: {
  "token": "jwt_token_here",
  "user": {
    "user_id": "uuid",
    "role": "freelancer",
    "email": "user@example.com",
    "pfi_score": 500,
    "trust_score": 500,
    "pfi_history": null,
    "grace_period_active": 0,
    "created_at": "2026-03-14T08:03:32.000Z",
    "stripe_account_id": null,
    "razorpay_account_id": null
  }
}
```

#### POST `/auth/signup`
```json
Request: {
  "email": "user@example.com",
  "password": "password123",
  "role": "freelancer"
}

Response: Same as login
```

#### POST `/auth/forgot-password`
```json
Request: {
  "email": "user@example.com"
}

Response: {
  "message": "Password reset link sent to your email"
}
```

#### GET `/auth/validate`
```json
Headers: Authorization: Bearer <token>

Response: {
  "valid": true
}
```

### Step 3: CORS Configuration

Your backend must allow CORS from your frontend:
- Origin: `http://localhost:3001`
- Methods: `GET`, `POST`
- Headers: `Content-Type`, `Authorization`

### Step 4: Remove Next.js API Routes (Optional)

Since you're connecting directly to backend, you can delete these files:
- `app/api/login/route.ts`
- `app/api/signup/route.ts`
- `app/api/forgot-password/route.ts`
- `app/api/validate/route.ts`

### Step 5: Test Integration

1. Update `API_BASE_URL` in authService.ts
2. Start dev server: `npm run dev`
3. Test signup with real backend
4. Test login with real credentials
5. Test forgot password

### Current Flow

Frontend → Direct Backend Call
- No more mock data
- Real authentication
- Your backend handles database
- Your backend generates JWT tokens

### Troubleshooting

**CORS Issues:**
Add this to your backend:
```javascript
app.use(cors({
  origin: 'http://localhost:3001',
  credentials: true
}))
```

**Network Errors:**
Check browser console for actual error messages
Verify backend URL is correct
Check if backend is running

**Authentication Issues:**
Verify JWT token format
Check token expiration
Validate response structure matches above
