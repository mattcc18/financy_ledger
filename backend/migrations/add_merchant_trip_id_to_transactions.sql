-- Migration: Add merchant and trip_id columns to transactions.ledger
-- This allows transactions to include expense-specific fields
-- Run this in Supabase SQL Editor BEFORE migrating expenses data

-- Add merchant column (nullable - only populated for expense-type transactions)
ALTER TABLE transactions.ledger 
ADD COLUMN IF NOT EXISTS merchant VARCHAR(255);

-- Add trip_id column (nullable - only populated for expense-type transactions with trip associations)
ALTER TABLE transactions.ledger 
ADD COLUMN IF NOT EXISTS trip_id INTEGER REFERENCES trips.list(trip_id) ON DELETE SET NULL;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_transactions_merchant ON transactions.ledger(merchant);
CREATE INDEX IF NOT EXISTS idx_transactions_trip_id ON transactions.ledger(trip_id);

-- Add comments
COMMENT ON COLUMN transactions.ledger.merchant IS 'Merchant/vendor name (populated for expense-type transactions)';
COMMENT ON COLUMN transactions.ledger.trip_id IS 'Reference to trips.list - allows expenses to be grouped by trip/holiday';



