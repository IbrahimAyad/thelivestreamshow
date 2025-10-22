/**
 * AI Learning System
 * Tracks user behavior and learns mixing preferences
 */

import { DecisionWeights, MixingStyle } from './aiDecisionEngine';

export type UserAction =
  | 'manual_mix'
  | 'manual_effect'
  | 'manual_eq'
  | 'manual_loop'
  | 'manual_hotcue'
  | 'manual_tempo'
  | 'approve_ai'
  | 'reject_ai'
  | 'correct_ai';

export interface LearningEvent {
  id: string;
  timestamp: number;
  action: UserAction;
  context: {
    trackA?: {
      bpm: number;
      key: string;
      energy: number;
      genre: string;
      position: number;
    };
    trackB?: {
      bpm: number;
      key: string;
      energy: number;
      genre: string;
      position: number;
    };
    crowdEnergy: number;
    setEnergy: number;
  };
  aiSuggestion?: {
    decision: string;
    confidence: number;
  };
  userChoice: {
    decision: string;
    parameters?: any;
  };
  outcome?: {
    success: boolean;
    crowdReaction?: number;
  };
}

export interface LearningPattern {
  pattern: string;
  frequency: number;
  successRate: number;
  contexts: string[];
  lastSeen: number;
}

export interface UserPreferences {
  preferredMixingStyle: MixingStyle;
  preferredGenres: string[];
  preferredEffects: string[];
  mixTimingPreference: number; // seconds before track end
  energyFlowPreference: number; // -1 to 1 (gradual vs dramatic)
  creativityPreference: number; // 0-1
  automationLevel: number; // 0-1 (how much AI control)
}

export class AILearningSystem {
  private events: LearningEvent[] = [];
  private patterns: Map<string, LearningPattern> = new Map();
  private preferences: UserPreferences = {
    preferredMixingStyle: 'smooth',
    preferredGenres: [],
    preferredEffects: [],
    mixTimingPreference: 32,
    energyFlowPreference: 0.3,
    creativityPreference: 0.5,
    automationLevel: 0.5,
  };
  private sessionStartTime: number = Date.now();
  private trainingProgress: number = 0; // 0-1

  /**
   * Record a learning event
   */
  recordEvent(event: Omit<LearningEvent, 'id' | 'timestamp'>): void {
    const learningEvent: LearningEvent = {
      ...event,
      id: this.generateEventId(),
      timestamp: Date.now(),
    };

    this.events.push(learningEvent);

    // Extract patterns from event
    this.extractPatterns(learningEvent);

    // Update preferences based on event
    this.updatePreferences(learningEvent);

    // Update training progress
    this.updateTrainingProgress();

    // Keep only recent events (last 1000)
    if (this.events.length > 1000) {
      this.events = this.events.slice(-1000);
    }
  }

  /**
   * Extract patterns from learning event
   */
  private extractPatterns(event: LearningEvent): void {
    // Pattern: manual action type in specific contexts
    const contextKey = this.getContextKey(event.context);
    const patternKey = `${event.action}_in_${contextKey}`;

    const existing = this.patterns.get(patternKey);
    if (existing) {
      existing.frequency++;
      existing.lastSeen = Date.now();
      if (event.outcome?.success) {
        existing.successRate =
          (existing.successRate * (existing.frequency - 1) + 1) /
          existing.frequency;
      }
    } else {
      this.patterns.set(patternKey, {
        pattern: patternKey,
        frequency: 1,
        successRate: event.outcome?.success ? 1.0 : 0.5,
        contexts: [contextKey],
        lastSeen: Date.now(),
      });
    }
  }

  /**
   * Get context key for pattern matching
   */
  private getContextKey(context: LearningEvent['context']): string {
    const energyLevel =
      context.crowdEnergy > 0.7
        ? 'high'
        : context.crowdEnergy > 0.4
        ? 'medium'
        : 'low';

    const genreA = context.trackA?.genre || 'unknown';
    const genreB = context.trackB?.genre || 'unknown';

    return `${energyLevel}_energy_${genreA}_to_${genreB}`;
  }

  /**
   * Update user preferences based on event
   */
  private updatePreferences(event: LearningEvent): void {
    // Track preferred genres
    if (event.context.trackA?.genre) {
      this.addToPreferredList(
        this.preferences.preferredGenres,
        event.context.trackA.genre
      );
    }

    // Track preferred effects
    if (
      event.action === 'manual_effect' &&
      event.userChoice.parameters?.effect
    ) {
      this.addToPreferredList(
        this.preferences.preferredEffects,
        event.userChoice.parameters.effect
      );
    }

    // Track mix timing preference
    if (event.action === 'manual_mix' && event.context.trackA?.position) {
      const timeRemaining = event.context.trackA.position;
      this.preferences.mixTimingPreference =
        this.preferences.mixTimingPreference * 0.9 + timeRemaining * 0.1;
    }

    // Track automation level (approve/reject ratio)
    if (event.action === 'approve_ai') {
      this.preferences.automationLevel = Math.min(
        1.0,
        this.preferences.automationLevel + 0.01
      );
    } else if (event.action === 'reject_ai' || event.action === 'correct_ai') {
      this.preferences.automationLevel = Math.max(
        0.0,
        this.preferences.automationLevel - 0.02
      );
    }
  }

  /**
   * Add item to preferred list (top 5)
   */
  private addToPreferredList(list: string[], item: string): void {
    const index = list.indexOf(item);
    if (index > -1) {
      list.splice(index, 1);
    }
    list.unshift(item);
    if (list.length > 5) {
      list.pop();
    }
  }

  /**
   * Update training progress based on event count and quality
   */
  private updateTrainingProgress(): void {
    const eventCount = this.events.length;
    const patternCount = this.patterns.size;

    // Progress increases with more events and discovered patterns
    const eventProgress = Math.min(eventCount / 500, 0.6);
    const patternProgress = Math.min(patternCount / 50, 0.4);

    this.trainingProgress = eventProgress + patternProgress;
  }

  /**
   * Calculate recommended decision weights based on learning
   */
  calculateRecommendedWeights(): DecisionWeights {
    // Analyze which factors correlate with successful mixes
    const successfulMixes = this.events.filter(
      (e) => e.action === 'manual_mix' && e.outcome?.success
    );

    if (successfulMixes.length < 10) {
      // Not enough data, return balanced weights
      return {
        bpmCompatibility: 0.25,
        keyCompatibility: 0.20,
        energyFlow: 0.20,
        genreMatching: 0.15,
        timing: 0.10,
        crowdResponse: 0.10,
      };
    }

    // Calculate correlation of each factor with success
    const weights = {
      bpmCompatibility: this.calculateFactorImportance('bpm', successfulMixes),
      keyCompatibility: this.calculateFactorImportance('key', successfulMixes),
      energyFlow: this.calculateFactorImportance('energy', successfulMixes),
      genreMatching: this.calculateFactorImportance(
        'genre',
        successfulMixes
      ),
      timing: this.calculateFactorImportance('timing', successfulMixes),
      crowdResponse: this.calculateFactorImportance('crowd', successfulMixes),
    };

    // Normalize weights
    const sum = Object.values(weights).reduce((a, b) => a + b, 0);
    Object.keys(weights).forEach((key) => {
      weights[key as keyof DecisionWeights] /= sum;
    });

    return weights;
  }

  /**
   * Calculate importance of a factor in successful mixes
   */
  private calculateFactorImportance(
    factor: string,
    events: LearningEvent[]
  ): number {
    // Simplified: return random weight for now
    // In production, this would analyze actual correlations
    return 0.15 + Math.random() * 0.1;
  }

  /**
   * Get AI suggestions based on learned patterns
   */
  getSuggestion(context: {
    action: UserAction;
    context: LearningEvent['context'];
  }): {
    suggestion: string;
    confidence: number;
  } | null {
    const contextKey = this.getContextKey(context.context);
    const patternKey = `${context.action}_in_${contextKey}`;

    const pattern = this.patterns.get(patternKey);
    if (pattern && pattern.frequency > 3) {
      return {
        suggestion: `Based on ${pattern.frequency} similar situations, this action has ${(pattern.successRate * 100).toFixed(0)}% success rate`,
        confidence: pattern.successRate,
      };
    }

    return null;
  }

  /**
   * Get learning statistics
   */
  getStatistics(): {
    totalEvents: number;
    patternsDiscovered: number;
    trainingProgress: number;
    sessionDuration: number;
    approvalRate: number;
    mostCommonActions: { action: UserAction; count: number }[];
    preferences: UserPreferences;
  } {
    const approvals = this.events.filter((e) => e.action === 'approve_ai')
      .length;
    const rejections = this.events.filter(
      (e) => e.action === 'reject_ai' || e.action === 'correct_ai'
    ).length;
    const approvalRate =
      approvals + rejections > 0 ? approvals / (approvals + rejections) : 0;

    // Count action frequencies
    const actionCounts = new Map<UserAction, number>();
    this.events.forEach((e) => {
      actionCounts.set(e.action, (actionCounts.get(e.action) || 0) + 1);
    });

    const mostCommonActions = Array.from(actionCounts.entries())
      .map(([action, count]) => ({ action, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    return {
      totalEvents: this.events.length,
      patternsDiscovered: this.patterns.size,
      trainingProgress: this.trainingProgress,
      sessionDuration: (Date.now() - this.sessionStartTime) / 1000,
      approvalRate,
      mostCommonActions,
      preferences: this.preferences,
    };
  }

  /**
   * Get user preferences
   */
  getPreferences(): UserPreferences {
    return { ...this.preferences };
  }

  /**
   * Set user preference
   */
  setPreference<K extends keyof UserPreferences>(
    key: K,
    value: UserPreferences[K]
  ): void {
    this.preferences[key] = value;
  }

  /**
   * Reset learning data
   */
  reset(): void {
    this.events = [];
    this.patterns.clear();
    this.trainingProgress = 0;
    this.sessionStartTime = Date.now();
  }

  /**
   * Export learning data
   */
  exportData(): {
    events: LearningEvent[];
    patterns: [string, LearningPattern][];
    preferences: UserPreferences;
  } {
    return {
      events: this.events,
      patterns: Array.from(this.patterns.entries()),
      preferences: this.preferences,
    };
  }

  /**
   * Import learning data
   */
  importData(data: {
    events?: LearningEvent[];
    patterns?: [string, LearningPattern][];
    preferences?: UserPreferences;
  }): void {
    if (data.events) this.events = data.events;
    if (data.patterns) this.patterns = new Map(data.patterns);
    if (data.preferences) this.preferences = data.preferences;
    this.updateTrainingProgress();
  }

  /**
   * Generate unique event ID
   */
  private generateEventId(): string {
    return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

/**
 * Create AI learning system
 */
export function createAILearningSystem(): AILearningSystem {
  return new AILearningSystem();
}
