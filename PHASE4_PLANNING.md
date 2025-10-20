# Phase 4: Intelligent Question Evolution & Host Adaptation
**Producer AI - Next Generation Planning Document**

**Date**: October 19, 2025
**Status**: 📋 PLANNING
**Estimated Duration**: 3-4 weeks
**Dependencies**: Phase 3 complete ✅

---

## 🎯 Vision

Phase 4 transforms the Producer AI from a **reactive question generator** into an **intelligent conversation partner** that learns from host behavior, audience engagement, and cross-show patterns to generate increasingly relevant and impactful questions.

### Key Goals
1. **Learn host preferences** - Adapt to what types of questions the host actually uses
2. **Cross-show intelligence** - Learn from patterns across all shows, not just current
3. **Topic clustering** - Understand topic relationships and guide conversations strategically
4. **Engagement tracking** - Integrate audience signals (chat activity, reactions, metrics)
5. **Follow-up chains** - Generate coherent question sequences that build on each other
6. **Adaptive difficulty** - Adjust question complexity based on show context

---

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    PHASE 4: INTELLIGENT LAYER                │
└─────────────────────────────────────────────────────────────┘
                           ▲
                           │
        ┌──────────────────┼──────────────────┐
        │                  │                  │
        ▼                  ▼                  ▼
┌──────────────┐  ┌────────────────┐  ┌──────────────┐
│ Host Profile │  │ Topic Clusters │  │  Engagement  │
│   Learning   │  │   & Patterns   │  │   Tracker    │
└──────┬───────┘  └────────┬───────┘  └──────┬───────┘
       │                   │                  │
       └───────────────────┴──────────────────┘
                           │
                           ▼
        ┌──────────────────────────────────────┐
        │  Adaptive Question Generator (NEW)    │
        │  - Learns from history                │
        │  - Predicts question impact           │
        │  - Generates follow-up chains         │
        └──────────────┬───────────────────────┘
                       │
                       ▼
        ┌──────────────────────────────────────┐
        │      Enhanced VotingEngine (Phase 3) │
        │  - Context Memory                     │
        │  - Novelty Scoring                    │
        └──────────────┬───────────────────────┘
                       │
                       ▼
        ┌──────────────────────────────────────┐
        │         Multi-Model AI (Phase 2)     │
        │  - GPT-4o, Claude, Gemini            │
        └──────────────────────────────────────┘
```

---

## 📦 Phase 4 Components

### 4.1: Host Profile Learning System

**Purpose**: Learn which types of questions the host prefers and uses

#### Features
- **Usage Tracking**: Record which questions host actually asks
- **Preference Analysis**: Identify patterns in question characteristics:
  - Question complexity (simple vs. deep)
  - Topic preferences (tech vs. politics vs. culture)
  - Question style (open-ended vs. specific)
  - Length preferences (short vs. detailed)
- **Adaptive Weighting**: Adjust scoring to favor host's preferred style
- **Feedback Loop**: Improve over time as more shows are recorded

#### Data Model
```typescript
interface HostProfile {
  hostId: string;
  totalShows: number;
  totalQuestions: number;
  questionPreferences: {
    avgComplexity: number; // 0-1
    avgLength: number; // words
    topicDistribution: Record<string, number>; // topic -> frequency
    stylePreferences: {
      openEnded: number; // %
      specific: number; // %
      provocative: number; // %
      analytical: number; // %
    };
  };
  usagePatterns: {
    questionsAsked: number;
    questionsIgnored: number;
    avgTimeToUse: number; // seconds
  };
  updatedAt: Date;
}
```

#### Database Schema
```sql
CREATE TABLE host_profiles (
  id UUID PRIMARY KEY,
  host_id TEXT UNIQUE NOT NULL,
  total_shows INTEGER DEFAULT 0,
  total_questions INTEGER DEFAULT 0,
  questions_asked INTEGER DEFAULT 0,
  questions_ignored INTEGER DEFAULT 0,
  avg_complexity NUMERIC(3,2),
  avg_length INTEGER,
  topic_distribution JSONB,
  style_preferences JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

### 4.2: Cross-Show Learning Engine

**Purpose**: Learn from patterns across ALL shows, not just current show

#### Features
- **Global Question Bank**: Store all questions ever generated with metadata
- **Success Metrics**: Track which questions led to good conversations
- **Topic Trends**: Identify trending topics across shows
- **Temporal Patterns**: Learn when certain types of questions work best
- **Host Comparisons**: Learn from similar hosts' successful questions

#### Data Model
```typescript
interface GlobalQuestionInsight {
  questionId: string;
  questionText: string;
  embedding: number[];

  // Context
  showId: string;
  hostId: string;
  timestamp: Date;
  topic: string;

  // Performance
  wasUsed: boolean;
  timeToUse?: number; // seconds
  audienceEngagement?: number; // chat activity spike

  // Characteristics
  complexity: number; // 0-1
  novelty: number; // 0-1
  length: number; // words
  style: 'open-ended' | 'specific' | 'provocative' | 'analytical';

  // Success indicators
  successScore: number; // 0-1, computed from engagement
}
```

#### Analysis Capabilities
- Find best-performing questions for similar contexts
- Identify question patterns that lead to viral moments
- Predict question success before asking
- Recommend optimal timing for different question types

---

### 4.3: Topic Clustering & Navigation

**Purpose**: Understand topic relationships and guide conversation flow

#### Features
- **Automatic Topic Detection**: Use embeddings to cluster questions by topic
- **Topic Graph**: Build relationships between topics
- **Conversation Flow Mapping**: Understand natural topic transitions
- **Strategic Navigation**: Suggest questions that bridge topics or deepen current topic

#### Visualization
```
        Tech ──────┐
         │         │
         │    ┌────▼─────┐
         │    │   AI     │
         └────►  Ethics  │
              │          │
         ┌────┤          │
         │    └────┬─────┘
    Privacy        │
         │         │
         └────► Policy
```

#### Implementation
```typescript
interface TopicCluster {
  id: string;
  name: string;
  keywords: string[];
  centroidEmbedding: number[];
  questionCount: number;
  relatedTopics: Array<{
    topicId: string;
    similarity: number;
  }>;
}

interface ConversationFlow {
  currentTopic: string;
  topicHistory: string[];
  suggestedNextTopics: Array<{
    topic: string;
    reasoning: string;
    transitionSmoothness: number; // 0-1
  }>;
}
```

---

### 4.4: Engagement Tracking & Integration

**Purpose**: Integrate real-time audience signals into question selection

#### Data Sources
- **Chat Activity**: Message rate, sentiment, keyword frequency
- **Viewer Metrics**: Viewer count changes, watch time
- **Social Media**: Tweet/mention rate, sentiment
- **Direct Feedback**: Host ratings, audience polls

#### Features
- **Engagement Spike Detection**: Identify when audience is most engaged
- **Question-Engagement Correlation**: Link questions to engagement changes
- **Real-time Scoring**: Adjust question scores based on current engagement
- **Optimal Timing**: Suggest best moments to ask specific questions

#### Data Model
```typescript
interface EngagementSnapshot {
  timestamp: Date;
  showId: string;

  // Metrics
  chatMessagesPerMinute: number;
  viewerCount: number;
  viewerCountChange: number; // % change from baseline
  sentimentScore: number; // -1 to 1

  // Context
  currentQuestion?: string;
  currentTopic?: string;

  // Derived insights
  engagementLevel: 'low' | 'medium' | 'high' | 'viral';
  audienceInterest: string[]; // detected topics from chat
}

interface QuestionImpact {
  questionId: string;
  askedAt: Date;

  // Before asking
  engagementBefore: EngagementSnapshot;

  // After asking (measured over 2 minutes)
  engagementAfter: EngagementSnapshot;

  // Impact metrics
  chatActivityChange: number; // % change
  viewerRetention: number; // % stayed
  sentimentChange: number;

  // Computed score
  impactScore: number; // 0-1
}
```

---

### 4.5: Follow-Up Question Chains

**Purpose**: Generate coherent sequences of questions that build on each other

#### Features
- **Question Sequencing**: Generate 3-5 follow-up questions for any question
- **Depth Progression**: Start broad, progressively deepen
- **Context Preservation**: Each follow-up builds on previous answers
- **Branching Paths**: Multiple follow-up directions based on answer

#### Example Chain
```
Initial: "What role should government play in AI regulation?"

Follow-ups (if answer emphasizes innovation):
  1. "How can we balance innovation with safety concerns?"
  2. "What specific AI applications should be prioritized?"
  3. "How would you address concerns about job displacement?"

Follow-ups (if answer emphasizes safety):
  1. "What safeguards would you implement first?"
  2. "How do we enforce AI safety internationally?"
  3. "What penalties should exist for violations?"
```

#### Data Model
```typescript
interface QuestionChain {
  rootQuestionId: string;
  rootQuestion: string;

  branches: Array<{
    condition: string; // "if answer emphasizes X"
    followUps: Array<{
      question: string;
      depth: number; // 1, 2, 3...
      reasoning: string;
      expectedOutcome: string;
    }>;
  }>;
}
```

---

### 4.6: Adaptive Complexity & Difficulty

**Purpose**: Adjust question complexity based on show context and audience

#### Complexity Factors
- **Show Format**: Live vs. recorded, interview vs. debate
- **Audience Level**: General public vs. experts
- **Time in Show**: Warm-up vs. deep discussion
- **Energy Level**: High-energy vs. contemplative
- **Host Preference**: From host profile

#### Implementation
```typescript
interface ComplexityProfile {
  // Input factors
  showFormat: 'live-interview' | 'recorded-debate' | 'panel' | 'solo';
  audienceType: 'general' | 'informed' | 'expert';
  minutesIntoShow: number;
  currentEnergy: 'low' | 'medium' | 'high';
  hostPreference: number; // 0-1, from profile

  // Output
  targetComplexity: number; // 0-1
  targetLength: number; // words
  preferredStyle: string;
}

function adjustQuestionComplexity(
  question: string,
  currentComplexity: number,
  targetComplexity: number
): string {
  // Use LLM to rewrite question at target complexity
  if (currentComplexity > targetComplexity + 0.2) {
    return simplifyQuestion(question);
  } else if (currentComplexity < targetComplexity - 0.2) {
    return deepenQuestion(question);
  }
  return question;
}
```

---

## 🔄 Updated Question Generation Flow (Phase 4)

```
1. Analyze Context
   ├─ Current transcript
   ├─ Host profile
   ├─ Show history
   ├─ Topic clusters
   └─ Current engagement

2. Generate Base Questions
   ├─ GPT-4o generates 5 questions
   ├─ Claude generates 5 questions
   └─ Gemini generates 5 questions

3. Enhanced Filtering (Phase 2 + 3)
   ├─ Deduplicate within batch
   ├─ Check context memory (Phase 3)
   ├─ Cross-model voting (Phase 2)
   └─ Calculate novelty scores (Phase 3)

4. Phase 4 Enhancements (NEW)
   ├─ Apply host profile preferences
   ├─ Check cross-show insights
   ├─ Calculate topic cluster fit
   ├─ Predict engagement impact
   ├─ Adjust complexity if needed
   └─ Generate follow-up chains

5. Final Ranking
   ├─ Quality: 40% (voting score)
   ├─ Novelty: 20% (context memory)
   ├─ Host Fit: 20% (profile match)
   └─ Impact: 20% (predicted engagement)

6. Return Top 5
   ├─ Main question
   ├─ Predicted impact score
   ├─ 3 follow-up suggestions
   └─ Optimal timing recommendation
```

---

## 📊 Success Metrics (Phase 4)

| Metric | Baseline (Phase 3) | Target (Phase 4) | Measurement |
|--------|-------------------|------------------|-------------|
| Question usage rate | 40-50% | 70%+ | % of AI questions actually asked |
| Time to first use | 3-5 min | < 2 min | Avg time from generation to use |
| Engagement correlation | Unknown | 0.6+ | Correlation between questions & chat activity |
| Host satisfaction | Qualitative | 8/10+ | Post-show survey |
| Topic coherence | Unknown | 0.8+ | Semantic similarity between consecutive questions |
| Follow-up adoption | 0% | 30%+ | % of times host uses suggested follow-ups |

---

## 🗄️ New Database Tables

```sql
-- Host profiles
CREATE TABLE host_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  host_id TEXT UNIQUE NOT NULL,
  total_shows INTEGER DEFAULT 0,
  total_questions INTEGER DEFAULT 0,
  questions_asked INTEGER DEFAULT 0,
  questions_ignored INTEGER DEFAULT 0,
  avg_complexity NUMERIC(3,2),
  avg_length INTEGER,
  topic_distribution JSONB,
  style_preferences JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Global question insights
CREATE TABLE question_insights (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  question_text TEXT NOT NULL,
  embedding VECTOR(1536),
  show_id TEXT NOT NULL,
  host_id TEXT,
  topic TEXT,
  complexity NUMERIC(3,2),
  length INTEGER,
  style TEXT,
  was_used BOOLEAN DEFAULT FALSE,
  time_to_use INTEGER, -- seconds
  engagement_before JSONB,
  engagement_after JSONB,
  impact_score NUMERIC(3,2),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Topic clusters
CREATE TABLE topic_clusters (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  keywords TEXT[],
  centroid_embedding VECTOR(1536),
  question_count INTEGER DEFAULT 0,
  related_clusters JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Engagement snapshots
CREATE TABLE engagement_snapshots (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  show_id TEXT NOT NULL,
  timestamp TIMESTAMPTZ NOT NULL,
  chat_messages_per_minute INTEGER,
  viewer_count INTEGER,
  viewer_count_change NUMERIC(5,2),
  sentiment_score NUMERIC(3,2),
  current_question_id UUID REFERENCES question_insights(id),
  engagement_level TEXT CHECK (engagement_level IN ('low', 'medium', 'high', 'viral')),
  audience_interests TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Question chains
CREATE TABLE question_chains (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  root_question_id UUID REFERENCES question_insights(id),
  parent_question_id UUID REFERENCES question_insights(id),
  follow_up_question TEXT NOT NULL,
  depth INTEGER NOT NULL,
  condition TEXT,
  reasoning TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_host_profiles_host_id ON host_profiles(host_id);
CREATE INDEX idx_question_insights_show_id ON question_insights(show_id);
CREATE INDEX idx_question_insights_host_id ON question_insights(host_id);
CREATE INDEX idx_question_insights_embedding ON question_insights USING ivfflat (embedding vector_cosine_ops);
CREATE INDEX idx_topic_clusters_embedding ON topic_clusters USING ivfflat (centroid_embedding vector_cosine_ops);
CREATE INDEX idx_engagement_snapshots_show_id ON engagement_snapshots(show_id);
CREATE INDEX idx_engagement_snapshots_timestamp ON engagement_snapshots(timestamp DESC);
CREATE INDEX idx_question_chains_root ON question_chains(root_question_id);
```

---

## 🛠️ Implementation Plan

### Week 1: Foundation
- [ ] Set up new database tables
- [ ] Implement HostProfileManager class
- [ ] Create data collection hooks in existing code
- [ ] Start collecting usage data retroactively

### Week 2: Learning Systems
- [ ] Build cross-show learning engine
- [ ] Implement topic clustering algorithm
- [ ] Create engagement tracking system
- [ ] Integrate with existing analytics

### Week 3: Intelligence Layer
- [ ] Implement adaptive question generation
- [ ] Build follow-up chain generator
- [ ] Create complexity adjustment system
- [ ] Integrate all Phase 4 components

### Week 4: Testing & Refinement
- [ ] Integration testing with real shows
- [ ] A/B testing: Phase 3 vs Phase 4
- [ ] Performance optimization
- [ ] UI updates for new features
- [ ] Documentation and deployment

---

## 🎨 UI Enhancements

### New UI Components

1. **Host Profile Dashboard**
   - Show host preferences and patterns
   - Visualization of question usage over time
   - Editable preference overrides

2. **Topic Navigator**
   - Interactive topic graph
   - Current topic highlight
   - Suggested topic transitions

3. **Engagement Monitor**
   - Real-time engagement chart
   - Correlation with questions
   - Optimal timing indicators

4. **Question Chain Viewer**
   - Tree view of follow-up questions
   - Branch selection based on answer
   - Quick access to next question

5. **Impact Predictions**
   - Predicted engagement score for each question
   - Confidence intervals
   - Success probability

---

## ⚠️ Risks & Mitigation

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| Overfitting to host preferences | High | Medium | Include diversity bonus, regular retraining |
| Complexity creep | Medium | High | Maintain simple fallback, phased rollout |
| Performance degradation | High | Low | Caching, async processing, load testing |
| Privacy concerns (host data) | Medium | Low | Anonymize data, opt-in system |
| False engagement signals | Medium | Medium | Multiple data sources, manual override |

---

## 🔮 Future Enhancements (Phase 5?)

- **Voice Analysis**: Detect host energy from voice tone
- **Video Analysis**: Use computer vision to detect audience reactions
- **Multi-language Support**: Generate questions in different languages
- **Guest Profiles**: Learn about recurring guests
- **External Context**: Integrate news, Twitter trends, etc.
- **Automated Fact-Checking**: Verify question premises
- **Question Templates**: Learn successful question templates
- **Collaborative Filtering**: "Hosts like you also asked..."

---

## 📝 Technical Requirements

### APIs Needed
- OpenAI API (existing)
- Anthropic API (existing)
- Google AI API (existing)
- Analytics API (new, for engagement data)

### Storage Requirements
- Database: ~50GB for first year (with all tables)
- Vector embeddings: ~10M dimensions active
- Cache: ~2GB in-memory

### Compute Requirements
- CPU: Additional 20% for learning algorithms
- Memory: +4GB for topic clustering
- GPU: Optional, for faster embeddings

---

## 💰 Cost Estimate

### Development
- Engineering: 3-4 weeks × 1 developer = $20-30K
- Testing: 1 week = $5-7K
- **Total**: ~$25-37K

### Ongoing Costs
- Database storage: +$50-100/month
- Additional AI API calls: +$100-200/month (follow-ups, complexity adjustment)
- Compute: +$30-50/month
- **Total**: ~$180-350/month

### ROI
- Improved question quality → higher viewer retention
- Reduced prep time for host → time savings
- Better engagement → increased ad revenue
- **Expected payback**: 3-6 months

---

## ✅ Phase 4 Checklist

### Prerequisites
- [ ] Phase 3 deployed to production
- [ ] Baseline metrics collected (1 week of Phase 3 data)
- [ ] Host feedback gathered
- [ ] Analytics integration approved

### Development
- [ ] Database schema reviewed and approved
- [ ] New tables created in Supabase
- [ ] HostProfileManager implemented
- [ ] CrossShowLearning engine implemented
- [ ] TopicCluster system implemented
- [ ] EngagementTracker implemented
- [ ] FollowUpChainGenerator implemented
- [ ] AdaptiveComplexity system implemented

### Testing
- [ ] Unit tests written (80%+ coverage)
- [ ] Integration tests passing
- [ ] A/B test framework set up
- [ ] Performance benchmarks met
- [ ] Security audit completed

### Deployment
- [ ] Staged rollout plan created
- [ ] Monitoring dashboards updated
- [ ] Documentation completed
- [ ] Team training completed
- [ ] Production deployment successful

---

**Prepared by**: Claude (Anthropic)
**Date**: October 19, 2025
**Version**: 1.0 (Planning)
**Status**: Ready for Review & Approval
