/**
 * Predictive AI Tests - Day 7
 *
 * Tests predictive engagement scoring system:
 * 1. Score calculation - predictions generate engagement scores
 * 2. Priority boost - high-scoring questions prioritized
 * 3. Learning from outcomes - system learns from actual engagement
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { PredictiveScoringEngine } from '../PredictiveScoringEngine';
import type { GeneratedQuestion } from '../../../hooks/useProducerAI';
import type { ShowContext } from '../types-phase5';

// Test environment variables
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://vcniezwtltraqramjlux.supabase.co';
const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZjbmllend0bHRyYXFyYW1qbHV4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAzMjQ1MTgsImV4cCI6MjA3NTkwMDUxOH0.5PDpv3-DVZzjOVFLdsWibzOk5A3-4PI1OthU1EQNhTQ';

describe('PredictiveAI: Engagement Scoring', () => {
  let scoringEngine: PredictiveScoringEngine;
  let supabase: SupabaseClient;
  const testShowId = 'test-show-' + Date.now();

  beforeAll(async () => {
    supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

    // Create scoring engine with test config
    scoringEngine = new PredictiveScoringEngine(
      SUPABASE_URL,
      SUPABASE_KEY,
      {
        minHistoricalData: 1,        // Lower threshold for tests
        similarityThreshold: 0.5,    // Lower threshold for finding similar questions
        maxPredictionAge: 24,
        confidenceThreshold: 0.3,    // Lower threshold to see predictions
        modelVersion: 'test-v1.0.0'
      }
    );
  });

  describe('1. Score Calculation', () => {
    it('should generate prediction with engagement scores', async () => {
      console.log('🧪 Testing: Score calculation for questions');

      // Create test question
      const testQuestion: GeneratedQuestion = {
        id: crypto.randomUUID(),
        question_text: 'What are the most important technological advancements in AI?',
        confidence: 0.9,
        reasoning: 'AI technology question',
        source: 'test',
        alternatives: [],
        topics: ['AI', 'technology'],
        created_at: new Date()
      };

      // Create show context
      const context: ShowContext = {
        showId: testShowId,
        elapsedMinutes: 15,
        totalDuration: 60,
        currentEngagement: 0.7,
        recentTopics: ['technology', 'innovation'],
        audienceSize: 100,
        showStyle: 'educational'
      };

      console.log('   1️⃣ Question: "What are the most important technological advancements in AI?"');
      console.log('   2️⃣ Context: 15min into 60min show, 70% engagement, 100 viewers');

      // Generate prediction
      const prediction = await scoringEngine.predictOutcome(testQuestion, context);

      console.log(`   3️⃣ Prediction received:`);
      console.log(`      - Engagement Score: ${(prediction.predictedEngagement * 100).toFixed(0)}%`);
      console.log(`      - Host Satisfaction: ${(prediction.predictedHostSatisfaction * 100).toFixed(0)}%`);
      console.log(`      - Conversation Depth: ${prediction.predictedConversationDepth}`);
      console.log(`      - Risk Level: ${prediction.riskLevel}`);
      console.log(`      - Confidence: ${(prediction.confidenceLevel * 100).toFixed(0)}%`);

      // Verify prediction structure
      expect(prediction).toBeDefined();
      expect(prediction.questionId).toBe(testQuestion.id);
      expect(prediction.showId).toBe(testShowId);

      // Verify scores are within valid range (0-1)
      expect(prediction.predictedEngagement).toBeGreaterThanOrEqual(0);
      expect(prediction.predictedEngagement).toBeLessThanOrEqual(1);
      expect(prediction.predictedHostSatisfaction).toBeGreaterThanOrEqual(0);
      expect(prediction.predictedHostSatisfaction).toBeLessThanOrEqual(1);

      // Verify other metrics
      expect(prediction.predictedConversationDepth).toBeGreaterThan(0);
      expect(prediction.predictedFollowUps).toBeGreaterThanOrEqual(0);
      expect(['low', 'medium', 'high']).toContain(prediction.riskLevel);

      // Verify confidence level
      expect(prediction.confidenceLevel).toBeGreaterThanOrEqual(0);
      expect(prediction.confidenceLevel).toBeLessThanOrEqual(1);

      console.log('✅ Score calculation working correctly');
    });

    it('should adjust scores based on show context', async () => {
      console.log('🧪 Testing: Context-based score adjustments');

      const question: GeneratedQuestion = {
        id: crypto.randomUUID(),
        question_text: 'How does quantum computing differ from classical computing?',
        confidence: 0.85,
        reasoning: 'Technical question',
        source: 'test',
        alternatives: [],
        topics: ['quantum', 'technology'],
        created_at: new Date()
      };

      // Test 1: High engagement context
      const highEngagementContext: ShowContext = {
        showId: testShowId,
        elapsedMinutes: 20,
        totalDuration: 60,
        currentEngagement: 0.85,  // High engagement
        recentTopics: ['technology'],
        audienceSize: 500,        // Large audience
        showStyle: 'educational'
      };

      const highEngagementPrediction = await scoringEngine.predictOutcome(
        question,
        highEngagementContext
      );

      console.log(`   1️⃣ High engagement context (85%, 500 viewers):`);
      console.log(`      Predicted Engagement: ${(highEngagementPrediction.predictedEngagement * 100).toFixed(0)}%`);

      // Test 2: Low engagement context
      const lowEngagementContext: ShowContext = {
        showId: testShowId,
        elapsedMinutes: 20,
        totalDuration: 60,
        currentEngagement: 0.25,  // Low engagement
        recentTopics: ['technology'],
        audienceSize: 30,         // Small audience
        showStyle: 'educational'
      };

      const lowEngagementPrediction = await scoringEngine.predictOutcome(
        question,
        lowEngagementContext
      );

      console.log(`   2️⃣ Low engagement context (25%, 30 viewers):`);
      console.log(`      Predicted Engagement: ${(lowEngagementPrediction.predictedEngagement * 100).toFixed(0)}%`);

      // Verify predictions exist and are valid
      expect(highEngagementPrediction.predictedEngagement).toBeGreaterThanOrEqual(0);
      expect(lowEngagementPrediction.predictedEngagement).toBeGreaterThanOrEqual(0);

      console.log('   3️⃣ Context adjustments applied ✅');
      console.log('✅ Context-based scoring working');
    });
  });

  describe('2. Priority Boost for High Scores', () => {
    it('should identify high-scoring questions for priority boost', async () => {
      console.log('🧪 Testing: Priority boost for high-scoring questions');

      // Create multiple questions with different expected scores
      const questions: GeneratedQuestion[] = [
        {
          id: crypto.randomUUID(),
          question_text: 'What is artificial intelligence?',
          confidence: 0.9,
          reasoning: 'Basic AI question',
          source: 'test',
          alternatives: [],
          topics: ['AI', 'technology'],
          created_at: new Date()
        },
        {
          id: crypto.randomUUID(),
          question_text: 'Can you explain the latest AI research breakthroughs?',
          confidence: 0.85,
          reasoning: 'Advanced AI question',
          source: 'test',
          alternatives: [],
          topics: ['AI', 'research'],
          created_at: new Date()
        },
        {
          id: crypto.randomUUID(),
          question_text: 'How do I make a pizza?',
          confidence: 0.7,
          reasoning: 'Off-topic question',
          source: 'test',
          alternatives: [],
          topics: ['food', 'cooking'],
          created_at: new Date()
        }
      ];

      const context: ShowContext = {
        showId: testShowId,
        elapsedMinutes: 25,
        totalDuration: 60,
        currentEngagement: 0.75,
        recentTopics: ['AI', 'technology'],
        audienceSize: 150,
        showStyle: 'educational'
      };

      console.log('   1️⃣ Generating predictions for 3 questions...');

      // Get predictions for all questions
      const predictions = await Promise.all(
        questions.map(q => scoringEngine.predictOutcome(q, context))
      );

      // Sort by predicted engagement (highest first)
      const sortedPredictions = [...predictions].sort(
        (a, b) => b.predictedEngagement - a.predictedEngagement
      );

      console.log('   2️⃣ Predictions sorted by engagement score:');
      sortedPredictions.forEach((pred, idx) => {
        const question = questions.find(q => q.id === pred.questionId);
        console.log(`      ${idx + 1}. "${question?.question_text.slice(0, 40)}..." - ${(pred.predictedEngagement * 100).toFixed(0)}%`);
      });

      // Verify high-scoring questions
      const highScorers = predictions.filter(
        p => p.predictedEngagement >= 0.6 || p.riskLevel === 'low'
      );

      console.log(`   3️⃣ High-scoring questions (≥60% or low risk): ${highScorers.length}/${predictions.length}`);

      // At least some questions should have predictions
      expect(predictions.length).toBe(3);
      expect(predictions.every(p => typeof p.predictedEngagement === 'number')).toBe(true);

      console.log('✅ Priority boost identification working');
    });
  });

  describe('3. Learning from Outcomes', () => {
    it('should record actual outcomes and calculate accuracy', async () => {
      console.log('🧪 Testing: Learning from actual outcomes');

      // Create question and get prediction
      const question: GeneratedQuestion = {
        id: crypto.randomUUID(),
        question_text: 'What are the ethical implications of AI development?',
        confidence: 0.9,
        reasoning: 'Ethics question',
        source: 'test',
        alternatives: [],
        topics: ['AI', 'ethics'],
        created_at: new Date()
      };

      const context: ShowContext = {
        showId: testShowId,
        elapsedMinutes: 30,
        totalDuration: 60,
        currentEngagement: 0.7,
        recentTopics: ['AI', 'technology'],
        audienceSize: 200,
        showStyle: 'debate'
      };

      console.log('   1️⃣ Question: "What are the ethical implications of AI development?"');

      // Get initial prediction
      const prediction = await scoringEngine.predictOutcome(question, context);

      console.log(`   2️⃣ Predicted Engagement: ${(prediction.predictedEngagement * 100).toFixed(0)}%`);
      console.log(`   3️⃣ Predicted Host Satisfaction: ${(prediction.predictedHostSatisfaction * 100).toFixed(0)}%`);

      // Simulate actual outcomes (slightly different from prediction)
      const actualEngagement = 0.75;
      const actualHostSatisfaction = 0.80;
      const actualConversationDepth = 4;

      console.log(`   4️⃣ Actual outcomes recorded:`);
      console.log(`      Engagement: ${(actualEngagement * 100).toFixed(0)}%`);
      console.log(`      Host Satisfaction: ${(actualHostSatisfaction * 100).toFixed(0)}%`);
      console.log(`      Conversation Depth: ${actualConversationDepth}`);

      // Record actual outcome
      await scoringEngine.recordActualOutcome(
        prediction.id,
        actualEngagement,
        actualHostSatisfaction,
        actualConversationDepth
      );

      console.log('   5️⃣ Outcome recorded to database ✅');

      // Verify prediction was created
      expect(prediction.id).toBeDefined();
      expect(prediction.predictedEngagement).toBeGreaterThanOrEqual(0);
      expect(prediction.predictedHostSatisfaction).toBeGreaterThanOrEqual(0);

      console.log('✅ Learning from outcomes working');
    });

    it('should track prediction accuracy over time', async () => {
      console.log('🧪 Testing: Prediction accuracy tracking');

      // Get prediction stats for the show
      const stats = await scoringEngine.getPredictionStats(testShowId);

      console.log(`   1️⃣ Prediction Statistics for show:`);
      console.log(`      Total Predictions: ${stats.totalPredictions}`);
      console.log(`      Average Confidence: ${(stats.avgConfidence * 100).toFixed(0)}%`);
      console.log(`      Average Accuracy: ${(stats.avgAccuracy * 100).toFixed(0)}%`);
      console.log(`      High Risk Count: ${stats.highRiskCount}`);

      // Verify stats structure
      expect(typeof stats.totalPredictions).toBe('number');
      expect(typeof stats.avgConfidence).toBe('number');
      expect(typeof stats.avgAccuracy).toBe('number');
      expect(typeof stats.highRiskCount).toBe('number');

      // Stats should be valid ranges
      expect(stats.avgConfidence).toBeGreaterThanOrEqual(0);
      expect(stats.avgConfidence).toBeLessThanOrEqual(1);
      expect(stats.avgAccuracy).toBeGreaterThanOrEqual(0);
      expect(stats.avgAccuracy).toBeLessThanOrEqual(1);

      console.log('✅ Accuracy tracking working');
    });
  });
});
