# Migration Guide: Consolidate Expenses into Transactions Ledger

This guide walks you through migrating from the separate `expenses.list` table to the unified `transactions.ledger` table.

## Overview

We're consolidating expenses into the transactions ledger for a simpler, unified architecture:
- **Single source of truth** for all money movements
- **No data duplication** between expenses and transactions
- **Simpler queries** - one table for everything
- **Better balance calculation** - expenses automatically included

## Migration Steps

### Step 1: Add merchant and trip_id columns to transactions.ledger

Run this SQL script in Supabase SQL Editor:

```sql
-- File: add_merchant_trip_id_to_transactions.sql
```

This adds:
- `merchant` column (VARCHAR(255), nullable) - for expense merchant names
- `trip_id` column (INTEGER, nullable) - foreign key to trips.list

### Step 2: Migrate expenses data

Run this SQL script in Supabase SQL Editor:

```sql
-- File: migrate_expenses_to_transactions.sql
```

This:
- Copies all expenses from `expenses.list` to `transactions.ledger`
- Sets `transaction_type = 'expense'`
- Converts amounts to negative (expenses are negative in transaction ledger)
- Preserves merchant, trip_id, category, and description
- Prevents duplicates if run multiple times

### Step 3: Verify migration

Run this query to verify:

```sql
-- Count expenses in transactions.ledger
SELECT 
    transaction_type,
    COUNT(*) as count,
    SUM(amount) as total_amount
FROM transactions.ledger
WHERE transaction_type = 'expense'
GROUP BY transaction_type;

-- Compare with original expenses count
SELECT COUNT(*) as original_expenses_count FROM expenses.list;
```

### Step 4: Update backend code (already done)

The backend has been updated to:
- Include `merchant` and `trip_id` in `TransactionResponse` schema
- Support `merchant` and `trip_id` in transaction creation
- Filter transactions by `trip_id` and `merchant`
- Update trips API to query transactions instead of expenses

### Step 5: Update frontend code (already done)

The frontend has been updated to:
- Use transactions API instead of expenses API
- Display merchant column in transactions table
- Show all transactions (expenses, income, transfers) in one table

### Step 6: Test the migration

1. **Check transactions API:**
   ```bash
   curl "http://localhost:8000/api/transactions?transaction_type=expense"
   ```

2. **Check trip expenses:**
   ```bash
   curl "http://localhost:8000/api/trips/1/expenses"
   ```

3. **Verify frontend displays transactions correctly**

### Step 7: (Optional) Drop expenses.list table

**⚠️ IMPORTANT: Only do this after verifying everything works!**

Once you're confident the migration is complete and working:

```sql
-- Backup first (optional but recommended)
CREATE TABLE expenses.list_backup AS SELECT * FROM expenses.list;

-- Then drop the table
DROP TABLE IF EXISTS expenses.list CASCADE;
```

## Benefits After Migration

1. **Unified Data Model**: All money movements in one table
2. **Automatic Balance Calculation**: Expenses automatically included in balance calculations
3. **Simpler Queries**: No need to join expenses and transactions
4. **Single API**: Use `/api/transactions` for everything
5. **Better Performance**: One table to index and query

## Query Examples

### Get all expenses for an account
```sql
SELECT * FROM transactions.ledger 
WHERE account_id = 5 AND transaction_type = 'expense'
ORDER BY transaction_date DESC;
```

### Get expenses with merchant
```sql
SELECT * FROM transactions.ledger 
WHERE transaction_type = 'expense' AND merchant IS NOT NULL
ORDER BY transaction_date DESC;
```

### Get trip expenses
```sql
SELECT * FROM transactions.ledger 
WHERE trip_id = 3 AND transaction_type = 'expense'
ORDER BY transaction_date DESC;
```

## Rollback Plan

If you need to rollback:

1. The `expenses.list` table is still intact (unless you dropped it)
2. You can delete migrated transactions:
   ```sql
   DELETE FROM transactions.ledger 
   WHERE transaction_type = 'expense' AND merchant IS NOT NULL;
   ```
3. Revert code changes (expenses API still exists but won't be used)

## Notes

- Expenses amounts are stored as **negative** in transactions.ledger (standard for transaction ledgers)
- The `expenses.list` table can remain for reference, but new expenses should go to `transactions.ledger`
- The expenses API (`/api/expenses`) still exists but is deprecated - use `/api/transactions` instead



