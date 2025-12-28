# Import Expenses from Transactions.md

## Prerequisites

**IMPORTANT: Run these SQL migrations in Supabase SQL Editor BEFORE running the import script:**

1. **Create trips table** - Run `create_trips_table.sql` first
2. **Add accounts** - Run `add_accounts.sql` to add accounts to database
3. **Expenses table** - Should already exist from `supabase_schema_complete.sql`

The script will check that all required tables exist and give you a helpful error message if any are missing.

## Steps

1. **Activate virtual environment:**
   ```bash
   cd backend
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

2. **Run the import script:**
   ```bash
   python migrations/import_expenses.py
   ```

## What the Script Does

1. **Parses Transactions.md** - Reads the markdown table and extracts expense data
2. **Creates Trips** - Automatically creates trips from unique `trip_id` values in the expenses:
   - "ZRH Dec 2025"
   - "DUB Xmas 2025"
   - "CPH Oct 2025"
   - "Interrail ticket black Friday 2025"
   - etc.
3. **Maps Accounts** - Maps account names to account_ids from the database
4. **Inserts Expenses** - Inserts all expenses with proper foreign key relationships

## Notes

- The script will skip expenses if the account_name doesn't match any account in the database
- Trips are created automatically based on trip_id values in the expenses
- If a trip already exists (by name), it will use the existing trip_id
- The script commits in batches for better performance

## Troubleshooting

If you get database connection errors:
- Make sure `.env` file exists in `backend/` directory
- Check that `SUPABASE_DB_URL` is set correctly

If accounts aren't found:
- Run `add_accounts.sql` first to ensure accounts exist
- Check that account names match exactly (case-sensitive)

