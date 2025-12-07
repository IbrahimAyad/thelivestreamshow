-- =====================================================
-- FIX BETABOT MEDIA BROWSER RLS POLICIES
-- Allow inserts from both authenticated and anon users
-- =====================================================

-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Allow authenticated users to read media browser" ON betabot_media_browser;
DROP POLICY IF EXISTS "Allow authenticated users to insert media browser" ON betabot_media_browser;
DROP POLICY IF EXISTS "Allow authenticated users to update media browser" ON betabot_media_browser;
DROP POLICY IF EXISTS "Allow authenticated users to delete media browser" ON betabot_media_browser;

-- Create permissive policies that work for both authenticated and anon users
CREATE POLICY "Allow all to read media browser"
  ON betabot_media_browser FOR SELECT
  USING (true);

CREATE POLICY "Allow all to insert media browser"
  ON betabot_media_browser FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow all to update media browser"
  ON betabot_media_browser FOR UPDATE
  USING (true);

CREATE POLICY "Allow all to delete media browser"
  ON betabot_media_browser FOR DELETE
  USING (true);

-- Verify RLS is still enabled
SELECT
  schemaname,
  tablename,
  rowsecurity as "RLS Enabled"
FROM pg_tables
WHERE tablename = 'betabot_media_browser';

-- Test insert
INSERT INTO betabot_media_browser (search_query, content_type, metadata)
VALUES (
  'RLS test query',
  'images',
  '{"test": true}'::jsonb
);

-- Verify it worked
SELECT * FROM betabot_media_browser WHERE search_query = 'RLS test query';

-- Clean up test
DELETE FROM betabot_media_browser WHERE search_query = 'RLS test query';

SELECT '✅ RLS policies updated - now allows all users!' as status;
