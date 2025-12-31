# Authentication Token Configuration

## Problem
Tokens are expiring after 1 day, causing users to be logged out.

## Solutions

### Option 1: Increase JWT Expiration in Supabase (Recommended - Easiest)

1. Go to your Supabase Dashboard
2. Navigate to **Settings** → **Auth** → **JWT Settings**
3. Increase the **JWT expiry** from the default (usually 3600 seconds / 1 hour) to a longer duration
   - For 30 days: `2592000` seconds
   - For 7 days: `604800` seconds
   - For 1 day: `86400` seconds
4. Save changes

This will make tokens last longer without requiring code changes.

### Option 2: Implement Token Refresh (Better Security)

The codebase already includes token refresh logic, but you need to:

1. **Add a refresh endpoint to your backend** (`backend/app/api/auth.py`):
   ```python
   @router.post("/refresh")
   async def refresh_token(request: RefreshTokenRequest):
       """Refresh access token using refresh token"""
       # Call Supabase refresh endpoint
       # Return new access_token and refresh_token
   ```

2. **Ensure backend auth endpoints return refresh_token** in signup/signin responses

3. **The frontend will automatically refresh tokens** before they expire (every 50 minutes)

### Option 3: Use Supabase Client Library (Best Long-term Solution)

Use `@supabase/supabase-js` which handles token refresh automatically:

```bash
npm install @supabase/supabase-js
```

Then use Supabase client instead of custom auth endpoints - it handles all token management automatically.

## Current Implementation

The current code:
- Stores `access_token` and `refresh_token` in localStorage
- Checks token expiration before API calls
- Attempts to refresh tokens automatically
- Falls back gracefully if refresh fails

## Recommendation

For immediate fix: **Use Option 1** (increase JWT expiry in Supabase dashboard) - it's the quickest and requires no code changes.

For better long-term solution: **Use Option 3** (Supabase client library) - it handles everything automatically and is more secure.

