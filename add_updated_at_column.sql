-- =========================================
-- ADD UPDATED_AT COLUMN TO ROOMS
-- =========================================
-- Run this in Supabase SQL Editor

-- Add updated_at column to rooms table
ALTER TABLE rooms 
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW();

-- Create trigger to auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger on rooms table
DROP TRIGGER IF EXISTS update_rooms_updated_at ON rooms;
CREATE TRIGGER update_rooms_updated_at
    BEFORE UPDATE ON rooms
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Set current rooms' updated_at to created_at if NULL
UPDATE rooms 
SET updated_at = created_at 
WHERE updated_at IS NULL;

-- Verify
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'rooms' 
  AND column_name IN ('created_at', 'updated_at')
ORDER BY ordinal_position;
