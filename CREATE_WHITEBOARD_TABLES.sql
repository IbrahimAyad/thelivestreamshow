-- ============================================================================
-- WHITEBOARD REAL-TIME SYSTEM
-- ============================================================================
-- Creates tables for live whiteboard overlay that syncs via Supabase real-time
-- ============================================================================

-- Table to store individual drawing strokes
CREATE TABLE IF NOT EXISTS whiteboard_strokes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    stroke_data JSONB NOT NULL,  -- {type, points, color, size, tool, pressure}
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    is_visible BOOLEAN DEFAULT TRUE,
    session_id TEXT,
    layer_index INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table to manage whiteboard state (show/hide, clear)
CREATE TABLE IF NOT EXISTS whiteboard_state (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    is_active BOOLEAN DEFAULT FALSE,  -- Show/hide whiteboard in broadcast
    cleared_at TIMESTAMPTZ,  -- Last time canvas was cleared
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert initial state record
INSERT INTO whiteboard_state (is_active, cleared_at)
VALUES (FALSE, NOW())
ON CONFLICT DO NOTHING;

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_whiteboard_strokes_visible
ON whiteboard_strokes(is_visible, timestamp DESC);

CREATE INDEX IF NOT EXISTS idx_whiteboard_strokes_session
ON whiteboard_strokes(session_id, timestamp);

-- Enable Row Level Security (optional, for future multi-user support)
ALTER TABLE whiteboard_strokes ENABLE ROW LEVEL SECURITY;
ALTER TABLE whiteboard_state ENABLE ROW LEVEL SECURITY;

-- Policy: Allow all operations for authenticated users
CREATE POLICY "Allow all operations for authenticated users"
ON whiteboard_strokes FOR ALL
USING (true);

CREATE POLICY "Allow all operations on state for authenticated users"
ON whiteboard_state FOR ALL
USING (true);

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Check tables exist
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN ('whiteboard_strokes', 'whiteboard_state');

-- Check initial state
SELECT * FROM whiteboard_state;

-- ============================================================================
-- USAGE EXAMPLES
-- ============================================================================

-- Add a stroke
-- INSERT INTO whiteboard_strokes (stroke_data, session_id, layer_index)
-- VALUES (
--     '{"type": "pen", "points": [[100,100], [150,150]], "color": "#000", "size": 3}'::jsonb,
--     'session-123',
--     0
-- );

-- Get all visible strokes
-- SELECT * FROM whiteboard_strokes
-- WHERE is_visible = TRUE
-- ORDER BY timestamp ASC;

-- Clear whiteboard (hide all strokes)
-- UPDATE whiteboard_strokes SET is_visible = FALSE;
-- UPDATE whiteboard_state SET cleared_at = NOW();

-- Show whiteboard in broadcast
-- UPDATE whiteboard_state SET is_active = TRUE, updated_at = NOW();
