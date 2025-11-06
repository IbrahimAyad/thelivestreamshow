-- ============================================================================
-- ENABLE REAL-TIME FOR WHITEBOARD TABLES
-- ============================================================================
-- Run this in your Supabase SQL Editor to enable real-time subscriptions
-- ============================================================================

-- Enable real-time replication for whiteboard_strokes
ALTER PUBLICATION supabase_realtime ADD TABLE whiteboard_strokes;

-- Enable real-time replication for whiteboard_state
ALTER PUBLICATION supabase_realtime ADD TABLE whiteboard_state;

-- Verify real-time is enabled
SELECT schemaname, tablename
FROM pg_publication_tables
WHERE pubname = 'supabase_realtime'
AND tablename IN ('whiteboard_strokes', 'whiteboard_state');

-- ============================================================================
-- EXPECTED OUTPUT:
-- ============================================================================
-- Should show both tables:
--   schemaname | tablename
--   -----------+-------------------
--   public     | whiteboard_strokes
--   public     | whiteboard_state
-- ============================================================================
