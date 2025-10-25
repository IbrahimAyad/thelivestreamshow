# 🧪 BetaBot Testing Guide - Complete Integration Tests

## 🎯 Overview

This guide walks you through testing all BetaBot features end-to-end:
- ✅ Database setup verification
- ✅ Producer AI integration
- ✅ Keyword activation (Alakazam, Kadabra, Abra)
- ✅ Memory & learning systems
- ✅ Real-time subscriptions
- ✅ TTS (Text-to-Speech)

---

## 📋 Pre-Flight Checklist

Before testing, ensure these are completed:

### 1. Database Migration
```bash
# Go to Supabase SQL Editor
# Run: supabase/migrations/COMPLETE_BETABOT_MIGRATION.sql
# OR run the 3 individual migrations in order
```

**Verify migration succeeded:**
```sql
-- Should return 15 tables
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND (table_name LIKE 'betabot%' OR table_name LIKE 'show%')
ORDER BY table_name;
```

**Expected output:**
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

### 2. API Keys Configuration

**Check your `.env.local` has these keys:**
```bash
# Required for BetaBot
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_OPENAI_API_KEY=sk-your-openai-key

# Required for keyword activation
VITE_PERPLEXITY_API_KEY=pplx-your-perplexity-key
VITE_YOUTUBE_API_KEY=AIza-your-youtube-key
VITE_UNSPLASH_ACCESS_KEY=your-unsplash-key
```

**Verify API keys in browser console:**
```javascript
// Should NOT be undefined
console.log(import.meta.env.VITE_PERPLEXITY_API_KEY?.substring(0, 10));
console.log(import.meta.env.VITE_YOUTUBE_API_KEY?.substring(0, 10));
console.log(import.meta.env.VITE_UNSPLASH_ACCESS_KEY?.substring(0, 10));
```

### 3. Real-time Subscriptions Enabled

**Verify tables are in real-time publication:**
```sql
SELECT tablename
FROM pg_publication_tables
WHERE pubname = 'supabase_realtime'
  AND tablename IN ('betabot_conversation_log', 'show_questions', 'betabot_mood');
```

**If missing, enable manually:**
```sql
ALTER PUBLICATION supabase_realtime ADD TABLE betabot_conversation_log;
ALTER PUBLICATION supabase_realtime ADD TABLE show_questions;
ALTER PUBLICATION supabase_realtime ADD TABLE betabot_mood;
```

---

## 🧪 Test 1: Basic Database Setup

### Test 1.1: Verify Initial Data

```sql
-- Check default show metadata exists
SELECT * FROM show_metadata LIMIT 1;

-- Check default BetaBot mood exists
SELECT * FROM betabot_mood LIMIT 1;
```

**Expected:**
- 1 row in `show_metadata` with title "Abe I Stream"
- 1 row in `betabot_mood` with mood "neutral"

### Test 1.2: Test Foreign Key Constraints

```sql
-- Create a test session
INSERT INTO betabot_sessions (session_type, episode_number)
VALUES ('test', 999)
RETURNING id;

-- Use the returned ID for the next test
-- Example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890'
```

```sql
-- Test cascade delete (use actual ID from above)
DELETE FROM betabot_sessions WHERE episode_number = 999;

-- Verify cascade worked (should return 0 rows)
SELECT COUNT(*) FROM betabot_interactions
WHERE session_id = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';
```

✅ **Pass:** Foreign key constraints work correctly

---

## 🧪 Test 2: Real-time Subscriptions

### Test 2.1: Transcript Subscription

**In Browser Console:**
1. Open your app in browser
2. Open DevTools Console
3. Look for: `✅ Subscribed to transcripts`

**Insert test transcript in Supabase SQL Editor:**
```sql
INSERT INTO betabot_conversation_log (transcript_text, speaker_type)
VALUES ('This is a test transcript from the SQL editor', 'host');
```

**Expected console output:**
```
📨 New transcript: This is a test transcript from the SQL editor
```

✅ **Pass:** Transcript subscription working

### Test 2.2: Producer AI Question Subscription

**In Browser Console:**
1. Look for: `✅ Subscribed to Producer AI questions`

**Insert test question:**
```sql
INSERT INTO show_questions (
  question_text,
  source,
  ai_generated,
  context_summary
)
VALUES (
  'This is a test question from Producer AI',
  'producer_ai',
  true,
  'creative'
);
```

**Expected console output:**
```
📨 Producer AI question: This is a test question from Producer AI
📨 Received Producer AI question: This is a test question from Producer AI
🔊 Speaking: This is a test question from Producer AI
✅ Finished speaking
```

✅ **Pass:** Producer AI question subscription + TTS working

---

## 🧪 Test 3: Keyword Activation

### Test 3.1: Wake Word Detection (No Action Keyword)

**Insert transcript with wake word only:**
```sql
INSERT INTO betabot_conversation_log (transcript_text, speaker_type)
VALUES ('Hey BetaBot tell me about your favorite color', 'user');
```

**Expected console output:**
```
📨 New transcript: Hey BetaBot tell me about your favorite color
👋 Wake word detected!
🎯 Action: normal response
💬 Query: "tell me about your favorite color"
💬 Normal response
🎭 Using creative mode (emotion: neutral)
🔊 Speaking: [BetaBot's response about favorite color]
✅ Finished speaking
```

✅ **Pass:** Wake word detection + normal response working

### Test 3.2: Alakazam - Perplexity Search

**Insert transcript with Alakazam:**
```sql
INSERT INTO betabot_conversation_log (transcript_text, speaker_type)
VALUES ('Hey BetaBot Alakazam when did World War 2 start', 'user');
```

**Expected console output:**
```
📨 New transcript: Hey BetaBot Alakazam when did World War 2 start
👋 Wake word detected!
🎯 Action: alakazam
💬 Query: "when did World War 2 start"
🔍 Alakazam! Searching Perplexity...
🔊 Speaking: [Perplexity's answer about WW2]
✅ Finished speaking
```

**Verify in database:**
```sql
-- Check keyword activation was logged
SELECT *
FROM betabot_keyword_activations
ORDER BY created_at DESC
LIMIT 1;
```

**Should show:**
- `action_keyword`: "alakazam"
- `extracted_query`: "when did World War 2 start"
- `search_provider`: "perplexity"
- `results_data`: JSON with Perplexity response

✅ **Pass:** Alakazam keyword + Perplexity search working

### Test 3.3: Kadabra - YouTube Video Search

**Insert transcript with Kadabra:**
```sql
INSERT INTO betabot_conversation_log (transcript_text, speaker_type)
VALUES ('Hey BetaBot Kadabra show me videos about cooking pasta', 'user');
```

**Expected console output:**
```
📨 New transcript: Hey BetaBot Kadabra show me videos about cooking pasta
👋 Wake word detected!
🎯 Action: kadabra
💬 Query: "show me videos about cooking pasta"
🎥 Kadabra! Searching videos...
🔊 Speaking: I found 5 videos about "show me videos about cooking pasta". Here are the top results.
✅ Finished speaking
```

**Verify in database:**
```sql
SELECT *
FROM betabot_keyword_activations
WHERE action_keyword = 'kadabra'
ORDER BY created_at DESC
LIMIT 1;
```

✅ **Pass:** Kadabra keyword + YouTube search working

### Test 3.4: Abra - Unsplash Image Search

**Insert transcript with Abra:**
```sql
INSERT INTO betabot_conversation_log (transcript_text, speaker_type)
VALUES ('Hey BetaBot Abra show me images of sunset beaches', 'user');
```

**Expected console output:**
```
📨 New transcript: Hey BetaBot Abra show me images of sunset beaches
👋 Wake word detected!
🎯 Action: abra
💬 Query: "show me images of sunset beaches"
🖼️ Abra! Searching images...
🔊 Speaking: I found 10 images about "show me images of sunset beaches". Displaying them now.
✅ Finished speaking
```

**Verify in database:**
```sql
SELECT *
FROM betabot_keyword_activations
WHERE action_keyword = 'abra'
ORDER BY created_at DESC
LIMIT 1;
```

✅ **Pass:** Abra keyword + Unsplash search working

---

## 🧪 Test 4: Memory System

### Test 4.1: Store Memory

**In browser console:**
```javascript
// Get the BetaBot hook instance (if using in a component)
// Or test via API directly

// Manual test - insert memory
const { data, error } = await supabase
  .from('betabot_memory')
  .insert({
    topic: 'AI Ethics Discussion',
    conversation_snippet: 'We discussed the implications of AI on society and privacy',
    mentioned_entities: ['AI', 'society', 'privacy'],
    keywords: ['artificial intelligence', 'ethics', 'privacy'],
    sentiment: 'thoughtful',
    importance_score: 0.85
  })
  .select()
  .single();

console.log('Memory stored:', data);
```

**Verify:**
```sql
SELECT topic, conversation_snippet, importance_score, recall_count
FROM betabot_memory
ORDER BY created_at DESC
LIMIT 1;
```

✅ **Pass:** Memory storage working

### Test 4.2: Semantic Memory Search

**Test the `match_memories()` function:**
```sql
-- This requires embedding vector
-- In production, this is generated by OpenAI API
-- For testing, we can check the function exists:

\df match_memories
```

**Should show:** Function signature with parameters `query_embedding`, `match_threshold`, `match_count`

✅ **Pass:** Memory search function exists

### Test 4.3: Increment Memory Recall

```sql
-- Get a memory ID
SELECT id FROM betabot_memory LIMIT 1;

-- Increment recall count (use actual ID)
SELECT increment_memory_recall('your-memory-id-here');

-- Verify recall count increased
SELECT topic, recall_count
FROM betabot_memory
WHERE id = 'your-memory-id-here';
```

✅ **Pass:** Memory recall tracking working

---

## 🧪 Test 5: Feedback System

### Test 5.1: Submit Feedback

```sql
-- Create a test interaction first
INSERT INTO betabot_interactions (
  interaction_type,
  user_input,
  bot_response,
  processing_time_ms
)
VALUES (
  'normal_response',
  'What is the weather like?',
  'I can help with that!',
  250
)
RETURNING id;
```

```sql
-- Submit feedback (use actual interaction_id)
INSERT INTO betabot_feedback (
  interaction_id,
  feedback_type,
  feedback_value,
  feedback_text
)
VALUES (
  'your-interaction-id-here',
  'answer_helpful',
  1,
  'Great response!'
);
```

**Verify learning metrics updated:**
```sql
SELECT *
FROM betabot_learning_metrics
ORDER BY updated_at DESC
LIMIT 1;
```

✅ **Pass:** Feedback submission + metrics update working

---

## 🧪 Test 6: Producer AI Full Integration

### Test 6.1: Producer AI Analysis Flow

**This tests the complete flow:**
1. Producer AI analyzes transcript
2. Generates question
3. BetaBot receives question
4. BetaBot speaks question

**Manually trigger Producer AI:**
```sql
-- Insert 3-4 transcripts (Producer AI analyzes in batches)
INSERT INTO betabot_conversation_log (transcript_text, speaker_type)
VALUES
  ('I think AI is going to change everything', 'host'),
  ('That's really interesting, what makes you say that?', 'guest'),
  ('Well, look at how fast technology is advancing', 'host');
```

**Wait 2-3 minutes** (Producer AI polling interval)

**Check for generated question:**
```sql
SELECT question_text, source, ai_generated, created_at
FROM show_questions
WHERE source = 'producer_ai'
ORDER BY created_at DESC
LIMIT 1;
```

**Expected console output:**
```
📨 Producer AI question: [Generated question about AI discussion]
🔊 Speaking: [Question]
✅ Finished speaking
```

✅ **Pass:** Producer AI full integration working

---

## 🧪 Test 7: Multi-Model Fusion (No Perplexity Auto-Select)

### Test 7.1: Verify Perplexity Removed from Auto-Selection

**Insert normal conversation:**
```sql
INSERT INTO betabot_conversation_log (transcript_text, speaker_type)
VALUES ('Hey BetaBot what is the current weather in New York?', 'user');
```

**Expected console output:**
```
👋 Wake word detected!
🎯 Action: normal response
💬 Normal response
🎭 Using creative mode (emotion: neutral)
```

**Should NOT show:**
```
❌ 🔍 Alakazam! Searching Perplexity...
```

✅ **Pass:** Perplexity NOT auto-triggered for realtime questions

### Test 7.2: Verify Manual Alakazam Still Works

**Insert with explicit Alakazam:**
```sql
INSERT INTO betabot_conversation_log (transcript_text, speaker_type)
VALUES ('Hey BetaBot Alakazam what is the current weather in New York?', 'user');
```

**Expected console output:**
```
👋 Wake word detected!
🎯 Action: alakazam
🔍 Alakazam! Searching Perplexity...
```

✅ **Pass:** Manual Alakazam still triggers Perplexity

---

## 🛠️ Troubleshooting

### Issue: "Extension vector does not exist"

**Fix:**
```sql
CREATE EXTENSION IF NOT EXISTS vector;
```

Or enable in Supabase Dashboard → Settings → Database → Extensions → vector

---

### Issue: Real-time subscriptions not working

**Check 1: Verify tables in publication**
```sql
SELECT tablename
FROM pg_publication_tables
WHERE pubname = 'supabase_realtime';
```

**Fix:**
```sql
ALTER PUBLICATION supabase_realtime ADD TABLE betabot_conversation_log;
ALTER PUBLICATION supabase_realtime ADD TABLE show_questions;
ALTER PUBLICATION supabase_realtime ADD TABLE betabot_mood;
```

**Check 2: Verify RLS policies**
```sql
SELECT tablename, policyname
FROM pg_policies
WHERE tablename IN ('betabot_conversation_log', 'show_questions');
```

---

### Issue: API key errors in console

**Check:**
```javascript
console.log('Perplexity:', import.meta.env.VITE_PERPLEXITY_API_KEY?.substring(0, 10));
console.log('YouTube:', import.meta.env.VITE_YOUTUBE_API_KEY?.substring(0, 10));
console.log('Unsplash:', import.meta.env.VITE_UNSPLASH_ACCESS_KEY?.substring(0, 10));
```

**Fix:**
1. Verify `.env.local` exists in project root
2. Verify keys are present
3. Restart dev server: `npm run dev`

---

### Issue: TTS not speaking

**Check 1: Browser support**
```javascript
console.log('SpeechSynthesis available:', 'speechSynthesis' in window);
```

**Check 2: User interaction required**
- Some browsers require user interaction before TTS works
- Click anywhere on page first, then test

---

### Issue: Duplicate processing

**Check console for:**
```
⏸️ Already processing or speaking, skipping
```

**This is normal** - prevents multiple activations at once

---

## ✅ Complete Test Checklist

- [ ] Database migration successful (15 tables)
- [ ] API keys configured in `.env.local`
- [ ] Real-time subscriptions enabled
- [ ] Transcript subscription working
- [ ] Producer AI question subscription working
- [ ] Wake word detection working
- [ ] Alakazam (Perplexity) working
- [ ] Kadabra (YouTube) working
- [ ] Abra (Unsplash) working
- [ ] Memory storage working
- [ ] Feedback submission working
- [ ] Producer AI full flow working
- [ ] Perplexity NOT auto-triggered
- [ ] Manual Alakazam still works
- [ ] TTS speaking responses

---

## 📊 Performance Benchmarks

**Expected performance:**
- Transcript subscription latency: 100-200ms
- Keyword detection: < 50ms
- Perplexity search: 1-3 seconds
- YouTube search: 500ms - 2 seconds
- Unsplash search: 500ms - 1.5 seconds
- TTS start: < 100ms

**Monitor in console:**
```
🔊 Speaking: [response]
[Wait time]
✅ Finished speaking
```

---

## 🎯 Next Steps After Testing

Once all tests pass:

1. **Run in production mode:**
   ```bash
   npm run build
   npm run preview
   ```

2. **Test with real live stream:**
   - Set up OBS connection
   - Enable live transcription
   - Test keyword activation during stream
   - Monitor Producer AI questions

3. **Monitor database performance:**
   ```sql
   -- Check table sizes
   SELECT
     schemaname,
     tablename,
     pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
   FROM pg_tables
   WHERE tablename LIKE 'betabot%'
   ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
   ```

4. **Set up monitoring:**
   - Real-time subscription health
   - API rate limits
   - Database query performance
   - Memory usage

---

## 📚 Related Documentation

- **Setup:** `BETABOT_DATABASE_SETUP.md`
- **Integration:** `BETABOT_SUPABASE_INTEGRATION.md`
- **Features:** `READY_TO_IMPLEMENT.md`
- **Audit:** `AUDIT_COMPLETE_FIXES_APPLIED.md`

---

**Ready to test!** 🎉

Run through each test in order, checking off items as you go. If any test fails, consult the troubleshooting section.
