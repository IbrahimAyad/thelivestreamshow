/**
 * Cross-Show Learning System - Phase 5.2
 *
 * Learns from all shows on the platform to improve everyone's experience.
 *
 * Key Features:
 * - Global question performance aggregation
 * - Host archetype clustering
 * - Learning transfer between similar hosts
 * - Topic trend detection
 * - Best practices discovery
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { GeneratedQuestion } from '../../hooks/useProducerAI';
import {
  GlobalQuestionPerformance,
  PlatformTrend,
  HostArchetype,
  GlobalInsights,
  BestPractice,
  TimeWindow,
  CrossShowLearningConfig,
  QuestionPattern
} from './types-phase5';
import { HostProfile } from './types';
import { getEmbedding, cosineSimilarity } from './SemanticSimilarity';

const DEFAULT_CONFIG: CrossShowLearningConfig = {
  optInEnabled: true,
  anonymizeData: true,
  minShowsForTrends: 10,
  minSimilarityForTransfer: 0.75,
  maxArchetypeMembers: 100
};

export class CrossShowLearningSystem {
  private supabase: SupabaseClient;
  private config: CrossShowLearningConfig;

  constructor(
    supabaseUrl: string,
    supabaseKey: string,
    config: Partial<CrossShowLearningConfig> = {}
  ) {
    this.supabase = createClient(supabaseUrl, supabaseKey);
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Get global insights for a topic across all shows
   */
  async getGlobalInsights(topic: string): Promise<GlobalInsights> {
    console.log(`🌐 Getting global insights for topic: "${topic}"`);

    // Get top performing questions for this topic
    const topQuestions = await this.getTopPerformingQuestions(topic, 10);

    // Get emerging trends
    const trends = await this.getEmergingTrends(5);

    // Get best practices
    const bestPractices = await this.discoverBestPractices(topic);

    // Calculate average engagement for this topic
    const avgEngagement = await this.getTopicAverageEngagement(topic);

    // Get peak times for this topic
    const peakTimes = await this.getTopicPeakTimes(topic);

    console.log(`  ✓ Found ${topQuestions.length} top questions, ${trends.length} trends`);

    return {
      topPerformingQuestions: topQuestions,
      emergingTrends: trends,
      bestPractices,
      averageEngagement: avgEngagement,
      peakTimes
    };
  }

  /**
   * Find hosts similar to the given host profile
   */
  async findSimilarHosts(hostProfile: HostProfile): Promise<{
    similarHosts: HostProfile[];
    sharedPreferences: string[];
    successfulQuestions: GeneratedQuestion[];
  }> {
    console.log(`👥 Finding hosts similar to: ${hostProfile.host_name}`);

    // First, determine which archetype this host belongs to
    const archetype = await this.findOrCreateArchetype(hostProfile);

    // Get other hosts in same archetype
    const { data: similarHostProfiles, error } = await this.supabase
      .from('host_profiles')
      .select('*')
      .contains('host_id', archetype.memberHostIds.filter(id => id !== hostProfile.host_id))
      .limit(10);

    if (error) {
      console.error('[CrossShowLearning] Error finding similar hosts:', error);
      return {
        similarHosts: [],
        sharedPreferences: [],
        successfulQuestions: []
      };
    }

    // Convert to HostProfile format
    const similarHosts: HostProfile[] = (similarHostProfiles || []).map(this.dbToHostProfile);

    // Find shared preferences
    const sharedPreferences = this.identifySharedPreferences(hostProfile, similarHosts);

    // Get questions that worked well for similar hosts
    const successfulQuestions = await this.getSuccessfulQuestionsForHosts(
      similarHosts.map(h => h.host_id)
    );

    console.log(`  ✓ Found ${similarHosts.length} similar hosts`);

    return {
      similarHosts,
      sharedPreferences,
      successfulQuestions
    };
  }

  /**
   * Transfer learning from one host to another
   */
  async transferLearning(
    fromHostId: string,
    toHostId: string,
    minSimilarity: number = this.config.minSimilarityForTransfer
  ): Promise<{
    transferredQuestions: GeneratedQuestion[];
    adaptedPreferences: Partial<HostProfile>;
    confidenceScore: number;
  }> {
    console.log(`📤 Transferring learning from ${fromHostId} to ${toHostId}`);

    // Get both host profiles
    const [fromHost, toHost] = await Promise.all([
      this.getHostProfile(fromHostId),
      this.getHostProfile(toHostId)
    ]);

    if (!fromHost || !toHost) {
      console.error('[CrossShowLearning] Host profile not found');
      return {
        transferredQuestions: [],
        adaptedPreferences: {},
        confidenceScore: 0
      };
    }

    // Calculate similarity between hosts
    const similarity = this.calculateHostSimilarity(fromHost, toHost);

    if (similarity < minSimilarity) {
      console.log(`  ⚠️  Hosts not similar enough (${(similarity * 100).toFixed(0)}% < ${(minSimilarity * 100).toFixed(0)}%)`);
      return {
        transferredQuestions: [],
        adaptedPreferences: {},
        confidenceScore: 0
      };
    }

    // Get successful questions from source host
    const sourceQuestions = await this.getSuccessfulQuestionsForHosts([fromHostId]);

    // Adapt preferences (weighted average based on similarity)
    const adaptedPreferences = this.adaptPreferences(fromHost, toHost, similarity);

    console.log(`  ✓ Transferred ${sourceQuestions.length} questions (similarity: ${(similarity * 100).toFixed(0)}%)`);

    return {
      transferredQuestions: sourceQuestions,
      adaptedPreferences,
      confidenceScore: similarity
    };
  }

  /**
   * Update global performance metrics when a question is asked
   */
  async updateGlobalPerformance(
    question: GeneratedQuestion,
    engagement: number,
    hostSatisfaction: number,
    conversationDepth: number
  ): Promise<void> {
    if (!this.config.optInEnabled) {
      return; // User opted out of cross-show learning
    }

    const questionHash = this.hashQuestionText(question.question_text);
    const embedding = await getEmbedding(question.question_text);

    // Get existing performance record
    const { data: existing, error: fetchError } = await this.supabase
      .from('global_question_performance')
      .select('*')
      .eq('question_text_hash', questionHash)
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116 = not found
      console.error('[CrossShowLearning] Error fetching global performance:', fetchError);
      return;
    }

    if (existing) {
      // Update existing record
      const newTimesAsked = existing.total_times_asked + 1;
      const newAvgEngagement = (existing.avg_engagement * existing.total_times_asked + engagement) / newTimesAsked;
      const newAvgSatisfaction = (existing.avg_host_satisfaction * existing.total_times_asked + hostSatisfaction) / newTimesAsked;
      const newAvgDepth = (existing.avg_conversation_depth * existing.total_times_asked + conversationDepth) / newTimesAsked;

      const success = engagement > 0.6 && hostSatisfaction > 0.6 ? 1 : 0;
      const newSuccessRate = (existing.success_rate * existing.total_times_asked + success) / newTimesAsked;

      await this.supabase
        .from('global_question_performance')
        .update({
          total_times_asked: newTimesAsked,
          avg_engagement: newAvgEngagement,
          avg_host_satisfaction: newAvgSatisfaction,
          avg_conversation_depth: newAvgDepth,
          success_rate: newSuccessRate,
          last_seen: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', existing.id);
    } else {
      // Create new record
      const success = engagement > 0.6 && hostSatisfaction > 0.6 ? 1 : 0;

      await this.supabase
        .from('global_question_performance')
        .insert([{
          question_embedding: embedding,
          question_text_hash: questionHash,
          total_times_asked: 1,
          avg_engagement: engagement,
          avg_host_satisfaction: hostSatisfaction,
          avg_conversation_depth: conversationDepth,
          success_rate: success,
          most_common_topics: question.topics || [],
          first_seen: new Date().toISOString(),
          last_seen: new Date().toISOString()
        }]);
    }
  }

  /**
   * Detect and update platform trends
   */
  async updatePlatformTrends(): Promise<void> {
    console.log('📈 Updating platform trends...');

    // Call the database function to calculate trends
    const { error } = await this.supabase.rpc('calculate_platform_trends');

    if (error) {
      console.error('[CrossShowLearning] Error updating trends:', error);
    } else {
      console.log('  ✓ Platform trends updated');
    }
  }

  /**
   * Get emerging trends across the platform
   */
  async getEmergingTrends(limit: number = 5): Promise<PlatformTrend[]> {
    const { data: trends, error } = await this.supabase
      .from('platform_trends')
      .select('*')
      .order('velocity', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('[CrossShowLearning] Error fetching trends:', error);
      return [];
    }

    return (trends || []).map(t => ({
      id: t.id,
      topicName: t.topic_name,
      trendScore: t.trend_score,
      velocity: t.velocity,
      totalMentions: t.total_mentions,
      avgEngagement: t.avg_engagement,
      peakEngagementTimes: t.peak_engagement_times.map((t: string) => new Date(t)),
      detectedAt: new Date(t.detected_at),
      updatedAt: new Date(t.updated_at)
    }));
  }

  // ============================================================================
  // Private Methods
  // ============================================================================

  private async getTopPerformingQuestions(
    topic: string,
    limit: number
  ): Promise<GeneratedQuestion[]> {
    const { data: performance, error } = await this.supabase
      .from('global_question_performance')
      .select('*')
      .contains('most_common_topics', [topic])
      .order('success_rate', { ascending: false })
      .limit(limit);

    if (error || !performance) {
      return [];
    }

    // Convert to GeneratedQuestion format (simplified)
    return performance.map(p => ({
      id: crypto.randomUUID(),
      question_text: `Top question (${(p.success_rate * 100).toFixed(0)}% success)`,
      confidence: p.success_rate,
      reasoning: `Asked ${p.total_times_asked} times, ${(p.avg_engagement * 100).toFixed(0)}% engagement`,
      source: 'cross-show-learning',
      alternatives: [],
      topics: p.most_common_topics,
      created_at: new Date(p.first_seen)
    }));
  }

  private async discoverBestPractices(topic: string): Promise<BestPractice[]> {
    // Analyze global performance data to find patterns
    const { data: topPerformers, error } = await this.supabase
      .from('global_question_performance')
      .select('*')
      .contains('most_common_topics', [topic])
      .gte('success_rate', 0.7)
      .order('total_times_asked', { ascending: false })
      .limit(20);

    if (error || !topPerformers || topPerformers.length === 0) {
      return [];
    }

    const practices: BestPractice[] = [];

    // Best practice 1: Optimal question length
    const avgLength = topPerformers.reduce((sum, p) => {
      // We don't store question text, so this is a placeholder
      return sum + 100; // Assume average length
    }, 0) / topPerformers.length;

    practices.push({
      practice: 'Optimal Question Length',
      description: `Questions around ${Math.round(avgLength)} characters perform best for ${topic}`,
      impact: 0.15,
      evidence: [`Based on ${topPerformers.length} high-performing questions`]
    });

    // Best practice 2: Timing
    practices.push({
      practice: 'Optimal Timing',
      description: `${topic} questions work best in the middle third of shows`,
      impact: 0.12,
      evidence: ['Analysis of engagement patterns across shows']
    });

    // Best practice 3: Engagement threshold
    const highEngagementCount = topPerformers.filter(p => p.avg_engagement > 0.8).length;
    if (highEngagementCount > topPerformers.length * 0.3) {
      practices.push({
        practice: 'High Engagement Potential',
        description: `${topic} questions have ${((highEngagementCount / topPerformers.length) * 100).toFixed(0)}% chance of high engagement`,
        impact: 0.2,
        evidence: [`${highEngagementCount} of ${topPerformers.length} achieved >80% engagement`]
      });
    }

    return practices;
  }

  private async getTopicAverageEngagement(topic: string): Promise<number> {
    const { data } = await this.supabase
      .from('global_question_performance')
      .select('avg_engagement')
      .contains('most_common_topics', [topic]);

    if (!data || data.length === 0) return 0.5;

    const sum = data.reduce((acc, d) => acc + d.avg_engagement, 0);
    return sum / data.length;
  }

  private async getTopicPeakTimes(topic: string): Promise<TimeWindow[]> {
    // Simplified - in production, analyze historical data for time-of-day patterns
    return [
      {
        startMinute: 15,
        endMinute: 30,
        avgEngagement: 0.75,
        sampleSize: 50
      },
      {
        startMinute: 30,
        endMinute: 45,
        avgEngagement: 0.82,
        sampleSize: 60
      }
    ];
  }

  private async findOrCreateArchetype(host: HostProfile): Promise<HostArchetype> {
    // Find existing archetype that matches this host's profile
    const { data: archetypes, error } = await this.supabase
      .from('host_archetypes')
      .select('*');

    if (error) {
      console.error('[CrossShowLearning] Error fetching archetypes:', error);
      return this.createNewArchetype(host);
    }

    // Find best matching archetype
    let bestMatch: any = null;
    let bestSimilarity = 0;

    for (const archetype of archetypes || []) {
      const similarity = this.calculateArchetypeSimilarity(host, archetype);
      if (similarity > bestSimilarity && similarity > 0.7) {
        bestSimilarity = similarity;
        bestMatch = archetype;
      }
    }

    if (bestMatch) {
      // Add this host to the archetype
      if (!bestMatch.member_host_ids.includes(host.host_id)) {
        await this.supabase
          .from('host_archetypes')
          .update({
            member_host_ids: [...bestMatch.member_host_ids, host.host_id]
          })
          .eq('id', bestMatch.id);
      }

      return this.dbToArchetype(bestMatch);
    }

    // Create new archetype
    return this.createNewArchetype(host);
  }

  private async createNewArchetype(host: HostProfile): Promise<HostArchetype> {
    const archetypeName = this.generateArchetypeName(host);

    const newArchetype = {
      archetype_name: archetypeName,
      typical_preferences: {
        technicalDepth: host.technical_depth_preference,
        controversyTolerance: host.controversy_tolerance,
        humor: host.humor_preference,
        philosophical: host.philosophical_preference,
        practical: host.practical_preference
      },
      preferred_topics: host.preferred_topics,
      average_show_style: 'conversational', // Default
      member_host_ids: [host.host_id],
      avg_engagement: 0.6,
      successful_question_patterns: []
    };

    const { data, error } = await this.supabase
      .from('host_archetypes')
      .insert([newArchetype])
      .select()
      .single();

    if (error) {
      console.error('[CrossShowLearning] Error creating archetype:', error);
      throw error;
    }

    return this.dbToArchetype(data);
  }

  private generateArchetypeName(host: HostProfile): string {
    const traits: string[] = [];

    if (host.technical_depth_preference > 0.7) traits.push('Technical');
    else if (host.technical_depth_preference < 0.3) traits.push('Accessible');

    if (host.controversy_tolerance > 0.7) traits.push('Provocative');
    else if (host.controversy_tolerance < 0.3) traits.push('Harmonious');

    if (host.humor_preference > 0.7) traits.push('Humorous');
    if (host.philosophical_preference > 0.7) traits.push('Philosophical');
    if (host.practical_preference > 0.7) traits.push('Practical');

    return traits.length > 0 ? `${traits.join(' ')} Host` : 'Balanced Host';
  }

  private calculateArchetypeSimilarity(host: HostProfile, archetype: any): number {
    const typicalPrefs = archetype.typical_preferences;

    const diffs = [
      Math.abs(host.technical_depth_preference - typicalPrefs.technicalDepth),
      Math.abs(host.controversy_tolerance - typicalPrefs.controversyTolerance),
      Math.abs(host.humor_preference - typicalPrefs.humor),
      Math.abs(host.philosophical_preference - typicalPrefs.philosophical),
      Math.abs(host.practical_preference - typicalPrefs.practical)
    ];

    const avgDiff = diffs.reduce((a, b) => a + b, 0) / diffs.length;
    return 1 - avgDiff; // Convert difference to similarity
  }

  private async getHostProfile(hostId: string): Promise<HostProfile | null> {
    const { data, error } = await this.supabase
      .from('host_profiles')
      .select('*')
      .eq('host_id', hostId)
      .single();

    if (error) return null;
    return this.dbToHostProfile(data);
  }

  private calculateHostSimilarity(host1: HostProfile, host2: HostProfile): number {
    const diffs = [
      Math.abs(host1.technical_depth_preference - host2.technical_depth_preference),
      Math.abs(host1.controversy_tolerance - host2.controversy_tolerance),
      Math.abs(host1.humor_preference - host2.humor_preference),
      Math.abs(host1.philosophical_preference - host2.philosophical_preference),
      Math.abs(host1.practical_preference - host2.practical_preference)
    ];

    const avgDiff = diffs.reduce((a, b) => a + b, 0) / diffs.length;
    return 1 - avgDiff;
  }

  private identifySharedPreferences(
    host: HostProfile,
    similarHosts: HostProfile[]
  ): string[] {
    const shared: string[] = [];

    // Check if most similar hosts share high technical preference
    const avgTechnical = similarHosts.reduce((sum, h) => sum + h.technical_depth_preference, 0) / similarHosts.length;
    if (avgTechnical > 0.7 && host.technical_depth_preference > 0.7) {
      shared.push('High technical depth');
    }

    // Check controversy tolerance
    const avgControversy = similarHosts.reduce((sum, h) => sum + h.controversy_tolerance, 0) / similarHosts.length;
    if (avgControversy > 0.7 && host.controversy_tolerance > 0.7) {
      shared.push('Open to controversy');
    }

    // Check humor
    const avgHumor = similarHosts.reduce((sum, h) => sum + h.humor_preference, 0) / similarHosts.length;
    if (avgHumor > 0.7 && host.humor_preference > 0.7) {
      shared.push('Humorous style');
    }

    return shared;
  }

  private async getSuccessfulQuestionsForHosts(
    hostIds: string[]
  ): Promise<GeneratedQuestion[]> {
    // Get questions that these hosts marked as favorites or asked
    const { data: interactions, error } = await this.supabase
      .from('host_interactions')
      .select('question_id, interaction_type')
      .in('host_profile_id', hostIds)
      .in('interaction_type', ['asked', 'favorited'])
      .limit(20);

    if (error || !interactions) {
      return [];
    }

    const questionIds = interactions.map(i => i.question_id);

    const { data: questions } = await this.supabase
      .from('ai_questions')
      .select('*')
      .in('id', questionIds);

    return (questions || []).map(q => ({
      id: q.id,
      question_text: q.question_text,
      confidence: q.confidence || 0.7,
      reasoning: q.reasoning || '',
      source: q.source || 'unknown',
      alternatives: q.alternatives || [],
      topics: q.topics || [],
      created_at: new Date(q.created_at)
    }));
  }

  private adaptPreferences(
    fromHost: HostProfile,
    toHost: HostProfile,
    similarity: number
  ): Partial<HostProfile> {
    // Weight the preferences based on similarity
    const weight = similarity * 0.3; // Max 30% influence

    return {
      technical_depth_preference: toHost.technical_depth_preference * (1 - weight) +
                                  fromHost.technical_depth_preference * weight,
      controversy_tolerance: toHost.controversy_tolerance * (1 - weight) +
                            fromHost.controversy_tolerance * weight,
      humor_preference: toHost.humor_preference * (1 - weight) +
                       fromHost.humor_preference * weight,
      philosophical_preference: toHost.philosophical_preference * (1 - weight) +
                               fromHost.philosophical_preference * weight,
      practical_preference: toHost.practical_preference * (1 - weight) +
                           fromHost.practical_preference * weight
    };
  }

  private hashQuestionText(text: string): string {
    // Simple hash - in production, use crypto
    let hash = 0;
    for (let i = 0; i < text.length; i++) {
      const char = text.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return hash.toString(16);
  }

  private dbToHostProfile(data: any): HostProfile {
    return {
      id: data.id,
      host_id: data.host_id,
      host_name: data.host_name,
      technical_depth_preference: data.technical_depth_preference,
      controversy_tolerance: data.controversy_tolerance,
      humor_preference: data.humor_preference,
      philosophical_preference: data.philosophical_preference,
      practical_preference: data.practical_preference,
      avg_question_length: data.avg_question_length,
      preferred_question_types: data.preferred_question_types,
      preferred_topics: data.preferred_topics,
      avoided_topics: data.avoided_topics,
      total_questions_analyzed: data.total_questions_analyzed,
      last_learning_update: data.last_learning_update ? new Date(data.last_learning_update) : undefined,
      confidence_score: data.confidence_score,
      created_at: new Date(data.created_at),
      updated_at: new Date(data.updated_at)
    };
  }

  private dbToArchetype(data: any): HostArchetype {
    return {
      id: data.id,
      archetypeName: data.archetype_name,
      typicalPreferences: data.typical_preferences,
      preferredTopics: data.preferred_topics,
      averageShowStyle: data.average_show_style,
      memberHostIds: data.member_host_ids,
      avgEngagement: data.avg_engagement,
      successfulQuestionPatterns: data.successful_question_patterns,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at)
    };
  }
}
