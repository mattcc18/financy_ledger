-- Update expenses.trip_id to reference trips.trip_id (Integer foreign key)
-- Run this AFTER create_trips_table.sql
-- 
-- NOTE: If you have existing expenses with trip_id values, you have two options:
--   1. If trip_id values are already integers: This script will work directly
--   2. If trip_id values are strings (trip names): You need to create trips first,
--      then use the migration script below to map string names to trip_ids

-- Step 1: Check if trip_id column exists and what type it is
DO $$
BEGIN
    -- Check if column exists and is VARCHAR
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'expenses' 
          AND table_name = 'list' 
          AND column_name = 'trip_id'
          AND data_type = 'character varying'
    ) THEN
        -- Step 1a: Create a temporary column for the new integer trip_id
        ALTER TABLE expenses.list ADD COLUMN IF NOT EXISTS trip_id_temp INTEGER;
        
        -- Step 1b: Drop the old VARCHAR column
        ALTER TABLE expenses.list DROP COLUMN trip_id;
        
        -- Step 1c: Rename the temp column to trip_id
        ALTER TABLE expenses.list RENAME COLUMN trip_id_temp TO trip_id;
        
        RAISE NOTICE 'Converted trip_id from VARCHAR to INTEGER';
    ELSIF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'expenses' 
          AND table_name = 'list' 
          AND column_name = 'trip_id'
          AND data_type = 'integer'
    ) THEN
        RAISE NOTICE 'trip_id is already INTEGER, skipping conversion';
    ELSE
        -- Column doesn't exist, create it
        ALTER TABLE expenses.list ADD COLUMN trip_id INTEGER;
        RAISE NOTICE 'Created trip_id column as INTEGER';
    END IF;
END $$;

-- Step 2: Add foreign key constraint (if it doesn't exist)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.table_constraints 
        WHERE constraint_schema = 'expenses' 
          AND table_name = 'list' 
          AND constraint_name = 'fk_expenses_trip_id'
    ) THEN
        ALTER TABLE expenses.list 
        ADD CONSTRAINT fk_expenses_trip_id 
        FOREIGN KEY (trip_id) 
        REFERENCES trips.list(trip_id) 
        ON DELETE SET NULL;
        
        RAISE NOTICE 'Added foreign key constraint';
    ELSE
        RAISE NOTICE 'Foreign key constraint already exists';
    END IF;
END $$;

-- Step 3: Create index (if it doesn't exist)
CREATE INDEX IF NOT EXISTS idx_expenses_trip_id ON expenses.list(trip_id);

-- Verify the change
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'expenses' 
  AND table_name = 'list' 
  AND column_name = 'trip_id';
