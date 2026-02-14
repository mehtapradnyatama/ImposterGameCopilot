-- =========================================
-- SIMPLE RLS FIX - NO RECURSION
-- =========================================
-- Run this COMPLETE script in Supabase SQL Editor
-- This fixes infinite recursion and 500 errors

-- ==========================================
-- DISABLE RLS TEMPORARILY TO CLEAN UP
-- ==========================================
ALTER TABLE rooms DISABLE ROW LEVEL SECURITY;
ALTER TABLE votes DISABLE ROW LEVEL SECURITY;
ALTER TABLE room_participants DISABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages DISABLE ROW LEVEL SECURITY;

-- ==========================================
-- DROP ALL EXISTING POLICIES
-- ==========================================

-- Rooms policies
DROP POLICY IF EXISTS "Users can view rooms" ON rooms;
DROP POLICY IF EXISTS "Users can create rooms" ON rooms;
DROP POLICY IF EXISTS "Users can update rooms" ON rooms;
DROP POLICY IF EXISTS "Host can update room" ON rooms;
DROP POLICY IF EXISTS "Users can read rooms" ON rooms;

-- Votes policies
DROP POLICY IF EXISTS "Users can read votes in their room" ON votes;
DROP POLICY IF EXISTS "Users can vote" ON votes;
DROP POLICY IF EXISTS "Users can insert votes" ON votes;
DROP POLICY IF EXISTS "Users can update their own vote" ON votes;

-- Participants policies
DROP POLICY IF EXISTS "Users can view participants" ON room_participants;
DROP POLICY IF EXISTS "Users can join rooms" ON room_participants;
DROP POLICY IF EXISTS "Users can read participants" ON room_participants;
DROP POLICY IF EXISTS "Users can insert participants" ON room_participants;
DROP POLICY IF EXISTS "Host can update participants" ON room_participants;
DROP POLICY IF EXISTS "Users can read participants in their room" ON room_participants;
DROP POLICY IF EXISTS "Users can insert themselves as participant" ON room_participants;

-- Chat policies
DROP POLICY IF EXISTS "Users can read messages" ON chat_messages;
DROP POLICY IF EXISTS "Users can send messages" ON chat_messages;

-- ==========================================
-- 1. ROOMS TABLE - SIMPLE POLICIES
-- ==========================================
ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;

-- Allow participants to read rooms
CREATE POLICY "rooms_select_policy" ON rooms
  FOR SELECT
  USING (true); -- For now, allow all reads to avoid complexity

-- Allow authenticated users to create rooms
CREATE POLICY "rooms_insert_policy" ON rooms
  FOR INSERT
  WITH CHECK (auth.uid() = host_id);

-- Allow host to update their rooms
CREATE POLICY "rooms_update_policy" ON rooms
  FOR UPDATE
  USING (auth.uid() = host_id)
  WITH CHECK (auth.uid() = host_id);

-- ==========================================
-- 2. ROOM_PARTICIPANTS - NO RECURSION
-- ==========================================
ALTER TABLE room_participants ENABLE ROW LEVEL SECURITY;

-- Allow all authenticated users to read participants (simplest)
CREATE POLICY "participants_select_policy" ON room_participants
  FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- Allow users to insert themselves
CREATE POLICY "participants_insert_policy" ON room_participants
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Allow host to update participants (for scores, words, impostor status)
CREATE POLICY "participants_update_policy" ON room_participants
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM rooms 
      WHERE id = room_participants.room_id 
      AND host_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM rooms 
      WHERE id = room_participants.room_id 
      AND host_id = auth.uid()
    )
  );

-- ==========================================
-- 3. VOTES TABLE
-- ==========================================
ALTER TABLE votes ENABLE ROW LEVEL SECURITY;

-- Allow participants to insert votes
CREATE POLICY "votes_insert_policy" ON votes
  FOR INSERT
  WITH CHECK (auth.uid() = voter_id);

-- Allow authenticated users to read votes
CREATE POLICY "votes_select_policy" ON votes
  FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- ==========================================
-- 4. CHAT_MESSAGES TABLE
-- ==========================================
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read messages
CREATE POLICY "messages_select_policy" ON chat_messages
  FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- Allow users to send messages
CREATE POLICY "messages_insert_policy" ON chat_messages
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- ==========================================
-- VERIFICATION
-- ==========================================
SELECT 'Policies created successfully!' as status;

SELECT 
  tablename, 
  policyname,
  cmd as command
FROM pg_policies 
WHERE tablename IN ('rooms', 'votes', 'room_participants', 'chat_messages')
ORDER BY tablename, policyname;
