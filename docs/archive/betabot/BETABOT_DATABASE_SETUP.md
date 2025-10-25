# 🗄️ BetaBot Database Setup Guide

## 📋 What This Includes

Complete database schema for all BetaBot enhancements:

✅ **Feedback & Learning System** (Migration 001)
- Track user feedback (thumbs up/down)
- Learning metrics (question usage, response quality)
- Learned patterns (what works, what doesn't)

✅ **Memory System** (Migration 002)
- Semantic memory with vector embeddings
- Entity knowledge tracking
- Memory connections (knowledge graph)

✅ **Core System Tables** (Migration 003)
- Sessions, interactions, conversation log
- Show/episode/segment management
- BetaBot mood tracking
- Keyword activation tracking (Alakazam/Kadabra/Abra)

---

## 🚀 Quick Setup

### Option 1: Run Complete Migration (Recommended)

Run this **ONE FILE** to set up everything:

```bash
# Go to Supabase SQL Editor
# Copy and paste: supabase/migrations/COMPLETE_BETABOT_MIGRATION.sql
# Click "Run"
```

**File:** `supabase/migrations/COMPLETE_BETABOT_MIGRATION.sql`

This creates all 15 tables + functions + triggers in one go.

---

### Option 2: Run Individual Migrations

If you want to run migrations separately:

```bash
# In Supabase SQL Editor, run in order:
1. supabase/migrations/001_betabot_feedback_system.sql
2. supabase/migrations/002_betabot_memory_system.sql
3. supabase/migrations/003_betabot_keyword_system_complete.sql
```

---

## 📊 Tables Created

### **BetaBot Core Tables** (7 tables)
1. `betabot_sessions` - Track conversation sessions
2. `betabot_interactions` - Individual BetaBot responses
3. `betabot_conversation_log` - Raw transcript log
4. `betabot_mood` - Current mood/state
5. `betabot_feedback` - User feedback tracking
6. `betabot_learning_metrics` - Learning/improvement metrics
7. `betabot_learned_patterns` - Learned behavioral patterns

### **Memory System Tables** (3 tables)
8. `betabot_memory` - Semantic memory with vector embeddings
9. `betabot_memory_connections` - Memory relationships (knowledge graph)
10. `betabot_entity_knowledge` - Knowledge about entities (people, topics)

### **Show Management Tables** (4 tables)
11. `show_metadata` - Overall show settings
12. `episode_info` - Episode information
13. `show_segments` - Episode segments
14. `show_questions` - Producer AI questions

### **Keyword Activation** (1 table)
15. `betabot_keyword_activations` - Track Alakazam/Kadabra/Abra usage

---

## ✅ Verification

After running the migration, verify it worked:

```sql
-- Check all tables exist
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND (table_name LIKE 'betabot%' OR table_name LIKE 'show%')
ORDER BY table_name;

-- Should show 15 tables
```

Expected output:
```
betabot_conversation_log
betabot_entity_knowledge
betabot_feedback
betabot_interactions
betabot_keyword_activations
betabot_learned_patterns
betabot_learning_metrics
betabot_memory
betabot_memory_connections
betabot_mood
betabot_sessions
episode_info
show_metadata
show_segments
show_questions
```

---

## 🔧 Required Extensions

The migration automatically enables:
- ✅ `uuid-ossp` - For UUID generation
- ✅ `vector` - For semantic similarity search (pgvector)

**If you get an error about the `vector` extension:**

```sql
-- Enable pgvector manually in Supabase Dashboard
-- Settings → Database → Extensions → Enable "vector"
```

---

## 🎯 Real-Time Enabled Tables

The following tables have real-time subscriptions enabled:
- ✅ `betabot_conversation_log` - For live transcript updates
- ✅ `show_questions` - For Producer AI questions
- ✅ `betabot_mood` - For mood state changes

**Your `useBetaBotComplete` hook already uses these!**

---

## 🔑 Key Features

### 1. **Vector Embeddings** (Semantic Search)
```sql
-- Stored in betabot_memory.embedding (1536 dimensions)
-- Uses OpenAI text-embedding-3-small
-- HNSW index for fast similarity search
```

### 2. **Automatic Triggers**
```sql
-- Auto-update timestamps
-- Auto-increment session interactions
-- Auto-update learning metrics from feedback
```

### 3. **Foreign Key Constraints**
```sql
-- Proper relationships between tables
-- Cascade deletes to maintain data integrity
```

### 4. **Row Level Security (RLS)**
```sql
-- All tables have RLS enabled
-- Currently set to "allow all" for authenticated users
-- You can customize policies later for production
```

---

## 📝 Initial Data

The migration automatically inserts:

```sql
-- Default show metadata
INSERT INTO show_metadata (
  show_title,
  show_description,
  is_live,
  is_rehearsal
)
VALUES (
  'Abe I Stream',
  'Live debates, therapy sessions, hot takes, and cultural commentary',
  false,
  false
);

-- Default BetaBot mood
INSERT INTO betabot_mood (
  mood,
  show_incoming,
  incoming_count,
  movement
)
VALUES (
  'neutral',
  false,
  0,
  'home'
);
```

---

## 🔍 Useful Functions Created

### `match_memories()`
Semantic similarity search for memories:

```sql
SELECT * FROM match_memories(
  query_embedding := '[your vector here]',
  match_threshold := 0.7,
  match_count := 5
);
```

### `find_memories_by_entity()`
Find all memories mentioning an entity:

```sql
SELECT * FROM find_memories_by_entity('Alpha', 10);
```

### `increment_memory_recall()`
Track memory usage:

```sql
SELECT increment_memory_recall('memory-uuid-here');
```

---

## 🧪 Test the Setup

### Test 1: Insert a Transcript
```sql
INSERT INTO betabot_conversation_log (
  transcript_text,
  speaker_type
)
VALUES (
  'Hey BetaBot Alakazam when did World War 2 start',
  'user'
);

-- Check real-time subscription in your app console
-- Should see: "📨 New transcript: Hey BetaBot Alakazam..."
```

### Test 2: Insert a Producer AI Question
```sql
INSERT INTO show_questions (
  question_text,
  source,
  ai_generated
)
VALUES (
  'That's fascinating! Can you tell us more?',
  'producer_ai',
  true
);

-- Check real-time subscription
-- Should see: "📨 Producer AI question: That's fascinating..."
```

### Test 3: Store a Memory
```sql
INSERT INTO betabot_memory (
  topic,
  conversation_snippet,
  mentioned_entities,
  keywords,
  sentiment,
  importance_score
)
VALUES (
  'AI Ethics',
  'Discussion about the impact of AI on society',
  ARRAY['AI', 'society', 'ethics'],
  ARRAY['artificial intelligence', 'impact', 'ethical'],
  'neutral',
  0.85
);

-- Verify
SELECT topic, conversation_snippet, importance_score
FROM betabot_memory
ORDER BY created_at DESC
LIMIT 1;
```

---

## ⚠️ Troubleshooting

### Error: "extension vector does not exist"
```sql
-- Enable pgvector extension manually
-- Supabase Dashboard → Settings → Database → Extensions
-- Find "vector" and click "Enable"
```

### Error: "relation already exists"
```
-- Some tables may already exist
-- The migration uses "CREATE TABLE IF NOT EXISTS"
-- It's safe to run again - won't duplicate
```

### Error: "duplicate key value violates unique constraint"
```
-- Initial data already exists
-- The migration uses "ON CONFLICT DO NOTHING"
-- It's safe to ignore
```

### Real-time not working
```sql
-- Verify tables are in real-time publication
SELECT tablename
FROM pg_publication_tables
WHERE pubname = 'supabase_realtime';

-- If missing, add manually:
ALTER PUBLICATION supabase_realtime ADD TABLE betabot_conversation_log;
ALTER PUBLICATION supabase_realtime ADD TABLE show_questions;
ALTER PUBLICATION supabase_realtime ADD TABLE betabot_mood;
```

---

## 📚 Table Relationships

```
betabot_sessions
    ├── betabot_interactions
    ├── betabot_conversation_log
    ├── betabot_memory
    └── betabot_feedback

episode_info
    └── show_segments
        └── show_questions

betabot_memory
    ├── betabot_memory_connections
    └── betabot_entity_knowledge

betabot_interactions
    ├── betabot_feedback
    └── betabot_keyword_activations
```

---

## 🎯 What's Next

1. ✅ Run the migration (COMPLETE_BETABOT_MIGRATION.sql)
2. ✅ Verify tables exist (15 tables)
3. ✅ Test real-time subscriptions
4. ✅ Check API keys in `.env.local`
5. ✅ Test BetaBot with keyword activation
6. ✅ Test Producer AI integration

---

## 📖 Documentation Files

- **Migration Files:**
  - `supabase/migrations/COMPLETE_BETABOT_MIGRATION.sql` - All-in-one
  - `supabase/migrations/001_betabot_feedback_system.sql` - Feedback
  - `supabase/migrations/002_betabot_memory_system.sql` - Memory
  - `supabase/migrations/003_betabot_keyword_system_complete.sql` - Core + Keywords

- **Setup Guides:**
  - `BETABOT_DATABASE_SETUP.md` (this file) - Database setup
  - `BETABOT_SUPABASE_INTEGRATION.md` - Supabase integration
  - `READY_TO_IMPLEMENT.md` - BetaBot features overview
  - `AUDIT_COMPLETE_FIXES_APPLIED.md` - System audit results

---

## ✅ Ready!

Your database is now fully set up for:
- ✅ Keyword activation (Alakazam, Kadabra, Abra)
- ✅ Producer AI questions
- ✅ Memory & learning
- ✅ Feedback tracking
- ✅ Session management

**Just run the SQL and you're good to go!** 🎉
