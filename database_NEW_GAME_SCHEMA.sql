-- ===================================
-- UPDATE SCHEMA FOR NEW GAME LOGIC
-- ===================================
-- Run this in Supabase SQL Editor to update for new impostor game

-- 1. Update rooms table for new game logic
ALTER TABLE rooms 
  ADD COLUMN IF NOT EXISTS min_players INTEGER DEFAULT 3,
  ADD COLUMN IF NOT EXISTS impostor_count INTEGER DEFAULT 1;

-- Set default values for existing rooms
UPDATE rooms SET min_players = 3 WHERE min_players IS NULL;
UPDATE rooms SET impostor_count = 1 WHERE impostor_count IS NULL;

-- Remove rounds column if you want (optional - or just ignore it)
-- ALTER TABLE rooms DROP COLUMN IF EXISTS rounds;
-- ALTER TABLE rooms DROP COLUMN IF EXISTS current_round;

-- 2. Update room_participants table
ALTER TABLE room_participants 
  ADD COLUMN IF NOT EXISTS word TEXT,
  ADD COLUMN IF NOT EXISTS voted_for_id UUID REFERENCES users(id);

-- 3. Drop game_rounds table (we don't use rounds anymore)
-- Uncomment if you want to completely remove it:
-- DROP TABLE IF EXISTS game_rounds CASCADE;

-- 4. Drop votes table old structure and recreate simpler one
DROP TABLE IF EXISTS votes CASCADE;

CREATE TABLE votes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  room_id UUID REFERENCES rooms(id) ON DELETE CASCADE,
  voter_id UUID REFERENCES users(id),
  voted_for_id UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(room_id, voter_id)
);

-- Enable RLS
ALTER TABLE votes ENABLE ROW LEVEL SECURITY;

-- Votes policies
CREATE POLICY "Users can read votes in their room" ON votes
  FOR SELECT USING (
    voter_id = auth.uid() OR 
    EXISTS (SELECT 1 FROM room_participants WHERE room_id = votes.room_id AND user_id = auth.uid())
  );

CREATE POLICY "Users can vote" ON votes
  FOR INSERT WITH CHECK (auth.uid() = voter_id);

-- 5. Add trigger to auto-create user profile (from previous fix)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.users (id, email, full_name, avatar_url, total_score, games_played, games_won)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', ''),
    0,
    0,
    0
  )
  ON CONFLICT (id) DO UPDATE SET
    full_name = COALESCE(EXCLUDED.full_name, users.full_name),
    avatar_url = COALESCE(EXCLUDED.avatar_url, users.avatar_url);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Backfill existing auth users
INSERT INTO public.users (id, email, full_name, avatar_url, total_score, games_played, games_won)
SELECT 
  id,
  email,
  COALESCE(raw_user_meta_data->>'full_name', email),
  COALESCE(raw_user_meta_data->>'avatar_url', ''),
  0,
  0,
  0
FROM auth.users
WHERE id NOT IN (SELECT id FROM public.users)
ON CONFLICT (id) DO UPDATE SET
  full_name = COALESCE(EXCLUDED.full_name, users.full_name),
  avatar_url = COALESCE(EXCLUDED.avatar_url, users.avatar_url);

-- ===================================
-- DONE! Database ready for new game!
-- ===================================
