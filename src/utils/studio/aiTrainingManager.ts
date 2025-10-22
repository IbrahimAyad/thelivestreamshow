/**
 * AI Training Manager
 * Orchestrates the complete AI DJ training system
 * Integrates decision engine, learning system, and context analyzer
 */

import {
  AIDecisionEngine,
  createAIDecisionEngine,
  DecisionContext,
  DecisionOutput,
  MixingStyle,
} from './aiDecisionEngine';
import {
  AILearningSystem,
  createAILearningSystem,
  UserAction,
  LearningEvent,
  UserPreferences,
} from './aiLearningSystem';
import {
  AIContextAnalyzer,
  createAIContextAnalyzer,
  Track,
  CompatibilityAnalysis,
} from './aiContextAnalyzer';

export type TrainingMode = 'passive' | 'active' | 'autonomous';

export interface AITrainingState {
  mode: TrainingMode;
  isActive: boolean;
  trainingProgress: number; // 0-1
  totalActions: number;
  correctPredictions: number;
  incorrectPredictions: number;
  accuracy: number;
  lastDecision: DecisionOutput | null;
  currentSuggestion: string | null;
}

export interface AITrainingConfig {
  mode: TrainingMode;
  autoApply: boolean; // Automatically apply AI decisions
  showSuggestions: boolean; // Show AI suggestions in UI
  confidenceThreshold: number; // Only suggest/apply if confidence > threshold
  learningRate: number; // How quickly to adapt (0-1)
}

export class AITrainingManager {
  private decisionEngine: AIDecisionEngine;
  private learningSystem: AILearningSystem;
  private contextAnalyzer: AIContextAnalyzer;

  private config: AITrainingConfig = {
    mode: 'passive',
    autoApply: false,
    showSuggestions: true,
    confidenceThreshold: 0.7,
    learningRate: 0.5,
  };

  private state: AITrainingState = {
    mode: 'passive',
    isActive: false,
    trainingProgress: 0,
    totalActions: 0,
    correctPredictions: 0,
    incorrectPredictions: 0,
    accuracy: 0,
    lastDecision: null,
    currentSuggestion: null,
  };

  private listeners: Map<string, (state: AITrainingState) => void> = new Map();
  private monitoringInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.decisionEngine = createAIDecisionEngine();
    this.learningSystem = createAILearningSystem();
    this.contextAnalyzer = createAIContextAnalyzer();
  }

  /**
   * Start AI training
   */
  start(): void {
    this.state.isActive = true;
    this.startMonitoring();
    this.notifyListeners();
  }

  /**
   * Stop AI training
   */
  stop(): void {
    this.state.isActive = false;
    this.stopMonitoring();
    this.notifyListeners();
  }

  /**
   * Start monitoring for autonomous decisions
   */
  private startMonitoring(): void {
    if (this.monitoringInterval) return;

    this.monitoringInterval = setInterval(() => {
      if (this.config.mode === 'autonomous' && this.state.isActive) {
        // In autonomous mode, periodically check if AI should make a decision
        // This would be triggered by actual playback state in production
        this.updateTrainingProgress();
      }
    }, 5000);
  }

  /**
   * Stop monitoring
   */
  private stopMonitoring(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
  }

  /**
   * Record user action for learning
   */
  recordUserAction(
    action: UserAction,
    context: {
      trackA?: Track;
      trackB?: Track;
      crowdEnergy: number;
      setEnergy: number;
    },
    parameters?: any
  ): void {
    const learningEvent: Omit<LearningEvent, 'id' | 'timestamp'> = {
      action,
      context: {
        trackA: context.trackA
          ? {
              bpm: context.trackA.bpm,
              key: context.trackA.key,
              energy: context.trackA.energy,
              genre: context.trackA.genre,
              position: 0,
            }
          : undefined,
        trackB: context.trackB
          ? {
              bpm: context.trackB.bpm,
              key: context.trackB.key,
              energy: context.trackB.energy,
              genre: context.trackB.genre,
              position: 0,
            }
          : undefined,
        crowdEnergy: context.crowdEnergy,
        setEnergy: context.setEnergy,
      },
      aiSuggestion: this.state.lastDecision
        ? {
            decision: this.state.lastDecision.decision,
            confidence: this.state.lastDecision.confidence,
          }
        : undefined,
      userChoice: {
        decision: action,
        parameters,
      },
    };

    this.learningSystem.recordEvent(learningEvent);
    this.updateAccuracy(action);
    this.updateTrainingProgress();
    this.notifyListeners();
  }

  /**
   * Get AI decision for current context
   */
  getDecision(context: DecisionContext): DecisionOutput {
    const decision = this.decisionEngine.makeDecision(context);
    this.state.lastDecision = decision;
    this.state.totalActions++;

    // Update suggestion if confidence is high enough
    if (
      decision.confidence >= this.config.confidenceThreshold &&
      this.config.showSuggestions
    ) {
      this.state.currentSuggestion = decision.reasoning;
    } else {
      this.state.currentSuggestion = null;
    }

    this.notifyListeners();
    return decision;
  }

  /**
   * Analyze track compatibility
   */
  analyzeCompatibility(trackA: Track, trackB: Track): CompatibilityAnalysis {
    return this.contextAnalyzer.analyzeCompatibility(trackA, trackB);
  }

  /**
   * Get next track suggestion
   */
  suggestNextTrack(
    currentTrack: Track,
    availableTracks: Track[],
    context: {
      crowdEnergy: number;
      setEnergy: number;
      timeInSet: number;
      recentTracks: Track[];
    }
  ): Track | null {
    return this.contextAnalyzer.suggestNextTrack(
      {
        currentTrack,
        nextTrack: null,
        playbackPosition: 0,
        timeInSet: context.timeInSet,
        recentTracks: context.recentTracks,
        crowdEnergy: context.crowdEnergy,
        targetEnergy: context.setEnergy,
      },
      availableTracks
    );
  }

  /**
   * Approve AI decision (positive feedback)
   */
  approveDecision(): void {
    if (!this.state.lastDecision) return;

    this.recordUserAction(
      'approve_ai',
      {
        crowdEnergy: 0.5,
        setEnergy: 0.5,
      },
      this.state.lastDecision
    );

    this.state.correctPredictions++;
    this.updateAccuracy('approve_ai');
  }

  /**
   * Reject AI decision (negative feedback)
   */
  rejectDecision(): void {
    if (!this.state.lastDecision) return;

    this.recordUserAction(
      'reject_ai',
      {
        crowdEnergy: 0.5,
        setEnergy: 0.5,
      },
      this.state.lastDecision
    );

    this.state.incorrectPredictions++;
    this.updateAccuracy('reject_ai');
  }

  /**
   * Correct AI decision (user provides better choice)
   */
  correctDecision(correction: {
    action: UserAction;
    parameters?: any;
  }): void {
    if (!this.state.lastDecision) return;

    this.recordUserAction(
      'correct_ai',
      {
        crowdEnergy: 0.5,
        setEnergy: 0.5,
      },
      correction
    );

    this.state.incorrectPredictions++;
    this.updateAccuracy('correct_ai');

    // Learn from correction
    this.adaptFromCorrection(correction);
  }

  /**
   * Adapt decision engine from user correction
   */
  private adaptFromCorrection(correction: {
    action: UserAction;
    parameters?: any;
  }): void {
    // In production, this would adjust weights based on what user chose instead
    const currentWeights = this.decisionEngine.getWeights();

    // Simple adaptation: slightly adjust weights based on action type
    if (correction.action === 'manual_mix') {
      currentWeights.timing += this.config.learningRate * 0.05;
    } else if (correction.action === 'manual_effect') {
      currentWeights.crowdResponse += this.config.learningRate * 0.05;
    }

    this.decisionEngine.updateWeights(currentWeights);
  }

  /**
   * Update accuracy metric
   */
  private updateAccuracy(action: UserAction): void {
    const feedbackActions = ['approve_ai', 'reject_ai', 'correct_ai'];
    if (!feedbackActions.includes(action)) return;

    const totalFeedback =
      this.state.correctPredictions + this.state.incorrectPredictions;
    if (totalFeedback > 0) {
      this.state.accuracy = this.state.correctPredictions / totalFeedback;
    }
  }

  /**
   * Update training progress
   */
  private updateTrainingProgress(): void {
    const stats = this.learningSystem.getStatistics();
    this.state.trainingProgress = stats.trainingProgress;
    this.notifyListeners();
  }

  /**
   * Set training mode
   */
  setMode(mode: TrainingMode): void {
    this.config.mode = mode;
    this.state.mode = mode;

    // Update decision engine based on mode
    if (mode === 'autonomous') {
      this.decisionEngine.setAggressiveness(0.7);
      this.decisionEngine.setCreativityLevel(0.6);
    } else if (mode === 'active') {
      this.decisionEngine.setAggressiveness(0.5);
      this.decisionEngine.setCreativityLevel(0.5);
    } else {
      // passive mode - more conservative
      this.decisionEngine.setAggressiveness(0.3);
      this.decisionEngine.setCreativityLevel(0.3);
    }

    this.notifyListeners();
  }

  /**
   * Set mixing style
   */
  setMixingStyle(style: MixingStyle): void {
    this.decisionEngine.setMixingStyle(style);
    this.learningSystem.setPreference('preferredMixingStyle', style);
  }

  /**
   * Set confidence threshold
   */
  setConfidenceThreshold(threshold: number): void {
    this.config.confidenceThreshold = Math.max(0, Math.min(1, threshold));
    this.notifyListeners();
  }

  /**
   * Set auto-apply mode
   */
  setAutoApply(autoApply: boolean): void {
    this.config.autoApply = autoApply;
    this.notifyListeners();
  }

  /**
   * Get current state
   */
  getState(): AITrainingState {
    return { ...this.state };
  }

  /**
   * Get configuration
   */
  getConfig(): AITrainingConfig {
    return { ...this.config };
  }

  /**
   * Get learning statistics
   */
  getStatistics() {
    return this.learningSystem.getStatistics();
  }

  /**
   * Get user preferences
   */
  getPreferences(): UserPreferences {
    return this.learningSystem.getPreferences();
  }

  /**
   * Register state change listener
   */
  onStateChange(id: string, callback: (state: AITrainingState) => void): void {
    this.listeners.set(id, callback);
  }

  /**
   * Unregister state change listener
   */
  offStateChange(id: string): void {
    this.listeners.delete(id);
  }

  /**
   * Notify all listeners of state change
   */
  private notifyListeners(): void {
    this.listeners.forEach((callback) => callback(this.getState()));
  }

  /**
   * Reset training data
   */
  reset(): void {
    this.learningSystem.reset();
    this.state = {
      mode: this.config.mode,
      isActive: false,
      trainingProgress: 0,
      totalActions: 0,
      correctPredictions: 0,
      incorrectPredictions: 0,
      accuracy: 0,
      lastDecision: null,
      currentSuggestion: null,
    };
    this.notifyListeners();
  }

  /**
   * Export complete training data
   */
  exportTrainingData(): {
    decisionEngine: any;
    learningSystem: any;
    config: AITrainingConfig;
    state: AITrainingState;
  } {
    return {
      decisionEngine: this.decisionEngine.exportState(),
      learningSystem: this.learningSystem.exportData(),
      config: this.config,
      state: this.state,
    };
  }

  /**
   * Import training data
   */
  importTrainingData(data: {
    decisionEngine?: any;
    learningSystem?: any;
    config?: AITrainingConfig;
    state?: AITrainingState;
  }): void {
    if (data.decisionEngine) {
      this.decisionEngine.importState(data.decisionEngine);
    }
    if (data.learningSystem) {
      this.learningSystem.importData(data.learningSystem);
    }
    if (data.config) {
      this.config = { ...this.config, ...data.config };
    }
    if (data.state) {
      this.state = { ...this.state, ...data.state };
    }
    this.notifyListeners();
  }

  /**
   * Cleanup
   */
  destroy(): void {
    this.stop();
    this.listeners.clear();
  }
}

/**
 * Create AI training manager
 */
export function createAITrainingManager(): AITrainingManager {
  return new AITrainingManager();
}
