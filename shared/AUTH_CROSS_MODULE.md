# Cross-Module Authentication Issue

## Problem
Each module runs on a different port (localhost:3100, localhost:3103, etc.), which means they have **isolated localStorage**. When a user logs in at the core module (port 3100), other modules (different ports) don't have access to the authentication tokens.

## Current Behavior
- User logs in at `http://localhost:3100` (Core Module)
- Core stores `access_token` in its localStorage
- User navigates to `http://localhost:3103` (Marketing Module)
- Marketing module checks its own localStorage - finds no token
- Shows "Sign In" instead of user info

## Solutions

### Option 1: Server-Side Session Cookies (RECOMMENDED for Production)
**Backend changes required**

Set HTTP-only cookies on the backend that work across all subdomains:
```python
# Backend: Set cookie with domain
response.set_cookie(
    "session_token",
    value=token,
    domain="localhost",  # Works for all localhost ports
    httponly=True,
    secure=False,  # Set to True in production with HTTPS
    samesite="lax"
)
```

### Option 2: Centralized Auth Redirect
**Current Implementation**

1. When user visits any module without auth, they're redirected to core login
2. After login, core redirects back to the original module
3. **Issue**: Token is still in core's localStorage only

**Fix Needed**: Add token to redirect URL (temporarily, then remove from URL)

### Option 3: Auth Bridge Service
Create a centralized auth service that all modules communicate with via iframe postMessage.

### Option 4: Manual Token Sync
When navigating between modules from Control Room, append tokens to URL:
```typescript
const url = `http://localhost:3103?access_token=${token}`;
```

Then modules read and store the token from URL params (implemented in AuthSync component).

## Recommended Immediate Fix

Update the backend to use HTTP-only cookies with `domain=localhost` instead of localStorage-based auth. This is the most secure and seamless solution.

## Temporary Workaround

Users need to log in separately on each module until backend authentication is updated to use cookies.
