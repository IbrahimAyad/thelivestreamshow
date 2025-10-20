/**
 * AI Coordinator Health Check - Day 10
 *
 * Client-side health monitoring for the AI Coordinator system.
 * Checks database connectivity, event recency, and queue status.
 */

import { SupabaseClient } from '@supabase/supabase-js';

export interface HealthStatus {
  coordinator: 'healthy' | 'degraded' | 'down';
  database: 'connected' | 'disconnected';
  lastEventAge: number;        // Seconds since last event
  lastEventFormatted: string;   // "2s ago"
  queueDepth: number;
  blockedActions: string[];
  checks: {
    databaseConnection: boolean;
    recentActivity: boolean;
    queueHealthy: boolean;
  };
  timestamp: Date;
}

export class HealthCheck {
  private supabase: SupabaseClient;

  constructor(supabaseClient: SupabaseClient) {
    this.supabase = supabaseClient;
  }

  /**
   * Perform comprehensive health check
   */
  async checkHealth(): Promise<HealthStatus> {
    const timestamp = new Date();

    // Check 1: Database connection
    const dbConnected = await this.checkDatabaseConnection();

    // Check 2: Recent activity (events within last 60 seconds)
    const { lastEventAge, lastEventFormatted, hasRecentActivity } = await this.checkRecentActivity();

    // Check 3: Queue depth (should be < 10)
    const queueDepth = await this.checkQueueDepth();
    const queueHealthy = queueDepth < 10;

    // Check 4: Blocked actions
    const blockedActions = await this.getBlockedActions();

    // Determine overall coordinator health
    let coordinatorStatus: 'healthy' | 'degraded' | 'down';

    if (!dbConnected) {
      coordinatorStatus = 'down';
    } else if (!hasRecentActivity || !queueHealthy) {
      coordinatorStatus = 'degraded';
    } else {
      coordinatorStatus = 'healthy';
    }

    return {
      coordinator: coordinatorStatus,
      database: dbConnected ? 'connected' : 'disconnected',
      lastEventAge,
      lastEventFormatted,
      queueDepth,
      blockedActions,
      checks: {
        databaseConnection: dbConnected,
        recentActivity: hasRecentActivity,
        queueHealthy
      },
      timestamp
    };
  }

  /**
   * Check if database is accessible
   */
  private async checkDatabaseConnection(): Promise<boolean> {
    try {
      const { error } = await this.supabase
        .from('ai_coordinator_logs')
        .select('count')
        .limit(1);

      return !error;
    } catch (err) {
      console.error('[HealthCheck] Database connection failed:', err);
      return false;
    }
  }

  /**
   * Check for recent coordinator activity
   */
  private async checkRecentActivity(): Promise<{
    lastEventAge: number;
    lastEventFormatted: string;
    hasRecentActivity: boolean;
  }> {
    try {
      const { data, error } = await this.supabase
        .from('ai_coordinator_logs')
        .select('created_at')
        .order('created_at', { ascending: false })
        .limit(1);

      if (error || !data || data.length === 0) {
        return {
          lastEventAge: Infinity,
          lastEventFormatted: 'never',
          hasRecentActivity: false
        };
      }

      const lastEventTime = new Date(data[0].created_at).getTime();
      const now = Date.now();
      const ageMs = now - lastEventTime;
      const ageSec = Math.floor(ageMs / 1000);

      const formatted = this.formatAge(ageSec);
      const isRecent = ageSec < 60; // Within last minute

      return {
        lastEventAge: ageSec,
        lastEventFormatted: formatted,
        hasRecentActivity: isRecent
      };
    } catch (err) {
      console.error('[HealthCheck] Failed to check recent activity:', err);
      return {
        lastEventAge: Infinity,
        lastEventFormatted: 'error',
        hasRecentActivity: false
      };
    }
  }

  /**
   * Check queue depth (estimate based on recent events)
   */
  private async checkQueueDepth(): Promise<number> {
    try {
      // Count events in last 10 seconds as proxy for queue depth
      const tenSecondsAgo = new Date(Date.now() - 10000).toISOString();

      const { count, error } = await this.supabase
        .from('ai_coordinator_logs')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', tenSecondsAgo)
        .eq('event_type', 'action_requested');

      if (error) {
        console.error('[HealthCheck] Failed to check queue depth:', error);
        return 0;
      }

      return count || 0;
    } catch (err) {
      console.error('[HealthCheck] Queue depth check error:', err);
      return 0;
    }
  }

  /**
   * Get currently blocked actions from mood state
   */
  private async getBlockedActions(): Promise<string[]> {
    try {
      const { data, error } = await this.supabase
        .from('betabot_mood')
        .select('current_mood, blocked_actions')
        .limit(1)
        .single();

      if (error || !data) {
        return [];
      }

      // If mood is annoyed or frustrated, actions are blocked
      if (data.current_mood === 'annoyed' || data.current_mood === 'frustrated') {
        return data.blocked_actions || ['generate_questions'];
      }

      return [];
    } catch (err) {
      console.error('[HealthCheck] Failed to get blocked actions:', err);
      return [];
    }
  }

  /**
   * Format age in seconds to human-readable string
   */
  private formatAge(seconds: number): string {
    if (seconds < 60) {
      return `${seconds}s ago`;
    } else if (seconds < 3600) {
      const minutes = Math.floor(seconds / 60);
      return `${minutes}m ago`;
    } else if (seconds < 86400) {
      const hours = Math.floor(seconds / 3600);
      return `${hours}h ago`;
    } else {
      const days = Math.floor(seconds / 86400);
      return `${days}d ago`;
    }
  }

  /**
   * Quick health check (returns just status)
   */
  async isHealthy(): Promise<boolean> {
    const status = await this.checkHealth();
    return status.coordinator === 'healthy';
  }

  /**
   * Get health summary for logging
   */
  async getHealthSummary(): Promise<string> {
    const status = await this.checkHealth();

    return [
      `Coordinator: ${status.coordinator}`,
      `Database: ${status.database}`,
      `Last Event: ${status.lastEventFormatted}`,
      `Queue: ${status.queueDepth}`,
      `Blocked: ${status.blockedActions.length > 0 ? status.blockedActions.join(', ') : 'none'}`
    ].join(' | ');
  }
}
