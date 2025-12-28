-- ============================================
-- Migration: Make user_id Required
-- Run this AFTER assigning existing data to a user
-- ============================================
-- WARNING: Only run this after you've assigned all existing data to a user!
-- This will fail if there are any NULL user_id values

-- Make user_id NOT NULL on all tables
ALTER TABLE accounts.list 
ALTER COLUMN user_id SET NOT NULL;

ALTER TABLE transactions.ledger 
ALTER COLUMN user_id SET NOT NULL;

ALTER TABLE balances.snapshot 
ALTER COLUMN user_id SET NOT NULL;

ALTER TABLE budgets.list 
ALTER COLUMN user_id SET NOT NULL;

ALTER TABLE expenses.list 
ALTER COLUMN user_id SET NOT NULL;

ALTER TABLE trips.list 
ALTER COLUMN user_id SET NOT NULL;

ALTER TABLE goals.list 
ALTER COLUMN user_id SET NOT NULL;

ALTER TABLE exchange_rates.rate_history 
ALTER COLUMN user_id SET NOT NULL;

