/**
 * VotingEngine Integration Tests with Context Memory (Phase 3)
 *
 * Tests the integration between VotingEngine and ContextMemoryManager
 * to ensure proper filtering, penalization, and boosting of questions
 * based on context memory and temporal decay.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { VotingEngine } from '../../lib/ai/VotingEngine'
import { ContextMemoryManager } from '../../lib/ai/ContextMemoryManager'
import { VotingConfig, ContextMemoryConfig, DEFAULT_CONTEXT_MEMORY_CONFIG } from '../../lib/ai/types'
import { GeneratedQuestion } from '../../hooks/useProducerAI'

// Mock the semantic similarity module
vi.mock('../../lib/ai/SemanticSimilarity', () => ({
  getEmbedding: vi.fn((text: string) => {
    // Mock embedding: convert text to a simple array based on text content
    // Same text = same embedding, different text = different embedding
    const hash = text.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
    return Promise.resolve(Array(1536).fill(hash / 10000))
  }),
  getBatchEmbeddings: vi.fn((texts: string[]) => {
    // Mock batch embeddings
    return Promise.resolve(texts.map(text => {
      const hash = text.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
      return Array(1536).fill(hash / 10000)
    }))
  }),
  cosineSimilarity: vi.fn((a: number[], b: number[]) => {
    // Mock similarity: if arrays are identical, return 1.0, otherwise calculate simple difference
    const aSum = a.reduce((sum, val) => sum + val, 0)
    const bSum = b.reduce((sum, val) => sum + val, 0)
    const diff = Math.abs(aSum - bSum)
    // Return high similarity if difference is small
    if (diff < 0.1) return 0.95 // Almost identical
    if (diff < 1.0) return 0.75 // Moderately similar
    if (diff < 5.0) return 0.50 // Somewhat similar
    return 0.30 // Different
  })
}))

describe('VotingEngine Integration with Context Memory', () => {
  let votingConfig: VotingConfig
  let contextMemoryConfig: ContextMemoryConfig
  let contextMemory: ContextMemoryManager
  let votingEngine: VotingEngine
  let mockSupabase: any

  beforeEach(async () => {
    // Create mock Supabase client with proper query chain
    mockSupabase = {
      from: vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            order: vi.fn(() => ({
              limit: vi.fn(() => Promise.resolve({ data: [], error: null }))
            }))
          }))
        })),
        insert: vi.fn(() => Promise.resolve({ data: null, error: null })),
      })),
    }

    // Setup voting config
    votingConfig = {
      similarity_threshold: 0.85,
      min_votes_required: 2,
      quality_weight: 0.6,
      diversity_weight: 0.2,
      novelty_weight: 0.2,
    }

    // Setup context memory config
    contextMemoryConfig = {
      ...DEFAULT_CONTEXT_MEMORY_CONFIG,
      maxCacheSize: 100,
      similarityThreshold: 0.80,
      penaltyThreshold: 0.70,
      boostThreshold: 0.60,
      temporalDecayHalfLife: 30,
      persistenceInterval: 300000,
    }

    // Initialize context memory with mock Supabase
    contextMemory = new ContextMemoryManager(mockSupabase, contextMemoryConfig)
    await contextMemory.initializeForShow('test-show-001')

    // Initialize voting engine with context memory
    votingEngine = new VotingEngine(votingConfig, contextMemory)
  })

  describe('Question Filtering Based on Context Memory', () => {
    it('should filter out highly similar questions (>80% similarity)', async () => {
      // Add a question to context memory
      await contextMemory.addQuestion(
        {
          question_text: 'What is the impact of climate change on ocean temperatures?',
          confidence: 0.85,
          reasoning: 'Test',
          follow_ups: [],
        },
        'gpt-4o'
      )

      // Create questions - one very similar, one different
      const questions: Array<GeneratedQuestion & { source_model?: 'gpt-4o' | 'claude' | 'gemini' }> = [
        {
          question_text: 'What is the impact of climate change on ocean temperatures?', // Nearly identical
          confidence: 0.80,
          reasoning: 'Test',
          follow_ups: [],
          source_model: 'claude',
        },
        {
          question_text: 'How do renewable energy sources compare in cost to fossil fuels?', // Different topic
          confidence: 0.85,
          reasoning: 'Test',
          follow_ups: [],
          source_model: 'gemini',
        },
      ]

      const ranked = await votingEngine.rankQuestions(questions)

      // Should filter out the similar question, keeping only the novel one
      expect(ranked.length).toBeLessThanOrEqual(1)

      // The remaining question should be the different one
      if (ranked.length > 0) {
        expect(ranked[0].question.question_text).toContain('renewable energy')
      }
    })

    it('should penalize moderately similar questions (70-80% similarity)', async () => {
      // Add a question to context memory
      await contextMemory.addQuestion(
        {
          question_text: 'What are the economic impacts of artificial intelligence?',
          confidence: 0.85,
          reasoning: 'Test',
          follow_ups: [],
        },
        'gpt-4o'
      )

      // Create a moderately similar question
      const questions: Array<GeneratedQuestion & { source_model?: 'gpt-4o' | 'claude' | 'gemini' }> = [
        {
          question_text: 'What are the economic effects of AI automation?', // Moderately similar
          confidence: 0.85,
          reasoning: 'Test',
          follow_ups: [],
          source_model: 'claude',
        },
        {
          question_text: 'What is the best programming language for beginners?', // Different
          confidence: 0.80,
          reasoning: 'Test',
          follow_ups: [],
          source_model: 'gemini',
        },
      ]

      const ranked = await votingEngine.rankQuestions(questions)

      // Should include both questions but penalize the similar one
      expect(ranked.length).toBeGreaterThan(0)

      // The novel question should rank higher due to penalty on similar question
      const similarQ = ranked.find(q => q.question.question_text.includes('AI automation'))
      const novelQ = ranked.find(q => q.question.question_text.includes('programming language'))

      if (similarQ && novelQ) {
        // Novel question should have higher novelty score
        expect((novelQ as any).novelty_score).toBeGreaterThan((similarQ as any).novelty_score || 0.5)
      }
    })

    it('should boost novel questions (<60% similarity)', async () => {
      // Add a question to context memory
      await contextMemory.addQuestion(
        {
          question_text: 'What is quantum computing?',
          confidence: 0.85,
          reasoning: 'Test',
          follow_ups: [],
        },
        'gpt-4o'
      )

      // Create a completely different question
      const questions: Array<GeneratedQuestion & { source_model?: 'gpt-4o' | 'claude' | 'gemini' }> = [
        {
          question_text: 'How does photosynthesis work in plants?', // Completely different
          confidence: 0.80,
          reasoning: 'Test',
          follow_ups: [],
          source_model: 'claude',
        },
      ]

      const ranked = await votingEngine.rankQuestions(questions)

      expect(ranked.length).toBeGreaterThan(0)

      // Novel question should have high novelty score
      const noveltyScore = (ranked[0] as any).novelty_score
      expect(noveltyScore).toBeGreaterThan(0.6) // Should be boosted
    })
  })

  describe('Temporal Decay Impact', () => {
    it('should reduce impact of older questions through temporal decay', async () => {
      // Add an old question (simulate 60 minutes ago)
      const oldTimestamp = new Date(Date.now() - 60 * 60 * 1000) // 60 minutes ago

      // Manually create a memory entry with old timestamp
      const oldQuestion = {
        text: 'What is machine learning?',
        embedding: Array(1536).fill(0.5),
        timestamp: oldTimestamp,
        confidence: 0.85,
        sourceModel: 'gpt-4o' as const,
        wasUsed: false,
      }

      // Add to cache manually (simulating old question)
      contextMemory['cache'].push(oldQuestion)

      // Now add a similar recent question
      await contextMemory.addQuestion(
        {
          question_text: 'What is deep learning?', // Related to ML
          confidence: 0.82,
          reasoning: 'Test',
          follow_ups: [],
        },
        'claude'
      )

      // Create a new similar question
      const questions: Array<GeneratedQuestion & { source_model?: 'gpt-4o' | 'claude' | 'gemini' }> = [
        {
          question_text: 'What is machine learning and how does it work?', // Similar to old question
          confidence: 0.85,
          reasoning: 'Test',
          follow_ups: [],
          source_model: 'gemini',
        },
      ]

      const ranked = await votingEngine.rankQuestions(questions)

      // Old question should have minimal impact due to temporal decay
      // Question should NOT be filtered because old question has decayed
      expect(ranked.length).toBeGreaterThan(0)
    })

    it('should significantly penalize questions similar to very recent questions', async () => {
      // Add a very recent question (1 minute ago)
      await contextMemory.addQuestion(
        {
          question_text: 'What is blockchain technology?',
          confidence: 0.90,
          reasoning: 'Test',
          follow_ups: [],
        },
        'gpt-4o'
      )

      // Immediately try to add a similar question
      const questions: Array<GeneratedQuestion & { source_model?: 'gpt-4o' | 'claude' | 'gemini' }> = [
        {
          question_text: 'What is blockchain and how does it work?', // Very similar
          confidence: 0.85,
          reasoning: 'Test',
          follow_ups: [],
          source_model: 'claude',
        },
        {
          question_text: 'What are the best practices for cybersecurity?', // Different
          confidence: 0.80,
          reasoning: 'Test',
          follow_ups: [],
          source_model: 'gemini',
        },
      ]

      const ranked = await votingEngine.rankQuestions(questions)

      // Recent similar question should be filtered or heavily penalized
      const blockchainQ = ranked.find(q => q.question.question_text.includes('blockchain'))
      const cybersecurityQ = ranked.find(q => q.question.question_text.includes('cybersecurity'))

      // Cybersecurity should rank higher or blockchain might be filtered
      if (blockchainQ && cybersecurityQ) {
        expect(cybersecurityQ.final_score).toBeGreaterThanOrEqual(blockchainQ.final_score)
      }
    })
  })

  describe('Final Score Calculation with Novelty', () => {
    it('should incorporate novelty into final score calculation', async () => {
      // Add some questions to context memory
      await contextMemory.addQuestion(
        {
          question_text: 'What is Python?',
          confidence: 0.85,
          reasoning: 'Test',
          follow_ups: [],
        },
        'gpt-4o'
      )
      await contextMemory.addQuestion(
        {
          question_text: 'What is JavaScript?',
          confidence: 0.82,
          reasoning: 'Test',
          follow_ups: [],
        },
        'claude'
      )

      const questions: Array<GeneratedQuestion & { source_model?: 'gpt-4o' | 'claude' | 'gemini' }> = [
        {
          question_text: 'What is Rust programming language?', // Novel
          confidence: 0.85,
          reasoning: 'Test',
          follow_ups: [],
          source_model: 'gemini',
        },
      ]

      const ranked = await votingEngine.rankQuestions(questions)

      expect(ranked.length).toBeGreaterThan(0)

      const result = ranked[0]

      // Final score should include all three components
      expect(result.final_score).toBeDefined()
      expect(result.votes.average).toBeDefined() // Quality
      expect(result.diversity_score).toBeDefined() // Diversity
      expect((result as any).novelty_score).toBeDefined() // Novelty

      // Final score should be weighted average: (quality × 0.6) + (diversity × 0.2) + (novelty × 0.2)
      const expectedScore =
        (result.votes.average * 0.6) +
        (result.diversity_score * 0.2) +
        ((result as any).novelty_score * 0.2)

      expect(result.final_score).toBeCloseTo(expectedScore, 2)
    })

    it('should prioritize high-novelty questions when quality is similar', async () => {
      // Add a question to memory
      await contextMemory.addQuestion(
        {
          question_text: 'What are the benefits of exercise?',
          confidence: 0.85,
          reasoning: 'Test',
          follow_ups: [],
        },
        'gpt-4o'
      )

      const questions: Array<GeneratedQuestion & { source_model?: 'gpt-4o' | 'claude' | 'gemini' }> = [
        {
          question_text: 'What are the health benefits of regular exercise?', // Similar to memory
          confidence: 0.85, // Same quality
          reasoning: 'Test',
          follow_ups: [],
          source_model: 'claude',
        },
        {
          question_text: 'What is the role of mitochondria in cellular energy production?', // Novel
          confidence: 0.85, // Same quality
          reasoning: 'Test',
          follow_ups: [],
          source_model: 'gemini',
        },
      ]

      const ranked = await votingEngine.rankQuestions(questions)

      // Novel question should rank higher due to novelty bonus
      expect(ranked.length).toBeGreaterThan(0)

      if (ranked.length === 2) {
        const top = ranked[0]
        // Top question should be the novel one (mitochondria)
        expect(top.question.question_text).toContain('mitochondria')
      } else if (ranked.length === 1) {
        // Similar question might have been filtered
        expect(ranked[0].question.question_text).toContain('mitochondria')
      }
    })
  })

  describe('Batch Processing with Context Memory', () => {
    it('should maintain context memory across multiple ranking calls', async () => {
      // First batch
      const batch1: Array<GeneratedQuestion & { source_model?: 'gpt-4o' | 'claude' | 'gemini' }> = [
        {
          question_text: 'What is the speed of light?',
          confidence: 0.85,
          reasoning: 'Test',
          follow_ups: [],
          source_model: 'gpt-4o',
        },
      ]

      const ranked1 = await votingEngine.rankQuestions(batch1)
      expect(ranked1.length).toBeGreaterThan(0)

      // Add ranked questions to context memory
      for (const vq of ranked1) {
        await contextMemory.addQuestion(
          {
            question_text: vq.question.question_text,
            confidence: vq.question.confidence || 0.70,
            reasoning: vq.question.reasoning || 'Test',
            follow_ups: vq.question.follow_ups || [],
          },
          vq.sourceModel
        )
      }

      // Second batch with similar question
      const batch2: Array<GeneratedQuestion & { source_model?: 'gpt-4o' | 'claude' | 'gemini' }> = [
        {
          question_text: 'What is the speed of light in a vacuum?', // Similar to batch 1
          confidence: 0.85,
          reasoning: 'Test',
          follow_ups: [],
          source_model: 'claude',
        },
        {
          question_text: 'How do black holes form?', // Different
          confidence: 0.85,
          reasoning: 'Test',
          follow_ups: [],
          source_model: 'gemini',
        },
      ]

      const ranked2 = await votingEngine.rankQuestions(batch2)

      // Similar question should be filtered or penalized
      const speedQ = ranked2.find(q => q.question.question_text.includes('speed of light'))
      const blackHoleQ = ranked2.find(q => q.question.question_text.includes('black holes'))

      // Black hole question should be present and rank well
      expect(blackHoleQ).toBeDefined()

      // Speed of light question should be filtered or rank lower
      if (speedQ && blackHoleQ) {
        expect(blackHoleQ.final_score).toBeGreaterThanOrEqual(speedQ.final_score)
      }
    })

    it('should handle empty context memory gracefully', async () => {
      // Create a new voting engine without context memory
      const engineNoMemory = new VotingEngine(votingConfig)

      const questions: Array<GeneratedQuestion & { source_model?: 'gpt-4o' | 'claude' | 'gemini' }> = [
        {
          question_text: 'What is artificial general intelligence?',
          confidence: 0.85,
          reasoning: 'Test',
          follow_ups: [],
          source_model: 'gpt-4o',
        },
      ]

      const ranked = await engineNoMemory.rankQuestions(questions)

      // Should work normally without context memory
      expect(ranked.length).toBeGreaterThan(0)
      expect(ranked[0].question.question_text).toContain('artificial general intelligence')
    })
  })

  describe('Performance and Edge Cases', () => {
    it('should handle large batches of questions efficiently', async () => {
      // Add some questions to context memory
      await contextMemory.addQuestion(
        {
          question_text: 'What is topic A?',
          confidence: 0.85,
          reasoning: 'Test',
          follow_ups: [],
        },
        'gpt-4o'
      )
      await contextMemory.addQuestion(
        {
          question_text: 'What is topic B?',
          confidence: 0.82,
          reasoning: 'Test',
          follow_ups: [],
        },
        'claude'
      )

      // Create a large batch (20 questions)
      const questions: Array<GeneratedQuestion & { source_model?: 'gpt-4o' | 'claude' | 'gemini' }> = []
      for (let i = 0; i < 20; i++) {
        questions.push({
          question_text: `What is topic ${String.fromCharCode(67 + i)}?`, // Topics C through V
          confidence: 0.75 + (i * 0.01),
          reasoning: 'Test',
          follow_ups: [],
          source_model: i % 3 === 0 ? 'gpt-4o' : i % 3 === 1 ? 'claude' : 'gemini',
        })
      }

      const startTime = Date.now()
      const ranked = await votingEngine.rankQuestions(questions)
      const duration = Date.now() - startTime

      // Should process in reasonable time (under 5 seconds for test)
      expect(duration).toBeLessThan(5000)

      // Should return top 5 ranked questions
      expect(ranked.length).toBeLessThanOrEqual(5)

      // All ranked questions should have required fields
      for (const q of ranked) {
        expect(q.final_score).toBeDefined()
        expect(q.votes.average).toBeDefined()
        expect(q.diversity_score).toBeDefined()
      }
    })

    it('should handle questions with missing confidence scores', async () => {
      const questions: Array<GeneratedQuestion & { source_model?: 'gpt-4o' | 'claude' | 'gemini' }> = [
        {
          question_text: 'What is the meaning of life?',
          confidence: undefined as any, // Missing confidence
          reasoning: 'Test',
          follow_ups: [],
          source_model: 'gpt-4o',
        },
      ]

      const ranked = await votingEngine.rankQuestions(questions)

      // Should handle gracefully with default confidence
      expect(ranked.length).toBeGreaterThan(0)
      expect(ranked[0].votes.average).toBeDefined()
    })
  })
})
