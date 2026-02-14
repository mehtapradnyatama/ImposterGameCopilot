-- =========================================
-- FIX ROOMS UPDATE ERROR - RLS POLICIES
-- =========================================
-- Run this in Supabase SQL Editor

-- 1. Drop existing policies for rooms
DROP POLICY IF EXISTS "Users can view rooms" ON rooms;
DROP POLICY IF EXISTS "Users can create rooms" ON rooms;
DROP POLICY IF EXISTS "Users can update rooms" ON rooms;
DROP POLICY IF EXISTS "Host can update room" ON rooms;
DROP POLICY IF EXISTS "Users can read rooms" ON rooms;

-- 2. Enable RLS on rooms table
ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;

-- 3. Allow anyone to read rooms they're participating in
CREATE POLICY "Users can read rooms" ON rooms
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM room_participants 
      WHERE room_id = rooms.id 
      AND user_id = auth.uid()
    )
  );

-- 4. Allow authenticated users to create rooms
CREATE POLICY "Users can create rooms" ON rooms
  FOR INSERT
  WITH CHECK (auth.uid() = host_id);

-- 5. Allow HOST to update their own rooms (IMPORTANT FOR START VOTING!)
CREATE POLICY "Host can update room" ON rooms
  FOR UPDATE
  USING (auth.uid() = host_id)
  WITH CHECK (auth.uid() = host_id);

-- 6. Verify rooms table has updated_at column
-- Check columns
SELECT 
  column_name, 
  data_type, 
  is_nullable 
FROM information_schema.columns 
WHERE table_name = 'rooms' 
ORDER BY ordinal_position;
