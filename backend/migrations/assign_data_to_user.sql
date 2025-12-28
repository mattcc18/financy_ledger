-- ============================================
-- Assign Existing Data to User
-- Replace YOUR_USER_ID_HERE with your actual user UUID
-- ============================================

-- Example usage:
-- SELECT assign_existing_data_to_user('123e4567-e89b-12d3-a456-426614174000');

-- Replace the UUID below with your actual user ID from Supabase Auth
SELECT assign_existing_data_to_user('YOUR_USER_ID_HERE');

-- After running, verify the data was assigned:
SELECT 
    'accounts' as table_name, 
    COUNT(*) as total_rows, 
    COUNT(user_id) as rows_with_user_id,
    COUNT(*) FILTER (WHERE user_id IS NULL) as null_user_ids
FROM accounts.list
UNION ALL
SELECT 'transactions', COUNT(*), COUNT(user_id), COUNT(*) FILTER (WHERE user_id IS NULL)
FROM transactions.ledger
UNION ALL
SELECT 'budgets', COUNT(*), COUNT(user_id), COUNT(*) FILTER (WHERE user_id IS NULL)
FROM budgets.list
UNION ALL
SELECT 'goals', COUNT(*), COUNT(user_id), COUNT(*) FILTER (WHERE user_id IS NULL)
FROM goals.list
UNION ALL
SELECT 'trips', COUNT(*), COUNT(user_id), COUNT(*) FILTER (WHERE user_id IS NULL)
FROM trips.list
UNION ALL
SELECT 'expenses', COUNT(*), COUNT(user_id), COUNT(*) FILTER (WHERE user_id IS NULL)
FROM expenses.list;

-- All null_user_ids should be 0 after running the function

