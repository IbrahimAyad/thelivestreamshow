/**
 * Performance Analytics - Phase 5.6
 *
 * Deep analytics on what makes questions successful.
 *
 * Key Features:
 * - Success factor analysis
 * - A/B testing support
 * - Topic performance tracking
 * - Host-topic matching
 * - Trend forecasting
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { GeneratedQuestion } from '../../hooks/useProducerAI';
import {
  SuccessFactor,
  QuestionAnalysis,
  TopicPerformance
} from './types-phase5';
import { HostProfile } from './types';

export class PerformanceAnalytics {
  private supabase: SupabaseClient;

  constructor(supabaseUrl: string, supabaseKey: string) {
    this.supabase = createClient(supabaseUrl, supabaseKey);
  }

  /**
   * Analyze what made a question successful or unsuccessful
   */
  async analyzeQuestionSuccess(
    questionId: string,
    engagement: number,
    hostSatisfaction: number,
    conversationDepth: number
  ): Promise<QuestionAnalysis> {
    console.log(`📊 Analyzing question success (engagement: ${(engagement * 100).toFixed(0)}%)`);

    // Get question data
    const { data: question, error } = await this.supabase
      .from('ai_questions')
      .select('*')
      .eq('id', questionId)
      .single();

    if (error || !question) {
      console.error('[Analytics] Question not found:', error);
      return {
        successFactors: [],
        underperformingAspects: [],
        improvementSuggestions: []
      };
    }

    // Determine if question was successful
    const isSuccessful = engagement > 0.6 && hostSatisfaction > 0.6;

    // Analyze success factors
    const successFactors = this.identifySuccessFactors(
      question,
      engagement,
      hostSatisfaction,
      conversationDepth
    );

    // Identify underperforming aspects
    const underperformingAspects = this.identifyUnderperformingAspects(
      question,
      engagement,
      hostSatisfaction,
      conversationDepth
    );

    // Generate improvement suggestions
    const improvementSuggestions = this.generateImprovementSuggestions(
      question,
      successFactors,
      underperformingAspects,
      isSuccessful
    );

    console.log(`  ✓ Found ${successFactors.length} success factors, ${underperformingAspects.length} issues`);

    return {
      successFactors,
      underperformingAspects,
      improvementSuggestions
    };
  }

  /**
   * Find optimal topics for a host based on historical performance
   */
  async findOptimalTopics(
    hostId: string,
    timeOfDay?: number, // 0-23
    dayOfWeek?: number  // 0-6
  ): Promise<TopicPerformance[]> {
    console.log(`🎯 Finding optimal topics for host: ${hostId}`);

    // Get host's question history with engagement data
    const { data: interactions, error } = await this.supabase
      .from('host_interactions')
      .select(`
        *,
        question:ai_questions(*)
      `)
      .eq('host_profile_id', hostId)
      .eq('interaction_type', 'asked')
      .limit(100);

    if (error || !interactions || interactions.length === 0) {
      console.log('  ⚠️  No interaction history found');
      return [];
    }

    // Group by topic and calculate average engagement
    const topicPerformance = new Map<string, {
      totalEngagement: number;
      count: number;
      questions: any[];
    }>();

    for (const interaction of interactions) {
      const question = interaction.question;
      if (!question || !question.topics) continue;

      // Get engagement for this question
      const engagement = await this.getQuestionEngagement(question.id);

      for (const topic of question.topics) {
        if (!topicPerformance.has(topic)) {
          topicPerformance.set(topic, {
            totalEngagement: 0,
            count: 0,
            questions: []
          });
        }

        const perf = topicPerformance.get(topic)!;
        perf.totalEngagement += engagement;
        perf.count += 1;
        perf.questions.push(question);
      }
    }

    // Calculate averages and sort
    const results: TopicPerformance[] = [];

    for (const [topic, perf] of topicPerformance.entries()) {
      const avgEngagement = perf.count > 0 ? perf.totalEngagement / perf.count : 0;

      // Generate reasoning
      const reasoning = this.generateTopicReasoning(topic, perf, avgEngagement);

      results.push({
        name: topic,
        predictedEngagement: avgEngagement,
        reasoning,
        optimalTimeOfDay: timeOfDay,
        optimalDayOfWeek: dayOfWeek
      });
    }

    // Sort by predicted engagement
    results.sort((a, b) => b.predictedEngagement - a.predictedEngagement);

    console.log(`  ✓ Found ${results.length} topics, best: ${results[0]?.name} (${(results[0]?.predictedEngagement * 100).toFixed(0)}%)`);

    return results.slice(0, 10);
  }

  /**
   * Compare two question variations (A/B testing)
   */
  async compareQuestionVariations(
    questionAId: string,
    questionBId: string
  ): Promise<{
    questionA: {
      text: string;
      avgEngagement: number;
      avgSatisfaction: number;
      timesAsked: number;
    };
    questionB: {
      text: string;
      avgEngagement: number;
      avgSatisfaction: number;
      timesAsked: number;
    };
    winner: 'A' | 'B' | 'tie';
    confidence: number;
    recommendation: string;
  }> {
    console.log(`🔬 Comparing question variations`);

    // Get both questions and their performance
    const [questionA, questionB] = await Promise.all([
      this.getQuestionWithPerformance(questionAId),
      this.getQuestionWithPerformance(questionBId)
    ]);

    if (!questionA || !questionB) {
      throw new Error('One or both questions not found');
    }

    // Determine winner
    let winner: 'A' | 'B' | 'tie';
    const scoreDiff = questionA.avgEngagement - questionB.avgEngagement;

    if (Math.abs(scoreDiff) < 0.05) {
      winner = 'tie';
    } else if (scoreDiff > 0) {
      winner = 'A';
    } else {
      winner = 'B';
    }

    // Calculate confidence (based on sample size and effect size)
    const minSampleSize = Math.min(questionA.timesAsked, questionB.timesAsked);
    const effectSize = Math.abs(scoreDiff);
    const confidence = Math.min(0.95, (minSampleSize / 20) * effectSize);

    // Generate recommendation
    const recommendation = this.generateABTestRecommendation(
      winner,
      questionA,
      questionB,
      confidence
    );

    console.log(`  ✓ Winner: ${winner} (confidence: ${(confidence * 100).toFixed(0)}%)`);

    return {
      questionA: {
        text: questionA.text,
        avgEngagement: questionA.avgEngagement,
        avgSatisfaction: questionA.avgSatisfaction,
        timesAsked: questionA.timesAsked
      },
      questionB: {
        text: questionB.text,
        avgEngagement: questionB.avgEngagement,
        avgSatisfaction: questionB.avgSatisfaction,
        timesAsked: questionB.timesAsked
      },
      winner,
      confidence,
      recommendation
    };
  }

  /**
   * Get performance trends over time
   */
  async getPerformanceTrends(
    period: 'day' | 'week' | 'month'
  ): Promise<{
    dates: string[];
    avgEngagement: number[];
    questionCount: number[];
    successRate: number[];
  }> {
    console.log(`📈 Getting performance trends (${period})`);

    const intervals = period === 'day' ? 24 : period === 'week' ? 7 : 30;
    const intervalType = period === 'day' ? 'hour' : 'day';

    // Query engagement snapshots grouped by time interval
    const { data, error } = await this.supabase.rpc(
      'get_performance_trends',
      {
        interval_type: intervalType,
        num_intervals: intervals
      }
    );

    if (error || !data) {
      console.error('[Analytics] Error getting trends:', error);
      return {
        dates: [],
        avgEngagement: [],
        questionCount: [],
        successRate: []
      };
    }

    return {
      dates: data.map((d: any) => d.date),
      avgEngagement: data.map((d: any) => d.avg_engagement || 0),
      questionCount: data.map((d: any) => d.question_count || 0),
      successRate: data.map((d: any) => d.success_rate || 0)
    };
  }

  /**
   * Identify patterns in successful questions
   */
  async identifySuccessPatterns(): Promise<{
    lengthPattern: { min: number; max: number; avgEngagement: number };
    topicPatterns: Array<{ topic: string; successRate: number }>;
    timingPatterns: Array<{ timeRange: string; avgEngagement: number }>;
  }> {
    console.log(`🔍 Identifying success patterns`);

    // Analyze question length vs. engagement
    const lengthPattern = await this.analyzeLengthPattern();

    // Analyze topic success rates
    const topicPatterns = await this.analyzeTopicPatterns();

    // Analyze timing patterns
    const timingPatterns = await this.analyzeTimingPatterns();

    console.log(`  ✓ Found patterns: length, ${topicPatterns.length} topics, ${timingPatterns.length} time windows`);

    return {
      lengthPattern,
      topicPatterns,
      timingPatterns
    };
  }

  // ============================================================================
  // Private Methods
  // ============================================================================

  /**
   * Identify factors that contributed to success
   */
  private identifySuccessFactors(
    question: any,
    engagement: number,
    hostSatisfaction: number,
    conversationDepth: number
  ): SuccessFactor[] {
    const factors: SuccessFactor[] = [];

    // Factor 1: High engagement
    if (engagement > 0.7) {
      factors.push({
        factor: 'Strong Audience Engagement',
        contribution: (engagement - 0.7) / 0.3, // Normalize to 0-1
        confidence: 0.9,
        description: `Question achieved ${(engagement * 100).toFixed(0)}% engagement, well above average`
      });
    }

    // Factor 2: Deep conversation
    if (conversationDepth > 3) {
      factors.push({
        factor: 'Generated Deep Discussion',
        contribution: Math.min(1, (conversationDepth - 3) / 7), // Normalize
        confidence: 0.85,
        description: `Sparked ${conversationDepth} exchanges, indicating strong interest`
      });
    }

    // Factor 3: Host satisfaction
    if (hostSatisfaction > 0.7) {
      factors.push({
        factor: 'Host Satisfaction',
        contribution: (hostSatisfaction - 0.7) / 0.3,
        confidence: 0.8,
        description: `Host rated this question ${(hostSatisfaction * 100).toFixed(0)}% favorable`
      });
    }

    // Factor 4: Optimal length
    const questionLength = question.question_text.length;
    if (questionLength >= 80 && questionLength <= 200) {
      factors.push({
        factor: 'Optimal Question Length',
        contribution: 0.15,
        confidence: 0.7,
        description: `Question length (${questionLength} chars) is in the sweet spot for engagement`
      });
    }

    // Factor 5: Topic relevance
    if (question.topics && question.topics.length > 0 && question.topics.length <= 3) {
      factors.push({
        factor: 'Focused Topic Coverage',
        contribution: 0.1,
        confidence: 0.6,
        description: `Question covers ${question.topics.length} related topics, maintaining focus`
      });
    }

    return factors.sort((a, b) => b.contribution - a.contribution);
  }

  /**
   * Identify aspects that underperformed
   */
  private identifyUnderperformingAspects(
    question: any,
    engagement: number,
    hostSatisfaction: number,
    conversationDepth: number
  ): string[] {
    const aspects: string[] = [];

    if (engagement < 0.4) {
      aspects.push('Low audience engagement - question may not have resonated');
    }

    if (hostSatisfaction < 0.4) {
      aspects.push('Host dissatisfaction - question may not fit host preferences');
    }

    if (conversationDepth < 2) {
      aspects.push('Shallow conversation - question did not spark discussion');
    }

    const questionLength = question.question_text.length;
    if (questionLength < 40) {
      aspects.push('Question too short - may lack depth or context');
    } else if (questionLength > 250) {
      aspects.push('Question too long - may be overly complex or verbose');
    }

    if (!question.topics || question.topics.length === 0) {
      aspects.push('No topics tagged - harder to categorize and route');
    } else if (question.topics.length > 5) {
      aspects.push('Too many topics - question may lack focus');
    }

    return aspects;
  }

  /**
   * Generate actionable improvement suggestions
   */
  private generateImprovementSuggestions(
    question: any,
    successFactors: SuccessFactor[],
    underperformingAspects: string[],
    isSuccessful: boolean
  ): string[] {
    const suggestions: string[] = [];

    if (isSuccessful) {
      // For successful questions, suggest amplifying what worked
      if (successFactors.length > 0) {
        const topFactor = successFactors[0];
        suggestions.push(`Continue using similar questions - ${topFactor.factor} was particularly effective`);
      }
      suggestions.push('Consider creating variations of this question for future use');
    } else {
      // For unsuccessful questions, suggest improvements
      const questionLength = question.question_text.length;

      if (questionLength < 40) {
        suggestions.push('Add more context or depth to the question (target 80-200 characters)');
      } else if (questionLength > 250) {
        suggestions.push('Simplify the question - break into multiple shorter questions if needed');
      }

      if (!question.topics || question.topics.length === 0) {
        suggestions.push('Tag with 1-3 relevant topics for better categorization');
      }

      if (underperformingAspects.some(a => a.includes('Host dissatisfaction'))) {
        suggestions.push('Review host preferences - this question may not align with their interests');
      }

      if (underperformingAspects.some(a => a.includes('Low audience engagement'))) {
        suggestions.push('Try a more controversial or thought-provoking angle on this topic');
      }

      if (underperformingAspects.some(a => a.includes('Shallow conversation'))) {
        suggestions.push('Rephrase as an open-ended question to encourage discussion');
      }
    }

    return suggestions;
  }

  /**
   * Get engagement score for a question
   */
  private async getQuestionEngagement(questionId: string): Promise<number> {
    const { data, error } = await this.supabase
      .from('engagement_snapshots')
      .select('engagement_score')
      .eq('current_question_id', questionId);

    if (error || !data || data.length === 0) {
      return 0.5; // Default if no data
    }

    const avgEngagement = data.reduce((sum, s) => sum + (s.engagement_score || 0), 0) / data.length;
    return avgEngagement;
  }

  /**
   * Generate reasoning for topic performance
   */
  private generateTopicReasoning(
    topic: string,
    performance: { totalEngagement: number; count: number; questions: any[] },
    avgEngagement: number
  ): string {
    const sampleSize = performance.count;

    if (avgEngagement > 0.7) {
      return `${topic} consistently performs well (${sampleSize} questions, ${(avgEngagement * 100).toFixed(0)}% avg engagement)`;
    } else if (avgEngagement > 0.5) {
      return `${topic} shows moderate performance (${sampleSize} questions, ${(avgEngagement * 100).toFixed(0)}% avg engagement)`;
    } else {
      return `${topic} underperforms (${sampleSize} questions, ${(avgEngagement * 100).toFixed(0)}% avg engagement) - consider different angle`;
    }
  }

  /**
   * Get question with performance metrics
   */
  private async getQuestionWithPerformance(questionId: string): Promise<{
    text: string;
    avgEngagement: number;
    avgSatisfaction: number;
    timesAsked: number;
  } | null> {
    const { data: question, error } = await this.supabase
      .from('ai_questions')
      .select('*')
      .eq('id', questionId)
      .single();

    if (error || !question) {
      return null;
    }

    // Get engagement data
    const engagement = await this.getQuestionEngagement(questionId);

    // Get host satisfaction
    const { data: interactions } = await this.supabase
      .from('host_interactions')
      .select('interaction_type')
      .eq('question_id', questionId);

    const satisfaction = interactions ? this.calculateSatisfactionFromInteractions(interactions) : 0.5;

    return {
      text: question.question_text,
      avgEngagement: engagement,
      avgSatisfaction: satisfaction,
      timesAsked: interactions?.length || 0
    };
  }

  /**
   * Calculate satisfaction score from interactions
   */
  private calculateSatisfactionFromInteractions(interactions: any[]): number {
    if (interactions.length === 0) return 0.5;

    const scores = interactions.map(i => {
      if (i.interaction_type === 'favorited') return 1.0;
      if (i.interaction_type === 'asked') return 0.8;
      if (i.interaction_type === 'skipped') return 0.3;
      return 0.5;
    });

    return scores.reduce((a, b) => a + b, 0) / scores.length;
  }

  /**
   * Generate A/B test recommendation
   */
  private generateABTestRecommendation(
    winner: 'A' | 'B' | 'tie',
    questionA: any,
    questionB: any,
    confidence: number
  ): string {
    if (winner === 'tie') {
      return 'No significant difference found. Both variations perform similarly - use either or continue testing.';
    }

    const winnerData = winner === 'A' ? questionA : questionB;
    const loserData = winner === 'A' ? questionB : questionA;

    if (confidence > 0.8) {
      return `Variation ${winner} is the clear winner with ${(confidence * 100).toFixed(0)}% confidence. Use this variation going forward.`;
    } else if (confidence > 0.6) {
      return `Variation ${winner} shows promise (${(confidence * 100).toFixed(0)}% confidence), but collect more data to confirm.`;
    } else {
      return `Slight edge to variation ${winner}, but confidence is low (${(confidence * 100).toFixed(0)}%). Continue testing both.`;
    }
  }

  /**
   * Analyze question length patterns
   */
  private async analyzeLengthPattern(): Promise<{
    min: number;
    max: number;
    avgEngagement: number;
  }> {
    // In a full implementation, query database for length vs. engagement correlation
    // For now, return optimal range based on best practices
    return {
      min: 80,
      max: 200,
      avgEngagement: 0.72
    };
  }

  /**
   * Analyze topic success patterns
   */
  private async analyzeTopicPatterns(): Promise<Array<{
    topic: string;
    successRate: number;
  }>> {
    const { data } = await this.supabase
      .from('global_topic_performance')
      .select('*')
      .order('success_rate', { ascending: false })
      .limit(10);

    if (!data) return [];

    return data.map(d => ({
      topic: d.topic,
      successRate: d.success_rate
    }));
  }

  /**
   * Analyze timing patterns
   */
  private async analyzeTimingPatterns(): Promise<Array<{
    timeRange: string;
    avgEngagement: number;
  }>> {
    // Simplified - in production, analyze actual show timing data
    return [
      { timeRange: '0-15 min', avgEngagement: 0.55 },
      { timeRange: '15-30 min', avgEngagement: 0.72 },
      { timeRange: '30-45 min', avgEngagement: 0.68 },
      { timeRange: '45+ min', avgEngagement: 0.58 }
    ];
  }
}
