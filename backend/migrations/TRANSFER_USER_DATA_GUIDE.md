# Transfer User Data Guide

This guide explains how to transfer all data from one user account to another.

## When to Use This

- You created multiple accounts and want to merge them
- You want to transfer data to a different account
- You need to reassign data after a user account change

## Step-by-Step Instructions

### Step 1: Get User IDs

You need the UUIDs of both users:

1. **Source User ID** - The user whose data you want to move FROM
2. **Target User ID** - The user whose data you want to move TO

**How to find user IDs:**

Option A: From Supabase Dashboard
1. Go to **Authentication** → **Users**
2. Find the user
3. Copy the **User UID** (UUID)

Option B: From your database
```sql
-- If you know the email, you can find the user_id from your accounts table
SELECT DISTINCT user_id, email 
FROM accounts.list 
WHERE user_id IS NOT NULL;
```

### Step 2: Verify Data Before Transfer

Before transferring, check what data exists for each user:

```sql
-- Replace the UUIDs with your actual user IDs
SELECT 
    'accounts' as table_name,
    COUNT(*) FILTER (WHERE user_id = 'source-user-uuid-here'::UUID) as source_count,
    COUNT(*) FILTER (WHERE user_id = 'target-user-uuid-here'::UUID) as target_count
FROM accounts.list
UNION ALL
SELECT 'transactions', 
    COUNT(*) FILTER (WHERE user_id = 'source-user-uuid-here'::UUID),
    COUNT(*) FILTER (WHERE user_id = 'target-user-uuid-here'::UUID)
FROM transactions.ledger
UNION ALL
SELECT 'budgets', 
    COUNT(*) FILTER (WHERE user_id = 'source-user-uuid-here'::UUID),
    COUNT(*) FILTER (WHERE user_id = 'target-user-uuid-here'::UUID)
FROM budgets.list
UNION ALL
SELECT 'goals', 
    COUNT(*) FILTER (WHERE user_id = 'source-user-uuid-here'::UUID),
    COUNT(*) FILTER (WHERE user_id = 'target-user-uuid-here'::UUID)
FROM goals.list;
```

### Step 3: Create the Transfer Function

Run the migration file to create the function:

1. Go to Supabase SQL Editor
2. Open `backend/migrations/transfer_user_data.sql`
3. Copy and paste the entire file
4. Click **Run**

### Step 4: Transfer the Data

Run the transfer function:

```sql
SELECT * FROM transfer_user_data(
    'source-user-uuid-here'::UUID,
    'target-user-uuid-here'::UUID
);
```

**Example:**
```sql
SELECT * FROM transfer_user_data(
    '18a541fe-711e-484b-b24b-d9d50b7ec742'::UUID,
    'new-user-uuid-here'::UUID
);
```

The function will return a table showing how many rows were transferred from each table.

### Step 5: Verify Transfer

After transferring, verify the data was moved:

```sql
-- Check that source user has no data left
SELECT 
    'accounts' as table_name,
    COUNT(*) as remaining_rows
FROM accounts.list 
WHERE user_id = 'source-user-uuid-here'::UUID
UNION ALL
SELECT 'transactions', COUNT(*)
FROM transactions.ledger 
WHERE user_id = 'source-user-uuid-here'::UUID
UNION ALL
SELECT 'budgets', COUNT(*)
FROM budgets.list 
WHERE user_id = 'source-user-uuid-here'::UUID;

-- All should return 0
```

```sql
-- Check that target user now has the data
SELECT 
    'accounts' as table_name,
    COUNT(*) as total_rows
FROM accounts.list 
WHERE user_id = 'target-user-uuid-here'::UUID
UNION ALL
SELECT 'transactions', COUNT(*)
FROM transactions.ledger 
WHERE user_id = 'target-user-uuid-here'::UUID;
```

## Important Notes

⚠️ **This operation cannot be undone!** Once data is transferred, it's permanently moved.

- All data from the source user will be moved to the target user
- The source user will have no data left after the transfer
- Both users' data will be merged into the target user
- Make sure you have the correct user IDs before running

## What Gets Transferred

- ✅ Accounts
- ✅ Transactions
- ✅ Balances (legacy snapshots)
- ✅ Budgets
- ✅ Expenses
- ✅ Trips
- ✅ Goals
- ✅ Exchange rates

## Troubleshooting

**Issue: Function doesn't exist**
- Make sure you ran the migration SQL file first

**Issue: No rows transferred**
- Check that the source_user_id is correct
- Verify the source user actually has data

**Issue: Wrong user ID**
- Double-check the UUIDs in Supabase Dashboard
- Make sure you're using the correct format (UUID with dashes)

