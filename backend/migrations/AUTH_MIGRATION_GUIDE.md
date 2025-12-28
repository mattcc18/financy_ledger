# Authentication Migration Guide

This guide will help you add authentication to your finance dashboard **without losing any existing data**.

## Overview

The migration process:
1. Adds `user_id` columns to all tables (nullable initially)
2. You create your first user account
3. Assign all existing data to that user
4. Make `user_id` required (NOT NULL)

## Step-by-Step Instructions

### Step 1: Enable Supabase Auth

1. Go to your Supabase Dashboard
2. Navigate to **Authentication** → **Providers**
3. Enable **Email** provider (or your preferred auth method)
4. Configure email settings if needed

### Step 2: Run the First Migration

1. Go to **SQL Editor** in Supabase
2. Open `backend/migrations/add_user_authentication.sql`
3. Copy and paste the entire file
4. Click **Run**
5. ✅ This adds `user_id` columns but keeps them nullable (your data is safe!)

### Step 3: Create Your First User Account

**Option A: Via Supabase Dashboard (for testing)**
1. Go to **Authentication** → **Users**
2. Click **Add User**
3. Enter email and password
4. Copy the **User UID** (UUID) - you'll need this!

**Option B: Via Your App (recommended)**
1. We'll add signup functionality to your app
2. Sign up with your email
3. Get your user ID from the auth token

### Step 4: Assign Existing Data to Your User

1. Go back to **SQL Editor**
2. Run this query (replace `YOUR_USER_ID_HERE` with your actual UUID):

```sql
SELECT assign_existing_data_to_user('YOUR_USER_ID_HERE');
```

For example:
```sql
SELECT assign_existing_data_to_user('123e4567-e89b-12d3-a456-426614174000');
```

3. Verify the data was assigned:
```sql
-- Check that all tables now have your user_id
SELECT COUNT(*) as total_accounts, COUNT(user_id) as accounts_with_user 
FROM accounts.list;

SELECT COUNT(*) as total_transactions, COUNT(user_id) as transactions_with_user 
FROM transactions.ledger;
```

All counts should match (no NULL user_ids remaining).

### Step 5: Make user_id Required

1. Open `backend/migrations/make_user_id_required.sql`
2. Copy and paste into SQL Editor
3. Click **Run**
4. ✅ Now user_id is required for all new data

### Step 6: Verify Everything Works

Run these checks:

```sql
-- Check for any NULL user_ids (should return 0 rows)
SELECT 'accounts' as table_name, COUNT(*) as null_count 
FROM accounts.list WHERE user_id IS NULL
UNION ALL
SELECT 'transactions', COUNT(*) FROM transactions.ledger WHERE user_id IS NULL
UNION ALL
SELECT 'budgets', COUNT(*) FROM budgets.list WHERE user_id IS NULL
UNION ALL
SELECT 'goals', COUNT(*) FROM goals.list WHERE user_id IS NULL;
```

All should return 0.

## What Happens to Your Data?

✅ **All your existing data is preserved**
- Accounts, transactions, budgets, goals, trips - everything stays
- They're just assigned to your user account
- No data is deleted or modified (except adding user_id)

## Next Steps

After completing the migration:
1. Backend will need authentication middleware
2. Frontend will need login/signup pages
3. All API endpoints will filter by user_id

But your data is safe! 🎉

