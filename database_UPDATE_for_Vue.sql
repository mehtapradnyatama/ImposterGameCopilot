-- ===================================
-- UPDATE DATABASE SCHEMA FOR VUE.JS
-- ===================================
-- Run this in Supabase SQL Editor
-- This will update existing schema to match Vue.js code

-- 1. Update users table
-- Add new columns if they don't exist
ALTER TABLE users 
  ADD COLUMN IF NOT EXISTS full_name TEXT,
  ADD COLUMN IF NOT EXISTS total_score INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS games_played INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS games_won INTEGER DEFAULT 0;

-- Copy data from old columns to new columns if old columns exist
DO $$ 
BEGIN
  -- Copy display_name to full_name if display_name exists and full_name is empty
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name='users' AND column_name='display_name'
  ) THEN
    UPDATE users SET full_name = display_name WHERE full_name IS NULL;
    ALTER TABLE users DROP COLUMN IF EXISTS display_name;
  END IF;
  
  -- Copy total_points to total_score if total_points exists
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name='users' AND column_name='total_points'
  ) THEN
    UPDATE users SET total_score = total_points WHERE total_score = 0;
    ALTER TABLE users DROP COLUMN IF EXISTS total_points;
  END IF;
END $$;

-- 2. Update rooms table
ALTER TABLE rooms 
  ADD COLUMN IF NOT EXISTS name TEXT,
  ADD COLUMN IF NOT EXISTS discussion_time INTEGER DEFAULT 120,
  ADD COLUMN IF NOT EXISTS voting_time INTEGER DEFAULT 60,
  ADD COLUMN IF NOT EXISTS rounds INTEGER DEFAULT 3,
  ADD COLUMN IF NOT EXISTS voice_chat_enabled BOOLEAN DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS current_round INTEGER DEFAULT 1;

-- Make topic nullable
ALTER TABLE rooms ALTER COLUMN topic DROP NOT NULL;

-- Rename min_players if exists (we don't use it in Vue)
-- But keep max_players

-- 3. Update room_participants table
ALTER TABLE room_participants 
  ADD COLUMN IF NOT EXISTS is_host BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS score INTEGER DEFAULT 0;

-- Copy points to score if points exists
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name='room_participants' AND column_name='points'
  ) THEN
    UPDATE room_participants SET score = points WHERE score = 0;
    ALTER TABLE room_participants DROP COLUMN IF EXISTS points;
  END IF;
END $$;

-- 4. Update game_rounds table
ALTER TABLE game_rounds 
  ADD COLUMN IF NOT EXISTS secret_word TEXT;

-- Copy word to secret_word if exists
UPDATE game_rounds SET secret_word = word WHERE secret_word IS NULL;

-- 5. Update votes table - add round_id reference
ALTER TABLE votes 
  ADD COLUMN IF NOT EXISTS round_id UUID REFERENCES game_rounds(id);

-- Drop old unique constraint and add new one if needed
DO $$
BEGIN
  -- Drop old constraint if exists
  IF EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'votes_room_id_voter_id_round_number_key'
  ) THEN
    ALTER TABLE votes DROP CONSTRAINT votes_room_id_voter_id_round_number_key;
  END IF;
  
  -- Add new constraint if not exists
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'votes_unique_vote'
  ) THEN
    ALTER TABLE votes ADD CONSTRAINT votes_unique_vote UNIQUE(round_id, voter_id);
  END IF;
END $$;

-- ===================================
-- ENABLE ROW LEVEL SECURITY (RLS)
-- ===================================

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE room_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_rounds ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Users can read all profiles" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;
DROP POLICY IF EXISTS "Anyone can read rooms" ON rooms;
DROP POLICY IF EXISTS "Authenticated users can create rooms" ON rooms;
DROP POLICY IF EXISTS "Host can update room" ON rooms;
DROP POLICY IF EXISTS "Anyone can read participants" ON room_participants;
DROP POLICY IF EXISTS "Users can join room" ON room_participants;
DROP POLICY IF EXISTS "Users can read messages" ON chat_messages;
DROP POLICY IF EXISTS "Users can send messages" ON chat_messages;
DROP POLICY IF EXISTS "Users can read votes" ON votes;
DROP POLICY IF EXISTS "Users can create vote" ON votes;
DROP POLICY IF EXISTS "Anyone can read rounds" ON game_rounds;
DROP POLICY IF EXISTS "System can manage rounds" ON game_rounds;

-- Users policies
CREATE POLICY "Users can read all profiles" ON users
  FOR SELECT USING (true);

CREATE POLICY "Users can insert own profile" ON users
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can delete own profile" ON users
  FOR DELETE USING (auth.uid() = id);

-- Rooms policies
CREATE POLICY "Anyone can read rooms" ON rooms
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create rooms" ON rooms
  FOR INSERT WITH CHECK (auth.uid() = host_id);

CREATE POLICY "Host can update room" ON rooms
  FOR UPDATE USING (auth.uid() = host_id);

CREATE POLICY "Host can delete room" ON rooms
  FOR DELETE USING (auth.uid() = host_id);

-- Room participants policies
CREATE POLICY "Anyone can read participants" ON room_participants
  FOR SELECT USING (true);

CREATE POLICY "Users can join room" ON room_participants
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own participation" ON room_participants
  FOR UPDATE USING (auth.uid() = user_id OR 
    EXISTS (SELECT 1 FROM rooms WHERE rooms.id = room_id AND rooms.host_id = auth.uid()));

CREATE POLICY "Users can leave room" ON room_participants
  FOR DELETE USING (auth.uid() = user_id);

-- Chat messages policies
CREATE POLICY "Users can read messages" ON chat_messages
  FOR SELECT USING (true);

CREATE POLICY "Users can send messages" ON chat_messages
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Votes policies
CREATE POLICY "Users can read votes" ON votes
  FOR SELECT USING (true);

CREATE POLICY "Users can create vote" ON votes
  FOR INSERT WITH CHECK (auth.uid() = voter_id);

-- Game rounds policies
CREATE POLICY "Anyone can read rounds" ON game_rounds
  FOR SELECT USING (true);

CREATE POLICY "System can manage rounds" ON game_rounds
  FOR ALL USING (true);

-- ===================================
-- DONE!
-- ===================================
-- Your database is now ready for Vue.js app!
