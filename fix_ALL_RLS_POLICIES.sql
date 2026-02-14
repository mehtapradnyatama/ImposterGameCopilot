-- =========================================
-- COMPLETE RLS FIX - ALL TABLES
-- =========================================
-- Run this ENTIRE script in Supabase SQL Editor
-- This will fix all 400 Bad Request errors

-- ==========================================
-- 1. FIX ROOMS TABLE
-- ==========================================

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view rooms" ON rooms;
DROP POLICY IF EXISTS "Users can create rooms" ON rooms;
DROP POLICY IF EXISTS "Users can update rooms" ON rooms;
DROP POLICY IF EXISTS "Host can update room" ON rooms;
DROP POLICY IF EXISTS "Users can read rooms" ON rooms;

-- Enable RLS
ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can read rooms" ON rooms
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM room_participants 
      WHERE room_id = rooms.id 
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create rooms" ON rooms
  FOR INSERT
  WITH CHECK (auth.uid() = host_id);

CREATE POLICY "Host can update room" ON rooms
  FOR UPDATE
  USING (auth.uid() = host_id)
  WITH CHECK (auth.uid() = host_id);

-- ==========================================
-- 2. FIX VOTES TABLE
-- ==========================================

-- Drop existing policies
DROP POLICY IF EXISTS "Users can read votes in their room" ON votes;
DROP POLICY IF EXISTS "Users can vote" ON votes;
DROP POLICY IF EXISTS "Users can insert votes" ON votes;
DROP POLICY IF EXISTS "Users can update their own vote" ON votes;

-- Enable RLS
ALTER TABLE votes ENABLE ROW LEVEL SECURITY;

-- Create policies
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

CREATE POLICY "Users can read votes in their room" ON votes
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM room_participants 
      WHERE room_id = votes.room_id 
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own vote" ON votes
  FOR UPDATE
  USING (auth.uid() = voter_id)
  WITH CHECK (auth.uid() = voter_id);

-- ==========================================
-- 3. FIX ROOM_PARTICIPANTS TABLE
-- ==========================================

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view participants" ON room_participants;
DROP POLICY IF EXISTS "Users can join rooms" ON room_participants;
DROP POLICY IF EXISTS "Users can read participants" ON room_participants;
DROP POLICY IF EXISTS "Users can insert participants" ON room_participants;
DROP POLICY IF EXISTS "Host can update participants" ON room_participants;

-- Enable RLS
ALTER TABLE room_participants ENABLE ROW LEVEL SECURITY;

-- Create policies (FIXED - No infinite recursion!)
CREATE POLICY "Users can read participants in their room" ON room_participants
  FOR SELECT
  USING (
    -- Can see participants in rooms they're in
    room_id IN (
      SELECT room_id FROM room_participants WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert themselves as participant" ON room_participants
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Host can update participants" ON room_participants
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM rooms 
      WHERE rooms.id = room_participants.room_id 
      AND rooms.host_id = auth.uid()
    )
  );

-- ==========================================
-- 4. FIX CHAT_MESSAGES TABLE
-- ==========================================

-- Drop existing policies
DROP POLICY IF EXISTS "Users can read messages" ON chat_messages;
DROP POLICY IF EXISTS "Users can send messages" ON chat_messages;

-- Enable RLS
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can read messages" ON chat_messages
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM room_participants 
      WHERE room_id = chat_messages.room_id 
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can send messages" ON chat_messages
  FOR INSERT
  WITH CHECK (
    auth.uid() = user_id AND
    EXISTS (
      SELECT 1 FROM room_participants 
      WHERE room_id = chat_messages.room_id 
      AND user_id = auth.uid()
    )
  );

-- ==========================================
-- VERIFICATION
-- ==========================================

-- Check all policies are created
SELECT schemaname, tablename, policyname 
FROM pg_policies 
WHERE tablename IN ('rooms', 'votes', 'room_participants', 'chat_messages')
ORDER BY tablename, policyname;
