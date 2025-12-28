-- ============================================
-- Transfer All Data from One User to Another
-- Use this to move all data (accounts, transactions, etc.) from one user to another
-- ============================================

-- Create function to transfer all data from source_user_id to target_user_id
CREATE OR REPLACE FUNCTION transfer_user_data(
    source_user_id UUID,
    target_user_id UUID
)
RETURNS TABLE(
    table_name TEXT,
    rows_transferred BIGINT
) AS $$
DECLARE
    accounts_count BIGINT;
    transactions_count BIGINT;
    balances_count BIGINT;
    budgets_count BIGINT;
    expenses_count BIGINT;
    trips_count BIGINT;
    goals_count BIGINT;
    exchange_rates_count BIGINT;
BEGIN
    -- Verify both users exist (optional check - you can remove if not needed)
    -- This assumes you have access to auth.users, which might not be available
    -- So we'll skip this check and just transfer the data
    
    -- Transfer accounts
    UPDATE accounts.list 
    SET user_id = target_user_id 
    WHERE user_id = source_user_id;
    GET DIAGNOSTICS accounts_count = ROW_COUNT;
    
    -- Transfer transactions
    UPDATE transactions.ledger 
    SET user_id = target_user_id 
    WHERE user_id = source_user_id;
    GET DIAGNOSTICS transactions_count = ROW_COUNT;
    
    -- Transfer balances (legacy)
    UPDATE balances.snapshot 
    SET user_id = target_user_id 
    WHERE user_id = source_user_id;
    GET DIAGNOSTICS balances_count = ROW_COUNT;
    
    -- Transfer budgets
    UPDATE budgets.list 
    SET user_id = target_user_id 
    WHERE user_id = source_user_id;
    GET DIAGNOSTICS budgets_count = ROW_COUNT;
    
    -- Transfer expenses
    UPDATE expenses.list 
    SET user_id = target_user_id 
    WHERE user_id = source_user_id;
    GET DIAGNOSTICS expenses_count = ROW_COUNT;
    
    -- Transfer trips
    UPDATE trips.list 
    SET user_id = target_user_id 
    WHERE user_id = source_user_id;
    GET DIAGNOSTICS trips_count = ROW_COUNT;
    
    -- Transfer goals
    UPDATE goals.list 
    SET user_id = target_user_id 
    WHERE user_id = source_user_id;
    GET DIAGNOSTICS goals_count = ROW_COUNT;
    
    -- Transfer exchange rates
    UPDATE exchange_rates.rate_history 
    SET user_id = target_user_id 
    WHERE user_id = source_user_id;
    GET DIAGNOSTICS exchange_rates_count = ROW_COUNT;
    
    -- Return summary
    RETURN QUERY SELECT 'accounts'::TEXT, accounts_count;
    RETURN QUERY SELECT 'transactions'::TEXT, transactions_count;
    RETURN QUERY SELECT 'balances'::TEXT, balances_count;
    RETURN QUERY SELECT 'budgets'::TEXT, budgets_count;
    RETURN QUERY SELECT 'expenses'::TEXT, expenses_count;
    RETURN QUERY SELECT 'trips'::TEXT, trips_count;
    RETURN QUERY SELECT 'goals'::TEXT, goals_count;
    RETURN QUERY SELECT 'exchange_rates'::TEXT, exchange_rates_count;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- Usage Example:
-- ============================================
-- To transfer all data from user A to user B:
--
-- SELECT * FROM transfer_user_data(
--     'source-user-uuid-here'::UUID,
--     'target-user-uuid-here'::UUID
-- );
--
-- This will return a table showing how many rows were transferred from each table.
--
-- WARNING: This operation cannot be undone! Make sure you have the correct user IDs.
-- ============================================

-- ============================================
-- Verify Before Transfer (Optional Check)
-- ============================================
-- Before transferring, you can check what data exists for each user:
--
-- SELECT 
--     'accounts' as table_name,
--     COUNT(*) FILTER (WHERE user_id = 'source-user-uuid'::UUID) as source_count,
--     COUNT(*) FILTER (WHERE user_id = 'target-user-uuid'::UUID) as target_count
-- FROM accounts.list
-- UNION ALL
-- SELECT 'transactions', 
--     COUNT(*) FILTER (WHERE user_id = 'source-user-uuid'::UUID),
--     COUNT(*) FILTER (WHERE user_id = 'target-user-uuid'::UUID)
-- FROM transactions.ledger;
-- ============================================

