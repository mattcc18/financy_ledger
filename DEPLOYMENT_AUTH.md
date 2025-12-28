# Authentication Deployment Guide

This guide covers deploying the authentication feature to Render (backend) and Vercel (frontend).

## Backend (Render) - New Environment Variables

You need to add these environment variables to your Render service:

### Required Environment Variables:

1. **`SUPABASE_URL`**
   - Get from: Supabase Dashboard → Settings → API
   - Value: Your Supabase project URL (e.g., `https://xxxxx.supabase.co`)

2. **`SUPABASE_ANON_KEY`**
   - Get from: Supabase Dashboard → Settings → API
   - Value: Your anon/public key (starts with `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`)

3. **`SUPABASE_JWT_SECRET`** (Optional but recommended)
   - Get from: Supabase Dashboard → Settings → API → JWT Secret
   - Note: Not strictly required as we use API verification, but good to have
   - Value: Your JWT secret (long base64 string)

### Steps to Add to Render:

1. Go to your Render Dashboard
2. Select your backend service
3. Go to "Environment" tab
4. Add the three variables above
5. Save changes
6. Render will automatically redeploy

### Existing Environment Variables:

- `SUPABASE_DB_URL` - Already set (your database connection string)
- `ALLOWED_ORIGINS` - Should include your Vercel frontend URL

### New Dependencies:

Already included in `requirements.txt`:
- `pyjwt==2.8.0`
- `httpx==0.25.2`

No changes needed to `requirements.txt` - they're already there!

---

## Frontend (Vercel) - Configuration

### Environment Variables:

The frontend doesn't need any new environment variables. It uses:
- `VITE_API_URL` - Already set (your Render backend URL)

### Vercel Configuration:

1. Go to your Vercel project
2. Go to Settings → Environment Variables
3. Verify `VITE_API_URL` is set to your Render backend URL
4. Make sure it's set for all environments (Production, Preview, Development)

### Supabase Redirect URLs:

You need to configure redirect URLs in Supabase for password reset:

1. Go to Supabase Dashboard → Authentication → URL Configuration
2. Add to "Redirect URLs":
   - `https://your-app.vercel.app/reset-password` (Production)
   - `http://localhost:3000/reset-password` (Local development)
   - `https://your-preview-url.vercel.app/reset-password` (Optional: for preview deployments)

---

## Deployment Steps

### 1. Backend (Render):

```bash
# Already merged to main, so Render will auto-deploy
# But make sure to add the new environment variables first!
```

**Action Required:**
1. Add `SUPABASE_URL`, `SUPABASE_ANON_KEY`, and `SUPABASE_JWT_SECRET` to Render
2. Verify `SUPABASE_DB_URL` is still set correctly
3. Verify `ALLOWED_ORIGINS` includes your Vercel URL

### 2. Frontend (Vercel):

```bash
# Already merged to main, so Vercel will auto-deploy
# No new environment variables needed
```

**Action Required:**
1. Verify `VITE_API_URL` is set correctly
2. Add redirect URLs to Supabase (see above)

---

## Testing After Deployment

1. **Test Signup:**
   - Go to your Vercel URL
   - Click "Sign up"
   - Create a new account
   - Should redirect to dashboard

2. **Test Login:**
   - Log out
   - Log back in
   - Should work correctly

3. **Test Password Reset:**
   - Click "Forgot password"
   - Enter email
   - Check email for reset link
   - Click link and reset password

4. **Test Data Isolation:**
   - Create a second account
   - Verify each account only sees its own data

---

## Troubleshooting

### Backend Issues:

**Error: "Supabase configuration missing"**
- Check that `SUPABASE_URL` and `SUPABASE_ANON_KEY` are set in Render

**Error: "Invalid token"**
- Verify `SUPABASE_ANON_KEY` is correct
- Check that token is being sent in Authorization header

**Error: "Circuit breaker open"**
- Too many failed authentication attempts
- Wait 5-10 minutes and try again

### Frontend Issues:

**Error: "Failed to fetch"**
- Check that `VITE_API_URL` points to your Render backend
- Verify CORS is configured correctly in backend (`ALLOWED_ORIGINS`)

**Password reset link doesn't work:**
- Verify redirect URLs are added to Supabase
- Check that the URL matches exactly (including https/http)

---

## Summary

**Render (Backend) - Add these:**
- ✅ `SUPABASE_URL`
- ✅ `SUPABASE_ANON_KEY`
- ✅ `SUPABASE_JWT_SECRET` (optional)

**Vercel (Frontend) - Nothing new needed:**
- ✅ `VITE_API_URL` (already set)

**Supabase Dashboard - Configure:**
- ✅ Add redirect URLs for password reset

That's it! Once you add the environment variables to Render, everything should work.

