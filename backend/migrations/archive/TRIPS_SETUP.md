# Trips Database Setup

## Overview

A dedicated `trips` table has been created to track trips/holidays and link expenses to them. This provides better data integrity and easier querying than storing trip names as strings.

## Database Schema

### Trips Table (`trips.list`)
- `trip_id` (SERIAL PRIMARY KEY) - Auto-incrementing ID
- `trip_name` (VARCHAR(255)) - Name of the trip (e.g., "Japan 2025", "Summer Holiday")
- `start_date` (DATE) - Optional trip start date
- `end_date` (DATE) - Optional trip end date
- `location` (VARCHAR(255)) - Optional location/destination
- `description` (TEXT) - Optional description
- `created_at` (TIMESTAMP) - Auto-generated
- `updated_at` (TIMESTAMP) - Auto-generated

### Expenses Table Update
- `trip_id` changed from `VARCHAR(100)` to `INTEGER`
- Now references `trips.list(trip_id)` as a foreign key
- `ON DELETE SET NULL` - If a trip is deleted, expenses keep the expense but trip_id becomes NULL

## Setup Steps

### Step 1: Create Trips Table
Run `create_trips_table.sql` in Supabase SQL Editor:
```sql
-- This creates the trips schema and table
```

### Step 2: Update Expenses Table
Run `update_expenses_trip_id.sql` in Supabase SQL Editor:
```sql
-- This converts trip_id from VARCHAR to INTEGER and adds foreign key constraint
```

### Step 3: Migrate Existing Data (if needed)
If you have existing expenses with string trip_id values, follow `migrate_string_trip_ids_to_trips.md` to:
1. Create trips from existing trip_id values
2. Map expenses to the new integer trip_ids

## API Endpoints

### Get All Trips
```bash
GET /api/trips
```

### Get Trip by ID
```bash
GET /api/trips/{trip_id}
```

### Create Trip
```bash
POST /api/trips
Content-Type: application/json

{
  "trip_name": "Japan 2025",
  "start_date": "2025-03-01",
  "end_date": "2025-03-15",
  "location": "Tokyo, Japan",
  "description": "Spring vacation"
}
```

### Update Trip
```bash
PUT /api/trips/{trip_id}
Content-Type: application/json

{
  "location": "Tokyo and Kyoto, Japan",
  "end_date": "2025-03-20"
}
```

### Delete Trip
```bash
DELETE /api/trips/{trip_id}
```
Note: Expenses linked to this trip will have `trip_id` set to NULL (not deleted)

### Get Trip Expenses
```bash
GET /api/trips/{trip_id}/expenses
```
Returns all expenses for a specific trip

## Example Usage

### Creating a Trip and Adding Expenses

```bash
# 1. Create a trip
curl -X POST http://localhost:8000/api/trips \
  -H 'Content-Type: application/json' \
  -d '{
    "trip_name": "Japan 2025",
    "start_date": "2025-03-01",
    "end_date": "2025-03-15",
    "location": "Tokyo"
  }'

# Response: { "trip_id": 1, "trip_name": "Japan 2025", ... }

# 2. Create expenses linked to the trip (via expenses API)
# Note: You'll need to use the expenses API endpoint with trip_id field
```

## Benefits

1. **Data Integrity**: Foreign key constraint ensures trip_id references valid trips
2. **Better Querying**: Can query trips separately and join with expenses
3. **Trip Metadata**: Store trip dates, location, description in one place
4. **Easier Filtering**: Query expenses by trip with proper joins
5. **Data Validation**: Can't accidentally create expenses with invalid trip_ids

## Migration Notes

- If you have existing expenses with trip_id values, they need to be migrated
- String trip_ids should be converted to trips first, then mapped to expenses
- See `migrate_string_trip_ids_to_trips.md` for detailed migration steps



