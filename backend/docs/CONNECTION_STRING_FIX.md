# Fix Supabase Connection String

## The Problem

You're using a **direct connection** string, but you need a **connection pooling** string.

## How to Fix

1. **Go to Supabase Dashboard** → Your Project
2. **Settings** → **Database**
3. Scroll to **"Connection string"** section
4. **IMPORTANT**: Select the **"Connection pooling"** tab (NOT "URI" or "Direct connection")
5. Copy the connection string - it should look like:
   ```
   postgresql://postgres.[ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres
   ```
   Notice: `pooler.supabase.com` and port `6543`

6. **Update your `.env` file** in `backend/` directory:
   ```env
   SUPABASE_DB_URL=postgresql://postgres.[ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres
   ```

7. **Restart your server** (Ctrl+C, then `python run.py` again)

## Difference

- ❌ **Direct connection**: `db.[ref].supabase.co:5432` - Can have connection limits
- ✅ **Connection pooling**: `aws-0-[region].pooler.supabase.com:6543` - Better for applications

## About User Accounts

For now, **no authentication needed** - this is a single-user setup. You can add authentication later if you want multi-user support.



