# Import Trips from Transactions.md

## Overview

This script extracts unique trip names from the Transactions.md file and creates trip records in the database with start and end dates based on the expense dates.

## Prerequisites

**IMPORTANT: Run this SQL migration in Supabase SQL Editor FIRST:**

1. **Create trips table** - Run `create_trips_table.sql`

## Steps

1. **Activate virtual environment:**
   ```bash
   cd backend
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

2. **Run the import script:**
   ```bash
   python migrations/import_trips.py
   ```

## What the Script Does

1. **Parses Transactions.md** - Reads the markdown table and extracts expense data
2. **Extracts Unique Trips** - Finds all unique `trip_id` values (e.g., "ZRH Dec 2025", "DUB Xmas 2025")
3. **Calculates Date Ranges** - For each trip, finds the earliest and latest expense date
4. **Creates/Updates Trips** - Inserts trips into the database with:
   - `trip_name` - The trip identifier from expenses
   - `start_date` - Earliest expense date for that trip
   - `end_date` - Latest expense date for that trip

## Example Trips Created

- **ZRH Dec 2025** - Zurich trip in December 2025
- **DUB Xmas 2025** - Dublin Christmas trip 2025
- **CPH Oct 2025** - Copenhagen trip in October 2025
- **Interrail ticket black Friday 2025** - Interrail trip

## Notes

- If a trip already exists (by name), the script will update the date range if the new dates are wider
- Trips with `null` or empty `trip_id` values are skipped
- The script is safe to run multiple times - it won't create duplicates

## Troubleshooting

If you get "trips.list table does not exist":
- Run `migrations/create_trips_table.sql` in Supabase SQL Editor first

If you get database connection errors:
- Make sure `.env` file exists in `backend/` directory
- Check that `SUPABASE_DB_URL` is set correctly



