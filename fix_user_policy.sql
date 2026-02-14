-- ===================================
-- FIX USER INSERT POLICY
-- ===================================
-- Run this ONLY to fix the user creation issue
-- This allows users to create their own profile after OAuth login

-- Drop the old combined policy
DROP POLICY IF EXISTS "Users can update own profile" ON users;

-- Create separate policies for each operation
CREATE POLICY "Users can insert own profile" ON users
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can delete own profile" ON users
  FOR DELETE USING (auth.uid() = id);

-- Make sure read policy exists
DROP POLICY IF EXISTS "Users can read all profiles" ON users;
CREATE POLICY "Users can read all profiles" ON users
  FOR SELECT USING (true);

-- Done! Users can now create their profile after OAuth login
