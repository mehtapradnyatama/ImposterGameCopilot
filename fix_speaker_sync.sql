-- Add columns to rooms table for turn-based synchronization
ALTER TABLE rooms 
ADD COLUMN IF NOT EXISTS speaker_order JSONB,
ADD COLUMN IF NOT EXISTS game_start_time TIMESTAMP;

-- Update existing rooms to have empty speaker order
UPDATE rooms SET speaker_order = '[]'::jsonb WHERE speaker_order IS NULL;
