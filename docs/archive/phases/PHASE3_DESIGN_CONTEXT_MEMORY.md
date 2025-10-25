# Phase 3: Advanced Context Memory System - Design Document

**Date**: October 19, 2025
**Status**: 🔨 In Design
**Estimated Effort**: 14 hours

---

## 🎯 Problem Statement

**Current Issue**: The Producer AI generates questions every 2 minutes during a 3-hour show (90 analyses per show). Without memory of past questions, it may:
- Ask the same question multiple times
- Rehash topics already explored
- Miss opportunities to build on previous discussions
- Feel repetitive to the host and viewers

**Example Scenario**:
```
Analysis #1 (10:00 AM):
  → "What evidence supports machine consciousness?"

Analysis #5 (10:08 AM):
  → "Can we prove AI systems are conscious?"  [87% similar to #1]

Analysis #12 (10:22 AM):
  → "How do we know if AI has subjective experience?"  [82% similar to #1]
```

**Goal**: Implement a context memory system that remembers questions asked during a show and prevents repetition while encouraging topical progression.

---

## 🏗️ Architecture Overview

### System Components

```
┌─────────────────────────────────────────────────────────┐
│                   Producer AI Hook                       │
│                  (useProducerAI.ts)                      │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│              Context Memory Manager                      │
│           (ContextMemoryManager.ts)                      │
│                                                           │
│  ┌─────────────────────────────────────────────────┐   │
│  │  In-Memory Cache (Current Show)                  │   │
│  │  - Question embeddings                           │   │
│  │  - Timestamps                                    │   │
│  │  - Similarity scores                             │   │
│  │  - Max 100 questions (rolling window)            │   │
│  └─────────────────────────────────────────────────┘   │
│                                                           │
│  ┌─────────────────────────────────────────────────┐   │
│  │  Supabase Persistent Storage                     │   │
│  │  - Table: question_history                       │   │
│  │  - Indexed by: show_id, timestamp, embedding     │   │
│  │  - Retention: 30 days                            │   │
│  └─────────────────────────────────────────────────┘   │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│                 Voting Engine                            │
│              (VotingEngine.ts)                           │
│                                                           │
│  Step 1: Deduplicate within current batch               │
│  Step 2: Check against context memory (NEW)             │
│  Step 3: Apply temporal decay scoring (NEW)              │
│  Step 4: Cross-model voting                             │
│  Step 5: Diversity + novelty scoring (UPDATED)          │
│  Step 6: Final ranking                                  │
└─────────────────────────────────────────────────────────┘
```

---

## 📊 Data Model

### Supabase Table: `question_history`

```sql
CREATE TABLE question_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  show_id TEXT NOT NULL,
  question_text TEXT NOT NULL,
  embedding VECTOR(1536),  -- OpenAI text-embedding-3-small
  confidence NUMERIC(3,2),
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  source_model TEXT,  -- 'gpt-4o', 'claude', 'gemini'
  was_used BOOLEAN DEFAULT FALSE,  -- Did host actually use this question?
  topic_tags TEXT[],  -- Optional: extracted topics
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for fast lookups
CREATE INDEX idx_question_history_show_id ON question_history(show_id);
CREATE INDEX idx_question_history_timestamp ON question_history(timestamp);
CREATE INDEX idx_question_history_embedding ON question_history USING ivfflat (embedding vector_cosine_ops);

-- Auto-cleanup old records (30 days retention)
CREATE OR REPLACE FUNCTION cleanup_old_question_history()
RETURNS void AS $$
BEGIN
  DELETE FROM question_history
  WHERE created_at < NOW() - INTERVAL '30 days';
END;
$$ LANGUAGE plpgsql;
```

### In-Memory Cache Structure

```typescript
interface ContextMemoryCache {
  showId: string;
  questions: Array<{
    text: string;
    embedding: number[];
    timestamp: Date;
    confidence: number;
    sourceModel: AIModel;
    wasUsed: boolean;
  }>;
  maxSize: number; // 100 questions max
  createdAt: Date;
}
```

---

## 🧠 Context Memory Manager

### Class: `ContextMemoryManager`

**File**: `/src/lib/ai/ContextMemoryManager.ts`

**Responsibilities**:
1. Maintain in-memory cache of recent questions
2. Persist questions to Supabase
3. Load questions from Supabase on show start
4. Check for semantic similarity against history
5. Calculate temporal decay scores
6. Provide novelty scoring for new questions

**Key Methods**:

```typescript
class ContextMemoryManager {
  private cache: ContextMemoryCache;
  private supabase: SupabaseClient;

  // Initialize cache for a show
  async initializeForShow(showId: string): Promise<void>

  // Add a question to memory
  async addQuestion(question: GeneratedQuestion): Promise<void>

  // Check if question is similar to any in history
  async checkSimilarity(questionText: string, threshold: number): Promise<{
    isSimilar: boolean;
    mostSimilarQuestion: string | null;
    similarity: number;
    timeAgo: number; // minutes since similar question
  }>

  // Get novelty score (0-1, higher = more novel)
  async calculateNoveltyScore(questionText: string): Promise<number>

  // Get all questions from current show
  getShowHistory(): Array<QuestionHistoryItem>

  // Clear cache (e.g., when show ends)
  clearCache(): void

  // Persist cache to Supabase
  async persistToDatabase(): Promise<void>
}
```

---

## 🔄 Integration with Voting Engine

### Modified Ranking Pipeline

**Current Flow** (Phase 2):
```
All Questions (8-12 from 3 models)
  ↓
Semantic Deduplication (remove 85%+ similar within batch)
  ↓
Cross-Model Voting
  ↓
Diversity Scoring
  ↓
Final Ranking (Top 5)
```

**New Flow** (Phase 3):
```
All Questions (8-12 from 3 models)
  ↓
Semantic Deduplication (remove 85%+ similar within batch)
  ↓
Context Memory Check (NEW)
  ├─ Filter out 80%+ similar to past questions from last 30 min
  ├─ Penalize 70-80% similar questions (reduce score by 30%)
  └─ Boost novel questions (< 60% similarity to any past)
  ↓
Cross-Model Voting
  ↓
Diversity + Novelty Scoring (UPDATED)
  ├─ Diversity: difference from other candidates (same as before)
  └─ Novelty: difference from historical questions (NEW)
  ↓
Temporal Decay Application (NEW)
  └─ Reduce scores for questions similar to recent history
  ↓
Final Ranking (Top 5)
```

### Novelty Score Calculation

```typescript
function calculateNoveltyScore(
  questionEmbedding: number[],
  historyEmbeddings: number[][],
  timestamps: Date[]
): number {
  let maxSimilarity = 0;
  let recentSimilaritySum = 0;
  let recentCount = 0;

  const now = Date.now();

  for (let i = 0; i < historyEmbeddings.length; i++) {
    const similarity = cosineSimilarity(questionEmbedding, historyEmbeddings[i]);
    const ageMinutes = (now - timestamps[i].getTime()) / 60000;

    // Temporal decay: recent questions matter more
    const decayFactor = Math.exp(-ageMinutes / 30); // 30 min half-life
    const weightedSimilarity = similarity * decayFactor;

    maxSimilarity = Math.max(maxSimilarity, weightedSimilarity);

    // Track recent similarities (last 30 minutes)
    if (ageMinutes < 30) {
      recentSimilaritySum += similarity;
      recentCount++;
    }
  }

  // Novelty = inverse of similarity
  // If maxSimilarity = 0.9 (90% similar), novelty = 0.1 (10% novel)
  // If maxSimilarity = 0.3 (30% similar), novelty = 0.7 (70% novel)
  const noveltyScore = 1 - maxSimilarity;

  // Bonus for completely unexplored angles
  const avgRecentSimilarity = recentCount > 0 ? recentSimilaritySum / recentCount : 0;
  const explorationBonus = avgRecentSimilarity < 0.4 ? 0.1 : 0;

  return Math.min(noveltyScore + explorationBonus, 1.0);
}
```

---

## ⏰ Temporal Decay Strategy

### Decay Function

Questions become "less relevant" over time. We use exponential decay:

```
decay(t) = e^(-t / half_life)

Where:
- t = minutes since question was asked
- half_life = 30 minutes (configurable)
```

**Examples**:
```
Time Ago   Decay Factor   Effective Similarity
5 min      0.89          90% → 80%  (significant penalty)
15 min     0.61          90% → 55%  (moderate penalty)
30 min     0.37          90% → 33%  (small penalty)
60 min     0.13          90% → 12%  (negligible)
```

**Logic**:
- Questions asked 5 minutes ago should strongly prevent similar questions
- Questions asked 30+ minutes ago are less restrictive (topic may have evolved)
- Questions asked 60+ minutes ago barely affect scoring

---

## 🎛️ Configuration

### Context Memory Config

```typescript
interface ContextMemoryConfig {
  enabled: boolean;                    // Toggle context memory on/off
  maxCacheSize: number;                // Max questions in memory (default: 100)
  similarityThreshold: number;         // Block if > this (default: 0.80)
  penaltySimilarityThreshold: number;  // Penalize if > this (default: 0.70)
  noveltyBoostThreshold: number;       // Boost if < this (default: 0.60)
  temporalDecayHalfLife: number;       // Minutes (default: 30)
  persistToDatabase: boolean;          // Save to Supabase (default: true)
  retentionDays: number;               // Keep history for X days (default: 30)
}

export const DEFAULT_CONTEXT_MEMORY_CONFIG: ContextMemoryConfig = {
  enabled: true,
  maxCacheSize: 100,
  similarityThreshold: 0.80,
  penaltySimilarityThreshold: 0.70,
  noveltyBoostThreshold: 0.60,
  temporalDecayHalfLife: 30,
  persistToDatabase: true,
  retentionDays: 30
};
```

---

## 🚀 Performance Considerations

### 1. **In-Memory Cache First**
- Check cache before querying Supabase
- Cache stores last 100 questions (typical show = 90 analyses)
- Average lookup time: < 1ms

### 2. **Batch Embedding Lookups**
- Don't embed each question individually
- Use batch embedding API for all candidates at once
- Reduces API calls from 5 to 1

### 3. **Vector Indexing in Supabase**
- Use pgvector extension with IVFFlat index
- Fast approximate nearest neighbor search
- Sub-100ms query time for similarity search

### 4. **Lazy Persistence**
- Write to Supabase asynchronously (don't block analysis)
- Batch writes every 5 minutes
- Final flush when show ends

---

## 📊 Expected Impact

### Metrics to Track

**Before Context Memory** (Phase 2):
```
Show Duration: 3 hours
Analyses: 90 total
Questions Generated: ~450 total
Duplicates/Similar: ~90-120 (20-25%)
Host Satisfaction: "Too many repeated questions"
```

**After Context Memory** (Phase 3 Target):
```
Show Duration: 3 hours
Analyses: 90 total
Questions Generated: ~450 total
Duplicates/Similar: ~20-45 (5-10%)
Novel Questions: 80%+
Host Satisfaction: "Questions build on previous discussion"
```

### Success Criteria

- ✅ Duplicate rate < 10% (down from 20-25%)
- ✅ Novelty score average > 0.70
- ✅ Performance impact < 200ms per analysis
- ✅ UI shows "similar to X minutes ago" warnings
- ✅ Host can mark questions as "used" for stronger filtering

---

## 🎨 UI Enhancements

### 1. **Context Memory Status Badge**

```
┌───────────────────────────────────────┐
│ 📚 Context Memory: Active             │
│ ─────────────────────────────────────  │
│ Questions in Memory: 67               │
│ Show Duration: 1h 23m                 │
│ Avg Novelty: 78%                      │
└───────────────────────────────────────┘
```

### 2. **Question History Panel**

```
┌───────────────────────────────────────────────┐
│ 🕐 Recent Questions (Last 30 min)            │
├───────────────────────────────────────────────┤
│ 5 min ago   "What evidence supports..."  ✓   │
│ 12 min ago  "Can we prove AI systems..." ✗   │
│ 18 min ago  "How do emotions differ..."  ✓   │
│ 24 min ago  "Is consciousness binary..." ✗   │
└───────────────────────────────────────────────┘
```

### 3. **Novelty Score on Question Cards**

```
┌────────────────────────────────────────┐
│ #1 🥇  gpt-4o          Score: 89%      │
│ ✨ Novelty: 82% (Fresh angle!)         │
├────────────────────────────────────────┤
│ "How would you design an experiment    │
│  to test whether an AI system..."      │
└────────────────────────────────────────┘
```

### 4. **Similarity Warning**

```
┌────────────────────────────────────────┐
│ #3 🥉  claude         Score: 72%       │
│ ⚠️  74% similar to question 18min ago  │
├────────────────────────────────────────┤
│ "Can we prove AI has consciousness?"   │
│ Similar to: "What evidence supports    │
│ machine consciousness?" (10:22 AM)     │
└────────────────────────────────────────┘
```

---

## 🔧 Implementation Plan

### Phase 3.1: Architecture & Types (2 hours)
- [x] Design system architecture
- [ ] Define TypeScript interfaces
- [ ] Create configuration types
- [ ] Design Supabase schema

### Phase 3.2: Context Memory Manager (4 hours)
- [ ] Implement in-memory cache
- [ ] Add Supabase persistence
- [ ] Build similarity checking
- [ ] Add temporal decay logic

### Phase 3.3: Voting Engine Integration (3 hours)
- [ ] Update ranking pipeline
- [ ] Add novelty scoring
- [ ] Integrate temporal decay
- [ ] Update final score calculation

### Phase 3.4: UI Components (3 hours)
- [ ] Context memory status badge
- [ ] Question history panel
- [ ] Novelty indicators on question cards
- [ ] Similarity warnings

### Phase 3.5: Testing & Documentation (2 hours)
- [ ] Unit tests for ContextMemoryManager
- [ ] Integration tests with VotingEngine
- [ ] Performance benchmarks
- [ ] Update documentation

---

## 🎯 Future Enhancements (Phase 4+)

1. **Topic Clustering**: Group questions by semantic topic
2. **Conversation Flow Analysis**: Detect when topic naturally shifts
3. **Multi-Show Context**: Remember questions across shows (same topic)
4. **Learning from Usage**: Boost question types that hosts actually use
5. **Predictive Context**: Anticipate when topics will be exhausted

---

## 📝 Open Questions

1. **Should we filter or just penalize similar questions?**
   - Filter: Completely block > 80% similar
   - Penalize: Reduce score but allow in final ranking
   - **Decision**: Filter hard duplicates (>80%), penalize medium (70-80%)

2. **How to handle topic shifts?**
   - Reset context memory when topic changes significantly
   - Use semantic clustering to detect shifts
   - **Decision**: Implement in Phase 4

3. **What if host explicitly wants to revisit a topic?**
   - Add manual override to disable context memory temporarily
   - Add "refresh topic" button to clear related questions from memory
   - **Decision**: Add to UI in Phase 3.4

---

**Status**: ✅ Design Complete
**Next Step**: Implement TypeScript interfaces and Supabase schema
**Estimated Start**: October 19, 2025
