-- Create categories table for expense and income categories
-- This allows users to manage their own categories

CREATE SCHEMA IF NOT EXISTS categories;

CREATE TABLE IF NOT EXISTS categories.list (
    category_id SERIAL PRIMARY KEY,
    category_name VARCHAR(100) NOT NULL UNIQUE,
    category_type VARCHAR(20) NOT NULL CHECK (category_type IN ('expense', 'income')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_category_type ON categories.list(category_type);
CREATE INDEX IF NOT EXISTS idx_category_name ON categories.list(LOWER(category_name));

-- Insert default expense categories
INSERT INTO categories.list (category_name, category_type) VALUES
    ('Groceries', 'expense'),
    ('Restaurants', 'expense'),
    ('Transport', 'expense'),
    ('Shopping', 'expense'),
    ('Entertainment', 'expense'),
    ('Bills', 'expense'),
    ('Health', 'expense'),
    ('Education', 'expense'),
    ('Travel', 'expense'),
    ('Other', 'expense')
ON CONFLICT (category_name) DO NOTHING;

-- Insert default income categories
INSERT INTO categories.list (category_name, category_type) VALUES
    ('Salary', 'income'),
    ('Freelance', 'income'),
    ('Investment', 'income'),
    ('Gift', 'income'),
    ('Other', 'income')
ON CONFLICT (category_name) DO NOTHING;

COMMENT ON TABLE categories.list IS 'User-manageable categories for expenses and income';
COMMENT ON COLUMN categories.list.category_type IS 'Type of category: expense or income';


