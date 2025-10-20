# Phase 2 Implementation Guide
## Multi-Model Voting for Question Generation

**Timeline:** 2-3 weeks (40-50 hours)
**Status:** Planning
**Prerequisites:** Phase 1 Complete ✅

---

## 📋 Overview

Phase 2 implements **ensemble AI question generation** by using multiple AI models (GPT-4o, Claude, Gemini) to generate and vote on questions, significantly improving quality and diversity.

### Core Concept

```
┌─────────────────────────────────────────────────────────┐
│              PRODUCER AI (Enhanced)                     │
│                                                         │
│  ┌──────────────────────────────────────────────────┐  │
│  │  INPUT: Recent Transcript                        │  │
│  └──────────────────────────────────────────────────┘  │
│                          │                              │
│                          ▼                              │
│  ┌──────────────────────────────────────────────────┐  │
│  │  PARALLEL MODEL GENERATION                       │  │
│  │                                                  │  │
│  │  ┌─────────┐  ┌─────────┐  ┌─────────┐          │  │
│  │  │ GPT-4o  │  │ Claude  │  │ Gemini  │          │  │
│  │  │ 3 Qs    │  │ 3 Qs    │  │ 3 Qs    │          │  │
│  │  └────┬────┘  └────┬────┘  └────┬────┘          │  │
│  │       │            │            │                │  │
│  └───────┼────────────┼────────────┼────────────────┘  │
│          │            │            │                    │
│          └────────────┴────────────┘                    │
│                       ▼                                 │
│  ┌──────────────────────────────────────────────────┐  │
│  │  VOTING & RANKING ENGINE                        │  │
│  │  - Semantic similarity detection (dedupe)       │  │
│  │  - Quality scoring (ensemble)                   │  │
│  │  - Diversity calculation                        │  │
│  │  - Final ranking                                │  │
│  └──────────────────────────────────────────────────┘  │
│                          │                              │
│                          ▼                              │
│  ┌──────────────────────────────────────────────────┐  │
│  │  OUTPUT: Top 3-5 Questions                       │  │
│  │  - High quality (voted by 3 models)              │  │
│  │  - High diversity (different angles)             │  │
│  │  - Deduped (no similar questions)                │  │
│  └──────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

---

## 🎯 Expected Impact

| Metric | Phase 1 | Phase 2 (Target) | Improvement |
|--------|---------|------------------|-------------|
| **Question Quality** | +25% | +40% | Additional +15% |
| **Question Diversity** | Baseline | +35% | New dimension |
| **Redundancy** | 20% overlap | 5% overlap | -75% duplicates |
| **Model Bias Reduction** | N/A | 60% less bias | Cross-model validation |
| **Operator Confidence** | 80% | 90% | +10 points |
| **Cost per Question** | $0.02 | $0.05 | +150% (worth it) |

**Key Benefits:**
- **Higher Quality:** Best questions from 3 models, not just 1
- **More Diversity:** Different AI perspectives reduce groupthink
- **Bias Reduction:** No single model's quirks dominate
- **Confidence:** Voted questions are statistically better

---

## 📊 Task Breakdown

### Task 2.1: Multi-Model Infrastructure ⏱️ 12 hours
**Priority:** P0 - Foundation for all Phase 2 work
**Status:** ⚪ Pending

**What We're Building:**
- Anthropic Claude SDK integration
- Google Gemini API integration
- Parallel question generation from 3 models
- Error handling and fallbacks
- Cost tracking per model

**Subtasks:**
- [ ] Install Anthropic SDK (`npm install @anthropic-ai/sdk`)
- [ ] Install Google Generative AI SDK (`npm install @google/generative-ai`)
- [ ] Create `MultiModelQuestionGenerator` class
- [ ] Implement parallel generation with Promise.allSettled
- [ ] Add model-specific error handling
- [ ] Create cost tracking system
- [ ] Add per-model configuration (temperature, max_tokens, etc.)
- [ ] Test with all 3 models individually
- [ ] Test parallel generation
- [ ] Document API usage and costs

**Files to Create/Modify:**
- `/src/lib/ai/MultiModelQuestionGenerator.ts` (NEW - 300 lines)
- `/src/hooks/useProducerAI.ts` (integrate multi-model generation)
- `/src/lib/ai/types.ts` (NEW - model-specific types)
- `/package.json` (add new dependencies)

---

### Task 2.2: Voting & Ranking Engine ⏱️ 16 hours
**Priority:** P0 - Core algorithm
**Status:** ⚪ Pending

**What We're Building:**
- Semantic similarity detection (dedupe similar questions)
- Cross-model quality voting
- Diversity scoring
- Final ranking algorithm

**Subtasks:**
- [ ] Implement semantic similarity using embeddings
- [ ] Create deduplication algorithm (threshold-based)
- [ ] Implement cross-model voting (each model scores others' questions)
- [ ] Calculate diversity score (topic coverage)
- [ ] Create final ranking function (weighted combination)
- [ ] Add configurable weights (quality vs diversity)
- [ ] Test with sample question sets
- [ ] Optimize performance (parallel processing)
- [ ] Add logging for voting decisions
- [ ] Document algorithm behavior

**Files to Create/Modify:**
- `/src/lib/ai/VotingEngine.ts` (NEW - 400 lines)
- `/src/lib/ai/SemanticSimilarity.ts` (NEW - 150 lines)
- `/src/lib/ai/DiversityScorer.ts` (NEW - 200 lines)
- `/src/hooks/useProducerAI.ts` (integrate voting)

**Algorithm Design:**

```typescript
interface VotedQuestion {
  question: GeneratedQuestion
  sourceModel: 'gpt-4o' | 'claude' | 'gemini'
  votes: {
    gpt4o_score: number
    claude_score: number
    gemini_score: number
    average: number
  }
  diversity_score: number
  final_score: number
  similar_to: string[] // IDs of similar questions (deduped)
}

function rankQuestions(
  allQuestions: GeneratedQuestion[],
  config: { quality_weight: 0.7, diversity_weight: 0.3 }
): VotedQuestion[] {
  // 1. Deduplicate similar questions
  const deduped = deduplicateQuestions(allQuestions)

  // 2. Cross-model voting
  const voted = await crossModelVote(deduped)

  // 3. Calculate diversity
  const withDiversity = calculateDiversity(voted)

  // 4. Final ranking
  const ranked = withDiversity.map(q => ({
    ...q,
    final_score: (q.votes.average * config.quality_weight) +
                 (q.diversity_score * config.diversity_weight)
  })).sort((a, b) => b.final_score - a.final_score)

  return ranked.slice(0, 5) // Top 5
}
```

---

### Task 2.3: UI Enhancements for Multi-Model Display ⏱️ 10 hours
**Priority:** P1 - User visibility
**Status:** ⚪ Pending

**What We're Building:**
- Display questions from all 3 models (before voting)
- Show voting scores and rankings
- Visual indicators for model source
- Diversity metrics display
- Cost breakdown by model

**Subtasks:**
- [ ] Create `MultiModelQuestionDisplay` component
- [ ] Add model source badges (GPT-4o, Claude, Gemini)
- [ ] Display voting scores with visual bars
- [ ] Show similarity clusters (deduped questions)
- [ ] Add diversity score visualization
- [ ] Create cost tracking panel
- [ ] Add toggle to show/hide raw model outputs
- [ ] Test UI with sample data
- [ ] Ensure responsive design
- [ ] Add loading states for parallel generation

**Files to Create/Modify:**
- `/src/components/MultiModelQuestionDisplay.tsx` (NEW - 250 lines)
- `/src/components/ProducerAIPanel.tsx` (integrate multi-model UI)
- `/src/components/ModelCostPanel.tsx` (NEW - 150 lines)

**UI Mockup:**

```
┌─────────────────────────────────────────────────────────┐
│ Producer AI (AUTO) - Multi-Model Enhanced              │
│ ────────────────────────────────────────────            │
│                                                         │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ 🎯 Multi-Model Question Generation                  │ │
│ │                                                     │ │
│ │ ✅ GPT-4o: 3 questions generated (0.5s)             │ │
│ │ ✅ Claude: 3 questions generated (0.7s)             │ │
│ │ ✅ Gemini: 3 questions generated (0.4s)             │ │
│ │                                                     │ │
│ │ 🗳️ Voting Complete: 7 unique questions (2 deduped) │ │
│ └─────────────────────────────────────────────────────┘ │
│                                                         │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ 🏆 Top Ranked Questions                             │ │
│ │                                                     │ │
│ │ 1. "How do we balance innovation speed with..."    │ │
│ │    [GPT-4o] Quality: ████████░░ 85%                 │ │
│ │    Diversity: ███████░░░ 72% | Final: 81%          │ │
│ │                                                     │ │
│ │ 2. "What historical parallels exist between..."    │ │
│ │    [Claude] Quality: ████████░░ 82%                 │ │
│ │    Diversity: ████████░░ 88% | Final: 84%          │ │
│ │                                                     │ │
│ │ 3. "If we assume AI consciousness is possible..."  │ │
│ │    [Gemini] Quality: ███████░░░ 78%                 │ │
│ │    Diversity: █████████░ 91% | Final: 82%          │ │
│ └─────────────────────────────────────────────────────┘ │
│                                                         │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ 💰 Cost Breakdown                                   │ │
│ │ GPT-4o: $0.018 | Claude: $0.022 | Gemini: $0.012   │ │
│ │ Total: $0.052 per analysis                          │ │
│ └─────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
```

---

### Task 2.4: Performance Optimization & Caching ⏱️ 8 hours
**Priority:** P2 - Nice to have
**Status:** ⚪ Pending

**What We're Building:**
- Response caching for similar transcripts
- Embedding caching for similarity detection
- Parallel API call optimization
- Rate limiting and backoff strategies

**Subtasks:**
- [ ] Implement LRU cache for embeddings
- [ ] Add transcript fingerprinting (hash-based)
- [ ] Cache voting results for similar question sets
- [ ] Optimize parallel API calls (connection pooling)
- [ ] Add rate limiting with exponential backoff
- [ ] Implement request queue for API limits
- [ ] Test cache hit rates
- [ ] Measure performance improvements
- [ ] Document caching strategy
- [ ] Add cache statistics to UI

**Files to Create/Modify:**
- `/src/lib/cache/QuestionCache.ts` (NEW - 200 lines)
- `/src/lib/cache/EmbeddingCache.ts` (NEW - 150 lines)
- `/src/lib/ai/RateLimiter.ts` (NEW - 100 lines)

---

### Task 2.5: Testing & Quality Assurance ⏱️ 6 hours
**Priority:** P1 - Must have
**Status:** ⚪ Pending

**What We're Testing:**
- Multi-model generation accuracy
- Voting algorithm fairness
- Deduplication effectiveness
- Performance under load
- Error handling and fallbacks

**Subtasks:**
- [ ] Create test transcript dataset (20+ examples)
- [ ] Test each model individually
- [ ] Test parallel generation
- [ ] Validate voting scores are reasonable
- [ ] Test deduplication threshold tuning
- [ ] Measure diversity improvements
- [ ] Test error scenarios (API failures)
- [ ] Load test (50 concurrent requests)
- [ ] Compare Phase 2 vs Phase 1 quality
- [ ] Document test results

**Files to Create:**
- `/src/lib/ai/__tests__/MultiModelGenerator.test.ts` (NEW)
- `/src/lib/ai/__tests__/VotingEngine.test.ts` (NEW)
- `/src/lib/ai/__tests__/SemanticSimilarity.test.ts` (NEW)
- `/tests/phase2/integration.test.ts` (NEW)

---

## 🛠️ Technical Design

### 1. Multi-Model Question Generator

```typescript
// /src/lib/ai/MultiModelQuestionGenerator.ts

import Anthropic from '@anthropic-ai/sdk'
import { GoogleGenerativeAI } from '@google/generative-ai'
import OpenAI from 'openai'

export interface ModelConfig {
  enabled: boolean
  temperature: number
  max_tokens: number
  timeout: number
}

export interface MultiModelConfig {
  gpt4o: ModelConfig
  claude: ModelConfig
  gemini: ModelConfig
  parallel: boolean
  fallback_on_error: boolean
}

export class MultiModelQuestionGenerator {
  private openai: OpenAI
  private anthropic: Anthropic
  private gemini: GoogleGenerativeAI
  private config: MultiModelConfig

  constructor(config: MultiModelConfig, apiKeys: {
    openai: string
    anthropic: string
    gemini: string
  }) {
    this.openai = new OpenAI({ apiKey: apiKeys.openai })
    this.anthropic = new Anthropic({ apiKey: apiKeys.anthropic })
    this.gemini = new GoogleGenerativeAI(apiKeys.gemini)
    this.config = config
  }

  async generateQuestions(transcript: string): Promise<{
    gpt4o: GeneratedQuestion[]
    claude: GeneratedQuestion[]
    gemini: GeneratedQuestion[]
    costs: { gpt4o: number; claude: number; gemini: number }
    timing: { gpt4o: number; claude: number; gemini: number }
  }> {
    const startTime = Date.now()

    // Generate from all models in parallel
    const results = await Promise.allSettled([
      this.generateWithGPT4o(transcript),
      this.generateWithClaude(transcript),
      this.generateWithGemini(transcript)
    ])

    // Process results and handle errors
    const [gpt4oResult, claudeResult, geminiResult] = results

    return {
      gpt4o: gpt4oResult.status === 'fulfilled' ? gpt4oResult.value.questions : [],
      claude: claudeResult.status === 'fulfilled' ? claudeResult.value.questions : [],
      gemini: geminiResult.status === 'fulfilled' ? geminiResult.value.questions : [],
      costs: {
        gpt4o: gpt4oResult.status === 'fulfilled' ? gpt4oResult.value.cost : 0,
        claude: claudeResult.status === 'fulfilled' ? claudeResult.value.cost : 0,
        gemini: geminiResult.status === 'fulfilled' ? geminiResult.value.cost : 0
      },
      timing: {
        gpt4o: gpt4oResult.status === 'fulfilled' ? gpt4oResult.value.timing : 0,
        claude: claudeResult.status === 'fulfilled' ? claudeResult.value.timing : 0,
        gemini: geminiResult.status === 'fulfilled' ? geminiResult.value.timing : 0
      }
    }
  }

  private async generateWithGPT4o(transcript: string): Promise<{
    questions: GeneratedQuestion[]
    cost: number
    timing: number
  }> {
    const start = Date.now()

    const response = await this.openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: PRODUCER_AI_SYSTEM_PROMPT },
        { role: 'user', content: transcript }
      ],
      temperature: this.config.gpt4o.temperature,
      max_tokens: this.config.gpt4o.max_tokens,
      response_format: { type: 'json_object' }
    })

    const timing = Date.now() - start
    const cost = this.calculateGPT4oCost(response.usage!)
    const analysis = JSON.parse(response.choices[0].message.content!)

    return {
      questions: analysis.questions.map((q: any) => ({
        ...q,
        source_model: 'gpt-4o'
      })),
      cost,
      timing
    }
  }

  private async generateWithClaude(transcript: string): Promise<{
    questions: GeneratedQuestion[]
    cost: number
    timing: number
  }> {
    const start = Date.now()

    const response = await this.anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: this.config.claude.max_tokens,
      temperature: this.config.claude.temperature,
      system: PRODUCER_AI_SYSTEM_PROMPT,
      messages: [
        { role: 'user', content: transcript }
      ]
    })

    const timing = Date.now() - start
    const cost = this.calculateClaudeCost(response.usage)
    const analysis = JSON.parse(response.content[0].text)

    return {
      questions: analysis.questions.map((q: any) => ({
        ...q,
        source_model: 'claude'
      })),
      cost,
      timing
    }
  }

  private async generateWithGemini(transcript: string): Promise<{
    questions: GeneratedQuestion[]
    cost: number
    timing: number
  }> {
    const start = Date.now()
    const model = this.gemini.getGenerativeModel({
      model: 'gemini-2.0-flash-exp',
      generationConfig: {
        temperature: this.config.gemini.temperature,
        maxOutputTokens: this.config.gemini.max_tokens,
        responseMimeType: 'application/json'
      }
    })

    const result = await model.generateContent([
      PRODUCER_AI_SYSTEM_PROMPT,
      transcript
    ])

    const timing = Date.now() - start
    const cost = this.calculateGeminiCost(result.response.usageMetadata!)
    const analysis = JSON.parse(result.response.text())

    return {
      questions: analysis.questions.map((q: any) => ({
        ...q,
        source_model: 'gemini'
      })),
      cost,
      timing
    }
  }

  private calculateGPT4oCost(usage: any): number {
    // GPT-4o pricing: $2.50/1M input tokens, $10.00/1M output tokens
    const inputCost = (usage.prompt_tokens / 1000000) * 2.50
    const outputCost = (usage.completion_tokens / 1000000) * 10.00
    return inputCost + outputCost
  }

  private calculateClaudeCost(usage: any): number {
    // Claude Sonnet pricing: $3.00/1M input tokens, $15.00/1M output tokens
    const inputCost = (usage.input_tokens / 1000000) * 3.00
    const outputCost = (usage.output_tokens / 1000000) * 15.00
    return inputCost + outputCost
  }

  private calculateGeminiCost(usage: any): number {
    // Gemini 2.0 Flash pricing: Free tier (60 RPM limit)
    // For simplicity, assume negligible cost
    return 0.001
  }
}
```

---

### 2. Voting Engine

```typescript
// /src/lib/ai/VotingEngine.ts

import { cosineSimilarity, getEmbedding } from './SemanticSimilarity'

export interface VotingConfig {
  similarity_threshold: number // 0.8 = 80% similar (dedupe)
  quality_weight: number // 0.7
  diversity_weight: number // 0.3
  min_votes_required: number // 2
}

export class VotingEngine {
  private config: VotingConfig
  private multiModelGenerator: MultiModelQuestionGenerator

  constructor(config: VotingConfig, generator: MultiModelQuestionGenerator) {
    this.config = config
    this.multiModelGenerator = generator
  }

  async rankQuestions(
    allQuestions: Array<GeneratedQuestion & { source_model: string }>
  ): Promise<VotedQuestion[]> {
    console.log(`🗳️ Voting on ${allQuestions.length} questions from ${new Set(allQuestions.map(q => q.source_model)).size} models`)

    // Step 1: Deduplicate similar questions
    const deduped = await this.deduplicateQuestions(allQuestions)
    console.log(`✅ After deduplication: ${deduped.length} unique questions`)

    // Step 2: Cross-model voting
    const voted = await this.crossModelVote(deduped)
    console.log(`🎯 Voting complete: average score ${(voted.reduce((sum, q) => sum + q.votes.average, 0) / voted.length).toFixed(2)}`)

    // Step 3: Calculate diversity
    const withDiversity = this.calculateDiversity(voted)
    console.log(`🌈 Diversity calculated: average ${(withDiversity.reduce((sum, q) => sum + q.diversity_score, 0) / withDiversity.length).toFixed(2)}`)

    // Step 4: Final ranking
    const ranked = withDiversity.map(q => ({
      ...q,
      final_score: (q.votes.average * this.config.quality_weight) +
                   (q.diversity_score * this.config.diversity_weight)
    })).sort((a, b) => b.final_score - a.final_score)

    console.log(`🏆 Top question score: ${ranked[0].final_score.toFixed(2)}`)

    return ranked.slice(0, 5) // Top 5
  }

  private async deduplicateQuestions(
    questions: Array<GeneratedQuestion & { source_model: string }>
  ): Promise<Array<GeneratedQuestion & { source_model: string }>> {
    const embeddings = await Promise.all(
      questions.map(q => getEmbedding(q.question_text))
    )

    const unique: Array<GeneratedQuestion & { source_model: string }> = []
    const duplicateIndices = new Set<number>()

    for (let i = 0; i < questions.length; i++) {
      if (duplicateIndices.has(i)) continue

      let isDuplicate = false
      for (let j = 0; j < unique.length; j++) {
        const similarity = cosineSimilarity(
          embeddings[i],
          await getEmbedding(unique[j].question_text)
        )

        if (similarity >= this.config.similarity_threshold) {
          isDuplicate = true
          console.log(`🔗 Deduped: "${questions[i].question_text.slice(0, 50)}..." (${(similarity * 100).toFixed(0)}% similar to existing)`)
          break
        }
      }

      if (!isDuplicate) {
        unique.push(questions[i])
      } else {
        duplicateIndices.add(i)
      }
    }

    return unique
  }

  private async crossModelVote(
    questions: Array<GeneratedQuestion & { source_model: string }>
  ): Promise<VotedQuestion[]> {
    // Each question gets scored by all models (including itself)
    // This is simplified - in production, you'd re-query models to score others' questions

    return questions.map(q => {
      // Simulate cross-model voting (in production, actually query models)
      const baseScore = q.confidence
      const variance = 0.1

      return {
        question: q,
        sourceModel: q.source_model as any,
        votes: {
          gpt4o_score: Math.min(1, Math.max(0, baseScore + (Math.random() - 0.5) * variance)),
          claude_score: Math.min(1, Math.max(0, baseScore + (Math.random() - 0.5) * variance)),
          gemini_score: Math.min(1, Math.max(0, baseScore + (Math.random() - 0.5) * variance)),
          average: baseScore
        },
        diversity_score: 0, // Calculated next
        final_score: 0, // Calculated last
        similar_to: []
      }
    })
  }

  private calculateDiversity(voted: VotedQuestion[]): VotedQuestion[] {
    // Diversity score based on:
    // 1. Topic uniqueness (how different from other questions)
    // 2. Angle coverage (different perspectives)

    return voted.map((q, i) => {
      let diversitySum = 0
      let comparisons = 0

      for (let j = 0; j < voted.length; j++) {
        if (i === j) continue

        // Simple word overlap diversity (in production, use embeddings)
        const q1Words = new Set(q.question.question_text.toLowerCase().split(/\s+/))
        const q2Words = new Set(voted[j].question.question_text.toLowerCase().split(/\s+/))
        const intersection = new Set([...q1Words].filter(w => q2Words.has(w)))
        const union = new Set([...q1Words, ...q2Words])
        const overlap = intersection.size / union.size

        diversitySum += (1 - overlap)
        comparisons++
      }

      return {
        ...q,
        diversity_score: comparisons > 0 ? diversitySum / comparisons : 0.5
      }
    })
  }
}
```

---

### 3. Semantic Similarity (Deduplication)

```typescript
// /src/lib/ai/SemanticSimilarity.ts

import OpenAI from 'openai'

let cachedEmbeddings = new Map<string, number[]>()

export async function getEmbedding(text: string): Promise<number[]> {
  // Check cache first
  if (cachedEmbeddings.has(text)) {
    return cachedEmbeddings.get(text)!
  }

  const openai = new OpenAI({ apiKey: process.env.VITE_OPENAI_API_KEY! })

  const response = await openai.embeddings.create({
    model: 'text-embedding-3-small',
    input: text
  })

  const embedding = response.data[0].embedding

  // Cache it (limit cache size to 1000 entries)
  if (cachedEmbeddings.size > 1000) {
    const firstKey = cachedEmbeddings.keys().next().value
    cachedEmbeddings.delete(firstKey)
  }
  cachedEmbeddings.set(text, embedding)

  return embedding
}

export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) {
    throw new Error('Vectors must have same length')
  }

  let dotProduct = 0
  let normA = 0
  let normB = 0

  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i]
    normA += a[i] * a[i]
    normB += b[i] * b[i]
  }

  const similarity = dotProduct / (Math.sqrt(normA) * Math.sqrt(normB))
  return similarity
}

export function clearEmbeddingCache() {
  cachedEmbeddings.clear()
}
```

---

## 🧪 Testing Strategy

### Phase 2 Test Scenarios

**Scenario 1: Quality Improvement**
```sql
-- Test transcript
INSERT INTO betabot_conversation_log (transcript_text, speaker_type, created_at)
VALUES
('The interesting thing about quantum computing is that it leverages superposition to perform calculations that classical computers cannot efficiently solve.', 'guest', NOW() - INTERVAL '2 minutes'),
('Right, but I wonder if we''re overselling the practical applications. Most businesses won''t need quantum computers for decades.', 'host', NOW() - INTERVAL '1.5 minutes'),
('That''s fair, though cryptography is already a concern. Quantum computers could break current encryption within years, not decades.', 'guest', NOW() - INTERVAL '1 minute');
```

**Expected:**
- All 3 models generate 3 questions each (9 total)
- 1-2 duplicates detected and removed
- Top 3-5 questions have average confidence > 0.75
- Diversity score > 0.6
- At least 2 different model sources in top 3

---

**Scenario 2: Diversity Testing**
```sql
-- Philosophical discussion
INSERT INTO betabot_conversation_log (transcript_text, speaker_type, created_at)
VALUES
('I think consciousness is fundamentally an emergent property of complex information processing.', 'guest', NOW() - INTERVAL '3 minutes'),
('But emergence doesn''t explain the subjective experience, the "what it''s like" to be conscious.', 'host', NOW() - INTERVAL '2 minutes'),
('True, panpsychism might offer a better explanation, though it raises other problems.', 'guest', NOW() - INTERVAL '1 minute');
```

**Expected:**
- Questions explore different philosophical angles (emergence, phenomenology, panpsychism)
- Diversity score > 0.7
- No two questions about exactly the same sub-topic

---

**Scenario 3: Error Handling**
```typescript
// Test with one model failing
test('Handles model failure gracefully', async () => {
  // Mock Claude to throw error
  mockClaude.messages.create.mockRejectedValue(new Error('API timeout'))

  const result = await multiModelGenerator.generateQuestions(transcript)

  // Should still have questions from GPT-4o and Gemini
  expect(result.gpt4o.length).toBeGreaterThan(0)
  expect(result.gemini.length).toBeGreaterThan(0)
  expect(result.claude.length).toBe(0)

  // Voting should still work with 2 models
  const ranked = await votingEngine.rankQuestions([
    ...result.gpt4o,
    ...result.gemini
  ])

  expect(ranked.length).toBeGreaterThan(0)
})
```

---

## 📊 Success Criteria

### Quantitative Metrics

- [ ] Question quality (manual rating): +15% vs Phase 1
- [ ] Question diversity: 35%+ improvement in topic coverage
- [ ] Deduplication effectiveness: < 5% similar questions in final set
- [ ] Model agreement: Top questions have 70%+ average vote
- [ ] Cost efficiency: < $0.06 per analysis (3 models)
- [ ] Performance: < 3 seconds total generation time (parallel)
- [ ] Error resilience: 95%+ success rate with 1 model failing

### Qualitative Improvements

- [ ] "Questions feel more balanced across different perspectives"
- [ ] "Less repetitive than single-model generation"
- [ ] "Voting scores help me trust the AI's suggestions"
- [ ] "Diversity metrics show coverage of different angles"
- [ ] "Model source transparency is valuable"

---

## 💰 Cost Analysis

### Per-Analysis Costs (Estimated)

| Component | Tokens | Cost |
|-----------|--------|------|
| **GPT-4o** | 250 in + 500 out | $0.0056 |
| **Claude Sonnet** | 250 in + 500 out | $0.0083 |
| **Gemini 2.0 Flash** | 250 in + 500 out | $0.0010 |
| **Embeddings (dedupe)** | 9 questions × 512 tokens | $0.0005 |
| **Total per analysis** | - | **$0.0154** |

### Monthly Costs (24/7 streaming)

- Analyses per day: 720 (1 every 2 minutes)
- Daily cost: $11.09
- Monthly cost: $332.64

**vs Phase 1:**
- Phase 1 monthly: $180
- Phase 2 monthly: $332
- **Increase: $152/month (+85%)**

**ROI Justification:**
- 40% higher quality questions → 40% better show content → higher viewership
- If $152 increase yields 10% viewership boost, ROI is positive
- Reduced operator question-writing time (15 min/show × 30 shows/month = 7.5 hours saved = $375 value)

---

## 🚀 Implementation Timeline

### Week 1: Infrastructure (Days 1-5)
- **Day 1-2:** Install SDKs, create MultiModelQuestionGenerator
- **Day 3:** Implement GPT-4o generation
- **Day 4:** Implement Claude generation
- **Day 5:** Implement Gemini generation + parallel execution

### Week 2: Voting & Ranking (Days 6-10)
- **Day 6-7:** Build VotingEngine core
- **Day 8:** Implement semantic similarity and deduplication
- **Day 9:** Build diversity scoring
- **Day 10:** Integration testing with real transcripts

### Week 3: UI & Polish (Days 11-15)
- **Day 11-12:** Build MultiModelQuestionDisplay UI
- **Day 13:** Add cost tracking and metrics panels
- **Day 14:** Performance optimization and caching
- **Day 15:** Final testing and documentation

---

## 🔄 Integration with Phase 1

Phase 2 builds on top of Phase 1 enhancements:

1. **Chain-of-Thought Prompting** → All 3 models use enhanced prompt
2. **Adaptive Timing** → Triggers multi-model generation at smart intervals
3. **Aspect-Based Sentiment** → Helps guide question diversity scoring

**Backward Compatibility:**
- Phase 2 can be toggled on/off via configuration
- Fallback to single-model (Phase 1) if multi-model fails
- Existing UI continues to work with single-model mode

---

## 📝 Configuration

```typescript
// /src/hooks/useProducerAI.ts - Phase 2 Config

interface ProducerAIConfig {
  // ... existing Phase 1 config ...

  // NEW: Phase 2 Multi-Model Config
  multiModel: {
    enabled: boolean
    models: {
      gpt4o: { enabled: boolean; temperature: number; max_tokens: number }
      claude: { enabled: boolean; temperature: number; max_tokens: number }
      gemini: { enabled: boolean; temperature: number; max_tokens: number }
    }
    voting: {
      similarity_threshold: number // 0.8
      quality_weight: number // 0.7
      diversity_weight: number // 0.3
      min_votes_required: number // 2
    }
    performance: {
      parallel_execution: boolean
      cache_embeddings: boolean
      max_cache_size: number // 1000
    }
    cost_limits: {
      max_cost_per_analysis: number // 0.10
      warn_threshold: number // 0.05
    }
  }
}
```

---

## 🎓 Key Learnings from Phase 1

**Apply to Phase 2:**

1. **Optional Fields Work Well** → All Phase 2 features should be optional
2. **Visual Hierarchy Matters** → Use distinct colors for multi-model UI
3. **Logging is Critical** → Extensive console logging for debugging
4. **Test with Mock Data First** → Build mock multi-model responses
5. **Cost Transparency** → Always show users what they're paying

**Avoid:**
- Long prompts that increase costs unnecessarily
- Synchronous API calls (use parallel)
- Complex UI that overwhelms users
- Missing error handling

---

## 📦 Deliverables

**Code:**
- 8 new files (~1,800 lines)
- 4 modified files (~200 lines)
- Total: ~2,000 lines of production code

**Documentation:**
- PHASE2_TASK1_COMPLETE.md
- PHASE2_TASK2_COMPLETE.md
- PHASE2_TASK3_COMPLETE.md
- PHASE2_TASK4_COMPLETE.md
- PHASE2_TASK5_COMPLETE.md
- PHASE2_COMPLETE.md (executive summary)

**Tests:**
- Unit tests for each component
- Integration tests for full pipeline
- Performance benchmarks
- Cost tracking reports

---

## 🚨 Risks & Mitigation

### Risk 1: API Cost Explosion
**Mitigation:**
- Implement cost limits and warnings
- Cache aggressively
- Allow disabling individual models
- Monitor costs in real-time

### Risk 2: Latency Issues
**Mitigation:**
- Parallel execution (Promise.allSettled)
- Timeout individual models (5s max)
- Fall back to fastest 2 models if needed
- Use streaming responses where possible

### Risk 3: Model Disagreement
**Mitigation:**
- Weighted voting (not simple average)
- Require minimum 2/3 models to agree
- Log disagreement patterns
- Allow manual override

### Risk 4: Deduplication Too Aggressive
**Mitigation:**
- Configurable similarity threshold (0.6-0.9)
- Show deduped questions in UI
- Allow operators to un-dedupe
- Test with diverse question sets

---

**Phase 2 planning complete!**
**Ready to begin implementation after Phase 1 testing.**

*Created: October 19, 2025*
*Status: Planning - Pending Phase 1 validation*
