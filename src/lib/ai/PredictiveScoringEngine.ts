/**
 * Predictive Scoring Engine - Phase 5.1
 *
 * Predicts question performance BEFORE they are asked using historical data.
 *
 * Key Features:
 * - Engagement prediction
 * - Host satisfaction prediction
 * - Conversation depth prediction
 * - Risk assessment
 * - Optimal timing suggestions
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { GeneratedQuestion } from '../../hooks/useProducerAI';
import {
  PredictedOutcome,
  RiskFactor,
  SimilarQuestion,
  OutcomeMetrics,
  ShowContext,
  PredictionBasis,
  PredictiveScoringConfig,
  TrainingFeatures
} from './types-phase5';
import { getEmbedding, cosineSimilarity } from './SemanticSimilarity';

const DEFAULT_CONFIG: PredictiveScoringConfig = {
  minHistoricalData: 10,        // Need at least 10 historical questions
  similarityThreshold: 0.7,     // 70% similarity to use as basis
  maxPredictionAge: 24,         // Cache predictions for 24 hours
  confidenceThreshold: 0.6,     // Show predictions with 60%+ confidence
  modelVersion: 'v1.0.0'
};

export class PredictiveScoringEngine {
  private supabase: SupabaseClient;
  private config: PredictiveScoringConfig;
  private predictionCache: Map<string, PredictedOutcome> = new Map();

  constructor(
    supabaseUrl: string,
    supabaseKey: string,
    config: Partial<PredictiveScoringConfig> = {}
  ) {
    this.supabase = createClient(supabaseUrl, supabaseKey);
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Main prediction method - predicts all outcomes for a question
   */
  async predictOutcome(
    question: GeneratedQuestion,
    context: ShowContext
  ): Promise<PredictedOutcome> {
    console.log(`🔮 Predicting outcome for: "${question.question_text.slice(0, 60)}..."`);

    // Check cache first
    const cacheKey = this.getCacheKey(question.id, context.showId);
    const cached = this.predictionCache.get(cacheKey);
    if (cached && this.isCacheValid(cached)) {
      console.log('  ✓ Using cached prediction');
      return cached;
    }

    // Get similar historical questions
    const similarQuestions = await this.findSimilarHistoricalQuestions(question);

    if (similarQuestions.length < this.config.minHistoricalData) {
      console.log(`  ⚠️  Insufficient historical data (${similarQuestions.length}/${this.config.minHistoricalData})`);
      return this.createLowConfidencePrediction(question, context, similarQuestions);
    }

    // Calculate average outcomes from similar questions
    const averageOutcome = this.calculateAverageOutcome(similarQuestions);

    // Adjust predictions based on context
    const contextAdjusted = this.applyContextAdjustments(averageOutcome, context);

    // Predict conversation depth
    const conversationDepth = this.predictConversationDepth(
      question,
      similarQuestions,
      context
    );

    // Predict number of follow-ups
    const followUps = this.predictFollowUps(question, similarQuestions);

    // Determine optimal timing
    const optimalTiming = this.determineOptimalTiming(
      question,
      context,
      similarQuestions
    );

    // Assess risks
    const { riskLevel, riskFactors } = this.assessRisks(
      question,
      context,
      similarQuestions
    );

    // Calculate confidence
    const confidence = this.calculateConfidence(
      similarQuestions.length,
      averageOutcome,
      context
    );

    const prediction: PredictedOutcome = {
      id: crypto.randomUUID(),
      questionId: question.id,
      showId: context.showId,

      predictedEngagement: contextAdjusted.engagement,
      predictedHostSatisfaction: contextAdjusted.hostSatisfaction,
      predictedConversationDepth: conversationDepth,
      predictedFollowUps: followUps,
      optimalTimingMinute: optimalTiming,

      riskLevel,
      riskFactors,

      confidenceLevel: confidence,
      modelVersion: this.config.modelVersion,
      predictionBasis: {
        similarQuestions: similarQuestions.slice(0, 5), // Top 5
        averageOutcome,
        sampleSize: similarQuestions.length,
        timeRange: {
          start: new Date(Math.min(...similarQuestions.map(q => q.askedAt.getTime()))),
          end: new Date(Math.max(...similarQuestions.map(q => q.askedAt.getTime())))
        }
      },

      createdAt: new Date()
    };

    // Cache the prediction
    this.predictionCache.set(cacheKey, prediction);

    // Save to database
    await this.savePrediction(prediction);

    console.log(`  ✓ Prediction complete:`);
    console.log(`    Engagement: ${(prediction.predictedEngagement * 100).toFixed(0)}%`);
    console.log(`    Host Satisfaction: ${(prediction.predictedHostSatisfaction * 100).toFixed(0)}%`);
    console.log(`    Risk: ${prediction.riskLevel}`);
    console.log(`    Confidence: ${(prediction.confidenceLevel * 100).toFixed(0)}%`);

    return prediction;
  }

  /**
   * Find similar questions from history using vector similarity
   */
  private async findSimilarHistoricalQuestions(
    question: GeneratedQuestion
  ): Promise<SimilarQuestion[]> {
    // Get embedding for the question
    const questionEmbedding = await getEmbedding(question.question_text);

    // Query Supabase for similar questions with outcomes
    const { data: historicalQuestions, error } = await this.supabase.rpc(
      'find_similar_questions_with_outcomes',
      {
        query_embedding: questionEmbedding,
        similarity_threshold: this.config.similarityThreshold,
        max_results: 50
      }
    );

    if (error) {
      console.error('[PredictiveScoring] Error finding similar questions:', error);
      return [];
    }

    if (!historicalQuestions || historicalQuestions.length === 0) {
      return [];
    }

    // Transform to SimilarQuestion format
    return historicalQuestions.map((hq: any) => ({
      questionText: hq.question_text,
      similarity: hq.similarity,
      engagement: hq.engagement_score || 0.5,
      hostSatisfaction: hq.host_satisfaction || 0.5,
      conversationDepth: hq.conversation_depth || 1,
      askedAt: new Date(hq.asked_at)
    }));
  }

  /**
   * Calculate average outcome from similar questions
   */
  private calculateAverageOutcome(similar: SimilarQuestion[]): OutcomeMetrics {
    if (similar.length === 0) {
      return {
        avgEngagement: 0.5,
        avgHostSatisfaction: 0.5,
        avgConversationDepth: 1,
        successRate: 0.5
      };
    }

    const sum = similar.reduce(
      (acc, q) => ({
        engagement: acc.engagement + q.engagement,
        hostSatisfaction: acc.hostSatisfaction + q.hostSatisfaction,
        conversationDepth: acc.conversationDepth + q.conversationDepth,
        success: acc.success + (q.engagement > 0.6 && q.hostSatisfaction > 0.6 ? 1 : 0)
      }),
      { engagement: 0, hostSatisfaction: 0, conversationDepth: 0, success: 0 }
    );

    return {
      avgEngagement: sum.engagement / similar.length,
      avgHostSatisfaction: sum.hostSatisfaction / similar.length,
      avgConversationDepth: sum.conversationDepth / similar.length,
      successRate: sum.success / similar.length
    };
  }

  /**
   * Apply context-based adjustments to predictions
   */
  private applyContextAdjustments(
    outcome: OutcomeMetrics,
    context: ShowContext
  ): { engagement: number; hostSatisfaction: number } {
    let engagementAdjustment = 0;
    let satisfactionAdjustment = 0;

    // Adjust based on current show engagement
    if (context.currentEngagement > 0.7) {
      // High engagement - easier to maintain
      engagementAdjustment += 0.05;
    } else if (context.currentEngagement < 0.3) {
      // Low engagement - harder to boost
      engagementAdjustment -= 0.05;
    }

    // Adjust based on show timing
    const progressRatio = context.elapsedMinutes / context.totalDuration;

    if (progressRatio < 0.2) {
      // Early in show - audience still warming up
      engagementAdjustment -= 0.03;
    } else if (progressRatio > 0.8) {
      // Late in show - audience may be tired
      engagementAdjustment -= 0.05;
    } else if (progressRatio >= 0.3 && progressRatio <= 0.6) {
      // Sweet spot - middle of show
      engagementAdjustment += 0.05;
    }

    // Adjust based on audience size
    if (context.audienceSize > 500) {
      // Large audience - more engagement potential
      engagementAdjustment += 0.03;
    } else if (context.audienceSize < 50) {
      // Small audience - less engagement momentum
      engagementAdjustment -= 0.02;
    }

    return {
      engagement: this.clamp(outcome.avgEngagement + engagementAdjustment, 0, 1),
      hostSatisfaction: this.clamp(outcome.avgHostSatisfaction + satisfactionAdjustment, 0, 1)
    };
  }

  /**
   * Predict conversation depth (number of back-and-forth exchanges)
   */
  private predictConversationDepth(
    question: GeneratedQuestion,
    similar: SimilarQuestion[],
    context: ShowContext
  ): number {
    if (similar.length === 0) return 2;

    // Base prediction on similar questions
    const avgDepth = similar.reduce((sum, q) => sum + q.conversationDepth, 0) / similar.length;

    // Adjust based on question complexity (longer questions = deeper conversations)
    const lengthFactor = Math.min(question.question_text.length / 200, 1.5);

    // Adjust based on show style
    const styleFactor = context.showStyle === 'debate' ? 1.3 :
                       context.showStyle === 'interview' ? 1.1 :
                       context.showStyle === 'educational' ? 1.2 : 1.0;

    return Math.round(avgDepth * lengthFactor * styleFactor);
  }

  /**
   * Predict number of follow-up questions
   */
  private predictFollowUps(
    question: GeneratedQuestion,
    similar: SimilarQuestion[]
  ): number {
    // Simple heuristic: deeper conversations generate more follow-ups
    const avgDepth = similar.length > 0
      ? similar.reduce((sum, q) => sum + q.conversationDepth, 0) / similar.length
      : 2;

    // Questions with higher engagement generate more follow-ups
    const avgEngagement = similar.length > 0
      ? similar.reduce((sum, q) => sum + q.engagement, 0) / similar.length
      : 0.5;

    const baseFollowUps = Math.floor(avgDepth * 0.7);
    const engagementBonus = avgEngagement > 0.7 ? 1 : 0;

    return Math.max(0, baseFollowUps + engagementBonus);
  }

  /**
   * Determine optimal timing (minute in show) for this question
   */
  private determineOptimalTiming(
    question: GeneratedQuestion,
    context: ShowContext,
    similar: SimilarQuestion[]
  ): number {
    // Analyze when similar questions performed best
    // For now, use simple heuristics

    const showDuration = context.totalDuration;
    const currentMinute = context.elapsedMinutes;

    // Deep/complex questions work better in middle of show
    const isDeep = question.question_text.length > 150 ||
                   question.topics?.some(t => ['philosophy', 'technical', 'science'].includes(t));

    if (isDeep) {
      // Recommend 30-60% through show
      const optimal = Math.floor(showDuration * 0.45);
      return optimal;
    }

    // Light/entertaining questions work better at start or end
    const isLight = question.question_text.length < 100;

    if (isLight) {
      // If early in show, recommend now. Otherwise, save for end
      if (currentMinute < showDuration * 0.3) {
        return currentMinute;
      } else {
        return Math.floor(showDuration * 0.85);
      }
    }

    // Default: recommend current time or slightly later
    return currentMinute + 5;
  }

  /**
   * Assess risks associated with asking this question
   */
  private assessRisks(
    question: GeneratedQuestion,
    context: ShowContext,
    similar: SimilarQuestion[]
  ): { riskLevel: 'low' | 'medium' | 'high'; riskFactors: RiskFactor[] } {
    const riskFactors: RiskFactor[] = [];

    // Risk 1: Low historical performance
    if (similar.length > 0) {
      const avgEngagement = similar.reduce((sum, q) => sum + q.engagement, 0) / similar.length;
      if (avgEngagement < 0.4) {
        riskFactors.push({
          factor: 'Low Historical Performance',
          severity: 'high',
          description: 'Similar questions have historically performed poorly',
          mitigation: 'Consider rewording or choosing a different question'
        });
      }
    }

    // Risk 2: Insufficient historical data
    if (similar.length < this.config.minHistoricalData) {
      riskFactors.push({
        factor: 'Limited Historical Data',
        severity: 'medium',
        description: `Only ${similar.length} similar questions found in history`,
        mitigation: 'Predictions may be less accurate'
      });
    }

    // Risk 3: Controversial topic during low engagement
    const isControversial = question.topics?.some(t =>
      ['politics', 'religion', 'controversy'].includes(t)
    );
    if (isControversial && context.currentEngagement < 0.4) {
      riskFactors.push({
        factor: 'Controversial Topic + Low Engagement',
        severity: 'high',
        description: 'Controversial questions may alienate audience when engagement is already low',
        mitigation: 'Wait for higher engagement or choose a lighter topic'
      });
    }

    // Risk 4: Late in show + complex question
    const progressRatio = context.elapsedMinutes / context.totalDuration;
    const isComplex = question.question_text.length > 150;
    if (progressRatio > 0.8 && isComplex) {
      riskFactors.push({
        factor: 'Complex Question Late in Show',
        severity: 'medium',
        description: 'Audience may be tired for deep discussions',
        mitigation: 'Save for earlier in show or simplify the question'
      });
    }

    // Risk 5: Small audience + niche topic
    if (context.audienceSize < 30 && question.topics?.some(t =>
      ['technical', 'academic', 'specialized'].includes(t)
    )) {
      riskFactors.push({
        factor: 'Niche Topic + Small Audience',
        severity: 'low',
        description: 'Specialized topics may not resonate with small audience',
        mitigation: 'Provide more context or choose broader topic'
      });
    }

    // Determine overall risk level
    const highRisks = riskFactors.filter(r => r.severity === 'high').length;
    const mediumRisks = riskFactors.filter(r => r.severity === 'medium').length;

    let riskLevel: 'low' | 'medium' | 'high';
    if (highRisks > 0) {
      riskLevel = 'high';
    } else if (mediumRisks > 1) {
      riskLevel = 'high';
    } else if (mediumRisks === 1 || riskFactors.length > 2) {
      riskLevel = 'medium';
    } else {
      riskLevel = 'low';
    }

    return { riskLevel, riskFactors };
  }

  /**
   * Calculate confidence in predictions
   */
  private calculateConfidence(
    sampleSize: number,
    outcome: OutcomeMetrics,
    context: ShowContext
  ): number {
    let confidence = 0;

    // Base confidence on sample size
    if (sampleSize >= 50) {
      confidence = 0.9;
    } else if (sampleSize >= 30) {
      confidence = 0.8;
    } else if (sampleSize >= 20) {
      confidence = 0.7;
    } else if (sampleSize >= 10) {
      confidence = 0.6;
    } else {
      confidence = 0.4;
    }

    // Reduce confidence if outcomes are highly variable
    // (would need historical variance data to implement properly)

    // Reduce confidence if context is unusual
    if (context.currentEngagement < 0.2 || context.currentEngagement > 0.9) {
      confidence *= 0.9; // Extreme engagement levels are less predictable
    }

    return this.clamp(confidence, 0, 1);
  }

  /**
   * Create low-confidence prediction when insufficient data
   */
  private createLowConfidencePrediction(
    question: GeneratedQuestion,
    context: ShowContext,
    similar: SimilarQuestion[]
  ): PredictedOutcome {
    return {
      id: crypto.randomUUID(),
      questionId: question.id,
      showId: context.showId,

      // Conservative estimates
      predictedEngagement: 0.5,
      predictedHostSatisfaction: 0.5,
      predictedConversationDepth: 2,
      predictedFollowUps: 1,
      optimalTimingMinute: context.elapsedMinutes,

      riskLevel: 'medium',
      riskFactors: [{
        factor: 'Insufficient Historical Data',
        severity: 'medium',
        description: `Only ${similar.length} similar questions found`,
        mitigation: 'Predictions are based on limited data'
      }],

      confidenceLevel: 0.3,
      modelVersion: this.config.modelVersion,
      predictionBasis: {
        similarQuestions: similar,
        averageOutcome: {
          avgEngagement: 0.5,
          avgHostSatisfaction: 0.5,
          avgConversationDepth: 2,
          successRate: 0.5
        },
        sampleSize: similar.length,
        timeRange: {
          start: new Date(),
          end: new Date()
        }
      },

      createdAt: new Date()
    };
  }

  /**
   * Update prediction with actual outcomes after question is asked
   */
  async recordActualOutcome(
    predictionId: string,
    actualEngagement: number,
    actualHostSatisfaction: number,
    actualConversationDepth: number
  ): Promise<void> {
    const accuracy = this.calculatePredictionAccuracy(
      predictionId,
      actualEngagement,
      actualHostSatisfaction,
      actualConversationDepth
    );

    const { error } = await this.supabase
      .from('predicted_outcomes')
      .update({
        actual_engagement: actualEngagement,
        actual_host_satisfaction: actualHostSatisfaction,
        actual_conversation_depth: actualConversationDepth,
        prediction_accuracy: accuracy
      })
      .eq('id', predictionId);

    if (error) {
      console.error('[PredictiveScoring] Error recording actual outcome:', error);
    } else {
      console.log(`✅ Recorded actual outcome (accuracy: ${(accuracy * 100).toFixed(0)}%)`);
    }
  }

  /**
   * Calculate how accurate the prediction was
   */
  private calculatePredictionAccuracy(
    predictionId: string,
    actualEngagement: number,
    actualHostSatisfaction: number,
    actualConversationDepth: number
  ): number {
    // Get prediction from cache or database
    const cached = Array.from(this.predictionCache.values()).find(p => p.id === predictionId);
    if (!cached) return 0;

    // Calculate error for each metric
    const engagementError = Math.abs(cached.predictedEngagement - actualEngagement);
    const satisfactionError = Math.abs(cached.predictedHostSatisfaction - actualHostSatisfaction);
    const depthError = Math.abs(cached.predictedConversationDepth - actualConversationDepth) / 10; // Normalize

    // Average error (lower is better)
    const avgError = (engagementError + satisfactionError + depthError) / 3;

    // Convert to accuracy score (1 - error)
    return this.clamp(1 - avgError, 0, 1);
  }

  /**
   * Get prediction statistics for a show
   */
  async getPredictionStats(showId: string): Promise<{
    totalPredictions: number;
    avgConfidence: number;
    avgAccuracy: number;
    highRiskCount: number;
  }> {
    const { data: predictions, error } = await this.supabase
      .from('predicted_outcomes')
      .select('*')
      .eq('show_id', showId);

    if (error || !predictions || predictions.length === 0) {
      return {
        totalPredictions: 0,
        avgConfidence: 0,
        avgAccuracy: 0,
        highRiskCount: 0
      };
    }

    const withAccuracy = predictions.filter(p => p.prediction_accuracy !== null);

    return {
      totalPredictions: predictions.length,
      avgConfidence: predictions.reduce((sum, p) => sum + (p.confidence_level || 0), 0) / predictions.length,
      avgAccuracy: withAccuracy.length > 0
        ? withAccuracy.reduce((sum, p) => sum + p.prediction_accuracy, 0) / withAccuracy.length
        : 0,
      highRiskCount: predictions.filter(p => p.risk_level === 'high').length
    };
  }

  // ============================================================================
  // Helper Methods
  // ============================================================================

  private getCacheKey(questionId: string, showId: string): string {
    return `${showId}:${questionId}`;
  }

  private isCacheValid(prediction: PredictedOutcome): boolean {
    const ageHours = (Date.now() - prediction.createdAt.getTime()) / (1000 * 60 * 60);
    return ageHours < this.config.maxPredictionAge;
  }

  private async savePrediction(prediction: PredictedOutcome): Promise<void> {
    const { error } = await this.supabase
      .from('predicted_outcomes')
      .insert([{
        id: prediction.id,
        question_id: prediction.questionId,
        show_id: prediction.showId,
        predicted_engagement: prediction.predictedEngagement,
        predicted_host_satisfaction: prediction.predictedHostSatisfaction,
        predicted_conversation_depth: prediction.predictedConversationDepth,
        predicted_follow_ups: prediction.predictedFollowUps,
        optimal_timing_minute: prediction.optimalTimingMinute,
        risk_level: prediction.riskLevel,
        risk_factors: prediction.riskFactors,
        confidence_level: prediction.confidenceLevel,
        model_version: prediction.modelVersion,
        prediction_basis: prediction.predictionBasis,
        created_at: prediction.createdAt.toISOString()
      }]);

    if (error) {
      console.error('[PredictiveScoring] Error saving prediction:', error);
    }
  }

  private clamp(value: number, min: number, max: number): number {
    return Math.min(Math.max(value, min), max);
  }
}
