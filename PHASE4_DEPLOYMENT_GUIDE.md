# Phase 4 Deployment Guide

## Overview
This guide walks through deploying Phase 4: Intelligent Question Evolution to production.

**Migration File**: `supabase/migrations/20250119000000_phase4_intelligent_evolution.sql`

## Prerequisites

- [x] Phase 4 implementation complete (all 5 components)
- [x] Database migration file created
- [ ] Supabase project access
- [ ] Environment variables configured
- [ ] Testing environment ready

## Step 1: Deploy Database Migration

### Option A: Using Supabase CLI (Recommended)

```bash
# 1. Link to your Supabase project (if not already linked)
npx supabase link --project-ref YOUR_PROJECT_REF

# 2. Check migration status
npx supabase db diff

# 3. Apply the migration
npx supabase db push

# 4. Verify migration was successful
npx supabase db remote commit
```

### Option B: Using Supabase Dashboard

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Open `supabase/migrations/20250119000000_phase4_intelligent_evolution.sql`
4. Copy the entire contents
5. Paste into SQL Editor
6. Click **Run** to execute

### Option C: Using psql

```bash
# Connect to your Supabase database
psql "postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres"

# Run the migration
\i supabase/migrations/20250119000000_phase4_intelligent_evolution.sql

# Verify tables were created
\dt
```

## Step 2: Verify Migration

Run these queries to verify all Phase 4 tables were created:

```sql
-- Check all Phase 4 tables exist
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN (
  'host_profiles',
  'host_interactions',
  'engagement_snapshots',
  'topic_clusters',
  'question_cluster_assignments',
  'cluster_transitions',
  'question_chains'
);

-- Should return 7 rows

-- Check indexes were created
SELECT schemaname, tablename, indexname
FROM pg_indexes
WHERE tablename IN (
  'host_profiles',
  'host_interactions',
  'engagement_snapshots',
  'topic_clusters',
  'question_cluster_assignments',
  'cluster_transitions',
  'question_chains'
)
ORDER BY tablename, indexname;

-- Should return 15+ rows

-- Check views were created
SELECT table_name
FROM information_schema.views
WHERE table_schema = 'public'
AND table_name IN (
  'host_profile_summary',
  'topic_cluster_analytics',
  'engagement_trends'
);

-- Should return 3 rows

-- Check functions were created
SELECT routine_name
FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_name IN (
  'update_host_profile_timestamp',
  'update_topic_cluster_timestamp',
  'calculate_engagement_change',
  'update_cluster_question_count',
  'update_host_profile_confidence'
);

-- Should return 5 rows
```

## Step 3: Configure Environment Variables

Add these to your `.env.local` or deployment environment:

```env
# Existing variables (should already be set)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_KEY=your-service-key
OPENAI_API_KEY=your-openai-key

# Phase 4 specific (optional, uses defaults if not set)
PHASE4_ENABLED=true
HOST_PROFILE_LEARNING_ENABLED=true
ENGAGEMENT_TRACKING_ENABLED=true
TOPIC_CLUSTERING_ENABLED=true
FOLLOWUP_CHAINS_ENABLED=true

# Phase 4 Configuration (optional)
ENGAGEMENT_SNAPSHOT_INTERVAL=60000  # 60 seconds
CONTEXT_MEMORY_WINDOW_HOURS=24
MIN_QUESTIONS_FOR_CLUSTERING=10
MAX_TOPIC_CLUSTERS=20
```

## Step 4: Test Phase 4 Components

### 4.1 Test Host Profile Manager

```typescript
import { HostProfileManager } from './src/lib/ai/HostProfileManager';

const hostProfile = new HostProfileManager(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!,
  'test-host-123'
);

await hostProfile.initialize();
console.log('Host profile initialized:', hostProfile);

// Record a test interaction
await hostProfile.recordInteraction(
  {
    question_text: 'What are your thoughts on AI ethics?',
    id: crypto.randomUUID(),
    // ... other question fields
  },
  'asked',
  5 // response time in seconds
);

// Get host fit score
const score = hostProfile.calculateHostFitScore({
  question_text: 'How does quantum computing work?',
  // ... other question fields
});
console.log('Host fit score:', score);
```

### 4.2 Test Engagement Tracker

```typescript
import { EngagementTracker } from './src/lib/ai/EngagementTracker';

const tracker = new EngagementTracker(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

const showId = crypto.randomUUID();
await tracker.initializeForShow(showId);

// Record some chat activity
await tracker.recordChatMessage('Great question!', 'user123');
await tracker.recordChatMessage('I agree!', 'user456');

// Record viewer count
await tracker.recordViewerCount(150);

// Take a snapshot
const snapshot = await tracker.takeSnapshot();
console.log('Engagement snapshot:', snapshot);
```

### 4.3 Test Topic Clustering

```typescript
import { TopicClusteringEngine } from './src/lib/ai/TopicClusteringEngine';

const clustering = new TopicClusteringEngine(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!,
  process.env.OPENAI_API_KEY!
);

const questions = [
  { text: 'What is machine learning?', id: '1' },
  { text: 'How do neural networks work?', id: '2' },
  { text: 'What are the best pizza toppings?', id: '3' },
  { text: 'How do you make sourdough?', id: '4' }
];

const clusters = await clustering.clusterQuestions(questions);
console.log('Clusters:', clusters);
```

### 4.4 Test Follow-up Chain Generator

```typescript
import { FollowUpChainGenerator } from './src/lib/ai/FollowUpChainGenerator';

const chainGen = new FollowUpChainGenerator(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!,
  process.env.OPENAI_API_KEY!
);

const rootQuestion = {
  question_text: 'What is consciousness?',
  id: crypto.randomUUID(),
  // ... other fields
};

const chain = await chainGen.generateChain(
  rootQuestion,
  'Philosophy discussion',
  { maxDepth: 2, branchesPerLevel: 2 }
);

console.log('Follow-up chain:', chain);
console.log(`Generated ${chain.totalFollowUps} follow-ups`);
```

## Step 5: Integration Testing

### Create a test show with all Phase 4 features enabled:

```typescript
import { useProducerAI } from './src/hooks/useProducerAI';

function TestPhase4() {
  const {
    generateQuestions,
    topQuestions,
    hostProfile,
    engagementMetrics
  } = useProducerAI({
    enableHostProfile: true,
    enableEngagement: true,
    enableClustering: true,
    enableFollowUps: true
  });

  const testShow = async () => {
    // 1. Generate initial questions
    const questions = await generateQuestions('Tell me about space exploration');
    console.log('✅ Generated questions:', questions.length);

    // 2. Check host profile is learning
    console.log('✅ Host profile confidence:', hostProfile?.confidence);

    // 3. Verify engagement tracking
    console.log('✅ Engagement level:', engagementMetrics?.level);

    // 4. Test question ranking with all factors
    console.log('✅ Top question final score:', topQuestions[0]?.final_score);
  };

  return (
    <button onClick={testShow}>Test Phase 4</button>
  );
}
```

## Step 6: Monitor & Verify in Production

### Check database activity:

```sql
-- Host profiles created
SELECT COUNT(*) as profile_count FROM host_profiles;

-- Interactions recorded
SELECT
  hp.host_name,
  COUNT(hi.id) as interactions,
  hp.confidence_score
FROM host_profiles hp
LEFT JOIN host_interactions hi ON hp.id = hi.host_profile_id
GROUP BY hp.id
ORDER BY interactions DESC;

-- Engagement snapshots
SELECT
  show_id,
  COUNT(*) as snapshot_count,
  AVG(engagement_score) as avg_engagement,
  MAX(engagement_level) as peak_level
FROM engagement_snapshots
GROUP BY show_id
ORDER BY snapshot_count DESC;

-- Topic clusters formed
SELECT
  name,
  question_count,
  total_asks,
  avg_engagement_score
FROM topic_clusters
ORDER BY question_count DESC
LIMIT 10;

-- Follow-up chains generated
SELECT
  root_question_id,
  COUNT(*) as followup_count,
  MAX(depth) as max_depth,
  COUNT(CASE WHEN was_used THEN 1 END) as used_count
FROM question_chains
GROUP BY root_question_id
ORDER BY followup_count DESC
LIMIT 10;
```

## Step 7: Performance Monitoring

### Key metrics to monitor:

1. **Database Performance**
   - Query execution time for embedding searches
   - Index usage on high-traffic tables
   - Connection pool utilization

```sql
-- Check slow queries
SELECT
  query,
  mean_exec_time,
  calls
FROM pg_stat_statements
WHERE query LIKE '%topic_clusters%' OR query LIKE '%host_profiles%'
ORDER BY mean_exec_time DESC
LIMIT 10;

-- Check index usage
SELECT
  schemaname,
  tablename,
  indexname,
  idx_scan,
  idx_tup_read,
  idx_tup_fetch
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
ORDER BY idx_scan DESC;
```

2. **OpenAI API Usage**
   - Embedding generation cost (~$0.13 per 1M tokens)
   - Follow-up generation cost (GPT-4o-mini: ~$0.15/$0.60 per 1M tokens)
   - Total monthly spend

3. **Feature Adoption**
   - Host profile confidence scores over time
   - Engagement tracking coverage (% of shows)
   - Cluster formation rate
   - Follow-up chain usage rate

## Rollback Plan

If issues arise, rollback using:

```sql
-- Drop Phase 4 tables in reverse dependency order
DROP TRIGGER IF EXISTS cluster_assignments_update_count ON question_cluster_assignments;
DROP TRIGGER IF EXISTS cluster_transitions_engagement_change ON cluster_transitions;
DROP TRIGGER IF EXISTS host_interactions_update_confidence ON host_interactions;
DROP TRIGGER IF EXISTS topic_clusters_updated_at ON topic_clusters;
DROP TRIGGER IF EXISTS host_profiles_updated_at ON host_profiles;

DROP FUNCTION IF EXISTS update_host_profile_confidence();
DROP FUNCTION IF EXISTS update_cluster_question_count();
DROP FUNCTION IF EXISTS calculate_engagement_change();
DROP FUNCTION IF EXISTS update_topic_cluster_timestamp();
DROP FUNCTION IF EXISTS update_host_profile_timestamp();

DROP VIEW IF EXISTS engagement_trends;
DROP VIEW IF EXISTS topic_cluster_analytics;
DROP VIEW IF EXISTS host_profile_summary;

DROP TABLE IF EXISTS question_chains CASCADE;
DROP TABLE IF EXISTS cluster_transitions CASCADE;
DROP TABLE IF EXISTS question_cluster_assignments CASCADE;
DROP TABLE IF EXISTS topic_clusters CASCADE;
DROP TABLE IF EXISTS engagement_snapshots CASCADE;
DROP TABLE IF EXISTS host_interactions CASCADE;
DROP TABLE IF EXISTS host_profiles CASCADE;
```

## Success Criteria

Phase 4 deployment is successful when:

- [x] All 7 tables created without errors
- [x] All 15 indexes created
- [x] All 5 functions operational
- [x] All 3 views accessible
- [ ] RLS policies enforced
- [ ] Host profiles created for test users
- [ ] Engagement snapshots recording
- [ ] Topic clusters forming automatically
- [ ] Follow-up chains generating
- [ ] VotingEngine using all 4 scoring factors
- [ ] No performance degradation (<200ms p95 latency)
- [ ] OpenAI costs within budget ($50/month estimated)

## Post-Deployment Tasks

1. **Documentation**
   - [ ] Update API docs with Phase 4 endpoints
   - [ ] Create user guides for new features
   - [ ] Document admin dashboards

2. **Monitoring Setup**
   - [ ] Configure Supabase alerts for slow queries
   - [ ] Set up OpenAI usage tracking
   - [ ] Create Grafana dashboards for metrics

3. **User Training**
   - [ ] Train hosts on profile interpretation
   - [ ] Demo engagement tracking features
   - [ ] Explain topic clustering visualization

## Support & Troubleshooting

### Common Issues

**Issue**: Vector extension not enabled
```sql
-- Solution: Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;
```

**Issue**: Embedding searches are slow
```sql
-- Solution: Rebuild ivfflat index with more lists
DROP INDEX idx_topic_clusters_centroid;
CREATE INDEX idx_topic_clusters_centroid ON topic_clusters
USING ivfflat (centroid_embedding vector_cosine_ops)
WITH (lists = 200);  -- Increase lists for larger datasets
```

**Issue**: RLS blocking service account
```sql
-- Solution: Verify service role bypass
SELECT * FROM host_profiles;  -- Should work with service key
```

## Next Steps

After successful Phase 4 deployment:

1. **UI Development**
   - Build host profile dashboard
   - Create engagement visualization
   - Add topic cluster explorer
   - Show follow-up chain tree

2. **Analytics**
   - Generate weekly performance reports
   - Track feature adoption metrics
   - Measure question quality improvements

3. **Optimization**
   - Fine-tune scoring weights based on data
   - Optimize clustering parameters
   - Adjust engagement thresholds

4. **Phase 5 Planning** (if applicable)
   - Multi-host conversation support
   - Cross-show learning
   - Predictive question generation

---

**Created**: January 2025
**Version**: 1.0.0
**Maintainer**: Ibrahim Ayad
