/**
 * HostProfileManager - Phase 4: Intelligent Question Evolution
 *
 * Learns host preferences and patterns to generate more relevant questions.
 * Tracks which questions get used, when they're used, and what characteristics
 * hosts prefer (complexity, style, topics, length).
 *
 * Key Features:
 * - Builds host profiles from historical data
 * - Calculates host fit scores for new questions
 * - Adapts to host preferences over time
 * - Provides personalized question ranking
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import {
  HostProfile,
  HostProfileConfig,
  QuestionStyle,
  QuestionInsight,
  AIModel,
  DEFAULT_HOST_PROFILE_CONFIG
} from './types';
import { GeneratedQuestion } from '../../hooks/useProducerAI';

export class HostProfileManager {
  private supabase: SupabaseClient;
  private config: HostProfileConfig;
  private currentProfile: HostProfile | null = null;
  private hostId: string | null = null;
  private updateTimer: NodeJS.Timeout | null = null;

  // Track questions in current session (before persisting)
  private sessionQuestions: {
    generated: QuestionInsight[];
    used: Set<string>;
  } = {
    generated: [],
    used: new Set()
  };

  constructor(
    supabaseUrl: string,
    supabaseKey: string,
    config: HostProfileConfig = DEFAULT_HOST_PROFILE_CONFIG
  ) {
    this.supabase = createClient(supabaseUrl, supabaseKey);
    this.config = config;
  }

  /**
   * Initialize profile for a specific host
   */
  async initializeForHost(hostId: string, hostName?: string): Promise<HostProfile> {
    this.hostId = hostId;

    // Try to load existing profile
    const { data: existingProfile, error } = await this.supabase
      .from('host_profiles')
      .select('*')
      .eq('host_id', hostId)
      .single();

    if (existingProfile && !error) {
      // Convert database format to HostProfile
      this.currentProfile = this.dbToProfile(existingProfile);
      console.log('[HostProfileManager] Loaded existing profile:', {
        hostId,
        totalShows: this.currentProfile.totalShows,
        usageRate: this.currentProfile.usageRate,
        confidence: this.currentProfile.confidenceScore
      });
    } else {
      // Create new profile
      this.currentProfile = this.createNewProfile(hostId, hostName);

      // Save to database
      const { error: insertError } = await this.supabase
        .from('host_profiles')
        .insert([this.profileToDb(this.currentProfile)]);

      if (insertError) {
        console.error('[HostProfileManager] Error creating profile:', insertError);
      } else {
        console.log('[HostProfileManager] Created new profile for host:', hostId);
      }
    }

    // Start periodic profile updates if enabled
    if (this.config.enabled && this.config.profileUpdateInterval > 0) {
      this.startPeriodicUpdates();
    }

    return this.currentProfile;
  }

  /**
   * Record a question that was generated
   */
  async recordQuestionGenerated(
    question: GeneratedQuestion,
    sourceModel: AIModel,
    showId: string,
    embedding?: number[]
  ): Promise<void> {
    if (!this.currentProfile || !this.hostId) {
      console.warn('[HostProfileManager] No profile initialized');
      return;
    }

    const insight: QuestionInsight = {
      id: crypto.randomUUID(),
      questionText: question.text,
      embedding: embedding || [],
      showId,
      hostId: this.hostId,
      timestamp: new Date(),
      topic: question.topic,
      complexity: question.complexity || 0.5,
      length: question.text.split(' ').length,
      style: this.classifyQuestionStyle(question.text),
      sourceModel,
      wasUsed: false,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Add to session tracking
    this.sessionQuestions.generated.push(insight);

    // Update profile stats
    this.currentProfile.totalQuestionsGenerated++;
  }

  /**
   * Record when a question was used by the host
   */
  async recordQuestionUsed(
    questionText: string,
    timeToUse: number, // seconds from generation to use
    engagementMetrics?: {
      chatActivityBefore: number;
      chatActivityAfter: number;
      viewerCountBefore: number;
      viewerCountAfter: number;
      sentimentBefore?: number;
      sentimentAfter?: number;
    }
  ): Promise<void> {
    if (!this.currentProfile || !this.hostId) {
      console.warn('[HostProfileManager] No profile initialized');
      return;
    }

    // Find the question in session
    const question = this.sessionQuestions.generated.find(
      q => q.questionText === questionText
    );

    if (question) {
      // Mark as used
      question.wasUsed = true;
      question.timeToUse = timeToUse;
      question.usedAt = new Date();
      this.sessionQuestions.used.add(question.id);

      // Add engagement metrics if provided
      if (engagementMetrics) {
        question.chatActivityBefore = engagementMetrics.chatActivityBefore;
        question.chatActivityAfter = engagementMetrics.chatActivityAfter;
        question.chatActivityChange =
          ((engagementMetrics.chatActivityAfter - engagementMetrics.chatActivityBefore) /
          (engagementMetrics.chatActivityBefore || 1)) * 100;

        question.viewerCountBefore = engagementMetrics.viewerCountBefore;
        question.viewerCountAfter = engagementMetrics.viewerCountAfter;
        question.viewerRetention =
          (engagementMetrics.viewerCountAfter / (engagementMetrics.viewerCountBefore || 1)) * 100;

        if (engagementMetrics.sentimentBefore !== undefined &&
            engagementMetrics.sentimentAfter !== undefined) {
          question.sentimentBefore = engagementMetrics.sentimentBefore;
          question.sentimentAfter = engagementMetrics.sentimentAfter;
          question.sentimentChange = engagementMetrics.sentimentAfter - engagementMetrics.sentimentBefore;
        }

        // Calculate engagement score
        question.engagementScore = this.calculateEngagementScore(
          question.chatActivityChange || 0,
          question.viewerRetention || 0,
          question.sentimentChange || 0
        );
      }

      // Update profile stats
      this.currentProfile.totalQuestionsAsked++;
      this.updatePreferenceMetrics(question);

      console.log('[HostProfileManager] Question used:', {
        questionText: questionText.substring(0, 50),
        timeToUse,
        engagementScore: question.engagementScore
      });
    }
  }

  /**
   * Calculate how well a question fits the host's profile
   * Returns score from 0-1, where 1 = perfect fit
   */
  calculateHostFitScore(question: GeneratedQuestion): number {
    if (!this.currentProfile || !this.config.enabled) {
      return 0.5; // Neutral if no profile
    }

    // If profile has low confidence, don't weight heavily
    if (this.currentProfile.confidenceScore < 0.3) {
      return 0.5;
    }

    const scores: number[] = [];
    const weights: number[] = [];

    // 1. Style preference (30% weight)
    const style = this.classifyQuestionStyle(question.text);
    const stylePreference = this.currentProfile.stylePreferences[style] || 0.5;
    scores.push(stylePreference);
    weights.push(0.3);

    // 2. Complexity match (25% weight)
    const complexityDiff = Math.abs((question.complexity || 0.5) - this.currentProfile.avgComplexity);
    const complexityScore = 1 - complexityDiff; // Closer to avg = higher score
    scores.push(Math.max(0, complexityScore));
    weights.push(0.25);

    // 3. Length match (20% weight)
    const questionLength = question.text.split(' ').length;
    const lengthDiff = Math.abs(questionLength - this.currentProfile.avgLength);
    const lengthScore = Math.max(0, 1 - (lengthDiff / 20)); // Allow 20 word variance
    scores.push(lengthScore);
    weights.push(0.2);

    // 4. Topic preference (25% weight)
    if (question.topic && this.currentProfile.topicDistribution[question.topic]) {
      const topicScore = this.currentProfile.topicDistribution[question.topic];
      scores.push(topicScore);
      weights.push(0.25);
    } else {
      // Unknown topic = neutral
      scores.push(0.5);
      weights.push(0.25);
    }

    // Calculate weighted average
    const totalWeight = weights.reduce((sum, w) => sum + w, 0);
    const weightedSum = scores.reduce((sum, score, i) => sum + score * weights[i], 0);
    const finalScore = weightedSum / totalWeight;

    // Apply confidence scaling (low confidence = pull toward neutral)
    const confidenceScaledScore =
      finalScore * this.currentProfile.confidenceScore +
      0.5 * (1 - this.currentProfile.confidenceScore);

    return Math.max(0, Math.min(1, confidenceScaledScore));
  }

  /**
   * Update profile based on current session data
   */
  async updateProfile(): Promise<void> {
    if (!this.currentProfile || !this.hostId) {
      return;
    }

    // Calculate updated metrics
    const totalQuestions = this.currentProfile.totalQuestionsGenerated;
    const totalUsed = this.currentProfile.totalQuestionsAsked;

    if (totalQuestions > 0) {
      this.currentProfile.usageRate = totalUsed / totalQuestions;
      this.currentProfile.totalQuestionsIgnored = totalQuestions - totalUsed;
    }

    // Update confidence based on sample size
    this.currentProfile.confidenceScore = this.calculateConfidence(totalUsed);

    // Persist insights to database
    await this.persistSessionInsights();

    // Update profile in database
    const { error } = await this.supabase
      .from('host_profiles')
      .update(this.profileToDb(this.currentProfile))
      .eq('host_id', this.hostId);

    if (error) {
      console.error('[HostProfileManager] Error updating profile:', error);
    } else {
      console.log('[HostProfileManager] Profile updated:', {
        hostId: this.hostId,
        usageRate: this.currentProfile.usageRate.toFixed(2),
        confidence: this.currentProfile.confidenceScore.toFixed(2)
      });
    }

    this.currentProfile.updatedAt = new Date();
  }

  /**
   * Get current profile
   */
  getProfile(): HostProfile | null {
    return this.currentProfile;
  }

  /**
   * Get profile statistics for UI display
   */
  getProfileStats() {
    if (!this.currentProfile) {
      return null;
    }

    return {
      hostId: this.currentProfile.hostId,
      hostName: this.currentProfile.hostName,
      totalShows: this.currentProfile.totalShows,
      usageRate: this.currentProfile.usageRate,
      avgTimeToUse: this.currentProfile.avgTimeToUse,
      preferredStyle: this.currentProfile.preferredStyle,
      confidenceScore: this.currentProfile.confidenceScore,
      topTopics: Object.entries(this.currentProfile.topicDistribution)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5)
        .map(([topic, score]) => ({ topic, score })),
      sessionStats: {
        questionsGenerated: this.sessionQuestions.generated.length,
        questionsUsed: this.sessionQuestions.used.size,
        currentUsageRate: this.sessionQuestions.generated.length > 0
          ? this.sessionQuestions.used.size / this.sessionQuestions.generated.length
          : 0
      }
    };
  }

  /**
   * Clean up resources
   */
  destroy(): void {
    if (this.updateTimer) {
      clearInterval(this.updateTimer);
      this.updateTimer = null;
    }
  }

  // ============================================================================
  // Private Helper Methods
  // ============================================================================

  private createNewProfile(hostId: string, hostName?: string): HostProfile {
    return {
      id: crypto.randomUUID(),
      hostId,
      hostName,
      totalShows: 0,
      totalQuestionsGenerated: 0,
      totalQuestionsAsked: 0,
      totalQuestionsIgnored: 0,
      usageRate: 0,
      avgTimeToUse: 0,
      avgComplexity: 0.5,
      avgLength: 15,
      topicDistribution: {},
      stylePreferences: {
        'open-ended': 0.5,
        'specific': 0.5,
        'provocative': 0.5,
        'analytical': 0.5,
        'unknown': 0.5
      },
      confidenceScore: 0,
      createdAt: new Date(),
      updatedAt: new Date()
    };
  }

  private classifyQuestionStyle(questionText: string): QuestionStyle {
    const text = questionText.toLowerCase();

    // Open-ended: "what do you think", "how do you feel", "tell me about"
    if (text.includes('what do you think') ||
        text.includes('how do you feel') ||
        text.includes('tell me about') ||
        text.includes('can you explain')) {
      return 'open-ended';
    }

    // Specific: "did you", "will you", "have you", numbers, dates
    if (text.startsWith('did you') ||
        text.startsWith('will you') ||
        text.startsWith('have you') ||
        /\d/.test(text)) {
      return 'specific';
    }

    // Provocative: "why would", "isn't it", controversial words
    if (text.includes('why would') ||
        text.includes("isn't it") ||
        text.includes('controversial') ||
        text.includes('disagree')) {
      return 'provocative';
    }

    // Analytical: "analyze", "compare", "evaluate"
    if (text.includes('analyze') ||
        text.includes('compare') ||
        text.includes('evaluate') ||
        text.includes('relationship between')) {
      return 'analytical';
    }

    return 'unknown';
  }

  private updatePreferenceMetrics(usedQuestion: QuestionInsight): void {
    if (!this.currentProfile) return;

    const learningRate = this.config.learningRate;

    // Update average complexity (exponential moving average)
    this.currentProfile.avgComplexity =
      this.currentProfile.avgComplexity * (1 - learningRate) +
      usedQuestion.complexity * learningRate;

    // Update average length
    this.currentProfile.avgLength = Math.round(
      this.currentProfile.avgLength * (1 - learningRate) +
      usedQuestion.length * learningRate
    );

    // Update average time to use
    if (usedQuestion.timeToUse) {
      this.currentProfile.avgTimeToUse = Math.round(
        this.currentProfile.avgTimeToUse * (1 - learningRate) +
        usedQuestion.timeToUse * learningRate
      );
    }

    // Update style preferences
    const style = usedQuestion.style;
    if (!this.currentProfile.stylePreferences[style]) {
      this.currentProfile.stylePreferences[style] = 0.5;
    }
    // Boost used style, slightly reduce others
    Object.keys(this.currentProfile.stylePreferences).forEach(s => {
      if (s === style) {
        this.currentProfile!.stylePreferences[s as QuestionStyle] = Math.min(1,
          this.currentProfile!.stylePreferences[s as QuestionStyle] + learningRate * 0.1
        );
      } else {
        this.currentProfile!.stylePreferences[s as QuestionStyle] = Math.max(0,
          this.currentProfile!.stylePreferences[s as QuestionStyle] - learningRate * 0.025
        );
      }
    });

    // Update topic distribution
    if (usedQuestion.topic) {
      if (!this.currentProfile.topicDistribution[usedQuestion.topic]) {
        this.currentProfile.topicDistribution[usedQuestion.topic] = 0.5;
      }
      this.currentProfile.topicDistribution[usedQuestion.topic] = Math.min(1,
        this.currentProfile.topicDistribution[usedQuestion.topic] + learningRate * 0.1
      );
    }

    // Update preferred style (most used)
    const styleEntries = Object.entries(this.currentProfile.stylePreferences) as [QuestionStyle, number][];
    const topStyle = styleEntries.reduce((max, [style, score]) =>
      score > max[1] ? [style, score] : max
    );
    this.currentProfile.preferredStyle = topStyle[0];
  }

  private calculateEngagementScore(
    chatChange: number,
    viewerRetention: number,
    sentimentChange: number
  ): number {
    // Normalize inputs to 0-1 range
    const chatScore = Math.max(0, Math.min(1, (chatChange + 100) / 200)); // -100% to +100% -> 0 to 1
    const retentionScore = Math.max(0, Math.min(1, viewerRetention / 100));
    const sentimentScore = Math.max(0, Math.min(1, (sentimentChange + 1) / 2)); // -1 to +1 -> 0 to 1

    // Weighted average
    return chatScore * 0.5 + retentionScore * 0.3 + sentimentScore * 0.2;
  }

  private calculateConfidence(totalQuestionsAsked: number): number {
    // Logistic function: approaches 1 as sample size increases
    // Reaches 50% confidence at min_questions, 90% at ~3x min_questions
    const k = 0.1; // Steepness
    const x0 = this.config.minQuestionsForProfile; // Midpoint
    return 1 / (1 + Math.exp(-k * (totalQuestionsAsked - x0)));
  }

  private async persistSessionInsights(): Promise<void> {
    if (this.sessionQuestions.generated.length === 0) {
      return;
    }

    // Convert insights to database format
    const insightsToInsert = this.sessionQuestions.generated.map(insight => ({
      id: insight.id,
      question_text: insight.questionText,
      embedding: insight.embedding.length > 0 ? insight.embedding : null,
      show_id: insight.showId,
      host_id: insight.hostId,
      topic: insight.topic,
      complexity: insight.complexity,
      length: insight.length,
      style: insight.style,
      source_model: insight.sourceModel,
      was_used: insight.wasUsed,
      time_to_use: insight.timeToUse,
      chat_activity_before: insight.chatActivityBefore,
      chat_activity_after: insight.chatActivityAfter,
      chat_activity_change: insight.chatActivityChange,
      viewer_count_before: insight.viewerCountBefore,
      viewer_count_after: insight.viewerCountAfter,
      viewer_retention: insight.viewerRetention,
      sentiment_before: insight.sentimentBefore,
      sentiment_after: insight.sentimentAfter,
      sentiment_change: insight.sentimentChange,
      engagement_score: insight.engagementScore,
      impact_score: insight.impactScore,
      created_at: insight.createdAt.toISOString()
    }));

    const { error } = await this.supabase
      .from('question_insights')
      .upsert(insightsToInsert);

    if (error) {
      console.error('[HostProfileManager] Error persisting insights:', error);
    } else {
      console.log(`[HostProfileManager] Persisted ${insightsToInsert.length} question insights`);
    }
  }

  private startPeriodicUpdates(): void {
    if (this.updateTimer) {
      clearInterval(this.updateTimer);
    }

    this.updateTimer = setInterval(() => {
      this.updateProfile().catch(err => {
        console.error('[HostProfileManager] Error in periodic update:', err);
      });
    }, this.config.profileUpdateInterval);

    console.log(`[HostProfileManager] Started periodic updates every ${this.config.profileUpdateInterval}ms`);
  }

  private dbToProfile(dbProfile: any): HostProfile {
    return {
      id: dbProfile.id,
      hostId: dbProfile.host_id,
      hostName: dbProfile.host_name,
      totalShows: dbProfile.total_shows || 0,
      totalQuestionsGenerated: dbProfile.total_questions_generated || 0,
      totalQuestionsAsked: dbProfile.total_questions_asked || 0,
      totalQuestionsIgnored: dbProfile.total_questions_ignored || 0,
      usageRate: parseFloat(dbProfile.usage_rate) || 0,
      avgTimeToUse: dbProfile.avg_time_to_use || 0,
      avgComplexity: parseFloat(dbProfile.avg_complexity) || 0.5,
      avgLength: dbProfile.avg_length || 15,
      preferredStyle: dbProfile.preferred_style,
      topicDistribution: dbProfile.topic_distribution || {},
      stylePreferences: dbProfile.style_preferences || {},
      lastAnalyzedAt: dbProfile.last_analyzed_at ? new Date(dbProfile.last_analyzed_at) : undefined,
      confidenceScore: parseFloat(dbProfile.confidence_score) || 0,
      createdAt: new Date(dbProfile.created_at),
      updatedAt: new Date(dbProfile.updated_at)
    };
  }

  private profileToDb(profile: HostProfile): any {
    return {
      id: profile.id,
      host_id: profile.hostId,
      host_name: profile.hostName,
      total_shows: profile.totalShows,
      total_questions_generated: profile.totalQuestionsGenerated,
      total_questions_asked: profile.totalQuestionsAsked,
      total_questions_ignored: profile.totalQuestionsIgnored,
      usage_rate: profile.usageRate,
      avg_time_to_use: profile.avgTimeToUse,
      avg_complexity: profile.avgComplexity,
      avg_length: profile.avgLength,
      preferred_style: profile.preferredStyle,
      topic_distribution: profile.topicDistribution,
      style_preferences: profile.stylePreferences,
      last_analyzed_at: profile.lastAnalyzedAt?.toISOString(),
      confidence_score: profile.confidenceScore,
      created_at: profile.createdAt.toISOString(),
      updated_at: profile.updatedAt.toISOString()
    };
  }
}
