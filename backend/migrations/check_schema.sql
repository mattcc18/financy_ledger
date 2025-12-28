-- Quick check to see which tables exist in your database
-- Run this in Supabase SQL Editor to see what's already created

SELECT 
    table_schema, 
    table_name 
FROM information_schema.tables 
WHERE table_schema IN ('accounts', 'balances', 'budgets', 'expenses', 'goals', 'exchange_rates', 'transactions', 'trips')
ORDER BY table_schema, table_name;



