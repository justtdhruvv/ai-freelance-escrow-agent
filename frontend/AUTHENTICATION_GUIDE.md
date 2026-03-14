# Authentication System Guide

## Fixed Issues ✅

1. **404 Errors Resolved**: Created proper API route files
2. **Payload Format Fixed**: Changed from FormData to JSON
3. **Response Structure Updated**: Matches your backend specification
4. **Removed Name Field**: Simplified signup to only email/password

## API Endpoints

### Signup
- **URL**: `POST /api/signup`
- **Payload**: 
  ```json
  {
    "email": "user@example.com",
    "password": "password123",
    "role": "freelancer"
  }
  ```
- **Response**:
  ```json
  {
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

### Login
- **URL**: `POST /api/login`
- **Payload**: 
  ```json
  {
    "email": "test@example.com",
    "password": "password123"
  }
  ```
- **Response**: Same format as signup

### Test Credentials
- **Email**: `test@example.com`
- **Password**: `password123`

## Flow
1. User signs up → Receives token + user data
2. Auto-redirects to login with success message
3. User logs in → Receives token + user data
4. Redirects to dashboard
5. Token stored in localStorage
6. Protected routes validate token

## Files Updated
- `app/api/signup/route.ts` - JSON API endpoint
- `app/api/login/route.ts` - JSON API endpoint  
- `services/authService.ts` - JSON requests, updated interfaces
- `components/SignupForm.tsx` - Removed name field
- `components/ProtectedRoute.tsx` - Token validation

## Next Steps
1. Replace mock responses with real backend API calls
2. Add proper JWT validation
3. Connect to your actual database
4. Add refresh token logic
5. Implement proper error handling
