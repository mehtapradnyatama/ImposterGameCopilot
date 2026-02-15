-- Cleanup: Remove unused columns from rooms table after simplifying to manual coordination system
-- These columns were used for the old timer-based enforcement that has been removed

ALTER TABLE rooms 
DROP COLUMN IF EXISTS game_start_time,
DROP COLUMN IF EXISTS current_speaker_index,
DROP COLUMN IF EXISTS discussion_time,
DROP COLUMN IF EXISTS voting_time;

-- Note: speaker_order is STILL USED for displaying speaking order cards
