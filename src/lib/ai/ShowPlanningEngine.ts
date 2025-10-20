/**
 * Show Planning Engine - Phase 5.4
 *
 * Automatically generates complete show plans with optimized pacing and segment structure.
 *
 * Key Features:
 * - Segment planning (opening, deep dive, conclusion, etc.)
 * - Pacing optimization
 * - Topic progression
 * - Time-aware planning
 * - Dynamic replanning during live shows
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { GeneratedQuestion } from '../../hooks/useProducerAI';
import {
  ShowPlan,
  ShowSegment,
  ShowPlanningParams,
  EngagementCurve,
  EngagementPoint,
  PlanChange,
  ShowPlanningConfig
} from './types-phase5';
import { PredictiveScoringEngine } from './PredictiveScoringEngine';
import { TopicClusteringEngine } from './TopicClusteringEngine';

const DEFAULT_CONFIG: ShowPlanningConfig = {
  minSegmentDuration: 10, // minutes
  maxSegmentDuration: 30, // minutes
  defaultSegments: ['opening', 'main-discussion', 'conclusion'],
  allowDynamicReplanning: true
};

export class ShowPlanningEngine {
  private supabase: SupabaseClient;
  private config: ShowPlanningConfig;
  private predictiveEngine?: PredictiveScoringEngine;
  private clusteringEngine?: TopicClusteringEngine;

  constructor(
    supabaseUrl: string,
    supabaseKey: string,
    config: Partial<ShowPlanningConfig> = {},
    predictiveEngine?: PredictiveScoringEngine,
    clusteringEngine?: TopicClusteringEngine
  ) {
    this.supabase = createClient(supabaseUrl, supabaseKey);
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.predictiveEngine = predictiveEngine;
    this.clusteringEngine = clusteringEngine;
  }

  /**
   * Generate a complete show plan
   */
  async generateShowPlan(params: ShowPlanningParams): Promise<ShowPlan> {
    console.log(`📝 Generating show plan: ${params.showLength}min, style: ${params.style}`);

    // Create segments based on show length and style
    const segments = await this.createSegments(params);

    // Predict engagement curve
    const predictedCurve = this.predictEngagementCurve(segments, params);

    // Generate contingency questions for each segment
    await this.addContingencyQuestions(segments);

    const plan: ShowPlan = {
      id: crypto.randomUUID(),
      showId: crypto.randomUUID(), // Will be updated with actual show ID
      segments,
      totalDuration: params.showLength,
      planningStyle: params.desiredPacing,
      mainTopics: params.mainTopics,
      originalPlan: JSON.parse(JSON.stringify(segments)), // Deep copy
      currentPlan: segments,
      planChanges: [],
      predictedEngagementCurve: predictedCurve.points,
      actualEngagementCurve: [],
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Save plan to database
    await this.savePlan(plan);

    console.log(`  ✓ Plan created with ${segments.length} segments, ${this.countTotalQuestions(segments)} total questions`);

    return plan;
  }

  /**
   * Adapt plan in real-time based on current engagement
   */
  async adaptPlanRealtime(
    planId: string,
    currentEngagement: number,
    elapsedTime: number
  ): Promise<{
    adjustedPlan: ShowPlan;
    changes: PlanChange[];
    reasoning: string;
  }> {
    console.log(`🔄 Adapting plan in real-time (engagement: ${(currentEngagement * 100).toFixed(0)}%, elapsed: ${elapsedTime}min)`);

    // Get current plan
    const { data: planData, error } = await this.supabase
      .from('show_plans')
      .select('*')
      .eq('id', planId)
      .single();

    if (error || !planData) {
      throw new Error('Plan not found');
    }

    const plan = this.dbToPlan(planData);

    // Analyze if adaptation is needed
    const needsAdaptation = this.assessNeedForAdaptation(
      plan,
      currentEngagement,
      elapsedTime
    );

    if (!needsAdaptation.needed) {
      console.log(`  ✓ No adaptation needed: ${needsAdaptation.reason}`);
      return {
        adjustedPlan: plan,
        changes: [],
        reasoning: needsAdaptation.reason
      };
    }

    // Make adaptations
    const changes: PlanChange[] = [];
    const adjustedSegments = [...plan.currentPlan];

    // Adaptation 1: Speed up if running behind and engagement is low
    if (currentEngagement < 0.4 && needsAdaptation.runningBehind) {
      const change = this.speedUpPlan(adjustedSegments, elapsedTime);
      changes.push(change);
    }

    // Adaptation 2: Extend if engagement is very high
    if (currentEngagement > 0.8 && !needsAdaptation.runningBehind) {
      const change = this.extendCurrentSegment(adjustedSegments, elapsedTime);
      changes.push(change);
    }

    // Adaptation 3: Change topic if engagement dropped significantly
    if (currentEngagement < 0.3) {
      const change = await this.switchTopic(adjustedSegments, plan.mainTopics);
      changes.push(change);
    }

    // Update plan
    plan.currentPlan = adjustedSegments;
    plan.planChanges = [...plan.planChanges, ...changes];
    plan.updatedAt = new Date();

    // Save updated plan
    await this.updatePlan(plan);

    const reasoning = changes.map(c => c.reason).join('; ');

    console.log(`  ✓ Plan adapted with ${changes.length} changes`);

    return {
      adjustedPlan: plan,
      changes,
      reasoning
    };
  }

  /**
   * Calculate plan effectiveness after show completes
   */
  async calculatePlanEffectiveness(
    planId: string,
    actualEngagementCurve: EngagementPoint[]
  ): Promise<number> {
    const { data: planData, error } = await this.supabase
      .from('show_plans')
      .select('*')
      .eq('id', planId)
      .single();

    if (error || !planData) {
      return 0;
    }

    const plan = this.dbToPlan(planData);
    const predictedCurve = plan.predictedEngagementCurve || [];

    if (predictedCurve.length === 0 || actualEngagementCurve.length === 0) {
      return 0.5; // Neutral score if missing data
    }

    // Calculate how well predictions matched reality
    let totalError = 0;
    let comparisons = 0;

    for (const actual of actualEngagementCurve) {
      // Find closest predicted point
      const predicted = this.findClosestPoint(predictedCurve, actual.minute);
      if (predicted) {
        const error = Math.abs(predicted.engagement - actual.engagement);
        totalError += error;
        comparisons++;
      }
    }

    const avgError = comparisons > 0 ? totalError / comparisons : 0.5;
    const effectiveness = Math.max(0, 1 - avgError);

    // Update plan with effectiveness score
    await this.supabase
      .from('show_plans')
      .update({
        actual_engagement_curve: actualEngagementCurve,
        plan_effectiveness: effectiveness
      })
      .eq('id', planId);

    console.log(`📊 Plan effectiveness: ${(effectiveness * 100).toFixed(0)}%`);

    return effectiveness;
  }

  // ============================================================================
  // Private Methods
  // ============================================================================

  /**
   * Create segments based on show parameters
   */
  private async createSegments(params: ShowPlanningParams): Promise<ShowSegment[]> {
    const segments: ShowSegment[] = [];
    let remainingTime = params.showLength;

    // Segment 1: Opening (10-15% of show)
    const openingDuration = Math.round(params.showLength * 0.12);
    segments.push({
      name: 'Opening',
      duration: openingDuration,
      questions: [], // Will be populated
      targetEngagement: 'warm-up',
      pacing: params.desiredPacing === 'energetic' ? 'fast' : 'medium',
      topics: params.mainTopics.slice(0, 1)
    });
    remainingTime -= openingDuration;

    // Segment 2-N: Main discussion segments
    const numMainSegments = Math.floor(remainingTime / 20); // ~20min segments
    const mainSegmentDuration = Math.floor(remainingTime * 0.7 / numMainSegments);

    for (let i = 0; i < numMainSegments; i++) {
      const topicIndex = i % params.mainTopics.length;
      segments.push({
        name: `Discussion: ${params.mainTopics[topicIndex]}`,
        duration: mainSegmentDuration,
        questions: [],
        targetEngagement: 'peak',
        pacing: params.desiredPacing === 'thoughtful' ? 'slow' : 'medium',
        topics: [params.mainTopics[topicIndex]]
      });
      remainingTime -= mainSegmentDuration;
    }

    // Final segment: Conclusion
    segments.push({
      name: 'Conclusion',
      duration: Math.max(5, remainingTime),
      questions: [],
      targetEngagement: 'wind-down',
      pacing: 'medium',
      topics: params.mainTopics
    });

    return segments;
  }

  /**
   * Predict engagement curve for the plan
   */
  private predictEngagementCurve(
    segments: ShowSegment[],
    params: ShowPlanningParams
  ): EngagementCurve {
    const points: EngagementPoint[] = [];
    let currentMinute = 0;

    for (const segment of segments) {
      // Add points throughout the segment
      const numPoints = Math.max(3, Math.floor(segment.duration / 5));

      for (let i = 0; i < numPoints; i++) {
        const minuteInSegment = (segment.duration / numPoints) * i;
        const minute = Math.floor(currentMinute + minuteInSegment);

        // Predict engagement based on segment target
        let baseEngagement = 0.5;
        if (segment.targetEngagement === 'warm-up') {
          baseEngagement = 0.5 + (i / numPoints) * 0.2; // Ramping up
        } else if (segment.targetEngagement === 'peak') {
          baseEngagement = 0.7 + Math.sin((i / numPoints) * Math.PI) * 0.15; // Peak in middle
        } else if (segment.targetEngagement === 'wind-down') {
          baseEngagement = 0.6 - (i / numPoints) * 0.2; // Winding down
        }

        points.push({
          minute,
          engagement: Math.max(0, Math.min(1, baseEngagement))
        });
      }

      currentMinute += segment.duration;
    }

    // Find peak and trough
    const sortedByEngagement = [...points].sort((a, b) => b.engagement - a.engagement);
    const peak = sortedByEngagement[0];
    const trough = sortedByEngagement[sortedByEngagement.length - 1];
    const avgEngagement = points.reduce((sum, p) => sum + p.engagement, 0) / points.length;

    return {
      points,
      predictedPeak: peak.minute,
      predictedTrough: trough.minute,
      predictedAverage: avgEngagement
    };
  }

  /**
   * Add contingency questions to segments
   */
  private async addContingencyQuestions(segments: ShowSegment[]): Promise<void> {
    // In a full implementation, this would generate questions for each segment
    // For now, just placeholder questions

    for (const segment of segments) {
      const numQuestions = Math.floor(segment.duration / 5); // ~1 question per 5 min

      for (let i = 0; i < numQuestions; i++) {
        segment.questions.push({
          id: crypto.randomUUID(),
          question_text: `${segment.name} question ${i + 1} about ${segment.topics.join(', ')}`,
          confidence: 0.7,
          reasoning: 'Planned segment question',
          source: 'show-planning',
          alternatives: [],
          topics: segment.topics,
          created_at: new Date()
        });
      }
    }
  }

  /**
   * Assess if plan needs real-time adaptation
   */
  private assessNeedForAdaptation(
    plan: ShowPlan,
    currentEngagement: number,
    elapsedTime: number
  ): { needed: boolean; reason: string; runningBehind: boolean } {
    // Check if we're running behind schedule
    const expectedProgress = elapsedTime / plan.totalDuration;
    let actualProgress = 0;
    let accumulatedTime = 0;

    for (const segment of plan.currentPlan) {
      if (accumulatedTime + segment.duration > elapsedTime) {
        break;
      }
      accumulatedTime += segment.duration;
      actualProgress = accumulatedTime / plan.totalDuration;
    }

    const runningBehind = actualProgress < expectedProgress - 0.1;

    // Check engagement against predictions
    const expectedEngagement = this.getExpectedEngagement(plan, elapsedTime);
    const engagementDelta = Math.abs(currentEngagement - expectedEngagement);

    if (engagementDelta > 0.3) {
      return {
        needed: true,
        reason: `Engagement significantly ${currentEngagement > expectedEngagement ? 'higher' : 'lower'} than expected`,
        runningBehind
      };
    }

    if (runningBehind && currentEngagement < 0.5) {
      return {
        needed: true,
        reason: 'Running behind schedule with low engagement',
        runningBehind: true
      };
    }

    return {
      needed: false,
      reason: 'Plan is on track',
      runningBehind
    };
  }

  /**
   * Speed up the plan by shortening segments
   */
  private speedUpPlan(segments: ShowSegment[], elapsedTime: number): PlanChange {
    // Find upcoming segments and reduce their duration
    let totalReduction = 0;

    for (const segment of segments) {
      if (segment.duration > this.config.minSegmentDuration) {
        const reduction = Math.min(5, segment.duration - this.config.minSegmentDuration);
        segment.duration -= reduction;
        totalReduction += reduction;
      }
    }

    return {
      timestamp: new Date(),
      changeType: 'change_segment',
      reason: 'Speeding up plan due to low engagement and time pressure',
      impact: `Reduced total duration by ${totalReduction} minutes`
    };
  }

  /**
   * Extend current segment due to high engagement
   */
  private extendCurrentSegment(segments: ShowSegment[], elapsedTime: number): PlanChange {
    // Find current segment
    let accumulatedTime = 0;
    let currentSegment: ShowSegment | null = null;

    for (const segment of segments) {
      if (accumulatedTime <= elapsedTime && accumulatedTime + segment.duration > elapsedTime) {
        currentSegment = segment;
        break;
      }
      accumulatedTime += segment.duration;
    }

    if (currentSegment && currentSegment.duration < this.config.maxSegmentDuration) {
      const extension = Math.min(5, this.config.maxSegmentDuration - currentSegment.duration);
      currentSegment.duration += extension;

      return {
        timestamp: new Date(),
        changeType: 'change_segment',
        reason: 'Extending segment due to high engagement',
        impact: `Extended "${currentSegment.name}" by ${extension} minutes`
      };
    }

    return {
      timestamp: new Date(),
      changeType: 'change_segment',
      reason: 'No extension needed',
      impact: 'No change'
    };
  }

  /**
   * Switch to a different topic
   */
  private async switchTopic(
    segments: ShowSegment[],
    availableTopics: string[]
  ): Promise<PlanChange> {
    // Find upcoming segment
    const upcomingSegment = segments[Math.floor(segments.length / 2)];

    if (upcomingSegment) {
      // Choose a different topic
      const currentTopics = new Set(upcomingSegment.topics);
      const newTopic = availableTopics.find(t => !currentTopics.has(t)) || availableTopics[0];

      upcomingSegment.topics = [newTopic];
      upcomingSegment.name = `Discussion: ${newTopic}`;

      return {
        timestamp: new Date(),
        changeType: 'change_segment',
        reason: 'Switching topic due to low engagement',
        impact: `Changed topic to "${newTopic}"`
      };
    }

    return {
      timestamp: new Date(),
      changeType: 'change_segment',
      reason: 'No topic switch needed',
      impact: 'No change'
    };
  }

  /**
   * Get expected engagement for a given minute
   */
  private getExpectedEngagement(plan: ShowPlan, minute: number): number {
    const points = plan.predictedEngagementCurve || [];
    const closest = this.findClosestPoint(points, minute);
    return closest?.engagement || 0.5;
  }

  /**
   * Find closest engagement point to a minute
   */
  private findClosestPoint(
    points: EngagementPoint[],
    targetMinute: number
  ): EngagementPoint | null {
    if (points.length === 0) return null;

    let closest = points[0];
    let minDiff = Math.abs(points[0].minute - targetMinute);

    for (const point of points) {
      const diff = Math.abs(point.minute - targetMinute);
      if (diff < minDiff) {
        minDiff = diff;
        closest = point;
      }
    }

    return closest;
  }

  /**
   * Count total questions across all segments
   */
  private countTotalQuestions(segments: ShowSegment[]): number {
    return segments.reduce((sum, seg) => sum + seg.questions.length, 0);
  }

  /**
   * Save plan to database
   */
  private async savePlan(plan: ShowPlan): Promise<void> {
    const { error } = await this.supabase
      .from('show_plans')
      .insert([{
        id: plan.id,
        show_id: plan.showId,
        segments: plan.segments,
        total_duration: plan.totalDuration,
        planning_style: plan.planningStyle,
        main_topics: plan.mainTopics,
        original_plan: plan.originalPlan,
        current_plan: plan.currentPlan,
        plan_changes: plan.planChanges,
        predicted_engagement_curve: plan.predictedEngagementCurve,
        actual_engagement_curve: plan.actualEngagementCurve,
        created_at: plan.createdAt.toISOString(),
        updated_at: plan.updatedAt.toISOString()
      }]);

    if (error) {
      console.error('[ShowPlanning] Error saving plan:', error);
    }
  }

  /**
   * Update existing plan
   */
  private async updatePlan(plan: ShowPlan): Promise<void> {
    const { error } = await this.supabase
      .from('show_plans')
      .update({
        current_plan: plan.currentPlan,
        plan_changes: plan.planChanges,
        updated_at: plan.updatedAt.toISOString()
      })
      .eq('id', plan.id);

    if (error) {
      console.error('[ShowPlanning] Error updating plan:', error);
    }
  }

  /**
   * Convert database record to ShowPlan
   */
  private dbToPlan(data: any): ShowPlan {
    return {
      id: data.id,
      showId: data.show_id,
      segments: data.segments,
      totalDuration: data.total_duration,
      planningStyle: data.planning_style,
      mainTopics: data.main_topics,
      originalPlan: data.original_plan,
      currentPlan: data.current_plan,
      planChanges: data.plan_changes || [],
      predictedEngagementCurve: data.predicted_engagement_curve || [],
      actualEngagementCurve: data.actual_engagement_curve || [],
      planEffectiveness: data.plan_effectiveness,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at)
    };
  }
}
