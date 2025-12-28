-- ============================================
-- Migration: Add User Authentication
-- This migration preserves all existing data
-- ============================================

-- Step 1: Create users table (using Supabase auth.users, but we'll track user_id)
-- Note: Supabase Auth handles the actual user accounts in auth.users
-- We'll use the UUID from auth.users as our user_id

-- Step 2: Add user_id columns to all tables (nullable initially to preserve data)
-- ============================================

-- Add user_id to accounts.list
ALTER TABLE accounts.list 
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Add user_id to transactions.ledger
ALTER TABLE transactions.ledger 
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Add user_id to balances.snapshot (legacy table)
ALTER TABLE balances.snapshot 
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Add user_id to budgets.list
ALTER TABLE budgets.list 
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Add user_id to expenses.list
ALTER TABLE expenses.list 
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Add user_id to trips.list
ALTER TABLE trips.list 
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Add user_id to goals.list
ALTER TABLE goals.list 
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Exchange rates can be shared or per-user - we'll make it per-user for consistency
ALTER TABLE exchange_rates.rate_history 
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Step 3: Create indexes on user_id for performance
CREATE INDEX IF NOT EXISTS idx_accounts_user_id ON accounts.list(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions.ledger(user_id);
CREATE INDEX IF NOT EXISTS idx_balances_user_id ON balances.snapshot(user_id);
CREATE INDEX IF NOT EXISTS idx_budgets_user_id ON budgets.list(user_id);
CREATE INDEX IF NOT EXISTS idx_expenses_user_id ON expenses.list(user_id);
CREATE INDEX IF NOT EXISTS idx_trips_user_id ON trips.list(user_id);
CREATE INDEX IF NOT EXISTS idx_goals_user_id ON goals.list(user_id);
CREATE INDEX IF NOT EXISTS idx_exchange_rates_user_id ON exchange_rates.rate_history(user_id);

-- Step 4: Create a function to assign existing data to a user
-- This will be called after you create your first user account
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

-- ============================================
-- IMPORTANT: After running this migration:
-- ============================================
-- 1. Enable Supabase Auth in your Supabase dashboard
-- 2. Create your first user account (sign up)
-- 3. Run the following SQL to assign all existing data to your user:
--
--    SELECT assign_existing_data_to_user('YOUR_USER_ID_HERE');
--
--    (Replace YOUR_USER_ID_HERE with your actual user UUID from auth.users)
--
-- 4. After assigning data, make user_id NOT NULL (run the next migration file)
-- ============================================

