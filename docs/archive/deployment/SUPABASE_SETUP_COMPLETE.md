# Complete Supabase Setup for Producer AI System
**Phases 1, 2, and 3**

This document contains all Supabase database setup required for the Producer AI system to function properly. Follow the instructions below to set up all tables, indexes, functions, and policies.

---

## 📋 Prerequisites

Before starting, ensure you have:
- [ ] Supabase project created
- [ ] Access to Supabase SQL Editor
- [ ] `pgvector` extension enabled (required for Phase 3)

---

## 🚀 Quick Setup

### Option 1: One-Click Setup (Recommended)

Copy and paste **ALL** of the SQL below into your Supabase SQL Editor and click "Run".

### Option 2: Step-by-Step Setup

Run each section separately in the order listed.

---

## 📦 Complete SQL Migration Script

```sql
-- ============================================================================
-- PRODUCER AI SYSTEM - COMPLETE DATABASE SETUP
-- Phases 1, 2, and 3
-- ============================================================================
--
-- This script sets up all database tables, indexes, functions, and policies
-- required for the Producer AI system to function.
--
-- Phases included:
-- - Phase 1: Basic session tracking
-- - Phase 2: Multi-model voting and question history
-- - Phase 3: Advanced context memory with semantic search
--
-- ============================================================================

-- ============================================================================
-- SECTION 1: EXTENSIONS
-- ============================================================================

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enable pgvector for semantic search (Phase 3)
CREATE EXTENSION IF NOT EXISTS vector;

-- ============================================================================
-- SECTION 2: PHASE 1 & 2 - SESSION AND ANALYSIS TABLES
-- ============================================================================

-- -----------------------------------------------------------------------------
-- Table: betabot_sessions
-- Purpose: Track BetaBot conversation sessions
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS betabot_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  show_id TEXT NOT NULL,
  mode TEXT NOT NULL CHECK (mode IN ('co-host', 'question-generator')),
  tts_provider TEXT CHECK (tts_provider IN ('browser', 'elevenlabs')),
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ended_at TIMESTAMPTZ,
  total_questions_asked INTEGER DEFAULT 0,
  total_responses INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for betabot_sessions
CREATE INDEX IF NOT EXISTS idx_betabot_sessions_show_id ON betabot_sessions(show_id);
CREATE INDEX IF NOT EXISTS idx_betabot_sessions_started_at ON betabot_sessions(started_at DESC);
CREATE INDEX IF NOT EXISTS idx_betabot_sessions_mode ON betabot_sessions(mode);

-- -----------------------------------------------------------------------------
-- Table: producer_ai_sessions
-- Purpose: Track Producer AI analysis sessions
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS producer_ai_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  show_id TEXT NOT NULL,
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ended_at TIMESTAMPTZ,
  total_analyses INTEGER DEFAULT 0,
  total_questions_generated INTEGER DEFAULT 0,
  multi_model_enabled BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for producer_ai_sessions
CREATE INDEX IF NOT EXISTS idx_producer_ai_sessions_show_id ON producer_ai_sessions(show_id);
CREATE INDEX IF NOT EXISTS idx_producer_ai_sessions_started_at ON producer_ai_sessions(started_at DESC);

-- -----------------------------------------------------------------------------
-- Table: producer_ai_analyses
-- Purpose: Store individual analysis results
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS producer_ai_analyses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID REFERENCES producer_ai_sessions(id) ON DELETE CASCADE,
  show_id TEXT NOT NULL,
  transcript_text TEXT NOT NULL,
  transcript_duration INTEGER, -- seconds
  analysis_timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Multi-model results (Phase 2)
  gpt4o_questions JSONB,
  claude_questions JSONB,
  gemini_questions JSONB,

  -- Voting results (Phase 2)
  voted_questions JSONB,
  top_question TEXT,
  top_question_score NUMERIC(3,2),

  -- Performance metrics
  processing_time_ms INTEGER,
  embedding_time_ms INTEGER,
  voting_time_ms INTEGER,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for producer_ai_analyses
CREATE INDEX IF NOT EXISTS idx_producer_ai_analyses_session_id ON producer_ai_analyses(session_id);
CREATE INDEX IF NOT EXISTS idx_producer_ai_analyses_show_id ON producer_ai_analyses(show_id);
CREATE INDEX IF NOT EXISTS idx_producer_ai_analyses_timestamp ON producer_ai_analyses(analysis_timestamp DESC);

-- ============================================================================
-- SECTION 3: PHASE 3 - CONTEXT MEMORY (QUESTION HISTORY)
-- ============================================================================

-- -----------------------------------------------------------------------------
-- Table: question_history
-- Purpose: Store generated questions with semantic embeddings for context memory
-- Phase: 3 (Advanced Context Memory)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS question_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  show_id TEXT NOT NULL,
  question_text TEXT NOT NULL,
  embedding VECTOR(1536),  -- OpenAI text-embedding-3-small dimension
  confidence NUMERIC(3,2) NOT NULL DEFAULT 0.70,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  source_model TEXT NOT NULL CHECK (source_model IN ('gpt-4o', 'claude', 'gemini')),
  was_used BOOLEAN DEFAULT FALSE,
  topic_tags TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for question_history
CREATE INDEX IF NOT EXISTS idx_question_history_show_id ON question_history(show_id);
CREATE INDEX IF NOT EXISTS idx_question_history_timestamp ON question_history(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_question_history_source_model ON question_history(source_model);
CREATE INDEX IF NOT EXISTS idx_question_history_was_used ON question_history(was_used);

-- Vector index for semantic similarity search (IVFFlat)
-- This is the MOST IMPORTANT index for Phase 3 performance
CREATE INDEX IF NOT EXISTS idx_question_history_embedding
  ON question_history
  USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 100);

-- ============================================================================
-- SECTION 4: TRIGGERS AND FUNCTIONS
-- ============================================================================

-- -----------------------------------------------------------------------------
-- Function: update_updated_at_column
-- Purpose: Automatically update updated_at timestamp on row updates
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to betabot_sessions
DROP TRIGGER IF EXISTS update_betabot_sessions_updated_at ON betabot_sessions;
CREATE TRIGGER update_betabot_sessions_updated_at
  BEFORE UPDATE ON betabot_sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Apply trigger to producer_ai_sessions
DROP TRIGGER IF EXISTS update_producer_ai_sessions_updated_at ON producer_ai_sessions;
CREATE TRIGGER update_producer_ai_sessions_updated_at
  BEFORE UPDATE ON producer_ai_sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Apply trigger to question_history
DROP TRIGGER IF EXISTS update_question_history_updated_at ON question_history;
CREATE TRIGGER update_question_history_updated_at
  BEFORE UPDATE ON question_history
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- -----------------------------------------------------------------------------
-- Function: cleanup_old_question_history
-- Purpose: Remove question history older than 30 days (Phase 3)
-- Usage: Schedule this to run daily via pg_cron or manual execution
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION cleanup_old_question_history()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM question_history
  WHERE created_at < NOW() - INTERVAL '30 days';

  GET DIAGNOSTICS deleted_count = ROW_COUNT;

  IF deleted_count > 0 THEN
    RAISE NOTICE 'Deleted % old question history records', deleted_count;
  END IF;

  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- -----------------------------------------------------------------------------
-- Function: get_similar_questions
-- Purpose: Find questions similar to a given embedding using vector similarity
-- Phase: 3 (Context Memory)
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION get_similar_questions(
  query_embedding VECTOR(1536),
  similarity_threshold FLOAT DEFAULT 0.80,
  max_results INT DEFAULT 10,
  show_filter TEXT DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  question_text TEXT,
  similarity FLOAT,
  timestamp TIMESTAMPTZ,
  source_model TEXT,
  was_used BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    qh.id,
    qh.question_text,
    1 - (qh.embedding <=> query_embedding) AS similarity,
    qh.timestamp,
    qh.source_model,
    qh.was_used
  FROM question_history qh
  WHERE
    (show_filter IS NULL OR qh.show_id = show_filter) AND
    1 - (qh.embedding <=> query_embedding) >= similarity_threshold
  ORDER BY qh.embedding <=> query_embedding
  LIMIT max_results;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- SECTION 5: VIEWS
-- ============================================================================

-- -----------------------------------------------------------------------------
-- View: recent_question_history
-- Purpose: Quick access to recent questions (last 3 hours)
-- Phase: 3
-- -----------------------------------------------------------------------------
CREATE OR REPLACE VIEW recent_question_history AS
SELECT
  id,
  show_id,
  question_text,
  confidence,
  timestamp,
  source_model,
  was_used,
  EXTRACT(EPOCH FROM (NOW() - timestamp)) / 60 AS age_minutes
FROM question_history
WHERE timestamp > NOW() - INTERVAL '3 hours'
ORDER BY timestamp DESC;

-- -----------------------------------------------------------------------------
-- View: active_sessions
-- Purpose: Quick access to currently active sessions
-- -----------------------------------------------------------------------------
CREATE OR REPLACE VIEW active_sessions AS
SELECT
  'betabot' AS session_type,
  id,
  show_id,
  mode AS session_mode,
  started_at,
  NULL AS ended_at,
  total_questions_asked AS activity_count
FROM betabot_sessions
WHERE ended_at IS NULL
UNION ALL
SELECT
  'producer_ai' AS session_type,
  id,
  show_id,
  CASE WHEN multi_model_enabled THEN 'multi-model' ELSE 'single-model' END AS session_mode,
  started_at,
  NULL AS ended_at,
  total_analyses AS activity_count
FROM producer_ai_sessions
WHERE ended_at IS NULL
ORDER BY started_at DESC;

-- ============================================================================
-- SECTION 6: ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE betabot_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE producer_ai_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE producer_ai_analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE question_history ENABLE ROW LEVEL SECURITY;

-- -----------------------------------------------------------------------------
-- RLS Policies: Allow all operations for authenticated users
-- Note: Adjust these policies based on your authentication requirements
-- -----------------------------------------------------------------------------

-- BetaBot Sessions
DROP POLICY IF EXISTS "Allow all operations on betabot_sessions" ON betabot_sessions;
CREATE POLICY "Allow all operations on betabot_sessions"
  ON betabot_sessions FOR ALL
  USING (true)
  WITH CHECK (true);

-- Producer AI Sessions
DROP POLICY IF EXISTS "Allow all operations on producer_ai_sessions" ON producer_ai_sessions;
CREATE POLICY "Allow all operations on producer_ai_sessions"
  ON producer_ai_sessions FOR ALL
  USING (true)
  WITH CHECK (true);

-- Producer AI Analyses
DROP POLICY IF EXISTS "Allow all operations on producer_ai_analyses" ON producer_ai_analyses;
CREATE POLICY "Allow all operations on producer_ai_analyses"
  ON producer_ai_analyses FOR ALL
  USING (true)
  WITH CHECK (true);

-- Question History
DROP POLICY IF EXISTS "Allow all operations on question_history" ON question_history;
CREATE POLICY "Allow all operations on question_history"
  ON question_history FOR ALL
  USING (true)
  WITH CHECK (true);

-- ============================================================================
-- SECTION 7: TABLE COMMENTS (DOCUMENTATION)
-- ============================================================================

COMMENT ON TABLE betabot_sessions IS 'Tracks BetaBot conversation sessions (Phase 1)';
COMMENT ON TABLE producer_ai_sessions IS 'Tracks Producer AI analysis sessions (Phase 1)';
COMMENT ON TABLE producer_ai_analyses IS 'Stores individual analysis results with multi-model support (Phase 2)';
COMMENT ON TABLE question_history IS 'Stores generated questions with embeddings for context memory (Phase 3)';

COMMENT ON COLUMN question_history.embedding IS 'Vector embedding from OpenAI text-embedding-3-small (1536 dimensions)';
COMMENT ON COLUMN question_history.was_used IS 'Indicates if the host actually asked this question during the show';
COMMENT ON COLUMN question_history.topic_tags IS 'Optional tags for topic clustering (future feature)';

-- ============================================================================
-- SECTION 8: VERIFICATION QUERIES
-- ============================================================================

-- Verify all tables were created successfully
DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'betabot_sessions') THEN
    RAISE NOTICE '✅ betabot_sessions table created';
  ELSE
    RAISE WARNING '❌ betabot_sessions table creation failed';
  END IF;

  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'producer_ai_sessions') THEN
    RAISE NOTICE '✅ producer_ai_sessions table created';
  ELSE
    RAISE WARNING '❌ producer_ai_sessions table creation failed';
  END IF;

  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'producer_ai_analyses') THEN
    RAISE NOTICE '✅ producer_ai_analyses table created';
  ELSE
    RAISE WARNING '❌ producer_ai_analyses table creation failed';
  END IF;

  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'question_history') THEN
    RAISE NOTICE '✅ question_history table created';
  ELSE
    RAISE WARNING '❌ question_history table creation failed';
  END IF;
END $$;

-- Verify vector index was created (CRITICAL for Phase 3)
DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_indexes WHERE indexname = 'idx_question_history_embedding') THEN
    RAISE NOTICE '✅ Vector index created successfully';
  ELSE
    RAISE WARNING '❌ Vector index creation failed - Phase 3 will not work!';
  END IF;
END $$;

-- Verify pgvector extension is enabled
DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_extension WHERE extname = 'vector') THEN
    RAISE NOTICE '✅ pgvector extension enabled';
  ELSE
    RAISE WARNING '❌ pgvector extension NOT enabled - Phase 3 requires this!';
  END IF;
END $$;

-- ============================================================================
-- SETUP COMPLETE!
-- ============================================================================

-- Display final status
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '============================================';
  RAISE NOTICE '🎉 DATABASE SETUP COMPLETE!';
  RAISE NOTICE '============================================';
  RAISE NOTICE '';
  RAISE NOTICE 'Created:';
  RAISE NOTICE '  - 4 tables (betabot_sessions, producer_ai_sessions, producer_ai_analyses, question_history)';
  RAISE NOTICE '  - 12 indexes (including vector index for semantic search)';
  RAISE NOTICE '  - 3 functions (update_updated_at, cleanup_old_question_history, get_similar_questions)';
  RAISE NOTICE '  - 3 triggers (auto-update timestamps)';
  RAISE NOTICE '  - 2 views (recent_question_history, active_sessions)';
  RAISE NOTICE '  - 4 RLS policies (allow all operations)';
  RAISE NOTICE '';
  RAISE NOTICE 'Next steps:';
  RAISE NOTICE '  1. Verify all tables exist in Supabase dashboard';
  RAISE NOTICE '  2. Test vector search: SELECT * FROM get_similar_questions(...)';
  RAISE NOTICE '  3. (Optional) Schedule cleanup: SELECT cleanup_old_question_history()';
  RAISE NOTICE '  4. Update your .env file with Supabase credentials';
  RAISE NOTICE '  5. Start your application and test!';
  RAISE NOTICE '';
  RAISE NOTICE '============================================';
END $$;
```

---

## 🔍 Post-Setup Verification

After running the SQL above, verify everything is set up correctly:

### 1. Check Tables

Run this query to see all tables:
```sql
SELECT tablename
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;
```

You should see:
- ✅ `betabot_sessions`
- ✅ `producer_ai_sessions`
- ✅ `producer_ai_analyses`
- ✅ `question_history`

### 2. Check Vector Index (CRITICAL for Phase 3)

Run this query:
```sql
SELECT indexname, indexdef
FROM pg_indexes
WHERE tablename = 'question_history'
  AND indexname = 'idx_question_history_embedding';
```

You should see the IVFFlat vector index.

### 3. Test Vector Search Function

```sql
-- This should return empty results (no data yet)
SELECT * FROM get_similar_questions(
  array_fill(0.0, ARRAY[1536])::vector,
  0.80,
  10
);
```

### 4. Check Extensions

```sql
SELECT extname, extversion
FROM pg_extension
WHERE extname IN ('uuid-ossp', 'vector');
```

You should see both extensions enabled.

---

## 🔧 Maintenance Tasks

### Daily Cleanup (Recommended)

Schedule this to run daily to remove old question history:

```sql
SELECT cleanup_old_question_history();
```

**Using pg_cron** (if available):
```sql
SELECT cron.schedule(
  'cleanup-old-questions',
  '0 2 * * *',  -- Run at 2 AM daily
  $$SELECT cleanup_old_question_history();$$
);
```

### Monitor Table Sizes

```sql
SELECT
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

### Monitor Vector Index Performance

```sql
SELECT
  schemaname,
  tablename,
  indexname,
  idx_scan AS number_of_scans,
  idx_tup_read AS tuples_read,
  idx_tup_fetch AS tuples_fetched
FROM pg_stat_user_indexes
WHERE indexname = 'idx_question_history_embedding';
```

### Vacuum Analyze (Run Weekly)

```sql
VACUUM ANALYZE question_history;
VACUUM ANALYZE producer_ai_analyses;
```

---

## ⚙️ Environment Variables

After setting up the database, update your application's `.env` file:

```env
# Supabase Configuration
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here

# Optional: Service role key (for server-side operations)
SUPABASE_SERVICE_KEY=your-service-role-key-here
```

---

## 🔐 Security Considerations

### Current RLS Policies

The current setup uses **permissive RLS policies** (`USING (true)`) that allow all operations. This is suitable for:
- Development environments
- Internal tools
- Single-tenant applications

### For Production (Recommended)

Update RLS policies to restrict access based on your authentication model:

```sql
-- Example: Restrict access by user ID
DROP POLICY IF EXISTS "Allow all operations on question_history" ON question_history;

CREATE POLICY "Users can view all question history"
  ON question_history FOR SELECT
  USING (true);

CREATE POLICY "Service role can insert question history"
  ON question_history FOR INSERT
  WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Users can update their own questions"
  ON question_history FOR UPDATE
  USING (auth.uid() = user_id)  -- Assuming you add a user_id column
  WITH CHECK (auth.uid() = user_id);
```

---

## 📊 Sample Data (For Testing)

Once setup is complete, you can insert sample data:

```sql
-- Sample BetaBot session
INSERT INTO betabot_sessions (show_id, mode, tts_provider)
VALUES ('test-show-001', 'co-host', 'browser');

-- Sample Producer AI session
INSERT INTO producer_ai_sessions (show_id, multi_model_enabled)
VALUES ('test-show-001', true);

-- Sample question history (Phase 3)
-- Note: In production, embeddings are generated by OpenAI API
INSERT INTO question_history (
  show_id,
  question_text,
  embedding,
  confidence,
  source_model
) VALUES (
  'test-show-001',
  'What is the impact of AI on society?',
  array_fill(0.1, ARRAY[1536])::vector,  -- Dummy embedding
  0.85,
  'gpt-4o'
);
```

---

## 🐛 Troubleshooting

### Error: "extension vector does not exist"

**Solution**: Enable the pgvector extension in Supabase:
1. Go to Supabase Dashboard → Database → Extensions
2. Search for "vector"
3. Click "Enable"
4. Re-run the migration script

### Error: "index creation failed"

**Solution**: The vector index requires data to train. Either:
- Insert some sample data first
- Wait until real data is inserted
- The index will build automatically

### Error: "permission denied"

**Solution**: Ensure you're running the script with proper permissions:
- Use the Supabase SQL Editor (recommended)
- Or use a service role key for API access

### Performance Issues

If vector searches are slow:
1. Check index exists: `\d question_history` in psql
2. Rebuild index: `REINDEX INDEX idx_question_history_embedding;`
3. Increase index lists parameter: Modify `WITH (lists = 100)` to `WITH (lists = 200)`

---

## 📞 Support

If you encounter issues:
1. Check Supabase logs in the Dashboard
2. Verify all tables and indexes exist
3. Test vector search function with sample data
4. Check application logs for connection errors

---

## ✅ Setup Checklist

- [ ] Copied SQL script to Supabase SQL Editor
- [ ] Clicked "Run" and confirmed success messages
- [ ] Verified all 4 tables exist
- [ ] Verified vector index exists
- [ ] Verified pgvector extension is enabled
- [ ] Updated .env file with Supabase credentials
- [ ] Tested sample query (optional)
- [ ] Scheduled cleanup job (optional)
- [ ] Updated RLS policies for production (if needed)

---

**Last Updated**: October 19, 2025
**Version**: 1.0
**Compatible with**: Producer AI Phases 1, 2, and 3
