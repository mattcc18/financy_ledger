-- Create budgets schema and table only
-- Run this in Supabase SQL Editor if budgets table doesn't exist

CREATE SCHEMA IF NOT EXISTS budgets;

CREATE TABLE IF NOT EXISTS budgets.list (
    budget_id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    currency VARCHAR(3) NOT NULL DEFAULT 'GBP',
    income_sources JSONB NOT NULL DEFAULT '[]'::jsonb,
    categories JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Verify it was created
SELECT table_schema, table_name 
FROM information_schema.tables 
WHERE table_schema = 'budgets' AND table_name = 'list';



