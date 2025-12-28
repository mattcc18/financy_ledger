-- Migration: Enforce single Initial Balance per account
-- This ensures each account can only have one "Initial Balance" transaction

-- Step 1: Delete duplicate Initial Balance transactions (keep the earliest one per account)
WITH ranked_initial_balances AS (
    SELECT 
        transaction_id,
        account_id,
        transaction_date,
        ROW_NUMBER() OVER (PARTITION BY account_id ORDER BY transaction_date ASC, transaction_id ASC) as rn
    FROM transactions.ledger
    WHERE category = 'Initial Balance'
)
DELETE FROM transactions.ledger
WHERE transaction_id IN (
    SELECT transaction_id 
    FROM ranked_initial_balances 
    WHERE rn > 1
);

-- Step 2: Create a unique partial index to enforce one Initial Balance per account
-- This prevents future duplicates
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_initial_balance_per_account 
ON transactions.ledger (account_id) 
WHERE category = 'Initial Balance';

COMMENT ON INDEX idx_unique_initial_balance_per_account IS 'Ensures each account can only have one Initial Balance transaction';



