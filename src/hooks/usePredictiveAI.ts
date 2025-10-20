/**
 * usePredictiveAI Hook - Phase 5 Integration
 *
 * Integrates predictive intelligence engines into the Producer AI system
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { PredictiveScoringEngine } from '../lib/ai/PredictiveScoringEngine';
import { CrossShowLearningSystem } from '../lib/ai/CrossShowLearningSystem';
import { MultiHostEngine } from '../lib/ai/MultiHostEngine';
import { ShowPlanningEngine } from '../lib/ai/ShowPlanningEngine';
import { PerformanceAnalytics } from '../lib/ai/PerformanceAnalytics';
import type {
  QuestionPrediction,
  ShowHealth,
  Recommendation,
  ShowPlan,
  GlobalInsights
} from '../lib/ai/types-phase5';
import type { GeneratedQuestion } from './useProducerAI';

interface PredictiveAIConfig {
  enabled: boolean;
  showId: string;
  hostId: string;
  supabaseUrl: string;
  supabaseKey: string;
  openaiApiKey: string;

  // Feature flags
  enablePredictions: boolean;
  enableCrossShowLearning: boolean;
  enableMultiHost: boolean;
  enableShowPlanning: boolean;
  enableAnalytics: boolean;
}

interface PredictiveAIState {
  // Predictions
  predictions: QuestionPrediction[];
  showHealth: ShowHealth | null;
  recommendations: Recommendation[];

  // Cross-show learning
  globalInsights: GlobalInsights | null;
  similarHosts: string[];

  // Show planning
  showPlan: ShowPlan | null;
  planAdaptations: number;

  // Analytics
  topPerformingTopics: Array<{ topic: string; avgEngagement: number }>;
  successPatterns: {
    optimalLength?: { min: number; max: number };
    bestTopics?: string[];
    bestTiming?: number[];
  };

  // Status
  isInitialized: boolean;
  lastUpdate: Date | null;
}

const DEFAULT_CONFIG: PredictiveAIConfig = {
  enabled: false,
  showId: '',
  hostId: '',
  supabaseUrl: '',
  supabaseKey: '',
  openaiApiKey: '',
  enablePredictions: true,
  enableCrossShowLearning: true,
  enableMultiHost: false,
  enableShowPlanning: false,
  enableAnalytics: true
};

const DEFAULT_STATE: PredictiveAIState = {
  predictions: [],
  showHealth: null,
  recommendations: [],
  globalInsights: null,
  similarHosts: [],
  showPlan: null,
  planAdaptations: 0,
  topPerformingTopics: [],
  successPatterns: {},
  isInitialized: false,
  lastUpdate: null
};

export function usePredictiveAI(config: Partial<PredictiveAIConfig> = {}) {
  const [aiConfig, setAIConfig] = useState<PredictiveAIConfig>({
    ...DEFAULT_CONFIG,
    ...config
  });

  const [state, setState] = useState<PredictiveAIState>(DEFAULT_STATE);

  // Engine instances
  const engines = useRef<{
    predictive?: PredictiveScoringEngine;
    crossShow?: CrossShowLearningSystem;
    multiHost?: MultiHostEngine;
    showPlanning?: ShowPlanningEngine;
    analytics?: PerformanceAnalytics;
  }>({});

  /**
   * Initialize Phase 5 engines
   */
  const initializeEngines = useCallback(() => {
    if (!aiConfig.enabled || !aiConfig.supabaseUrl || !aiConfig.supabaseKey) {
      return;
    }

    try {
      // Initialize Predictive Scoring Engine
      if (aiConfig.enablePredictions && !engines.current.predictive) {
        engines.current.predictive = new PredictiveScoringEngine(
          aiConfig.supabaseUrl,
          aiConfig.supabaseKey
        );
      }

      // Initialize Cross-Show Learning System
      if (aiConfig.enableCrossShowLearning && !engines.current.crossShow) {
        engines.current.crossShow = new CrossShowLearningSystem(
          aiConfig.supabaseUrl,
          aiConfig.supabaseKey
        );
      }

      // Initialize Multi-Host Engine
      if (aiConfig.enableMultiHost && !engines.current.multiHost) {
        engines.current.multiHost = new MultiHostEngine(
          aiConfig.supabaseUrl,
          aiConfig.supabaseKey
        );
      }

      // Initialize Show Planning Engine
      if (aiConfig.enableShowPlanning && !engines.current.showPlanning) {
        engines.current.showPlanning = new ShowPlanningEngine(
          aiConfig.supabaseUrl,
          aiConfig.supabaseKey
        );
      }

      // Initialize Performance Analytics
      if (aiConfig.enableAnalytics && !engines.current.analytics) {
        engines.current.analytics = new PerformanceAnalytics(
          aiConfig.supabaseUrl,
          aiConfig.supabaseKey
        );
      }

      setState(prev => ({ ...prev, isInitialized: true }));
    } catch (error) {
      console.error('Failed to initialize Phase 5 engines:', error);
    }
  }, [aiConfig]);

  /**
   * Predict outcomes for a list of questions
   */
  const predictQuestions = useCallback(async (
    questions: GeneratedQuestion[],
    context: {
      currentTopic: string;
      showLengthMinutes: number;
      elapsedMinutes: number;
      currentEngagement: number;
    }
  ): Promise<QuestionPrediction[]> => {
    if (!engines.current.predictive || !aiConfig.enablePredictions) {
      return [];
    }

    try {
      const predictions: QuestionPrediction[] = [];

      for (const question of questions) {
        const showContext = {
          currentTopic: context.currentTopic,
          showLengthMinutes: context.showLengthMinutes,
          elapsedMinutes: context.elapsedMinutes,
          currentEngagement: context.currentEngagement,
          recentQuestionIds: [] // TODO: Get from history
        };

        const prediction = await engines.current.predictive.predictOutcome(
          question,
          showContext
        );

        predictions.push({
          question,
          predictedEngagement: prediction.predictedEngagement,
          predictedHostSatisfaction: prediction.predictedHostSatisfaction,
          riskLevel: prediction.riskLevel,
          riskFactors: prediction.riskFactors,
          optimalTiming: prediction.optimalTimingMinute < 5 ? 'now' :
                         prediction.optimalTimingMinute < 15 ? 'soon' : 'later',
          confidenceLevel: prediction.confidenceLevel,
          reasoning: prediction.riskFactors.map(rf => rf.factor).join(', ')
        });
      }

      setState(prev => ({
        ...prev,
        predictions: predictions.sort((a, b) =>
          b.predictedEngagement - a.predictedEngagement
        ),
        lastUpdate: new Date()
      }));

      return predictions;
    } catch (error) {
      console.error('Error predicting questions:', error);
      return [];
    }
  }, [aiConfig.enablePredictions]);

  /**
   * Calculate current show health
   */
  const calculateShowHealth = useCallback((
    currentEngagement: number,
    viewerCount: number,
    chatRate: number,
    showDuration: number
  ): ShowHealth => {
    // Simple show health calculation
    const engagementScore = Math.min(currentEngagement / 100, 1);
    const pacingScore = chatRate > 5 ? 0.8 : chatRate > 2 ? 0.6 : 0.4;
    const retentionScore = viewerCount > 50 ? 0.9 : viewerCount > 20 ? 0.7 : 0.5;

    const overallScore = (engagementScore * 0.5) + (pacingScore * 0.3) + (retentionScore * 0.2);

    const engagementTrend = currentEngagement > 70 ? 'rising' :
                           currentEngagement > 40 ? 'stable' : 'falling';

    const health: ShowHealth = {
      overallScore,
      engagementTrend,
      pacingScore,
      audienceRetention: retentionScore,
      riskFactors: overallScore < 0.4 ? ['Low engagement', 'Slow pacing'] : [],
      recommendations: overallScore < 0.4 ?
        ['Consider changing topics', 'Increase audience interaction'] : []
    };

    setState(prev => ({ ...prev, showHealth: health }));
    return health;
  }, []);

  /**
   * Generate recommendations based on current show state
   */
  const generateRecommendations = useCallback(async (
    currentEngagement: number,
    currentTopic: string,
    recentQuestions: GeneratedQuestion[]
  ): Promise<Recommendation[]> => {
    // Simple recommendation logic (can be enhanced with AI)
    const recommendations: Recommendation[] = [];

    // Low engagement recommendation
    if (currentEngagement < 40) {
      if (recentQuestions.length > 0) {
        recommendations.push({
          type: 'question',
          urgency: 'immediate',
          suggestedQuestion: recentQuestions[0],
          reasoning: 'Engagement is low. This high-scoring question may re-engage the audience.',
          expectedImpact: 0.3
        });
      }
    }

    // Topic variety recommendation
    if (recentQuestions.length >= 3) {
      const topicSet = new Set(recentQuestions.slice(-3).map(q =>
        q.metadata?.suggestedTopic || currentTopic
      ));

      if (topicSet.size === 1 && recentQuestions.length > 3) {
        recommendations.push({
          type: 'question',
          urgency: 'next',
          suggestedQuestion: recentQuestions.find(q =>
            q.metadata?.suggestedTopic !== currentTopic
          ) || recentQuestions[0],
          reasoning: 'Topic variety needed. Consider shifting to a different angle.',
          expectedImpact: 0.2
        });
      }
    }

    setState(prev => ({ ...prev, recommendations }));
    return recommendations;
  }, []);

  /**
   * Get global insights from cross-show learning
   */
  const getGlobalInsights = useCallback(async (topic: string): Promise<GlobalInsights | null> => {
    if (!engines.current.crossShow || !aiConfig.enableCrossShowLearning) {
      return null;
    }

    try {
      const insights = await engines.current.crossShow.getGlobalInsights(topic);
      setState(prev => ({ ...prev, globalInsights: insights }));
      return insights;
    } catch (error) {
      console.error('Error getting global insights:', error);
      return null;
    }
  }, [aiConfig.enableCrossShowLearning]);

  /**
   * Record actual outcome for prediction accuracy tracking
   */
  const recordQuestionOutcome = useCallback(async (
    questionId: string,
    predictionId: string,
    actualEngagement: number,
    actualHostSatisfaction: number,
    actualConversationDepth: number
  ): Promise<void> => {
    if (!engines.current.predictive) return;

    try {
      await engines.current.predictive.recordActualOutcome(
        predictionId,
        actualEngagement,
        actualHostSatisfaction,
        actualConversationDepth
      );

      // Also update global performance if cross-show learning is enabled
      if (engines.current.crossShow && aiConfig.enableCrossShowLearning) {
        // Find the question
        const question = state.predictions.find(p => p.question.id === questionId)?.question;
        if (question) {
          await engines.current.crossShow.updateGlobalPerformance(
            question,
            actualEngagement,
            actualHostSatisfaction,
            actualConversationDepth
          );
        }
      }

      // Update analytics if enabled
      if (engines.current.analytics && aiConfig.enableAnalytics) {
        await engines.current.analytics.analyzeQuestionSuccess(
          questionId,
          actualEngagement,
          actualHostSatisfaction,
          actualConversationDepth
        );
      }
    } catch (error) {
      console.error('Error recording question outcome:', error);
    }
  }, [aiConfig.enableCrossShowLearning, aiConfig.enableAnalytics, state.predictions]);

  /**
   * Load analytics and success patterns
   */
  const loadAnalytics = useCallback(async () => {
    if (!engines.current.analytics || !aiConfig.enableAnalytics) return;

    try {
      // Get optimal topics
      const topics = await engines.current.analytics.findOptimalTopics(aiConfig.hostId);

      // Get success patterns
      const patterns = await engines.current.analytics.identifySuccessPatterns();

      setState(prev => ({
        ...prev,
        topPerformingTopics: topics.map(t => ({
          topic: t.topic,
          avgEngagement: t.avgEngagement
        })),
        successPatterns: {
          optimalLength: patterns.lengthPattern,
          bestTopics: patterns.topicPatterns.slice(0, 5).map(p => p.topic),
          bestTiming: patterns.timingPatterns.map(p =>
            parseInt(p.timeRange.split('-')[0])
          )
        }
      }));
    } catch (error) {
      console.error('Error loading analytics:', error);
    }
  }, [aiConfig.hostId, aiConfig.enableAnalytics]);

  /**
   * Update configuration
   */
  const updateConfig = useCallback((updates: Partial<PredictiveAIConfig>) => {
    setAIConfig(prev => ({ ...prev, ...updates }));
  }, []);

  // Initialize engines when config changes
  useEffect(() => {
    if (aiConfig.enabled) {
      initializeEngines();
    }
  }, [aiConfig.enabled, initializeEngines]);

  // Load analytics on mount
  useEffect(() => {
    if (state.isInitialized && aiConfig.enableAnalytics) {
      loadAnalytics();
    }
  }, [state.isInitialized, aiConfig.enableAnalytics, loadAnalytics]);

  return {
    // Configuration
    config: aiConfig,
    updateConfig,

    // State
    ...state,

    // Actions
    predictQuestions,
    calculateShowHealth,
    generateRecommendations,
    getGlobalInsights,
    recordQuestionOutcome,
    loadAnalytics,

    // Engine access (for advanced use)
    engines: engines.current
  };
}
