-- Fix RLS policies for users table to allow score updates
-- Run this in Supabase SQL Editor

-- Enable RLS if not already enabled
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Users can view all profiles" ON users;
DROP POLICY IF EXISTS "Users can insert their own profile" ON users;
DROP POLICY IF EXISTS "Users can update their own profile" ON users;
DROP POLICY IF EXISTS "Users can update own score" ON users;

-- 1. Allow everyone to view all user profiles (for leaderboard)
CREATE POLICY "Users can view all profiles"
ON users FOR SELECT
USING (true);

-- 2. Allow users to insert their own profile on first login
CREATE POLICY "Users can insert their own profile"
ON users FOR INSERT
WITH CHECK (auth.uid() = id);

-- 3. CRITICAL FIX: Allow users to update ONLY their own score
-- Each player will update their own score, not the host updating everyone
CREATE POLICY "Users can update own score"
ON users FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Verify policies are created
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies
WHERE tablename = 'users';

-- Note: With this RLS policy, each client must update their own score.
-- The host cannot update other players' scores (security best practice).