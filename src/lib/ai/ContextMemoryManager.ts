/**
 * Context Memory Manager
 * Phase 3 - Prevents question repetition across analyses
 *
 * Maintains an in-memory cache of recent questions and persists to Supabase
 * for long-term storage. Uses semantic similarity to detect duplicates and
 * temporal decay to reduce impact of old questions.
 */

import { SupabaseClient } from '@supabase/supabase-js';
import { GeneratedQuestion } from '../../hooks/useProducerAI';
import {
  ContextMemoryConfig,
  ContextMemoryCache,
  QuestionHistoryItem,
  SimilarityCheckResult,
  NoveltyScore,
  AIModel,
  DEFAULT_CONTEXT_MEMORY_CONFIG
} from './types';
import { getEmbedding, getBatchEmbeddings, cosineSimilarity } from './SemanticSimilarity';

export class ContextMemoryManager {
  private cache: ContextMemoryCache;
  private config: ContextMemoryConfig;
  private supabase: SupabaseClient | null;
  private persistenceTimer: NodeJS.Timeout | null = null;

  constructor(supabase: SupabaseClient | null, config: ContextMemoryConfig = DEFAULT_CONTEXT_MEMORY_CONFIG) {
    this.config = config;
    this.supabase = supabase;
    this.cache = {
      showId: '',
      questions: [],
      maxSize: config.maxCacheSize,
      createdAt: new Date()
    };
  }

  /**
   * Initialize context memory for a new show
   * Loads recent questions from database if available
   */
  async initializeForShow(showId: string): Promise<void> {
    console.log(`📚 Context Memory: Initializing for show ${showId}`);

    this.cache = {
      showId,
      questions: [],
      maxSize: this.config.maxCacheSize,
      createdAt: new Date()
    };

    // Load recent questions from database if persistence enabled
    if (this.config.persistToDatabase && this.supabase) {
      try {
        await this.loadFromDatabase(showId);
      } catch (error) {
        console.error('❌ Failed to load question history from database:', error);
      }
    }

    // Start periodic persistence (every 5 minutes)
    if (this.config.persistToDatabase && this.supabase) {
      this.startPeriodicPersistence();
    }

    console.log(`✅ Context Memory: Initialized with ${this.cache.questions.length} historical questions`);
  }

  /**
   * Load questions from database for current show
   */
  private async loadFromDatabase(showId: string): Promise<void> {
    if (!this.supabase) return;

    const { data, error } = await this.supabase
      .from('question_history')
      .select('*')
      .eq('show_id', showId)
      .order('timestamp', { ascending: false })
      .limit(this.config.maxCacheSize);

    if (error) {
      console.error('Database load error:', error);
      return;
    }

    if (data && data.length > 0) {
      this.cache.questions = data.map(row => ({
        id: row.id,
        text: row.question_text,
        embedding: row.embedding,
        timestamp: new Date(row.timestamp),
        confidence: row.confidence,
        sourceModel: row.source_model,
        wasUsed: row.was_used,
        showId: row.show_id,
        topicTags: row.topic_tags
      }));

      console.log(`📥 Loaded ${data.length} questions from database`);
    }
  }

  /**
   * Add a question to context memory
   */
  async addQuestion(question: GeneratedQuestion, sourceModel: AIModel = 'gpt-4o'): Promise<void> {
    if (!this.config.enabled) return;

    // Get embedding for the question
    const embedding = await getEmbedding(question.question_text);

    const historyItem: QuestionHistoryItem = {
      text: question.question_text,
      embedding,
      timestamp: new Date(),
      confidence: question.confidence,
      sourceModel,
      wasUsed: false,
      showId: this.cache.showId,
      topicTags: []
    };

    // Add to cache
    this.cache.questions.push(historyItem);

    // Enforce max size (FIFO - remove oldest)
    if (this.cache.questions.length > this.config.maxCacheSize) {
      const removed = this.cache.questions.shift();
      console.log(`🗑️  Context Memory: Removed oldest question (cache full)`);
    }

    console.log(`➕ Context Memory: Added question "${question.question_text.slice(0, 50)}..."`);
  }

  /**
   * Check if a question is similar to any in history
   * Returns detailed similarity information
   */
  async checkSimilarity(questionText: string, embedding?: number[]): Promise<SimilarityCheckResult> {
    if (!this.config.enabled || this.cache.questions.length === 0) {
      return {
        isSimilar: false,
        mostSimilarQuestion: null,
        similarity: 0,
        timeAgo: 0,
        shouldFilter: false,
        shouldPenalize: false,
        shouldBoost: false
      };
    }

    // Get embedding if not provided
    const questionEmbedding = embedding || await getEmbedding(questionText);

    let maxSimilarity = 0;
    let mostSimilarQuestion: string | null = null;
    let mostSimilarTimestamp: Date | null = null;

    const now = new Date();

    // Check against all questions in cache
    for (const historyItem of this.cache.questions) {
      const similarity = cosineSimilarity(questionEmbedding, historyItem.embedding);

      // Apply temporal decay
      const ageMinutes = (now.getTime() - historyItem.timestamp.getTime()) / 60000;
      const decayFactor = Math.exp(-ageMinutes / this.config.temporalDecayHalfLife);
      const effectiveSimilarity = similarity * decayFactor;

      if (effectiveSimilarity > maxSimilarity) {
        maxSimilarity = effectiveSimilarity;
        mostSimilarQuestion = historyItem.text;
        mostSimilarTimestamp = historyItem.timestamp;
      }
    }

    const timeAgo = mostSimilarTimestamp
      ? (now.getTime() - mostSimilarTimestamp.getTime()) / 60000
      : 0;

    // Determine action based on similarity
    const shouldFilter = maxSimilarity >= this.config.similarityThreshold;
    const shouldPenalize = !shouldFilter && maxSimilarity >= this.config.penaltySimilarityThreshold;
    const shouldBoost = maxSimilarity < this.config.noveltyBoostThreshold;

    if (shouldFilter) {
      console.log(`🚫 Context Memory: Question too similar (${(maxSimilarity * 100).toFixed(0)}%) - FILTER`);
    } else if (shouldPenalize) {
      console.log(`⚠️  Context Memory: Question somewhat similar (${(maxSimilarity * 100).toFixed(0)}%) - PENALIZE`);
    } else if (shouldBoost) {
      console.log(`✨ Context Memory: Novel question (${(maxSimilarity * 100).toFixed(0)}% similarity) - BOOST`);
    }

    return {
      isSimilar: maxSimilarity >= this.config.penaltySimilarityThreshold,
      mostSimilarQuestion,
      similarity: maxSimilarity,
      timeAgo,
      shouldFilter,
      shouldPenalize,
      shouldBoost
    };
  }

  /**
   * Calculate novelty score for a question
   * Higher score = more novel/different from history
   */
  async calculateNoveltyScore(questionText: string, embedding?: number[]): Promise<NoveltyScore> {
    if (!this.config.enabled || this.cache.questions.length === 0) {
      return {
        score: 1.0,
        maxSimilarity: 0,
        avgRecentSimilarity: 0,
        explorationBonus: 0,
        temporalDecayFactor: 0
      };
    }

    // Get embedding if not provided
    const questionEmbedding = embedding || await getEmbedding(questionText);

    let maxSimilarity = 0;
    let recentSimilaritySum = 0;
    let recentCount = 0;

    const now = new Date();
    const recentWindowMinutes = 30;

    for (const historyItem of this.cache.questions) {
      const similarity = cosineSimilarity(questionEmbedding, historyItem.embedding);
      const ageMinutes = (now.getTime() - historyItem.timestamp.getTime()) / 60000;

      // Apply temporal decay
      const decayFactor = Math.exp(-ageMinutes / this.config.temporalDecayHalfLife);
      const effectiveSimilarity = similarity * decayFactor;

      maxSimilarity = Math.max(maxSimilarity, effectiveSimilarity);

      // Track recent similarities (last 30 minutes)
      if (ageMinutes < recentWindowMinutes) {
        recentSimilaritySum += similarity;
        recentCount++;
      }
    }

    const avgRecentSimilarity = recentCount > 0 ? recentSimilaritySum / recentCount : 0;

    // Novelty is inverse of similarity
    const baseNovelty = 1 - maxSimilarity;

    // Exploration bonus for completely unexplored angles
    const explorationBonus = avgRecentSimilarity < 0.4 ? 0.1 : 0;

    const finalScore = Math.min(baseNovelty + explorationBonus, 1.0);

    return {
      score: finalScore,
      maxSimilarity,
      avgRecentSimilarity,
      explorationBonus,
      temporalDecayFactor: Math.exp(-1 / this.config.temporalDecayHalfLife)
    };
  }

  /**
   * Get all questions from current show
   */
  getShowHistory(): QuestionHistoryItem[] {
    return [...this.cache.questions];
  }

  /**
   * Get recent questions (last N minutes)
   */
  getRecentQuestions(minutes: number = 30): QuestionHistoryItem[] {
    const now = new Date();
    const cutoff = new Date(now.getTime() - minutes * 60000);

    return this.cache.questions.filter(q => q.timestamp >= cutoff);
  }

  /**
   * Mark a question as used by the host
   */
  async markQuestionAsUsed(questionText: string): Promise<void> {
    const question = this.cache.questions.find(q => q.text === questionText);
    if (question) {
      question.wasUsed = true;

      // Update in database if persistence enabled
      if (this.config.persistToDatabase && this.supabase && question.id) {
        await this.supabase
          .from('question_history')
          .update({ was_used: true })
          .eq('id', question.id);
      }

      console.log(`✓ Context Memory: Marked question as used`);
    }
  }

  /**
   * Clear cache (e.g., when show ends)
   */
  clearCache(): void {
    console.log(`🗑️  Context Memory: Clearing cache (${this.cache.questions.length} questions)`);
    this.cache.questions = [];

    // Stop persistence timer
    if (this.persistenceTimer) {
      clearInterval(this.persistenceTimer);
      this.persistenceTimer = null;
    }
  }

  /**
   * Persist current cache to database
   */
  async persistToDatabase(): Promise<void> {
    if (!this.config.persistToDatabase || !this.supabase || this.cache.questions.length === 0) {
      return;
    }

    try {
      // Filter questions that don't have an ID (not yet persisted)
      const newQuestions = this.cache.questions.filter(q => !q.id);

      if (newQuestions.length === 0) {
        console.log('📤 Context Memory: No new questions to persist');
        return;
      }

      const rows = newQuestions.map(q => ({
        show_id: this.cache.showId,
        question_text: q.text,
        embedding: q.embedding,
        timestamp: q.timestamp.toISOString(),
        confidence: q.confidence,
        source_model: q.sourceModel,
        was_used: q.wasUsed,
        topic_tags: q.topicTags || []
      }));

      const { data, error } = await this.supabase
        .from('question_history')
        .insert(rows)
        .select('id');

      if (error) {
        console.error('❌ Context Memory: Persistence error:', error);
        return;
      }

      // Update cache with IDs from database
      if (data) {
        for (let i = 0; i < newQuestions.length && i < data.length; i++) {
          newQuestions[i].id = data[i].id;
        }
      }

      console.log(`✅ Context Memory: Persisted ${newQuestions.length} questions to database`);
    } catch (error) {
      console.error('❌ Context Memory: Persistence failed:', error);
    }
  }

  /**
   * Start periodic persistence (every 5 minutes)
   */
  private startPeriodicPersistence(): void {
    if (this.persistenceTimer) {
      clearInterval(this.persistenceTimer);
    }

    this.persistenceTimer = setInterval(async () => {
      await this.persistToDatabase();
    }, 5 * 60 * 1000); // 5 minutes

    console.log('⏱️  Context Memory: Periodic persistence started (every 5 minutes)');
  }

  /**
   * Stop periodic persistence and do final flush
   */
  async stopAndPersist(): Promise<void> {
    if (this.persistenceTimer) {
      clearInterval(this.persistenceTimer);
      this.persistenceTimer = null;
    }

    await this.persistToDatabase();
    console.log('✅ Context Memory: Final persistence complete');
  }

  /**
   * Get cache statistics
   */
  getCacheStats() {
    const now = new Date();
    const recentQuestions = this.cache.questions.filter(
      q => (now.getTime() - q.timestamp.getTime()) / 60000 < 30
    );

    return {
      totalQuestions: this.cache.questions.length,
      recentQuestions: recentQuestions.length,
      showId: this.cache.showId,
      cacheAge: (now.getTime() - this.cache.createdAt.getTime()) / 60000, // minutes
      oldestQuestion: this.cache.questions[0]?.timestamp,
      newestQuestion: this.cache.questions[this.cache.questions.length - 1]?.timestamp
    };
  }
}
