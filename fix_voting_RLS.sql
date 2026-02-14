-- =========================================
-- FIX VOTING ERROR - RLS POLICIES
-- =========================================
-- Run this in Supabase SQL Editor to fix 400 errors

-- 1. Drop existing policies to recreate them
DROP POLICY IF EXISTS "Users can read votes in their room" ON votes;
DROP POLICY IF EXISTS "Users can vote" ON votes;

-- 2. Enable RLS if not already enabled
ALTER TABLE votes ENABLE ROW LEVEL SECURITY;

-- 3. Allow participants to INSERT votes
CREATE POLICY "Users can insert votes" ON votes
  FOR INSERT
  WITH CHECK (
    auth.uid() = voter_id AND
    EXISTS (
      SELECT 1 FROM room_participants 
      WHERE room_id = votes.room_id 
      AND user_id = auth.uid()
    )
  );

-- 4. Allow participants to read votes in their room
CREATE POLICY "Users can read votes in their room" ON votes
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM room_participants 
      WHERE room_id = votes.room_id 
      AND user_id = auth.uid()
    )
  );

-- 5. Allow participants to update their own vote (if needed)
CREATE POLICY "Users can update their own vote" ON votes
  FOR UPDATE
  USING (auth.uid() = voter_id)
  WITH CHECK (auth.uid() = voter_id);

-- 6. Verify votes table structure
-- Make sure these columns exist:
-- - id (UUID PRIMARY KEY)
-- - room_id (UUID REFERENCES rooms)
-- - voter_id (UUID REFERENCES users)
-- - voted_for_id (UUID REFERENCES users)
-- - created_at (TIMESTAMP)

-- Check if table is correct
SELECT 
  column_name, 
  data_type, 
  is_nullable 
FROM information_schema.columns 
WHERE table_name = 'votes' 
ORDER BY ordinal_position;
