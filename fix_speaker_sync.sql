-- Add columns to rooms table for turn-based synchronization
ALTER TABLE rooms 
ADD COLUMN IF NOT EXISTS speaker_order JSONB,
ADD COLUMN IF NOT EXISTS game_start_time TIMESTAMP,
ADD COLUMN IF NOT EXISTS current_speaker_index INTEGER DEFAULT 0;

-- Update existing rooms to have empty speaker order and index 0
UPDATE rooms SET speaker_order = '[]'::jsonb WHERE speaker_order IS NULL;
UPDATE rooms SET current_speaker_index = 0 WHERE current_speaker_index IS NULL;
