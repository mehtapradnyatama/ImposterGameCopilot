-- =========================================
-- DIAGNOSTIC QUERIES - RLS DEBUGGING
-- =========================================
-- Run these queries to diagnose RLS problems

-- 1. Check if RLS is enabled on all tables
SELECT 
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('rooms', 'votes', 'room_participants', 'chat_messages')
ORDER BY tablename;

-- 2. List all current policies
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('rooms', 'votes', 'room_participants', 'chat_messages')
ORDER BY tablename, policyname;

-- 3. Check votes table structure
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'votes'
ORDER BY ordinal_position;

-- 4. Check existing votes (as authenticated user)
SELECT 
  id,
  room_id,
  voter_id,
  voted_for_id,
  created_at
FROM votes
LIMIT 5;

-- 5. Check rooms table
SELECT 
  id,
  code,
  host_id,
  status,
  created_at
FROM rooms
ORDER BY created_at DESC
LIMIT 5;

-- 6. Check room_participants
SELECT 
  rp.id,
  rp.room_id,
  rp.user_id,
  u.email,
  rp.is_imposter,
  rp.joined_at
FROM room_participants rp
LEFT JOIN users u ON u.id = rp.user_id
ORDER BY rp.joined_at DESC
LIMIT 10;

-- 7. Test INSERT permission (will fail if RLS blocks)
-- Replace with actual UUIDs from your session
-- This is just a test query - won't actually insert
EXPLAIN (ANALYZE, VERBOSE, COSTS, BUFFERS) 
INSERT INTO votes (room_id, voter_id, voted_for_id)
SELECT 
  (SELECT id FROM rooms ORDER BY created_at DESC LIMIT 1),
  auth.uid(),
  auth.uid()
WHERE false; -- Won't actually insert

-- 8. Check users table for auth mapping
SELECT 
  id,
  email,
  created_at
FROM users
ORDER BY created_at DESC
LIMIT 5;

-- 9. Find problematic policies (that might cause recursion)
SELECT 
  policyname,
  tablename,
  qual,
  with_check
FROM pg_policies
WHERE (qual LIKE '%room_participants%' OR with_check LIKE '%room_participants%')
  AND tablename = 'room_participants';

-- 10. Show current auth user (if logged in via Supabase)
SELECT auth.uid() as current_user_id;

-- 11. Check if there are any foreign key constraint issues
SELECT
  tc.table_name, 
  kcu.column_name, 
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name 
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY' 
  AND tc.table_name IN ('votes', 'room_participants', 'chat_messages')
ORDER BY tc.table_name;
