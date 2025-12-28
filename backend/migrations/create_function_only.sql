-- ============================================
-- Create the function to assign existing data to a user
-- Run this if the function doesn't exist yet
-- ============================================

CREATE OR REPLACE FUNCTION assign_existing_data_to_user(target_user_id UUID)
RETURNS void AS $$
BEGIN
    -- Update all tables to assign existing NULL user_id rows to the target user
    UPDATE accounts.list SET user_id = target_user_id WHERE user_id IS NULL;
    UPDATE transactions.ledger SET user_id = target_user_id WHERE user_id IS NULL;
    UPDATE balances.snapshot SET user_id = target_user_id WHERE user_id IS NULL;
    UPDATE budgets.list SET user_id = target_user_id WHERE user_id IS NULL;
    UPDATE expenses.list SET user_id = target_user_id WHERE user_id IS NULL;
    UPDATE trips.list SET user_id = target_user_id WHERE user_id IS NULL;
    UPDATE goals.list SET user_id = target_user_id WHERE user_id IS NULL;
    UPDATE exchange_rates.rate_history SET user_id = target_user_id WHERE user_id IS NULL;
END;
$$ LANGUAGE plpgsql;

