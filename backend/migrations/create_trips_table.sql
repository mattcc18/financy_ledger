-- Create Trips Schema and Table
-- Run this in Supabase SQL Editor

-- Create trips schema
CREATE SCHEMA IF NOT EXISTS trips;

-- Create trips table
CREATE TABLE IF NOT EXISTS trips.list (
    trip_id SERIAL PRIMARY KEY,
    trip_name VARCHAR(255) NOT NULL,
    start_date DATE,
    end_date DATE,
    location VARCHAR(255),
    description TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create index on trip_name for faster lookups
CREATE INDEX IF NOT EXISTS idx_trips_name ON trips.list(trip_name);
CREATE INDEX IF NOT EXISTS idx_trips_dates ON trips.list(start_date, end_date);

-- Add comment
COMMENT ON TABLE trips.list IS 'Trips/holidays for expense tracking';
COMMENT ON COLUMN trips.list.trip_name IS 'Name of the trip/holiday (e.g., "Japan 2025", "Summer Holiday")';
COMMENT ON COLUMN trips.list.start_date IS 'Trip start date';
COMMENT ON COLUMN trips.list.end_date IS 'Trip end date';
COMMENT ON COLUMN trips.list.location IS 'Trip location/destination';

-- Verify table was created
SELECT table_name, column_name, data_type 
FROM information_schema.columns 
WHERE table_schema = 'trips' 
ORDER BY table_name, ordinal_position;



