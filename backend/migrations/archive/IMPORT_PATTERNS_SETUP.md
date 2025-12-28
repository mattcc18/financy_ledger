# Import Patterns Table Setup

The CSV import feature uses an optional `import_patterns` table to learn from your imports and improve accuracy over time.

## Setup Instructions

1. **Open Supabase SQL Editor**: Go to your Supabase project dashboard and open the SQL Editor.

2. **Run the Migration**: Copy and paste the contents of `create_import_patterns_table.sql` into the SQL Editor and execute it.

   Or run this SQL directly:

```sql
-- Store learned patterns for future CSV imports
CREATE TABLE IF NOT EXISTS import_patterns (
    pattern_id SERIAL PRIMARY KEY,
    pattern_type VARCHAR(50) NOT NULL, -- 'merchant', 'description', 'account_match', 'category'
    pattern_value TEXT NOT NULL,
    matched_account_id INTEGER REFERENCES accounts.list(account_id) ON DELETE SET NULL,
    matched_category VARCHAR(100),
    matched_transaction_type VARCHAR(20), -- 'income', 'expense', 'transfer'
    confidence_score DECIMAL(3,2) DEFAULT 0.5 CHECK (confidence_score >= 0 AND confidence_score <= 1),
    usage_count INTEGER DEFAULT 1,
    last_used TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_pattern_type_value ON import_patterns(pattern_type, LOWER(pattern_value));
CREATE INDEX IF NOT EXISTS idx_pattern_merchant ON import_patterns(pattern_type, LOWER(pattern_value)) WHERE pattern_type = 'merchant';
CREATE INDEX IF NOT EXISTS idx_pattern_account ON import_patterns(matched_account_id) WHERE matched_account_id IS NOT NULL;

COMMENT ON TABLE import_patterns IS 'Stores learned patterns from CSV imports to improve future recognition';
COMMENT ON COLUMN import_patterns.pattern_type IS 'Type of pattern: merchant, description, account_match, category';
COMMENT ON COLUMN import_patterns.pattern_value IS 'The actual pattern value (merchant name, description text, etc.)';
COMMENT ON COLUMN import_patterns.matched_account_id IS 'Account ID that this pattern matches to';
COMMENT ON COLUMN import_patterns.matched_category IS 'Category that this pattern matches to';
COMMENT ON COLUMN import_patterns.matched_transaction_type IS 'Transaction type (income, expense, transfer)';
COMMENT ON COLUMN import_patterns.confidence_score IS 'Confidence score from 0 to 1';
COMMENT ON COLUMN import_patterns.usage_count IS 'Number of times this pattern has been used';
```

3. **Verify**: The table is now created and the CSV import feature will use it to learn patterns.

## Note

The CSV import feature will work **without** this table, but it won't be able to learn from your imports. The code has been updated to gracefully handle the missing table, so you'll see errors in the logs but the import will still work.

## Benefits

Once the table is created, the system will:
- Remember which accounts merchants belong to
- Learn category classifications
- Improve matching accuracy over time
- Reduce the number of uncertain transactions



