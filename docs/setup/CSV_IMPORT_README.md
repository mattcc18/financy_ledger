# CSV Import Feature

## Overview
The CSV import feature allows you to upload transaction CSV files from various banks (Revolut, Monzo, etc.) and automatically:
- Recognize transaction types (income, expense, transfer)
- Match transactions to accounts
- Categorize transactions
- Match trips (if applicable)
- Learn patterns for future imports

## Setup

### 1. Database Migration
Run the migration to create the `import_patterns` table:

```sql
-- Run this in Supabase SQL Editor
\i backend/migrations/create_import_patterns_table.sql
```

Or copy and paste the contents of `backend/migrations/create_import_patterns_table.sql` into the Supabase SQL Editor.

### 2. Backend API
The CSV import API endpoints are automatically registered when you start the backend server:
- `POST /api/csv-import/upload` - Upload and parse CSV file
- `POST /api/csv-import/confirm` - Confirm and import transactions

### 3. Frontend
The CSV Import page is accessible from the navigation bar at `/csv-import`.

## Supported CSV Formats

### Revolut Statement Format
Expected columns:
- `Type` - Transaction type (e.g., "Card Payment", "Top Up", "Transfer")
- `Product` - Product type
- `Started Date` - Start date
- `Completed Date` - Completion date (format: DD/MM/YYYY)
- `Description` - Transaction description
- `Amount` - Transaction amount
- `Currency` - Currency code
- `State` - Transaction state (REVERTED transactions are skipped)

### Revolut Expense Format
Expected columns:
- `date` - Transaction date (format: DD/MM/YYYY)
- `total_amt` or `amount` - Transaction amount
- `merchandiser` or `merchant` - Merchant name
- `currency` - Currency code
- `expense_category` or `category` - Category (optional)
- `Trip` or `trip` - Trip name (optional)

### Monzo Format
Similar to Revolut Expense format.

## How It Works

### 1. Pattern Matching
The system uses pattern matching to:
- **Classify transaction types**: Based on keywords in the transaction type and description
- **Match accounts**: By currency and description keywords (account name, institution)
- **Categorize transactions**: Using keyword matching (e.g., "tesco" → Groceries, "uber" → Transport)

### 2. Learning System
When you confirm transactions, the system saves patterns to the `import_patterns` table:
- **Merchant patterns**: Links merchant names to accounts, categories, and transaction types
- **Confidence scores**: Tracks how confident each match is (0.0 to 1.0)
- **Usage count**: Tracks how often each pattern is used

Future imports will use these learned patterns to improve accuracy.

### 3. Review Interface
Transactions with low confidence (< 0.7) or missing account matches are flagged for review:
- Edit account, category, merchant, trip, or transaction type
- Delete transactions you don't want to import
- Import only after reviewing uncertain transactions

## Usage

1. **Navigate to CSV Import**: Click "CSV Import" in the navigation bar
2. **Select CSV File**: Click "Select CSV File" and choose your CSV file
3. **Process CSV**: Click "Process CSV" to parse the file
4. **Review Results**:
   - **Confident Transactions**: Automatically matched with high confidence (> 0.7)
   - **Review Required**: Transactions needing manual review (< 0.7 confidence or missing account)
   - **Errors**: Rows that couldn't be parsed
5. **Edit Uncertain Transactions** (if needed):
   - Click the edit icon (✏️) to modify account, category, merchant, trip, or transaction type
   - Click the delete icon (🗑️) to remove transactions you don't want
6. **Import Transactions**: Click "Import" to save all transactions to the database

## Pattern Learning

The system learns from your confirmations:
- **High confidence patterns** (user-confirmed): Saved with 0.9 confidence
- **Pattern updates**: When a pattern is used again, its confidence and usage count increase
- **Account matching**: Links merchant names and descriptions to specific accounts

## Tips for Better Recognition

1. **Consistent Account Names**: Use consistent account names in your database (e.g., "Revolut EUR" not "Revolut - EUR")
2. **Review First Import**: The first import will have more uncertain transactions. Review and confirm them to improve future imports.
3. **Trip Matching**: If your CSV includes trip names, ensure they match trip names in your database
4. **Category Keywords**: The system recognizes common keywords. If a category isn't recognized, you can edit it during review.

## Troubleshooting

### "Unknown CSV format"
- Check that your CSV has the expected columns
- The system currently supports Revolut Statement, Revolut Expense, and Monzo formats
- If you have a different format, you may need to modify `backend/app/api/csv_import.py`

### "No account match"
- Ensure you have accounts in the database with matching currencies
- Edit the transaction during review to select the correct account
- The system will learn this pattern for future imports

### Transactions not importing
- Check that all required fields are present (account_id, transaction_date, amount, transaction_type)
- Review the "Errors" section for specific issues
- Ensure the transaction date is in the correct format (DD/MM/YYYY)

## Future Enhancements

Potential improvements:
- Support for more CSV formats (bank-specific)
- Duplicate detection (check if transaction already exists)
- Batch editing of uncertain transactions
- Export/import of learned patterns
- Machine learning for better categorization



