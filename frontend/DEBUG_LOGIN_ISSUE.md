# Login "Failed to fetch" - Debug Guide

## Issues Fixed ✅

1. **API_BASE_URL Updated**: Changed from localhost:3000 to placeholder
2. **forgotPassword Fixed**: Now uses JSON instead of FormData
3. **All endpoints consistent**: All use JSON format

## Current Status

Your `authService.ts` is now configured correctly:
```typescript
const API_BASE_URL = 'https://your-actual-backend-url.com/auth'
```

## What You Need To Do

### Step 1: Update Backend URL
**Replace** `https://your-actual-backend-url.com` with your actual backend URL:

```typescript
const API_BASE_URL = 'https://your-real-backend.com/auth'
```

### Step 2: Check Backend Server
Make sure your backend is:
- ✅ Running and accessible
- ✅ Listening on correct port
- ✅ Has CORS enabled for `http://localhost:3001`

### Step 3: Test Backend Directly
Test your backend endpoints directly:

```bash
# Test signup
curl -X POST https://your-backend-url/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123","role":"freelancer"}'

# Test login  
curl -X POST https://your-backend-url/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"ankitprajapati10027@gmail.com","password":"password123"}'
```

### Step 4: Check Browser Console
Open browser dev tools and check:
- Network tab for failed requests
- Console for error messages
- Exact URL being called

### Step 5: CORS Configuration
Your backend must allow:
```javascript
{
  origin: "http://localhost:3001",
  methods: ["GET", "POST"],
  allowedHeaders: ["Content-Type", "Authorization"]
}
```

## Common Issues

**"Failed to fetch" usually means:**
1. Wrong backend URL
2. Backend not running
3. CORS blocked
4. Network connectivity issues
5. Backend port mismatch

## Quick Test

1. Update `API_BASE_URL` in authService.ts
2. Restart frontend dev server
3. Try login again
4. Check browser network tab for actual request URL

This should resolve the "Failed to fetch" error!
