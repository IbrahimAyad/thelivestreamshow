-- =====================================================
-- CREATE BETABOT MEDIA BROWSER TABLE
-- Voice-activated search overlay system
-- =====================================================

-- Drop table if exists (fresh start)
DROP TABLE IF EXISTS betabot_media_browser CASCADE;

-- Create betabot_media_browser table with metadata support
CREATE TABLE betabot_media_browser (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  search_query TEXT NOT NULL,
  content_type TEXT NOT NULL CHECK (content_type IN ('images', 'videos')),
  session_id UUID,  -- Optional: can be NULL for voice-activated searches
  is_visible BOOLEAN DEFAULT true,
  metadata JSONB,   -- Store additional data (answer, sources, video count, etc.)
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_betabot_media_browser_session
  ON betabot_media_browser(session_id);

CREATE INDEX idx_betabot_media_browser_created
  ON betabot_media_browser(created_at DESC);

CREATE INDEX idx_betabot_media_browser_visible
  ON betabot_media_browser(is_visible)
  WHERE is_visible = true;

-- Enable Row Level Security
ALTER TABLE betabot_media_browser ENABLE ROW LEVEL SECURITY;

-- RLS Policies - Allow all authenticated users
CREATE POLICY "Allow authenticated users to read media browser"
  ON betabot_media_browser FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated users to insert media browser"
  ON betabot_media_browser FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update media browser"
  ON betabot_media_browser FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated users to delete media browser"
  ON betabot_media_browser FOR DELETE
  TO authenticated
  USING (true);

-- IMPORTANT: Enable Realtime for this table
ALTER PUBLICATION supabase_realtime ADD TABLE betabot_media_browser;

-- =====================================================
-- VERIFICATION
-- =====================================================

-- Test that we can insert a sample row
INSERT INTO betabot_media_browser (search_query, content_type, metadata)
VALUES (
  'test query',
  'images',
  '{"answer": "test answer", "sources": ["https://example.com"]}'::jsonb
);

-- Query it back
SELECT * FROM betabot_media_browser ORDER BY created_at DESC LIMIT 1;

-- Clean up test row
DELETE FROM betabot_media_browser WHERE search_query = 'test query';

-- =====================================================
-- SUCCESS!
-- =====================================================

SELECT '✅ betabot_media_browser table created successfully!' as status;
SELECT '✅ Realtime subscription enabled!' as status;
SELECT '✅ RLS policies configured!' as status;
SELECT '✅ Ready for voice-activated search overlays!' as status;
