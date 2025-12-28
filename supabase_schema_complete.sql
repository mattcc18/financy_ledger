-- Complete Database Schema for Finance Dashboard
-- Run this in Supabase SQL Editor to create all tables

-- ============================================
-- Create Schemas
-- ============================================
CREATE SCHEMA IF NOT EXISTS accounts;
CREATE SCHEMA IF NOT EXISTS balances;
CREATE SCHEMA IF NOT EXISTS budgets;
CREATE SCHEMA IF NOT EXISTS expenses;
CREATE SCHEMA IF NOT EXISTS goals;
CREATE SCHEMA IF NOT EXISTS exchange_rates;
CREATE SCHEMA IF NOT EXISTS transactions;
CREATE SCHEMA IF NOT EXISTS trips;

-- ============================================
-- Accounts Schema
-- ============================================
CREATE TABLE IF NOT EXISTS accounts.list (
    account_id SERIAL PRIMARY KEY,
    account_name VARCHAR(255) NOT NULL,
    account_type VARCHAR(100) NOT NULL,
    institution VARCHAR(255) NOT NULL,
    currency_code VARCHAR(3) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- Balances Schema (Snapshot - Legacy)
-- ============================================
CREATE TABLE IF NOT EXISTS balances.snapshot (
    snapshot_id SERIAL PRIMARY KEY,
    balance_date DATE NOT NULL,
    account_id INTEGER NOT NULL REFERENCES accounts.list(account_id) ON DELETE CASCADE,
    amount DECIMAL(15, 2) NOT NULL,
    balance_eur DECIMAL(15, 2),
    balance_usd DECIMAL(15, 2),
    balance_gbp DECIMAL(15, 2),
    balance_chf DECIMAL(15, 2),
    balance_cad DECIMAL(15, 2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(balance_date, account_id)
);

-- ============================================
-- Transactions Schema (New Transaction Ledger)
-- ============================================
CREATE TABLE IF NOT EXISTS transactions.ledger (
    transaction_id SERIAL PRIMARY KEY,
    account_id INTEGER NOT NULL REFERENCES accounts.list(account_id) ON DELETE CASCADE,
    amount DECIMAL(15, 2) NOT NULL,
    category VARCHAR(100),
    transaction_date DATE NOT NULL,
    transfer_link_id INTEGER,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE SEQUENCE IF NOT EXISTS transactions.transfer_link_seq;

-- ============================================
-- Exchange Rates Schema
-- ============================================
CREATE TABLE IF NOT EXISTS exchange_rates.rate_history (
    rate_id SERIAL PRIMARY KEY,
    base_currency VARCHAR(3) NOT NULL,
    target_currency VARCHAR(3) NOT NULL,
    rate DECIMAL(15, 6) NOT NULL,
    rate_date DATE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(base_currency, target_currency, rate_date)
);

-- ============================================
-- Budgets Schema
-- ============================================
CREATE TABLE IF NOT EXISTS budgets.list (
    budget_id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    currency VARCHAR(3) NOT NULL DEFAULT 'GBP',
    income_sources JSONB NOT NULL DEFAULT '[]'::jsonb,
    categories JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- Expenses Schema
-- ============================================
CREATE TABLE IF NOT EXISTS expenses.list (
    expense_id SERIAL PRIMARY KEY,
    expense_date DATE NOT NULL,
    account_id INTEGER NOT NULL REFERENCES accounts.list(account_id) ON DELETE CASCADE,
    merchant VARCHAR(255) NOT NULL,
    category VARCHAR(100) NOT NULL,
    amount DECIMAL(15, 2) NOT NULL,
    currency_code VARCHAR(3) NOT NULL,
    description TEXT,
    trip_id INTEGER REFERENCES trips.list(trip_id) ON DELETE SET NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- Trips Schema
-- ============================================
CREATE TABLE IF NOT EXISTS trips.list (
    trip_id SERIAL PRIMARY KEY,
    trip_name VARCHAR(255) NOT NULL,
    start_date DATE,
    end_date DATE,
    location VARCHAR(255),
    description TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- Goals Schema
-- ============================================
CREATE TABLE IF NOT EXISTS goals.list (
    goal_id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    goal_type VARCHAR(50) NOT NULL,
    target_amount DECIMAL(15, 2) NOT NULL,
    current_amount DECIMAL(15, 2) NOT NULL DEFAULT 0.0,
    currency VARCHAR(3) NOT NULL DEFAULT 'EUR',
    target_date DATE,
    description TEXT,
    icon VARCHAR(50),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- Create Indexes for Performance
-- ============================================
CREATE INDEX IF NOT EXISTS idx_accounts_name ON accounts.list(account_name);
CREATE INDEX IF NOT EXISTS idx_balances_account_date ON balances.snapshot(account_id, balance_date);
CREATE INDEX IF NOT EXISTS idx_balances_date ON balances.snapshot(balance_date);
CREATE INDEX IF NOT EXISTS idx_transactions_account_id ON transactions.ledger(account_id);
CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions.ledger(transaction_date);
CREATE INDEX IF NOT EXISTS idx_transactions_transfer_link ON transactions.ledger(transfer_link_id);
CREATE INDEX IF NOT EXISTS idx_transactions_category ON transactions.ledger(category);
CREATE INDEX IF NOT EXISTS idx_exchange_rates_date ON exchange_rates.rate_history(rate_date);
CREATE INDEX IF NOT EXISTS idx_exchange_rates_currencies ON exchange_rates.rate_history(base_currency, target_currency);
CREATE INDEX IF NOT EXISTS idx_expenses_account_date ON expenses.list(account_id, expense_date);
CREATE INDEX IF NOT EXISTS idx_expenses_date ON expenses.list(expense_date);
CREATE INDEX IF NOT EXISTS idx_expenses_trip_id ON expenses.list(trip_id);
CREATE INDEX IF NOT EXISTS idx_trips_name ON trips.list(trip_name);
CREATE INDEX IF NOT EXISTS idx_trips_dates ON trips.list(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_goals_type ON goals.list(goal_type);

-- ============================================
-- Add Comments
-- ============================================
COMMENT ON TABLE transactions.ledger IS 'Transaction ledger system - replaces snapshot-based balances';
COMMENT ON COLUMN transactions.ledger.transfer_link_id IS 'Links two transactions for transfers between accounts. Both transactions share the same transfer_link_id.';
COMMENT ON COLUMN transactions.ledger.category IS 'Transaction category (e.g., "Initial Balance", "Transfer", "Market Gain", "Expense", etc.)';

-- ============================================
-- Verification Query (Run this after to verify)
-- ============================================
COMMENT ON TABLE trips.list IS 'Trips/holidays for expense tracking';
COMMENT ON COLUMN trips.list.trip_name IS 'Name of the trip/holiday (e.g., "Japan 2025", "Summer Holiday")';
COMMENT ON COLUMN expenses.list.trip_id IS 'Reference to trips.list - allows expenses to be grouped by trip/holiday';

-- ============================================
-- Verification Query (Run this after to verify)
-- ============================================
-- SELECT table_schema, table_name 
-- FROM information_schema.tables 
-- WHERE table_schema IN ('accounts', 'balances', 'budgets', 'expenses', 'goals', 'exchange_rates', 'transactions', 'trips')
-- ORDER BY table_schema, table_name;

