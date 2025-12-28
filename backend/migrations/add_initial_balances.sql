-- Migration: Add Initial Balance transactions for accounts
-- This calculates and inserts "Initial Balance" transactions based on current balance
-- 
-- Instructions:
-- 1. Update the account_balances CTE below with your current account balances
-- 2. Run this script in Supabase SQL Editor
-- 3. It will calculate the initial balance needed and insert "Initial Balance" transactions

WITH account_balances AS (
    -- UPDATE THESE VALUES with your current account balances
    -- Format: (account_id, account_name, current_balance)
    SELECT 1 as account_id, 'Account Name 1' as account_name, 0.00 as current_balance
    UNION ALL SELECT 2, 'Account Name 2', 0.00
    UNION ALL SELECT 3, 'Account Name 3', 0.00
    -- Add more accounts as needed
),
transaction_sums AS (
    -- Calculate sum of all existing transactions per account
    SELECT 
        account_id,
        COALESCE(SUM(amount), 0) as transaction_total
    FROM transactions.ledger
    GROUP BY account_id
),
calculated_initial_balances AS (
    -- Calculate initial balance needed: current_balance - transaction_total
    SELECT 
        ab.account_id,
        ab.account_name,
        ab.current_balance,
        COALESCE(ts.transaction_total, 0) as transaction_total,
        ab.current_balance - COALESCE(ts.transaction_total, 0) as initial_balance_amount
    FROM account_balances ab
    LEFT JOIN transaction_sums ts ON ab.account_id = ts.account_id
)
-- Insert Initial Balance transactions
INSERT INTO transactions.ledger (
    account_id,
    amount,
    transaction_type,
    category,
    transaction_date,
    description
)
SELECT 
    cib.account_id,
    cib.initial_balance_amount as amount,
    'income' as transaction_type,
    'Initial Balance' as category,
    (SELECT MIN(transaction_date) FROM transactions.ledger WHERE account_id = cib.account_id) - INTERVAL '1 day' as transaction_date,
    'Initial Balance' as description
FROM calculated_initial_balances cib
WHERE cib.initial_balance_amount != 0  -- Only insert if balance is not zero
  AND NOT EXISTS (
      -- Don't insert if Initial Balance transaction already exists for this account
      SELECT 1 
      FROM transactions.ledger t
      WHERE t.account_id = cib.account_id 
        AND t.category = 'Initial Balance'
  )
ORDER BY cib.account_id;

-- Show summary of what was inserted
SELECT 
    'Initial Balance transactions created' as status,
    COUNT(*) as accounts_updated,
    SUM(amount) as total_initial_balance
FROM transactions.ledger
WHERE category = 'Initial Balance';



