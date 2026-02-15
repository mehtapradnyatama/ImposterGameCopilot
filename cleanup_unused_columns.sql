-- Cleanup: Remove unused columns from rooms table after removing turn-based timer system
-- These columns were used for the old turn-based speaking enforcement that has been removed

ALTER TABLE rooms 
DROP COLUMN IF EXISTS game_start_time,
DROP COLUMN IF EXISTS current_speaker_index;

-- Note: speaker_order is STILL USED for displaying speaking order cards
