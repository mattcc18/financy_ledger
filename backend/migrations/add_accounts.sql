-- Add accounts to the database
-- Run this in Supabase SQL Editor

-- WARNING: This will DELETE all existing accounts first!
-- NOTE: This will also cascade delete any transactions, balances, or other data
--       linked to these accounts (due to foreign key constraints)
-- Delete all existing accounts
DELETE FROM accounts.list;

-- Insert accounts
INSERT INTO accounts.list (account_name, account_type, institution, currency_code)
VALUES 
  ('Swiss Pension', 'Investment', 'Swiss Gov', 'CHF'),
  ('Degiro', 'Investment', 'DEGIRO', 'EUR'),
  ('Rev Current - CHF', 'Cash', 'Revolut', 'CHF'),
  ('Rev Current - Euro', 'Cash', 'Revolut', 'EUR'),
  ('Rev Current - GBP', 'Cash', 'Revolut', 'GBP'),
  ('Bills', 'Cash', 'Cash', 'GBP'),
  ('Rev Pockets - CHF', 'Cash', 'Revolut', 'CHF'),
  ('REV Emergency Fund', 'Cash', 'Revolut', 'EUR'),
  ('Rev Cash Funds - EUR', 'Cash', 'Revolut', 'EUR'),
  ('Rev Cash Funds - GBP', 'Cash', 'Revolut', 'GBP'),
  ('Rev Cash Funds - USD', 'Cash', 'Revolut', 'USD'),
  ('AIB', 'Cash', 'AIB', 'EUR'),
  ('Rev Stocks', 'Investment', 'Revolut', 'EUR'),
  ('Krypto', 'Investment', 'Revolut', 'EUR'),
  ('Monzo', 'Cash', 'Monzo', 'GBP'),
  ('Leamington Rent Deposit', 'Cash', 'Cash', 'GBP'),
  ('JLR Pension', 'Investment', 'Scottish Widows', 'GBP'),
  ('S&S ISA', 'Investment', 'Trading 212', 'GBP'),
  ('Cash ISA', 'Cash', 'Trading 212', 'GBP');

-- Verify the accounts were inserted
SELECT account_id, account_name, account_type, institution, currency_code 
FROM accounts.list 
ORDER BY account_id;

