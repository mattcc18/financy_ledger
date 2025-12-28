-- Migration: Add transaction_type column to transactions.ledger
-- Run this in Supabase SQL Editor

-- Add transaction_type column
ALTER TABLE transactions.ledger 
ADD COLUMN IF NOT EXISTS transaction_type VARCHAR(20) DEFAULT 'expense';

-- Add check constraint to ensure valid transaction types
ALTER TABLE transactions.ledger
DROP CONSTRAINT IF EXISTS check_transaction_type;

ALTER TABLE transactions.ledger
ADD CONSTRAINT check_transaction_type 
CHECK (transaction_type IN ('income', 'expense', 'transfer'));

-- Update existing transactions based on category
UPDATE transactions.ledger 
SET transaction_type = 'transfer' 
WHERE category = 'Transfer';

UPDATE transactions.ledger 
SET transaction_type = 'income' 
WHERE category IN ('Initial Balance', 'Market Gain', 'Balance Adjustment')
AND amount > 0;

UPDATE transactions.ledger 
SET transaction_type = 'expense' 
WHERE transaction_type IS NULL OR transaction_type = 'expense';

-- Create index for transaction_type
CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions.ledger(transaction_type);

-- Add comment
COMMENT ON COLUMN transactions.ledger.transaction_type IS 'Transaction type: income, expense, or transfer';



