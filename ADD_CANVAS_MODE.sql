-- Add canvas_mode column to whiteboard_state table
-- This allows the dashboard to tell the broadcast overlay what size to use

ALTER TABLE whiteboard_state
ADD COLUMN IF NOT EXISTS canvas_mode TEXT DEFAULT 'normal';

-- Update existing record to normal mode
UPDATE whiteboard_state
SET canvas_mode = 'normal'
WHERE canvas_mode IS NULL;

-- Verify the column was added
SELECT id, is_active, canvas_mode, cleared_at, updated_at
FROM whiteboard_state;
