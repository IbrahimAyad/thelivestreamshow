/**
 * EngagementTracker - Phase 4: Intelligent Question Evolution
 *
 * Tracks real-time audience engagement metrics and correlates them with questions.
 * Helps identify which questions drive better engagement.
 *
 * Key Features:
 * - Periodic engagement snapshots (chat, viewers, sentiment)
 * - Question-engagement correlation
 * - Audience interest detection
 * - Engagement score calculation
 * - Trend analysis
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import {
  EngagementSnapshot,
  EngagementLevel,
  EngagementTrackingConfig,
  DEFAULT_ENGAGEMENT_TRACKING_CONFIG
} from './types';

export interface ChatMessage {
  message: string;
  username: string;
  timestamp: Date;
}

export interface ViewerMetrics {
  count: number;
  timestamp: Date;
}

export interface EngagementMetrics {
  chatMessagesPerMinute: number;
  uniqueChatters: number;
  chatSentiment?: number;
  viewerCount: number;
  viewerCountChange: number;
  avgWatchTime?: number;
  engagementLevel: EngagementLevel;
  engagementScore: number;
  audienceInterests: string[];
  topKeywords: string[];
}

export class EngagementTracker {
  private supabase: SupabaseClient;
  private config: EngagementTrackingConfig;
  private showId: string | null = null;
  private snapshotTimer: NodeJS.Timeout | null = null;

  // Baseline metrics for calculating changes
  private baselineMetrics: {
    chatRate: number;
    viewerCount: number;
    sentiment: number;
  } = {
    chatRate: 0,
    viewerCount: 0,
    sentiment: 0
  };

  // Recent data for analysis
  private recentChatMessages: ChatMessage[] = [];
  private recentViewerCounts: ViewerMetrics[] = [];
  private lastSnapshot: Date = new Date();

  constructor(
    supabaseUrl: string,
    supabaseKey: string,
    config: EngagementTrackingConfig = DEFAULT_ENGAGEMENT_TRACKING_CONFIG
  ) {
    this.supabase = createClient(supabaseUrl, supabaseKey);
    this.config = config;
  }

  /**
   * Initialize engagement tracking for a show
   */
  async initializeForShow(showId: string): Promise<void> {
    this.showId = showId;

    // Calculate baseline from recent history (last 10 minutes)
    await this.calculateBaseline();

    // Start periodic snapshots if enabled
    if (this.config.enabled && this.config.snapshotInterval > 0) {
      this.startPeriodicSnapshots();
    }

    console.log(`[EngagementTracker] Initialized for show ${showId}`);
  }

  /**
   * Record a chat message
   */
  recordChatMessage(message: string, username: string): void {
    this.recentChatMessages.push({
      message,
      username,
      timestamp: new Date()
    });

    // Keep only last hour of messages
    const oneHourAgo = Date.now() - 60 * 60 * 1000;
    this.recentChatMessages = this.recentChatMessages.filter(
      msg => msg.timestamp.getTime() > oneHourAgo
    );
  }

  /**
   * Record viewer count
   */
  recordViewerCount(count: number): void {
    this.recentViewerCounts.push({
      count,
      timestamp: new Date()
    });

    // Keep only last hour of counts
    const oneHourAgo = Date.now() - 60 * 60 * 1000;
    this.recentViewerCounts = this.recentViewerCounts.filter(
      metric => metric.timestamp.getTime() > oneHourAgo
    );
  }

  /**
   * Take an engagement snapshot
   */
  async takeSnapshot(currentQuestionId?: string, currentTopic?: string): Promise<EngagementSnapshot | null> {
    if (!this.showId) {
      console.warn('[EngagementTracker] No show initialized');
      return null;
    }

    const metrics = this.calculateCurrentMetrics();

    const snapshot: EngagementSnapshot = {
      id: crypto.randomUUID(),
      showId: this.showId,
      timestamp: new Date(),
      chatMessagesPerMinute: metrics.chatMessagesPerMinute,
      uniqueChatters: metrics.uniqueChatters,
      chatSentiment: metrics.chatSentiment,
      viewerCount: metrics.viewerCount,
      viewerCountChange: metrics.viewerCountChange,
      avgWatchTime: metrics.avgWatchTime,
      engagementLevel: metrics.engagementLevel,
      engagementScore: metrics.engagementScore,
      currentQuestionId,
      currentTopic,
      audienceInterests: metrics.audienceInterests,
      topKeywords: metrics.topKeywords,
      createdAt: new Date()
    };

    // Save to database
    const { error } = await this.supabase
      .from('engagement_snapshots')
      .insert([{
        id: snapshot.id,
        show_id: snapshot.showId,
        timestamp: snapshot.timestamp.toISOString(),
        chat_messages_per_minute: snapshot.chatMessagesPerMinute,
        unique_chatters: snapshot.uniqueChatters,
        chat_sentiment: snapshot.chatSentiment,
        viewer_count: snapshot.viewerCount,
        viewer_count_change: snapshot.viewerCountChange,
        avg_watch_time: snapshot.avgWatchTime,
        engagement_level: snapshot.engagementLevel,
        engagement_score: snapshot.engagementScore,
        current_question_id: snapshot.currentQuestionId,
        current_topic: snapshot.currentTopic,
        audience_interests: snapshot.audienceInterests,
        top_keywords: snapshot.topKeywords,
        created_at: snapshot.createdAt.toISOString()
      }]);

    if (error) {
      console.error('[EngagementTracker] Error saving snapshot:', error);
      return null;
    }

    this.lastSnapshot = new Date();
    return snapshot;
  }

  /**
   * Get engagement metrics before and after a specific time
   */
  async getMetricsAroundTime(
    timestamp: Date,
    beforeMinutes: number = 2,
    afterMinutes: number = 2
  ): Promise<{
    before: EngagementMetrics | null;
    after: EngagementMetrics | null;
  }> {
    if (!this.showId) {
      return { before: null, after: null };
    }

    const beforeTime = new Date(timestamp.getTime() - beforeMinutes * 60 * 1000);
    const afterTime = new Date(timestamp.getTime() + afterMinutes * 60 * 1000);

    // Get snapshots before the timestamp
    const { data: beforeSnapshots } = await this.supabase
      .from('engagement_snapshots')
      .select('*')
      .eq('show_id', this.showId)
      .gte('timestamp', beforeTime.toISOString())
      .lt('timestamp', timestamp.toISOString())
      .order('timestamp', { ascending: false })
      .limit(3);

    // Get snapshots after the timestamp
    const { data: afterSnapshots } = await this.supabase
      .from('engagement_snapshots')
      .select('*')
      .eq('show_id', this.showId)
      .gt('timestamp', timestamp.toISOString())
      .lte('timestamp', afterTime.toISOString())
      .order('timestamp', { ascending: true })
      .limit(3);

    const beforeMetrics = beforeSnapshots && beforeSnapshots.length > 0
      ? this.averageSnapshots(beforeSnapshots)
      : null;

    const afterMetrics = afterSnapshots && afterSnapshots.length > 0
      ? this.averageSnapshots(afterSnapshots)
      : null;

    return { before: beforeMetrics, after: afterMetrics };
  }

  /**
   * Get current engagement metrics without saving
   */
  getCurrentMetrics(): EngagementMetrics {
    return this.calculateCurrentMetrics();
  }

  /**
   * Stop tracking and cleanup
   */
  destroy(): void {
    if (this.snapshotTimer) {
      clearInterval(this.snapshotTimer);
      this.snapshotTimer = null;
    }
  }

  // ============================================================================
  // Private Helper Methods
  // ============================================================================

  private async calculateBaseline(): Promise<void> {
    if (!this.showId) return;

    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);

    // Get recent snapshots to calculate baseline
    const { data: snapshots } = await this.supabase
      .from('engagement_snapshots')
      .select('*')
      .eq('show_id', this.showId)
      .gte('timestamp', tenMinutesAgo.toISOString())
      .order('timestamp', { ascending: false })
      .limit(10);

    if (snapshots && snapshots.length > 0) {
      const avgChatRate = snapshots.reduce((sum, s) => sum + (s.chat_messages_per_minute || 0), 0) / snapshots.length;
      const avgViewers = snapshots.reduce((sum, s) => sum + (s.viewer_count || 0), 0) / snapshots.length;
      const avgSentiment = snapshots.reduce((sum, s) => sum + (s.chat_sentiment || 0), 0) / snapshots.length;

      this.baselineMetrics = {
        chatRate: avgChatRate,
        viewerCount: avgViewers,
        sentiment: avgSentiment
      };

      console.log('[EngagementTracker] Baseline calculated:', this.baselineMetrics);
    } else {
      // No history, use defaults
      this.baselineMetrics = {
        chatRate: 5, // 5 messages per minute
        viewerCount: 50, // 50 viewers
        sentiment: 0 // neutral
      };
    }
  }

  private calculateCurrentMetrics(): EngagementMetrics {
    const now = Date.now();
    const oneMinuteAgo = now - 60 * 1000;

    // Chat metrics
    const recentMessages = this.recentChatMessages.filter(
      msg => msg.timestamp.getTime() > oneMinuteAgo
    );
    const chatMessagesPerMinute = recentMessages.length;
    const uniqueChatters = new Set(recentMessages.map(msg => msg.username)).size;

    // Sentiment analysis (simple keyword-based)
    const chatSentiment = this.config.sentimentAnalysisEnabled
      ? this.analyzeSentiment(recentMessages.map(m => m.message))
      : undefined;

    // Viewer metrics
    const recentViewers = this.recentViewerCounts.filter(
      metric => metric.timestamp.getTime() > oneMinuteAgo
    );
    const viewerCount = recentViewers.length > 0
      ? recentViewers[recentViewers.length - 1].count
      : 0;

    const viewerCountChange = this.baselineMetrics.viewerCount > 0
      ? ((viewerCount - this.baselineMetrics.viewerCount) / this.baselineMetrics.viewerCount) * 100
      : 0;

    // Engagement level
    const engagementScore = this.calculateEngagementScore(
      chatMessagesPerMinute,
      viewerCountChange,
      chatSentiment
    );
    const engagementLevel = this.determineEngagementLevel(engagementScore);

    // Audience interests (from chat keywords)
    const audienceInterests = this.extractAudienceInterests(recentMessages.map(m => m.message));
    const topKeywords = this.extractTopKeywords(recentMessages.map(m => m.message));

    return {
      chatMessagesPerMinute,
      uniqueChatters,
      chatSentiment,
      viewerCount,
      viewerCountChange,
      engagementLevel,
      engagementScore,
      audienceInterests,
      topKeywords
    };
  }

  private calculateEngagementScore(
    chatRate: number,
    viewerChange: number,
    sentiment?: number
  ): number {
    // Normalize chat rate (0-1, baseline = 0.5)
    const chatScore = Math.min(1, chatRate / (this.baselineMetrics.chatRate * 2));

    // Normalize viewer change (-100% to +100% -> 0 to 1)
    const viewerScore = Math.max(0, Math.min(1, (viewerChange + 100) / 200));

    // Normalize sentiment (-1 to +1 -> 0 to 1)
    const sentimentScore = sentiment !== undefined
      ? (sentiment + 1) / 2
      : 0.5;

    // Weighted average
    const weights = {
      chat: 0.5,
      viewer: 0.3,
      sentiment: 0.2
    };

    return chatScore * weights.chat + viewerScore * weights.viewer + sentimentScore * weights.sentiment;
  }

  private determineEngagementLevel(score: number): EngagementLevel {
    if (score >= 0.8) return 'viral';
    if (score >= 0.6) return 'high';
    if (score >= 0.4) return 'medium';
    return 'low';
  }

  private analyzeSentiment(messages: string[]): number {
    if (messages.length === 0) return 0;

    const positiveWords = ['love', 'great', 'awesome', 'amazing', 'good', 'nice', 'perfect', 'excellent', 'lol', 'haha', '😂', '❤️', '👍', '🔥'];
    const negativeWords = ['hate', 'bad', 'terrible', 'awful', 'worst', 'boring', 'stupid', 'trash', '😡', '👎', '💩'];

    let sentimentSum = 0;

    messages.forEach(msg => {
      const lowerMsg = msg.toLowerCase();
      let msgSentiment = 0;

      positiveWords.forEach(word => {
        if (lowerMsg.includes(word)) msgSentiment += 0.1;
      });

      negativeWords.forEach(word => {
        if (lowerMsg.includes(word)) msgSentiment -= 0.1;
      });

      sentimentSum += Math.max(-1, Math.min(1, msgSentiment));
    });

    return sentimentSum / messages.length;
  }

  private extractAudienceInterests(messages: string[]): string[] {
    if (messages.length === 0) return [];

    // Common interest topics
    const interestKeywords: Record<string, string[]> = {
      'politics': ['election', 'president', 'congress', 'vote', 'policy', 'government'],
      'technology': ['ai', 'tech', 'software', 'coding', 'programming', 'app', 'computer'],
      'philosophy': ['philosophy', 'ethics', 'morality', 'consciousness', 'existence', 'meaning'],
      'sports': ['game', 'team', 'player', 'score', 'win', 'loss', 'sports'],
      'entertainment': ['movie', 'show', 'music', 'film', 'actor', 'song', 'netflix'],
      'science': ['science', 'research', 'study', 'experiment', 'theory', 'data'],
      'current-events': ['news', 'today', 'breaking', 'latest', 'update', 'happening']
    };

    const interestCounts: Record<string, number> = {};

    messages.forEach(msg => {
      const lowerMsg = msg.toLowerCase();
      Object.entries(interestKeywords).forEach(([interest, keywords]) => {
        keywords.forEach(keyword => {
          if (lowerMsg.includes(keyword)) {
            interestCounts[interest] = (interestCounts[interest] || 0) + 1;
          }
        });
      });
    });

    // Return interests with at least 2 mentions
    return Object.entries(interestCounts)
      .filter(([, count]) => count >= 2)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([interest]) => interest);
  }

  private extractTopKeywords(messages: string[]): string[] {
    if (messages.length === 0) return [];

    // Common stop words to ignore
    const stopWords = new Set(['the', 'a', 'an', 'and', 'or', 'but', 'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'can', 'to', 'of', 'in', 'for', 'on', 'with', 'at', 'by', 'from', 'as', 'into', 'like', 'through', 'after', 'over', 'between', 'out', 'against', 'during', 'without', 'before', 'under', 'around', 'among', 'what', 'which', 'who', 'when', 'where', 'why', 'how', 'that', 'this', 'these', 'those', 'i', 'you', 'he', 'she', 'it', 'we', 'they', 'my', 'your', 'his', 'her', 'its', 'our', 'their']);

    const wordCounts: Record<string, number> = {};

    messages.forEach(msg => {
      const words = msg.toLowerCase()
        .replace(/[^\w\s]/g, '')
        .split(/\s+/)
        .filter(word => word.length > 3 && !stopWords.has(word));

      words.forEach(word => {
        wordCounts[word] = (wordCounts[word] || 0) + 1;
      });
    });

    return Object.entries(wordCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([word]) => word);
  }

  private averageSnapshots(snapshots: any[]): EngagementMetrics {
    const count = snapshots.length;

    const avgChatRate = snapshots.reduce((sum, s) => sum + (s.chat_messages_per_minute || 0), 0) / count;
    const avgUniqueChatters = Math.round(snapshots.reduce((sum, s) => sum + (s.unique_chatters || 0), 0) / count);
    const avgSentiment = snapshots.reduce((sum, s) => sum + (s.chat_sentiment || 0), 0) / count;
    const avgViewerCount = Math.round(snapshots.reduce((sum, s) => sum + (s.viewer_count || 0), 0) / count);
    const avgViewerChange = snapshots.reduce((sum, s) => sum + (s.viewer_count_change || 0), 0) / count;
    const avgWatchTime = snapshots.reduce((sum, s) => sum + (s.avg_watch_time || 0), 0) / count;
    const avgEngagementScore = snapshots.reduce((sum, s) => sum + (s.engagement_score || 0), 0) / count;

    // Most common engagement level
    const levelCounts = snapshots.reduce((acc, s) => {
      acc[s.engagement_level] = (acc[s.engagement_level] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    const engagementLevel = Object.entries(levelCounts)
      .sort(([, a], [, b]) => b - a)[0][0] as EngagementLevel;

    // Combine all interests and keywords
    const allInterests = snapshots.flatMap(s => s.audience_interests || []);
    const allKeywords = snapshots.flatMap(s => s.top_keywords || []);

    return {
      chatMessagesPerMinute: avgChatRate,
      uniqueChatters: avgUniqueChatters,
      chatSentiment: avgSentiment,
      viewerCount: avgViewerCount,
      viewerCountChange: avgViewerChange,
      avgWatchTime: avgWatchTime > 0 ? avgWatchTime : undefined,
      engagementLevel,
      engagementScore: avgEngagementScore,
      audienceInterests: [...new Set(allInterests)].slice(0, 5),
      topKeywords: [...new Set(allKeywords)].slice(0, 10)
    };
  }

  private startPeriodicSnapshots(): void {
    if (this.snapshotTimer) {
      clearInterval(this.snapshotTimer);
    }

    this.snapshotTimer = setInterval(() => {
      this.takeSnapshot().catch(err => {
        console.error('[EngagementTracker] Error in periodic snapshot:', err);
      });
    }, this.config.snapshotInterval);

    console.log(`[EngagementTracker] Started periodic snapshots every ${this.config.snapshotInterval}ms`);
  }
}
