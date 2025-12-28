-- Migration: Copy expenses from expenses.list to transactions.ledger
-- Run this in Supabase SQL Editor AFTER adding merchant and trip_id columns
-- This consolidates expenses into the unified transactions ledger

-- First, determine if trip_id is VARCHAR or INTEGER and handle accordingly
DO $$
DECLARE
    trip_id_type TEXT;
BEGIN
    -- Check the data type of expenses.list.trip_id
    SELECT data_type INTO trip_id_type
    FROM information_schema.columns 
    WHERE table_schema = 'expenses' 
      AND table_name = 'list' 
      AND column_name = 'trip_id';
    
    IF trip_id_type = 'integer' THEN
        -- trip_id is already INTEGER, use it directly
        EXECUTE '
        INSERT INTO transactions.ledger (
            account_id, amount, transaction_type, category, transaction_date,
            merchant, trip_id, description, created_at, updated_at
        )
        SELECT 
            e.account_id,
            -ABS(e.amount) as amount,
            ''expense'' as transaction_type,
            e.category,
            e.expense_date as transaction_date,
            e.merchant,
            e.trip_id::integer,
            e.description,
            e.created_at,
            e.updated_at
        FROM expenses.list e
        WHERE NOT EXISTS (
            SELECT 1 
            FROM transactions.ledger t
            WHERE t.account_id = e.account_id
              AND t.transaction_date = e.expense_date
              AND t.amount = -ABS(e.amount)
              AND t.merchant = e.merchant
              AND t.transaction_type = ''expense''
        )';
        RAISE NOTICE 'Migrated expenses with INTEGER trip_id';
    ELSE
        -- trip_id is VARCHAR (trip names), need to look up integer trip_id from trips.list
        EXECUTE '
        INSERT INTO transactions.ledger (
            account_id, amount, transaction_type, category, transaction_date,
            merchant, trip_id, description, created_at, updated_at
        )
        SELECT 
            e.account_id,
            -ABS(e.amount) as amount,
            ''expense'' as transaction_type,
            e.category,
            e.expense_date as transaction_date,
            e.merchant,
            (
                SELECT t.trip_id 
                FROM trips.list t 
                WHERE t.trip_name = e.trip_id::text
                LIMIT 1
            ) as trip_id,
            e.description,
            e.created_at,
            e.updated_at
        FROM expenses.list e
        WHERE NOT EXISTS (
            SELECT 1 
            FROM transactions.ledger t
            WHERE t.account_id = e.account_id
              AND t.transaction_date = e.expense_date
              AND t.amount = -ABS(e.amount)
              AND t.merchant = e.merchant
              AND t.transaction_type = ''expense''
        )';
        RAISE NOTICE 'Migrated expenses with VARCHAR trip_id (looked up from trips.list)';
    END IF;
END $$;

-- Show migration summary
SELECT 
    'Expenses migrated to transactions' as status,
    COUNT(*) as total_expenses_migrated,
    COUNT(DISTINCT account_id) as accounts_affected,
    COUNT(DISTINCT trip_id) FILTER (WHERE trip_id IS NOT NULL) as trips_with_expenses
FROM transactions.ledger
WHERE transaction_type = 'expense' AND merchant IS NOT NULL;
