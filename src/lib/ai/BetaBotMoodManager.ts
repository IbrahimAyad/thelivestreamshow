/**
 * BetaBot Mood Manager
 *
 * Manages BetaBot's mood with clear priority hierarchy:
 * 1. Manual Override (Director Panel) - always wins
 * 2. Conversation Mode (BetaBot active conversation) - during interaction
 * 3. Context-driven (AI Context Analyzer) - ambient suggestions
 * 4. Default (neutral) - fallback
 */

import { supabase } from '../supabase';
import { captureError, addBreadcrumb, reportCriticalError } from '../monitoring/sentry';
import { moodLogger, logError } from '../logging/logger';

export type Mood = 'neutral' | 'bored' | 'amused' | 'spicy' | 'excited' | 'thoughtful';
export type Movement = 'home' | 'run_left' | 'run_right' | 'bounce' | 'hide';
export type MoodSource = 'manual' | 'conversation' | 'context' | 'default';

export interface MoodChangeResult {
  status: 'applied' | 'blocked' | 'error';
  reason?: string;
  blockedUntil?: Date;
}

export interface BetaBotMoodState {
  id: string;
  mood: Mood;
  movement?: Movement;
  source?: MoodSource;
  show_incoming: boolean;
  incoming_count: number;
  updated_at: string;
}

export class BetaBotMoodManager {
  private moodId: string | null = null;
  private manualOverrideUntil: number | null = null;
  private conversationActive: boolean = false;
  private currentMood: Mood = 'neutral';
  private currentSource: MoodSource = 'default';

  /**
   * Initialize the mood manager by loading or creating mood state
   */
  async initialize(): Promise<void> {
    moodLogger.info('🎭 BetaBotMoodManager: Initializing...');

    addBreadcrumb('BetaBotMoodManager initialization started', 'betabot');

    try {
      const { data, error } = await supabase
        .from('betabot_mood')
        .select('*')
        .limit(1)
        .maybeSingle();

      if (error) {
        logError(moodLogger, error, '❌ Failed to load BetaBot mood');
        throw error;
      }

      if (data) {
        this.moodId = data.id;
        this.currentMood = data.mood as Mood;
        this.currentSource = (data.source as MoodSource) || 'default';
        moodLogger.info(`✅ BetaBot mood loaded: ${this.currentMood} (source: ${this.currentSource})`);
      } else {
        // Create default mood row
        moodLogger.warn('⚠️ No mood state found, creating default...');
        const { data: newData, error: insertError } = await supabase
          .from('betabot_mood')
          .insert({
            mood: 'neutral',
            movement: 'home',
            source: 'default',
            show_incoming: false,
            incoming_count: 0
          })
          .select()
          .single();

        if (insertError) {
          logError(moodLogger, insertError, '❌ Failed to create default mood');
          throw insertError;
        }

        if (newData) {
          this.moodId = newData.id;
          this.currentMood = 'neutral';
          this.currentSource = 'default';
          moodLogger.info('✅ Default mood state created');
        }
      }

      addBreadcrumb('BetaBotMoodManager initialized successfully', 'betabot', {
        mood: this.currentMood,
        source: this.currentSource
      });
    } catch (error) {
      logError(moodLogger, error as Error, '❌ BetaBotMoodManager initialization failed');

      reportCriticalError(error as Error, {
        module: 'BetaBotMoodManager',
        operation: 'initialize',
        impact: 'high'
      });

      throw error;
    }
  }

  /**
   * Set BetaBot's mood with priority hierarchy
   *
   * @param mood - The mood to set
   * @param source - Who/what is trying to set the mood
   * @param duration - Duration in minutes for manual override (default: 5)
   * @returns Result indicating if mood was applied or blocked
   */
  async setMood(
    mood: Mood,
    source: MoodSource,
    duration?: number
  ): Promise<MoodChangeResult> {
    if (!this.moodId) {
      await this.initialize();
    }

    const now = Date.now();

    moodLogger.info(`🎭 Mood change request: ${mood} (source: ${source})`);

    addBreadcrumb('Mood change requested', 'betabot', {
      mood,
      source,
      duration,
      currentMood: this.currentMood,
      manualOverrideActive: this.isManualOverrideActive()
    });

    // Priority 1: Check manual override
    if (this.manualOverrideUntil && now < this.manualOverrideUntil) {
      const blockedUntil = new Date(this.manualOverrideUntil);
      moodLogger.warn(`🚫 Manual override active until ${blockedUntil.toLocaleTimeString()}`);
      moodLogger.warn(`   Blocking ${source} mood change to: ${mood}`);

      // Log the blocked attempt
      await this.logMoodEvent({
        type: 'blocked',
        attempted_mood: mood,
        attempted_source: source,
        current_mood: this.currentMood,
        reason: 'manual_override',
        blocked_until: blockedUntil.toISOString()
      });

      return {
        status: 'blocked',
        reason: 'manual_override',
        blockedUntil
      };
    }

    // Set manual override duration
    if (source === 'manual') {
      const overrideDuration = (duration || 5) * 60 * 1000; // Default 5 minutes
      this.manualOverrideUntil = now + overrideDuration;
      moodLogger.info(`🎮 Manual override set for ${duration || 5} minutes (until ${new Date(this.manualOverrideUntil).toLocaleTimeString()})`);
    }

    // Priority 2: Check conversation priority
    if (source === 'context' && this.conversationActive) {
      moodLogger.info('💬 BetaBot in active conversation - blocking context suggestion');

      await this.logMoodEvent({
        type: 'blocked',
        attempted_mood: mood,
        attempted_source: source,
        current_mood: this.currentMood,
        reason: 'conversation_active'
      });

      return {
        status: 'blocked',
        reason: 'conversation_active'
      };
    }

    // Apply mood
    try {
      const { error } = await supabase
        .from('betabot_mood')
        .update({
          mood,
          // Note: 'source' is tracked in-memory only (not in database schema)
          updated_at: new Date().toISOString()
        })
        .eq('id', this.moodId);

      if (error) {
        logError(moodLogger, error, '❌ Failed to update mood');
        return { status: 'error', reason: error.message };
      }

      this.currentMood = mood;
      this.currentSource = source;

      moodLogger.info(`✅ BetaBot mood updated: ${mood} (source: ${source})`);

      // Log successful mood change
      await this.logMoodEvent({
        type: 'applied',
        attempted_mood: mood,
        attempted_source: source,
        current_mood: mood,
        reason: 'success'
      });

      return { status: 'applied' };
    } catch (error) {
      logError(moodLogger, error as Error, '❌ Error updating mood');

      // Capture mood change errors
      captureError(error as Error, {
        module: 'BetaBotMoodManager',
        operation: 'setMood',
        data: {
          mood,
          source,
          duration,
          currentMood: this.currentMood,
          currentSource: this.currentSource
        }
      });

      return {
        status: 'error',
        reason: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Set movement (separate from mood)
   */
  async setMovement(movement: Movement, source: MoodSource): Promise<MoodChangeResult> {
    if (!this.moodId) {
      await this.initialize();
    }

    moodLogger.info(`🏃 Movement change request: ${movement} (source: ${source})`);

    try {
      const { error } = await supabase
        .from('betabot_mood')
        .update({
          movement,
          updated_at: new Date().toISOString()
        })
        .eq('id', this.moodId);

      if (error) {
        logError(moodLogger, error, '❌ Failed to update movement');
        return { status: 'error', reason: error.message };
      }

      moodLogger.info(`✅ BetaBot movement updated: ${movement}`);
      return { status: 'applied' };
    } catch (error) {
      logError(moodLogger, error as Error, '❌ Error updating movement');
      return {
        status: 'error',
        reason: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Set conversation active state
   * When active, blocks context-based mood changes
   */
  setConversationActive(active: boolean): void {
    this.conversationActive = active;
    moodLogger.info(`💬 BetaBot conversation ${active ? 'started' : 'ended'}`);

    addBreadcrumb(
      `BetaBot conversation ${active ? 'started' : 'ended'}`,
      'betabot',
      { conversationActive: active }
    );
  }

  /**
   * Clear manual override early
   */
  clearManualOverride(): void {
    if (this.manualOverrideUntil) {
      moodLogger.info('🔓 Manual override cleared early');
      this.manualOverrideUntil = null;

      addBreadcrumb('Manual override cleared', 'betabot', {
        previousMood: this.currentMood
      });
    }
  }

  /**
   * Get current mood state
   */
  getCurrentMood(): { mood: Mood; source: MoodSource } {
    return {
      mood: this.currentMood,
      source: this.currentSource
    };
  }

  /**
   * Check if manual override is active
   */
  isManualOverrideActive(): boolean {
    if (!this.manualOverrideUntil) return false;
    return Date.now() < this.manualOverrideUntil;
  }

  /**
   * Get time remaining on manual override
   */
  getManualOverrideTimeRemaining(): number {
    if (!this.manualOverrideUntil) return 0;
    const remaining = Math.max(0, this.manualOverrideUntil - Date.now());
    return Math.ceil(remaining / 1000); // seconds
  }

  /**
   * Log mood events for analytics
   */
  private async logMoodEvent(event: {
    type: 'applied' | 'blocked';
    attempted_mood: Mood;
    attempted_source: MoodSource;
    current_mood: Mood;
    reason: string;
    blocked_until?: string;
  }): Promise<void> {
    try {
      await supabase.from('ai_coordinator_logs').insert({
        event_type: `betabot_mood_${event.type}`,
        event_data: {
          attempted_mood: event.attempted_mood,
          attempted_source: event.attempted_source,
          current_mood: event.current_mood,
          reason: event.reason,
          blocked_until: event.blocked_until
        },
        created_at: new Date().toISOString()
      });
    } catch (error) {
      // Don't throw - logging failures shouldn't break mood changes
      moodLogger.warn('⚠️ Failed to log mood event:', error);
    }
  }

  /**
   * Get mood statistics
   */
  async getMoodStats(): Promise<{
    totalChanges: number;
    blockedAttempts: number;
    moodDistribution: Record<Mood, number>;
    sourceDistribution: Record<MoodSource, number>;
  }> {
    try {
      const { data, error } = await supabase
        .from('ai_coordinator_logs')
        .select('event_data')
        .like('event_type', 'betabot_mood_%')
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;

      const stats = {
        totalChanges: 0,
        blockedAttempts: 0,
        moodDistribution: {} as Record<Mood, number>,
        sourceDistribution: {} as Record<MoodSource, number>
      };

      if (!data) return stats;

      for (const log of data) {
        const eventData = log.event_data as any;

        if (log.event_type === 'betabot_mood_applied') {
          stats.totalChanges++;

          const mood = eventData.attempted_mood as Mood;
          stats.moodDistribution[mood] = (stats.moodDistribution[mood] || 0) + 1;

          const source = eventData.attempted_source as MoodSource;
          stats.sourceDistribution[source] = (stats.sourceDistribution[source] || 0) + 1;
        } else if (log.event_type === 'betabot_mood_blocked') {
          stats.blockedAttempts++;
        }
      }

      return stats;
    } catch (error) {
      logError(moodLogger, error as Error, '❌ Failed to get mood stats');
      return {
        totalChanges: 0,
        blockedAttempts: 0,
        moodDistribution: {} as Record<Mood, number>,
        sourceDistribution: {} as Record<MoodSource, number>
      };
    }
  }

  /**
   * Destroy the mood manager
   */
  destroy(): void {
    this.manualOverrideUntil = null;
    this.conversationActive = false;
    moodLogger.info('🎭 BetaBotMoodManager destroyed');
  }
}
