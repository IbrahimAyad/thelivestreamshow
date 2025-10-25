import { useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';

export type FeedbackType =
  | 'question_used'
  | 'question_ignored'
  | 'question_modified'
  | 'answer_helpful'
  | 'answer_poor'
  | 'timing_good'
  | 'timing_bad'
  | 'mood_appropriate'
  | 'mood_inappropriate'
  | 'memory_recalled'
  | 'memory_failed';

export interface FeedbackData {
  feedbackType: FeedbackType;
  feedbackValue: number; // -2 to 2
  interactionId?: string;
  sessionId?: string;
  context?: Record<string, any>;
  feedbackNote?: string;
  hostId?: string;
  showId?: string;
}

export interface LearningMetrics {
  questionsGenerated: number;
  questionsUsed: number;
  questionsIgnored: number;
  questionUsageRate: number;
  responsesGiven: number;
  responsesHelpful: number;
  responsesPoor: number;
  responseQualityScore: number;
  timingGoodCount: number;
  timingBadCount: number;
  timingAccuracyRate: number;
  memoryRecallsAttempted: number;
  memoryRecallsSuccessful: number;
  memoryRecallAccuracy: number;
  averageFeedbackScore: number;
  totalInteractions: number;
}

export interface LearnedPattern {
  patternType: 'question_topic' | 'timing_preference' | 'response_style' | 'mood_preference' | 'memory_usage' | 'topic_shift';
  patternKey: string;
  patternValue: Record<string, any>;
  confidenceScore: number;
  sampleSize: number;
  firstObserved: string;
  updatedAt: string;
}

export interface UseBetaBotFeedback {
  // Feedback submission
  submitFeedback: (data: FeedbackData) => Promise<boolean>;
  quickFeedback: (type: 'thumbs_up' | 'thumbs_down', interactionId: string) => Promise<boolean>;

  // Learning metrics
  getMetrics: (period: 'daily' | 'weekly' | 'monthly', date?: Date) => Promise<LearningMetrics | null>;
  getCurrentMetrics: () => Promise<LearningMetrics | null>;

  // Learned patterns
  getPatterns: (patternType?: string) => Promise<LearnedPattern[]>;
  getPattern: (patternType: string, patternKey: string) => Promise<LearnedPattern | null>;

  // State
  isSubmitting: boolean;
  error: string | null;
}

export function useBetaBotFeedback(): UseBetaBotFeedback {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Submit feedback for a BetaBot interaction
   */
  const submitFeedback = useCallback(async (data: FeedbackData): Promise<boolean> => {
    setIsSubmitting(true);
    setError(null);

    try {
      const { error: insertError } = await supabase
        .from('betabot_feedback')
        .insert([{
          interaction_id: data.interactionId,
          session_id: data.sessionId,
          feedback_type: data.feedbackType,
          feedback_value: data.feedbackValue,
          context: data.context,
          feedback_note: data.feedbackNote,
          host_id: data.hostId,
          show_id: data.showId
        }]);

      if (insertError) {
        console.error('Error submitting feedback:', insertError);
        setError(insertError.message);
        return false;
      }

      console.log('✅ Feedback submitted:', data.feedbackType, data.feedbackValue);
      return true;

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      console.error('Error submitting feedback:', errorMessage);
      setError(errorMessage);
      return false;

    } finally {
      setIsSubmitting(false);
    }
  }, []);

  /**
   * Quick thumbs up/down feedback
   */
  const quickFeedback = useCallback(async (
    type: 'thumbs_up' | 'thumbs_down',
    interactionId: string
  ): Promise<boolean> => {
    return submitFeedback({
      feedbackType: type === 'thumbs_up' ? 'answer_helpful' : 'answer_poor',
      feedbackValue: type === 'thumbs_up' ? 1 : -1,
      interactionId
    });
  }, [submitFeedback]);

  /**
   * Get learning metrics for a specific period
   */
  const getMetrics = useCallback(async (
    period: 'daily' | 'weekly' | 'monthly',
    date: Date = new Date()
  ): Promise<LearningMetrics | null> => {
    try {
      const metricDate = date.toISOString().split('T')[0]; // YYYY-MM-DD

      const { data, error: queryError } = await supabase
        .from('betabot_learning_metrics')
        .select('*')
        .eq('period_type', period)
        .eq('metric_date', metricDate)
        .single();

      if (queryError) {
        // ✅ EMERGENCY FIX: Silence HTTP 406 errors (table exists but no data)
        if (queryError.code === 'PGRST116' || queryError.code === 'PGRST406') {
          // No data found for this period - this is normal, not an error
          return null;
        }
        // Only log unexpected errors
        if (queryError.code !== '42P01') { // Don't log "table doesn't exist" errors
          console.warn('📏 Learning metrics query returned no data:', period, metricDate);
        }
        return null;
      }

      return {
        questionsGenerated: data.questions_generated || 0,
        questionsUsed: data.questions_used || 0,
        questionsIgnored: data.questions_ignored || 0,
        questionUsageRate: data.question_usage_rate || 0,
        responsesGiven: data.responses_given || 0,
        responsesHelpful: data.responses_helpful || 0,
        responsesPoor: data.responses_poor || 0,
        responseQualityScore: data.response_quality_score || 0,
        timingGoodCount: data.timing_good_count || 0,
        timingBadCount: data.timing_bad_count || 0,
        timingAccuracyRate: data.timing_accuracy_rate || 0,
        memoryRecallsAttempted: data.memory_recalls_attempted || 0,
        memoryRecallsSuccessful: data.memory_recalls_successful || 0,
        memoryRecallAccuracy: data.memory_recall_accuracy || 0,
        averageFeedbackScore: data.average_feedback_score || 0,
        totalInteractions: data.total_interactions || 0
      };

    } catch (err) {
      // ✅ EMERGENCY FIX: Silently handle metrics errors to prevent console spam
      // Metrics are not critical for core functionality
      return null;
    }
  }, []);

  /**
   * Get current day's metrics
   */
  const getCurrentMetrics = useCallback(async (): Promise<LearningMetrics | null> => {
    return getMetrics('daily', new Date());
  }, [getMetrics]);

  /**
   * Get learned patterns
   */
  const getPatterns = useCallback(async (
    patternType?: string
  ): Promise<LearnedPattern[]> => {
    try {
      let query = supabase
        .from('betabot_learned_patterns')
        .select('*')
        .order('confidence_score', { ascending: false })
        .order('updated_at', { ascending: false });

      if (patternType) {
        query = query.eq('pattern_type', patternType);
      }

      const { data, error: queryError } = await query;

      if (queryError) {
        console.error('Error fetching patterns:', queryError);
        return [];
      }

      return (data || []).map(p => ({
        patternType: p.pattern_type as any,
        patternKey: p.pattern_key,
        patternValue: p.pattern_value,
        confidenceScore: p.confidence_score,
        sampleSize: p.sample_size,
        firstObserved: p.first_observed,
        updatedAt: p.updated_at
      }));

    } catch (err) {
      console.error('Error fetching patterns:', err);
      return [];
    }
  }, []);

  /**
   * Get a specific learned pattern
   */
  const getPattern = useCallback(async (
    patternType: string,
    patternKey: string
  ): Promise<LearnedPattern | null> => {
    try {
      const { data, error: queryError } = await supabase
        .from('betabot_learned_patterns')
        .select('*')
        .eq('pattern_type', patternType)
        .eq('pattern_key', patternKey)
        .single();

      if (queryError) {
        if (queryError.code === 'PGRST116') {
          return null;
        }
        console.error('Error fetching pattern:', queryError);
        return null;
      }

      return {
        patternType: data.pattern_type as any,
        patternKey: data.pattern_key,
        patternValue: data.pattern_value,
        confidenceScore: data.confidence_score,
        sampleSize: data.sample_size,
        firstObserved: data.first_observed,
        updatedAt: data.updated_at
      };

    } catch (err) {
      console.error('Error fetching pattern:', err);
      return null;
    }
  }, []);

  return {
    submitFeedback,
    quickFeedback,
    getMetrics,
    getCurrentMetrics,
    getPatterns,
    getPattern,
    isSubmitting,
    error
  };
}
