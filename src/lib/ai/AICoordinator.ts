/**
 * AI Coordinator
 *
 * Central coordinator for all AI systems in the livestream application.
 * Responsibilities:
 * - Question validation and routing
 * - Production action coordination
 * - Conflict resolution
 * - Priority management
 * - Feedback loops
 */

import { supabase } from '../supabase';
import { BetaBotMoodManager, Mood, MoodSource } from './BetaBotMoodManager';
import { PredictiveScoringEngine } from './PredictiveScoringEngine';
import { HostProfileManager } from './HostProfileManager';
import { ContextMemoryManager } from './ContextMemoryManager';
import { HealthCheck } from './HealthCheck';
import { RateLimiterManager, createCoordinatorRateLimiters } from './RateLimiter';
import { captureError, addBreadcrumb, setMonitoringContext, reportCriticalError } from '../monitoring/sentry';
import { coordinatorLogger, logError } from '../logging/logger';
import type { GeneratedQuestion } from '../../hooks/useProducerAI';
import type { SuggestedAction} from './AIContextAnalyzer';

export interface AICoordinatorConfig {
  supabaseUrl: string;
  supabaseKey: string;
  hostId?: string;
  enablePredictions?: boolean;
  enableHostProfile?: boolean;
  enableContextMemory?: boolean;
  openaiApiKey?: string;
}

export interface QuestionSubmission {
  question: GeneratedQuestion;
  source: 'producer_ai' | 'betabot_conversation_helper' | 'manual';
  metadata?: Record<string, any>;
}

export interface SubmissionResult {
  status: 'approved' | 'flagged' | 'rejected' | 'error';
  reason?: string;
  questionId?: string;
  priority?: number;
  prediction?: any;
}

export interface ActionResult {
  status: 'executed' | 'blocked' | 'not_implemented' | 'error';
  reason?: string;
}

export interface ShowContext {
  episode_id?: string;
  segment_id?: string;
  currentTopic?: string;
  showLengthMinutes?: number;
  elapsedMinutes?: number;
  currentEngagement?: number;
}

export class AICoordinator {
  private config: AICoordinatorConfig;
  private moodManager: BetaBotMoodManager;
  private predictiveAI: PredictiveScoringEngine | null = null;
  private hostProfile: HostProfileManager | null = null;
  private contextMemory: ContextMemoryManager | null = null;
  private showContext: ShowContext = {};
  private isInitialized: boolean = false;

  // ✅ Day 10: Production hardening
  private healthCheck: HealthCheck;
  private rateLimiters: RateLimiterManager;

  constructor(config: AICoordinatorConfig) {
    this.config = config;
    this.moodManager = new BetaBotMoodManager();

    // ✅ Day 10: Initialize health check and rate limiters
    this.healthCheck = new HealthCheck(supabase);
    this.rateLimiters = createCoordinatorRateLimiters();

    coordinatorLogger.info('🎯 AICoordinator: Initializing...');
    coordinatorLogger.debug({
      enablePredictions: config.enablePredictions,
      enableHostProfile: config.enableHostProfile,
      enableContextMemory: config.enableContextMemory,
      hasHostId: !!config.hostId
    }, '   Config:');
  }

  /**
   * Initialize all sub-systems
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      coordinatorLogger.warn('⚠️ AICoordinator already initialized');
      return;
    }

    coordinatorLogger.info('🎯 AICoordinator: Initializing sub-systems...');

    try {
      addBreadcrumb('AICoordinator initialization started', 'coordinator', {
        enablePredictions: this.config.enablePredictions,
        enableHostProfile: this.config.enableHostProfile,
        enableContextMemory: this.config.enableContextMemory
      });

      // Initialize mood manager
      await this.moodManager.initialize();

      // Initialize Predictive AI if enabled
      if (this.config.enablePredictions) {
        this.predictiveAI = new PredictiveScoringEngine(
          this.config.supabaseUrl,
          this.config.supabaseKey
        );
        coordinatorLogger.info('✅ Predictive AI initialized');
      }

      // Initialize Host Profile Manager if enabled
      if (this.config.enableHostProfile && this.config.hostId) {
        this.hostProfile = new HostProfileManager(
          this.config.supabaseUrl,
          this.config.supabaseKey,
          {
            enabled: true,
            minShowsForConfidence: 3,
            topicTrackingLimit: 50,
            sessionTimeout: 24 * 60 // 24 hours
          }
        );
        await this.hostProfile.initializeForHost(this.config.hostId);
        coordinatorLogger.info('✅ Host Profile Manager initialized');
      }

      // Initialize Context Memory if enabled
      if (this.config.enableContextMemory) {
        this.contextMemory = new ContextMemoryManager(
          supabase,
          {
            enabled: true,
            maxRecentQuestions: 20,
            similarityThreshold: 0.85,
            cacheTimeout: 24 * 60 // 24 hours
          }
        );

        // Initialize for current show if available
        const showId = await this.getCurrentShowId();
        if (showId) {
          await this.contextMemory.initializeForShow(showId);
          coordinatorLogger.info({ showId }, '✅ Context Memory initialized for show:');
        }
      }

      this.isInitialized = true;
      coordinatorLogger.info('✅ AICoordinator fully initialized');

      // Update Sentry context
      setMonitoringContext({
        coordinatorConfig: {
          enablePredictions: this.config.enablePredictions,
          enableHostProfile: this.config.enableHostProfile,
          enableContextMemory: this.config.enableContextMemory
        }
      });

      addBreadcrumb('AICoordinator initialized successfully', 'coordinator');
    } catch (error) {
      logError(coordinatorLogger, error as Error, '❌ AICoordinator initialization failed:');

      reportCriticalError(error as Error, {
        module: 'AICoordinator',
        operation: 'initialize',
        impact: 'high',
        data: {
          config: this.config
        }
      });

      throw error;
    }
  }

  /**
   * Submit a question from any AI system
   * Validates, predicts outcome, and routes appropriately
   */
  async submitQuestion(submission: QuestionSubmission): Promise<SubmissionResult> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    coordinatorLogger.info('📥 AICoordinator: Processing question submission');
    coordinatorLogger.info(`   Source: ${submission.source}`);
    coordinatorLogger.info(`   Question: "${submission.question.question_text.substring(0, 60)}..."`);

    // Add breadcrumb for tracking
    addBreadcrumb('Question submitted to coordinator', 'coordinator', {
      source: submission.source,
      questionLength: submission.question.question_text.length,
      confidence: submission.question.confidence,
      topics: submission.question.topics
    });

    try {
      // 1. Check for duplicates using Context Memory
      if (this.contextMemory) {
        const isDuplicate = await this.checkDuplicate(submission.question);
        if (isDuplicate) {
          coordinatorLogger.warn('⚠️ Duplicate question detected - rejecting');
          await this.logEvent({
            event_type: 'question_rejected',
            event_data: {
              question: submission.question.question_text,
              source: submission.source,
              reason: 'duplicate'
            }
          });
          return { status: 'rejected', reason: 'duplicate' };
        }
      }

      // 2. Get prediction from Predictive AI
      let prediction: any = null;
      if (this.predictiveAI && this.config.enablePredictions) {
        try {
          prediction = await this.predictiveAI.predictOutcome(
            submission.question,
            this.showContext
          );
          coordinatorLogger.info(`🎯 Prediction: ${prediction.predictedEngagement.toFixed(2)} engagement, ${prediction.riskLevel} risk`);
        } catch (error) {
          coordinatorLogger.warn({ error }, '⚠️ Prediction failed, continuing without it:');
        }
      }

      // 3. Apply risk filters
      if (prediction && prediction.riskLevel === 'high') {
        coordinatorLogger.warn('⚠️ High-risk question detected - flagging for review');

        await this.flagForReview(submission, prediction);

        return {
          status: 'flagged',
          reason: 'high_risk',
          prediction
        };
      }

      // 4. Calculate priority score
      const priority = this.calculatePriority(submission, prediction);
      coordinatorLogger.info(`📊 Calculated priority: ${priority}/100`);

      // 5. Insert into queue
      const { data, error} = await supabase
        .from('show_questions')
        .insert({
          topic: submission.question.topics?.[0] || 'General',  // Required field
          question_text: submission.question.question_text,
          source: submission.source,
          position: priority,
          context_metadata: {  // Changed from 'metadata' to 'context_metadata'
            ...submission.metadata,
            predicted_engagement: prediction?.predictedEngagement,
            risk_level: prediction?.riskLevel,
            optimal_timing: prediction?.optimalTimingMinute,
            coordinator_validated: true,
            validation_timestamp: new Date().toISOString(),
            status: 'pending'  // Moved status into metadata
          }
        })
        .select()
        .single();

      if (error) {
        coordinatorLogger.error({ error }, '❌ Failed to insert question:');
        return { status: 'error', reason: error.message };
      }

      coordinatorLogger.info({ questionId: data.id }, '✅ Question added to queue:');

      // 6. Add to Context Memory
      if (this.contextMemory) {
        await this.contextMemory.addQuestion(
          submission.question,
          submission.source
        );
      }

      // 7. Update Host Profile
      if (this.hostProfile && this.config.hostId) {
        const showId = await this.getCurrentShowId();
        await this.hostProfile.recordQuestionGenerated(
          submission.question,
          submission.source,
          showId || '',
          [] // Embedding will be calculated later if needed
        );
      }

      // 8. Log success
      await this.logEvent({
        event_type: 'question_approved',
        event_data: {
          question_id: data.id,
          question: submission.question.question_text,
          source: submission.source,
          priority,
          predicted_engagement: prediction?.predictedEngagement
        }
      });

      return {
        status: 'approved',
        questionId: data.id,
        priority
      };
    } catch (error) {
      logError(coordinatorLogger, error as Error, '❌ Error processing question submission:');

      // Capture error with context
      captureError(error as Error, {
        module: 'AICoordinator',
        operation: 'submitQuestion',
        data: {
          source: submission.source,
          question: submission.question.question_text,
          confidence: submission.question.confidence,
          metadata: submission.metadata
        }
      });

      return {
        status: 'error',
        reason: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Execute a production action (mood, camera, graphics)
   * Respects priority hierarchy and manual overrides
   */
  async executeProductionAction(action: SuggestedAction): Promise<ActionResult> {
    coordinatorLogger.info(`🎬 AICoordinator: Executing ${action.actionType}`);

    addBreadcrumb('Production action requested', 'coordinator', {
      actionType: action.actionType,
      actionData: action.actionData
    });

    try {
      // Route BetaBot mood changes through mood manager
      if (action.actionType === 'betabot.mood') {
        const moodResult = await this.moodManager.setMood(
          action.actionData.mood as Mood,
          'context' as MoodSource,
          undefined
        );

        if (moodResult.status === 'blocked') {
          await this.logEvent({
            event_type: 'production_action_blocked',
            event_data: {
              action_type: action.actionType,
              mood: action.actionData.mood,
              reason: moodResult.reason
            }
          });
        } else if (moodResult.status === 'applied') {
          await this.logEvent({
            event_type: 'production_action_executed',
            event_data: {
              action_type: action.actionType,
              mood: action.actionData.mood
            }
          });
        }

        return { status: moodResult.status, reason: moodResult.reason };
      }

      // Handle other production actions
      // TODO: Implement OBS scene switching, graphics, lower thirds

      coordinatorLogger.warn(`⚠️ Production action ${action.actionType} not yet implemented`);
      return { status: 'not_implemented' };
    } catch (error) {
      logError(coordinatorLogger, error as Error, `❌ Error executing production action:`);

      // Capture production action errors
      captureError(error as Error, {
        module: 'AICoordinator',
        operation: 'executeProductionAction',
        data: {
          actionType: action.actionType,
          actionData: action.actionData
        }
      });

      return {
        status: 'error',
        reason: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Record question usage for feedback loop
   */
  async recordQuestionUsage(questionId: string, wasUsed: boolean): Promise<void> {
    coordinatorLogger.info(`📊 Recording question usage: ${questionId} - ${wasUsed ? 'USED' : 'IGNORED'}`);

    try {
      // Get question details
      const { data: question } = await supabase
        .from('show_questions')
        .select('*')
        .eq('id', questionId)
        .single();

      if (!question) {
        coordinatorLogger.warn({ questionId }, '⚠️ Question not found:');
        return;
      }

      // Update Host Profile
      if (this.hostProfile) {
        await this.hostProfile.recordQuestionUsage(questionId, wasUsed);
      }

      // Log usage event
      await this.logEvent({
        event_type: wasUsed ? 'question_used' : 'question_ignored',
        event_data: {
          question_id: questionId,
          question: question.question_text,
          source: question.source,
          predicted_engagement: question.metadata?.predicted_engagement
        }
      });

      coordinatorLogger.info('✅ Question usage recorded');
    } catch (error) {
      logError(coordinatorLogger, error as Error, '❌ Error recording question usage:');
    }
  }

  /**
   * Update show context
   */
  updateShowContext(context: Partial<ShowContext>): void {
    this.showContext = { ...this.showContext, ...context };
    coordinatorLogger.info({ showContext: this.showContext }, '🎬 Show context updated:');

    // Update Sentry monitoring context
    this.updateMonitoringContext();
  }

  /**
   * Update Sentry context with current state
   */
  private updateMonitoringContext(): void {
    setMonitoringContext({
      showSegment: this.showContext.currentTopic,
      coordinatorConfig: {
        enablePredictions: this.config.enablePredictions,
        enableHostProfile: this.config.enableHostProfile,
        enableContextMemory: this.config.enableContextMemory
      },
      moodOverride: {
        active: this.moodManager.isManualOverrideActive(),
        mood: this.moodManager.getCurrentMood().mood,
        expiresAt: this.moodManager.isManualOverrideActive()
          ? new Date(Date.now() + this.moodManager.getManualOverrideTimeRemaining() * 1000).toISOString()
          : undefined
      }
    });
  }

  /**
   * Get mood manager instance
   */
  getMoodManager(): BetaBotMoodManager {
    return this.moodManager;
  }

  /**
   * ✅ Day 10: Get health check instance
   */
  getHealthCheck(): HealthCheck {
    return this.healthCheck;
  }

  /**
   * ✅ Day 10: Get rate limiter manager
   */
  getRateLimiters(): RateLimiterManager {
    return this.rateLimiters;
  }

  /**
   * ✅ Day 10: Perform system health check
   */
  async checkSystemHealth() {
    return await this.healthCheck.checkHealth();
  }

  /**
   * Check if question is duplicate
   */
  private async checkDuplicate(question: GeneratedQuestion): Promise<boolean> {
    if (!this.contextMemory) return false;

    try {
      const isDuplicate = await this.contextMemory.isDuplicate(question.question_text);
      return isDuplicate;
    } catch (error) {
      coordinatorLogger.warn({ error }, '⚠️ Duplicate check failed:');
      return false;
    }
  }

  /**
   * Flag question for review
   */
  private async flagForReview(
    submission: QuestionSubmission,
    prediction: any
  ): Promise<void> {
    try {
      await supabase.from('show_questions').insert({
        question_text: submission.question.question_text,
        source: submission.source,
        status: 'needs_review',
        metadata: {
          ...submission.metadata,
          risk_level: 'high',
          risk_factors: prediction.riskFactors,
          requires_approval: true,
          flagged_at: new Date().toISOString()
        }
      });

      // TODO: Notify director/producer
      coordinatorLogger.warn('🚩 Question flagged for review - notification not yet implemented');
    } catch (error) {
      logError(coordinatorLogger, error as Error, '❌ Failed to flag question:');
    }
  }

  /**
   * Calculate priority score for question
   */
  private calculatePriority(
    submission: QuestionSubmission,
    prediction: any | null
  ): number {
    let score = 0;

    // Live urgency (+50)
    if (submission.metadata?.is_live_urgent) {
      score += 50;
    }

    // Host requested (+40)
    if (submission.metadata?.host_requested) {
      score += 40;
    }

    // BetaBot suggestion (+30)
    if (submission.source === 'betabot_conversation_helper') {
      score += 30;
    }

    // Predicted engagement (0-20)
    if (prediction?.predictedEngagement) {
      score += prediction.predictedEngagement * 20;
    }

    // Risk level
    if (prediction?.riskLevel === 'low') {
      score += 10;
    } else if (prediction?.riskLevel === 'high') {
      score -= 20;
    }

    // Confidence bonus
    if (submission.question.confidence && submission.question.confidence >= 0.8) {
      score += 5;
    }

    return Math.max(0, Math.min(score, 100));
  }

  /**
   * Get current show ID from database
   */
  private async getCurrentShowId(): Promise<string | null> {
    try {
      const { data } = await supabase
        .from('show_metadata')
        .select('id')
        .single();

      return data?.id || null;
    } catch (error) {
      coordinatorLogger.warn({ error }, '⚠️ Failed to get current show ID:');
      return null;
    }
  }

  /**
   * Log event for analytics
   */
  private async logEvent(event: {
    event_type: string;
    event_data: Record<string, any>;
  }): Promise<void> {
    try {
      await supabase.from('ai_coordinator_logs').insert({
        event_type: event.event_type,
        event_data: event.event_data,
        created_at: new Date().toISOString()
      });
    } catch (error) {
      // Don't throw - logging failures shouldn't break functionality
      coordinatorLogger.warn({ error }, '⚠️ Failed to log event:');
    }
  }

  /**
   * Get coordinator statistics
   */
  async getStats(): Promise<{
    questionsSubmitted: number;
    questionsApproved: number;
    questionsFlagged: number;
    questionsRejected: number;
    approvalRate: number;
    moodStats: any;
  }> {
    try {
      const { data } = await supabase
        .from('ai_coordinator_logs')
        .select('event_type')
        .order('created_at', { ascending: false })
        .limit(100);

      if (!data) {
        return {
          questionsSubmitted: 0,
          questionsApproved: 0,
          questionsFlagged: 0,
          questionsRejected: 0,
          approvalRate: 0,
          moodStats: null
        };
      }

      const submitted = data.filter(e =>
        e.event_type === 'question_approved' ||
        e.event_type === 'question_flagged' ||
        e.event_type === 'question_rejected'
      ).length;

      const approved = data.filter(e => e.event_type === 'question_approved').length;
      const flagged = data.filter(e => e.event_type === 'question_flagged').length;
      const rejected = data.filter(e => e.event_type === 'question_rejected').length;

      const moodStats = await this.moodManager.getMoodStats();

      return {
        questionsSubmitted: submitted,
        questionsApproved: approved,
        questionsFlagged: flagged,
        questionsRejected: rejected,
        approvalRate: submitted > 0 ? (approved / submitted) * 100 : 0,
        moodStats
      };
    } catch (error) {
      logError(coordinatorLogger, error as Error, '❌ Failed to get coordinator stats:');
      return {
        questionsSubmitted: 0,
        questionsApproved: 0,
        questionsFlagged: 0,
        questionsRejected: 0,
        approvalRate: 0,
        moodStats: null
      };
    }
  }

  /**
   * Destroy the coordinator
   */
  destroy(): void {
    this.moodManager.destroy();
    if (this.contextMemory) {
      this.contextMemory.stopAndPersist();
    }
    if (this.hostProfile) {
      this.hostProfile.destroy();
    }
    coordinatorLogger.info('🎯 AICoordinator destroyed');
  }
}
