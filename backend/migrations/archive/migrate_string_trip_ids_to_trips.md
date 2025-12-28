# Migrating String Trip IDs to Trips Table

If you have existing expenses with `trip_id` values that are strings (trip names), you'll need to:

1. **Create trips** from the unique trip_id values in your expenses
2. **Update expenses** to use the new integer trip_id values

## Step-by-Step Migration

### Step 1: Find all unique trip names in expenses

```sql
SELECT DISTINCT trip_id 
FROM expenses.list 
WHERE trip_id IS NOT NULL 
  AND trip_id != '';
```

### Step 2: Create trips for each unique trip name

```sql
-- Example: Insert trips based on unique trip_id values
INSERT INTO trips.list (trip_name, start_date, end_date)
SELECT DISTINCT 
    trip_id as trip_name,
    MIN(expense_date) as start_date,  -- Earliest expense date
    MAX(expense_date) as end_date      -- Latest expense date
FROM expenses.list
WHERE trip_id IS NOT NULL AND trip_id != ''
GROUP BY trip_id;
```

### Step 3: Update expenses to use the new integer trip_ids

```sql
-- Map string trip_ids to integer trip_ids
UPDATE expenses.list e
SET trip_id = t.trip_id
FROM trips.list t
WHERE e.trip_id::text = t.trip_name  -- Cast to text for comparison
  AND e.trip_id IS NOT NULL
  AND e.trip_id != '';
```

### Step 4: Run the migration script

After mapping string trip_ids to integer trip_ids, run:
- `update_expenses_trip_id.sql`

This will ensure the foreign key constraint is properly set up.



