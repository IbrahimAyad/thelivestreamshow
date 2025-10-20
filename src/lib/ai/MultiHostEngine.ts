/**
 * Multi-Host Conversation Engine - Phase 5.3
 *
 * Supports panel discussions and multi-host shows with intelligent question routing.
 *
 * Key Features:
 * - Question routing to appropriate hosts
 * - Participation balancing
 * - Multi-perspective question generation
 * - Turn management suggestions
 * - Host expertise matching
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { GeneratedQuestion } from '../../hooks/useProducerAI';
import {
  QuestionRouting,
  MultiHostShow,
  HostParticipationMetrics,
  MultiHostQuestion,
  MultiHostConfig
} from './types-phase5';
import { HostProfile } from './types';

const DEFAULT_CONFIG: MultiHostConfig = {
  minRoutingConfidence: 0.6,
  balanceThreshold: 0.2, // 20% deviation allowed
  maxHosts: 4
};

export class MultiHostEngine {
  private supabase: SupabaseClient;
  private config: MultiHostConfig;

  constructor(
    supabaseUrl: string,
    supabaseKey: string,
    config: Partial<MultiHostConfig> = {}
  ) {
    this.supabase = createClient(supabaseUrl, supabaseKey);
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Route a question to the most appropriate host
   */
  async routeQuestion(
    question: GeneratedQuestion,
    hosts: HostProfile[]
  ): Promise<QuestionRouting> {
    console.log(`🎯 Routing question to best host among ${hosts.length} hosts`);

    if (hosts.length === 0) {
      throw new Error('No hosts provided for routing');
    }

    if (hosts.length === 1) {
      // Only one host, trivial routing
      return {
        question,
        primaryHost: hosts[0].host_id,
        secondaryHosts: [],
        routingReasoning: 'Only one host available',
        routingConfidence: 1.0,
        expectedDynamics: {
          likelyAgreement: true,
          complementaryPerspectives: false,
          debatePotential: 0
        }
      };
    }

    // Score each host for this question
    const hostScores = hosts.map(host => ({
      host,
      score: this.calculateHostQuestionFit(host, question),
      reasoning: this.explainFitScore(host, question)
    }));

    // Sort by score
    hostScores.sort((a, b) => b.score - a.score);

    // Primary host is highest scored
    const primaryHost = hostScores[0];

    // Secondary hosts are next 1-2 highest scored
    const secondaryHosts = hostScores
      .slice(1, 3)
      .filter(h => h.score > 0.5) // Only include if reasonably relevant
      .map(h => h.host.host_id);

    // Predict expected dynamics
    const expectedDynamics = this.predictDynamics(
      primaryHost.host,
      secondaryHosts.map(id => hosts.find(h => h.host_id === id)!).filter(Boolean),
      question
    );

    const routing: QuestionRouting = {
      question,
      primaryHost: primaryHost.host.host_id,
      secondaryHosts,
      routingReasoning: primaryHost.reasoning,
      routingConfidence: primaryHost.score,
      expectedDynamics
    };

    console.log(`  ✓ Routed to ${primaryHost.host.host_name} (confidence: ${(primaryHost.score * 100).toFixed(0)}%)`);
    if (secondaryHosts.length > 0) {
      console.log(`    Secondary hosts: ${secondaryHosts.length}`);
    }

    return routing;
  }

  /**
   * Generate a question designed for multiple hosts
   */
  async generateMultiHostQuestion(
    hosts: HostProfile[],
    topic: string,
    openaiApiKey: string
  ): Promise<MultiHostQuestion> {
    console.log(`✨ Generating multi-host question for ${hosts.length} hosts on: "${topic}"`);

    // Analyze host profiles to find complementary perspectives
    const hostAnalysis = hosts.map(host => ({
      id: host.host_id,
      name: host.host_name,
      strengths: this.identifyHostStrengths(host),
      perspective: this.determineHostPerspective(host)
    }));

    // Generate question that involves multiple perspectives
    const prompt = this.buildMultiHostPrompt(hostAnalysis, topic);

    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${openaiApiKey}`
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            {
              role: 'system',
              content: 'You are an expert at generating questions for panel discussions that bring out diverse perspectives.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.8,
          max_tokens: 400,
          response_format: { type: 'json_object' }
        })
      });

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.statusText}`);
      }

      const data = await response.json();
      const result = JSON.parse(data.choices[0].message.content);

      return {
        question: result.question,
        hostRoles: new Map(Object.entries(result.hostRoles || {})),
        expectedInteraction: result.expectedInteraction || 'Multi-perspective discussion'
      };
    } catch (error) {
      console.error('[MultiHost] Error generating multi-host question:', error);

      // Fallback: simple multi-host question
      return {
        question: `What are your different perspectives on ${topic}?`,
        hostRoles: new Map(hosts.map(h => [h.host_id, 'supporting'])),
        expectedInteraction: 'Each host shares their perspective'
      };
    }
  }

  /**
   * Analyze participation balance and suggest adjustments
   */
  async balanceParticipation(
    hosts: HostProfile[],
    recentQuestions: Array<{ questionId: string; targetHostId: string }>
  ): Promise<{
    underutilizedHosts: HostProfile[];
    recommendedNextHost: HostProfile;
    balanceScore: number;
  }> {
    console.log(`⚖️  Analyzing participation balance for ${hosts.length} hosts`);

    // Count questions per host
    const questionCounts = new Map<string, number>();
    hosts.forEach(host => questionCounts.set(host.host_id, 0));

    recentQuestions.forEach(q => {
      const current = questionCounts.get(q.targetHostId) || 0;
      questionCounts.set(q.targetHostId, current + 1);
    });

    // Calculate balance score (1.0 = perfect balance)
    const counts = Array.from(questionCounts.values());
    const avg = counts.reduce((a, b) => a + b, 0) / counts.length;
    const maxDeviation = Math.max(...counts.map(c => Math.abs(c - avg)));
    const balanceScore = avg > 0 ? 1 - (maxDeviation / avg) : 1.0;

    // Find underutilized hosts
    const underutilizedHosts = hosts
      .filter(host => {
        const count = questionCounts.get(host.host_id) || 0;
        return count < avg * (1 - this.config.balanceThreshold);
      })
      .sort((a, b) => {
        const aCount = questionCounts.get(a.host_id) || 0;
        const bCount = questionCounts.get(b.host_id) || 0;
        return aCount - bCount;
      });

    // Recommend host with fewest questions
    const recommendedNextHost = underutilizedHosts[0] || hosts[0];

    console.log(`  Balance score: ${(balanceScore * 100).toFixed(0)}%`);
    console.log(`  Underutilized hosts: ${underutilizedHosts.length}`);

    return {
      underutilizedHosts,
      recommendedNextHost,
      balanceScore
    };
  }

  /**
   * Get participation metrics for a multi-host show
   */
  async getParticipationMetrics(showId: string): Promise<HostParticipationMetrics[]> {
    // Get multi-host show data
    const { data: show, error: showError } = await this.supabase
      .from('multi_host_shows')
      .select('*')
      .eq('show_id', showId)
      .single();

    if (showError || !show) {
      console.error('[MultiHost] Show not found:', showError);
      return [];
    }

    // Get question routing history
    const { data: routings, error: routingError } = await this.supabase
      .from('question_routing_history')
      .select('*')
      .eq('show_id', showId);

    if (routingError || !routings) {
      console.error('[MultiHost] Error fetching routings:', routingError);
      return [];
    }

    // Calculate metrics per host
    const metrics: HostParticipationMetrics[] = show.host_ids.map((hostId: string) => {
      const hostRoutings = routings.filter(r => r.routed_to_host_id === hostId);
      const actuallyAnswered = routings.filter(r => r.actual_responder_host_id === hostId);

      return {
        hostId,
        questionsReceived: hostRoutings.length,
        questionsAnswered: actuallyAnswered.length,
        avgResponseLength: 0, // Would need response text data
        totalSpeakingTime: 0, // Would need timing data
        participationShare: hostRoutings.length / routings.length
      };
    });

    return metrics;
  }

  /**
   * Record actual routing outcome for learning
   */
  async recordRoutingOutcome(
    questionId: string,
    showId: string,
    routedToHostId: string,
    actualResponderHostId: string,
    routingReasoning: string,
    routingConfidence: number
  ): Promise<void> {
    // Calculate routing accuracy (1.0 if correct, 0.0 if wrong)
    const accuracy = routedToHostId === actualResponderHostId ? 1.0 : 0.0;

    const { error } = await this.supabase
      .from('question_routing_history')
      .insert([{
        question_id: questionId,
        show_id: showId,
        routed_to_host_id: routedToHostId,
        actual_responder_host_id: actualResponderHostId,
        routing_reasoning: routingReasoning,
        routing_confidence: routingConfidence,
        routing_accuracy: accuracy
      }]);

    if (error) {
      console.error('[MultiHost] Error recording routing outcome:', error);
    } else {
      console.log(`✅ Recorded routing outcome (accuracy: ${accuracy === 1 ? 'correct' : 'incorrect'})`);
    }
  }

  /**
   * Get routing accuracy statistics
   */
  async getRoutingStats(showId: string): Promise<{
    totalRoutings: number;
    avgAccuracy: number;
    avgConfidence: number;
    accuracyByHost: Map<string, number>;
  }> {
    const { data: routings, error } = await this.supabase
      .from('question_routing_history')
      .select('*')
      .eq('show_id', showId)
      .not('routing_accuracy', 'is', null);

    if (error || !routings || routings.length === 0) {
      return {
        totalRoutings: 0,
        avgAccuracy: 0,
        avgConfidence: 0,
        accuracyByHost: new Map()
      };
    }

    const avgAccuracy = routings.reduce((sum, r) => sum + r.routing_accuracy, 0) / routings.length;
    const avgConfidence = routings.reduce((sum, r) => sum + r.routing_confidence, 0) / routings.length;

    // Accuracy by host
    const accuracyByHost = new Map<string, number>();
    const hostGroups = new Map<string, number[]>();

    routings.forEach(r => {
      if (!hostGroups.has(r.routed_to_host_id)) {
        hostGroups.set(r.routed_to_host_id, []);
      }
      hostGroups.get(r.routed_to_host_id)!.push(r.routing_accuracy);
    });

    hostGroups.forEach((accuracies, hostId) => {
      const avg = accuracies.reduce((a, b) => a + b, 0) / accuracies.length;
      accuracyByHost.set(hostId, avg);
    });

    return {
      totalRoutings: routings.length,
      avgAccuracy,
      avgConfidence,
      accuracyByHost
    };
  }

  // ============================================================================
  // Private Methods
  // ============================================================================

  /**
   * Calculate how well a host fits a question
   */
  private calculateHostQuestionFit(host: HostProfile, question: GeneratedQuestion): number {
    let score = 0.5; // Base score

    // Topic match
    const questionTopics = question.topics || [];
    const hostTopics = host.preferred_topics || [];
    const topicOverlap = questionTopics.filter(qt => hostTopics.includes(qt)).length;
    const topicBonus = topicOverlap > 0 ? Math.min(0.3, topicOverlap * 0.1) : 0;
    score += topicBonus;

    // Technical level match
    const questionLength = question.question_text.length;
    const isTechnical = questionLength > 150 || questionTopics.some(t =>
      ['technical', 'science', 'technology', 'academic'].includes(t)
    );

    if (isTechnical && host.technical_depth_preference > 0.7) {
      score += 0.2;
    } else if (!isTechnical && host.technical_depth_preference < 0.3) {
      score += 0.1;
    }

    // Controversy match
    const isControversial = questionTopics.some(t =>
      ['politics', 'religion', 'controversy', 'debate'].includes(t)
    );

    if (isControversial && host.controversy_tolerance > 0.7) {
      score += 0.15;
    } else if (isControversial && host.controversy_tolerance < 0.3) {
      score -= 0.2; // Penalize if host doesn't like controversy
    }

    // Avoided topics penalty
    const avoidedTopics = host.avoided_topics || [];
    const hasAvoidedTopic = questionTopics.some(qt => avoidedTopics.includes(qt));
    if (hasAvoidedTopic) {
      score -= 0.3;
    }

    return Math.max(0, Math.min(1, score));
  }

  /**
   * Explain why a host was chosen
   */
  private explainFitScore(host: HostProfile, question: GeneratedQuestion): string {
    const reasons: string[] = [];

    const questionTopics = question.topics || [];
    const hostTopics = host.preferred_topics || [];
    const topicOverlap = questionTopics.filter(qt => hostTopics.includes(qt));

    if (topicOverlap.length > 0) {
      reasons.push(`Strong match on topics: ${topicOverlap.join(', ')}`);
    }

    const isTechnical = question.question_text.length > 150;
    if (isTechnical && host.technical_depth_preference > 0.7) {
      reasons.push('Prefers technical discussions');
    }

    const isControversial = questionTopics.some(t => ['politics', 'controversy'].includes(t));
    if (isControversial && host.controversy_tolerance > 0.7) {
      reasons.push('Comfortable with controversial topics');
    }

    if (reasons.length === 0) {
      reasons.push('General expertise and availability');
    }

    return reasons.join('; ');
  }

  /**
   * Predict conversation dynamics with multiple hosts
   */
  private predictDynamics(
    primaryHost: HostProfile,
    secondaryHosts: HostProfile[],
    question: GeneratedQuestion
  ): {
    likelyAgreement: boolean;
    complementaryPerspectives: boolean;
    debatePotential: number;
  } {
    if (secondaryHosts.length === 0) {
      return {
        likelyAgreement: true,
        complementaryPerspectives: false,
        debatePotential: 0
      };
    }

    // Check if hosts have similar preferences (likely to agree)
    const allHosts = [primaryHost, ...secondaryHosts];
    const avgTechnicalPref = allHosts.reduce((sum, h) => sum + h.technical_depth_preference, 0) / allHosts.length;
    const technicalVariance = allHosts.reduce((sum, h) =>
      sum + Math.pow(h.technical_depth_preference - avgTechnicalPref, 2), 0
    ) / allHosts.length;

    const likelyAgreement = technicalVariance < 0.1; // Low variance = similar views

    // Check if hosts have complementary strengths
    const technicalHosts = allHosts.filter(h => h.technical_depth_preference > 0.7).length;
    const practicalHosts = allHosts.filter(h => h.practical_preference > 0.7).length;
    const philosophicalHosts = allHosts.filter(h => h.philosophical_preference > 0.7).length;

    const complementaryPerspectives = (
      (technicalHosts > 0 && practicalHosts > 0) ||
      (philosophicalHosts > 0 && practicalHosts > 0)
    );

    // Debate potential based on controversy tolerance + topic
    const isControversial = (question.topics || []).some(t =>
      ['politics', 'religion', 'controversy'].includes(t)
    );

    const avgControversyTolerance = allHosts.reduce((sum, h) => sum + h.controversy_tolerance, 0) / allHosts.length;

    let debatePotential = 0;
    if (isControversial) {
      debatePotential = avgControversyTolerance; // Higher tolerance = more debate
    }
    if (!likelyAgreement) {
      debatePotential += 0.2; // Different perspectives increase debate potential
    }
    debatePotential = Math.min(1, debatePotential);

    return {
      likelyAgreement,
      complementaryPerspectives,
      debatePotential
    };
  }

  /**
   * Identify a host's strengths based on preferences
   */
  private identifyHostStrengths(host: HostProfile): string[] {
    const strengths: string[] = [];

    if (host.technical_depth_preference > 0.7) {
      strengths.push('Technical analysis');
    }
    if (host.practical_preference > 0.7) {
      strengths.push('Practical applications');
    }
    if (host.philosophical_preference > 0.7) {
      strengths.push('Philosophical depth');
    }
    if (host.humor_preference > 0.7) {
      strengths.push('Engaging presentation');
    }

    return strengths.length > 0 ? strengths : ['General expertise'];
  }

  /**
   * Determine a host's primary perspective
   */
  private determineHostPerspective(host: HostProfile): string {
    const prefs = [
      { name: 'technical', value: host.technical_depth_preference },
      { name: 'practical', value: host.practical_preference },
      { name: 'philosophical', value: host.philosophical_preference }
    ];

    prefs.sort((a, b) => b.value - a.value);

    return prefs[0].name;
  }

  /**
   * Build prompt for multi-host question generation
   */
  private buildMultiHostPrompt(
    hostAnalysis: Array<{ id: string; name: string; strengths: string[]; perspective: string }>,
    topic: string
  ): string {
    const hostDescriptions = hostAnalysis.map(h =>
      `- ${h.name}: ${h.strengths.join(', ')} (${h.perspective} perspective)`
    ).join('\n');

    return `Generate a discussion question about "${topic}" for a panel with these hosts:

${hostDescriptions}

The question should:
1. Allow each host to contribute from their unique perspective
2. Create an engaging multi-perspective discussion
3. Be specific enough to prompt different viewpoints
4. Encourage interaction between hosts

Return JSON with:
{
  "question": "the question text",
  "hostRoles": { "host_id": "lead|supporting|contrarian" },
  "expectedInteraction": "brief description of expected dynamics"
}`;
  }
}
