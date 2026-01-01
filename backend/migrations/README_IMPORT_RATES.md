# Import Exchange Rates

This script generates SQL to import exchange rates from the CSV file for a specific user.

## Usage

```bash
cd backend/migrations
python3 import_exchange_rates.py <your_user_id>
```

## Example

```bash
python3 import_exchange_rates.py "123e4567-e89b-12d3-a456-426614174000"
```

## Finding Your User ID

You can find your user_id by:
1. Logging into your application and checking the browser's localStorage or network requests
2. Running this SQL in Supabase:
   ```sql
   SELECT id, email FROM auth.users;
   ```

## Output

The script generates `import_exchange_rates_sep2025.sql` which contains:
- Exchange rates from September 2025 to latest
- CHF, GBP, and USD only
- Weekend dates filled with previous Friday's rates
- All rates associated with your user_id

## Running the SQL

Copy the generated SQL and run it in your Supabase SQL Editor.


