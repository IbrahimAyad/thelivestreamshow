/**
 * AI Training Hook
 * React hook for managing AI DJ training system
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  AITrainingManager,
  createAITrainingManager,
  AITrainingState,
  AITrainingConfig,
  TrainingMode,
} from '@/utils/studio/aiTrainingManager';
import { MixingStyle, DecisionContext } from '@/utils/studio/aiDecisionEngine';
import { UserAction, UserPreferences } from '@/utils/studio/aiLearningSystem';
import { Track, CompatibilityAnalysis } from '@/utils/studio/aiContextAnalyzer';

interface UseAITrainingResult {
  // State
  state: AITrainingState;
  config: AITrainingConfig;
  preferences: UserPreferences;
  statistics: any;

  // Actions
  start: () => void;
  stop: () => void;
  setMode: (mode: TrainingMode) => void;
  setMixingStyle: (style: MixingStyle) => void;
  setConfidenceThreshold: (threshold: number) => void;
  setAutoApply: (autoApply: boolean) => void;

  // Recording
  recordAction: (
    action: UserAction,
    context: {
      trackA?: Track;
      trackB?: Track;
      crowdEnergy: number;
      setEnergy: number;
    },
    parameters?: any
  ) => void;

  // Decisions
  getDecision: (context: DecisionContext) => void;
  approveDecision: () => void;
  rejectDecision: () => void;
  correctDecision: (correction: {
    action: UserAction;
    parameters?: any;
  }) => void;

  // Analysis
  analyzeCompatibility: (trackA: Track, trackB: Track) => CompatibilityAnalysis;
  suggestNextTrack: (
    currentTrack: Track,
    availableTracks: Track[],
    context: {
      crowdEnergy: number;
      setEnergy: number;
      timeInSet: number;
      recentTracks: Track[];
    }
  ) => Track | null;

  // Data management
  reset: () => void;
  exportData: () => any;
  importData: (data: any) => void;
}

export function useAITraining(): UseAITrainingResult {
  const managerRef = useRef<AITrainingManager | null>(null);
  const [state, setState] = useState<AITrainingState>({
    mode: 'passive',
    isActive: false,
    trainingProgress: 0,
    totalActions: 0,
    correctPredictions: 0,
    incorrectPredictions: 0,
    accuracy: 0,
    lastDecision: null,
    currentSuggestion: null,
  });
  const [config, setConfig] = useState<AITrainingConfig>({
    mode: 'passive',
    autoApply: false,
    showSuggestions: true,
    confidenceThreshold: 0.7,
    learningRate: 0.5,
  });
  const [preferences, setPreferences] = useState<UserPreferences>({
    preferredMixingStyle: 'smooth',
    preferredGenres: [],
    preferredEffects: [],
    mixTimingPreference: 32,
    energyFlowPreference: 0.3,
    creativityPreference: 0.5,
    automationLevel: 0.5,
  });
  const [statistics, setStatistics] = useState<any>({
    totalEvents: 0,
    patternsDiscovered: 0,
    trainingProgress: 0,
    sessionDuration: 0,
    approvalRate: 0,
    mostCommonActions: [],
  });

  // Initialize AI training manager
  useEffect(() => {
    const manager = createAITrainingManager();
    managerRef.current = manager;

    // Listen for state changes
    manager.onStateChange('main', (newState) => {
      setState(newState);
      setConfig(manager.getConfig());
      setPreferences(manager.getPreferences());
      setStatistics(manager.getStatistics());
    });

    return () => {
      manager.destroy();
      managerRef.current = null;
    };
  }, []);

  // Start training
  const start = useCallback(() => {
    if (!managerRef.current) return;
    managerRef.current.start();
  }, []);

  // Stop training
  const stop = useCallback(() => {
    if (!managerRef.current) return;
    managerRef.current.stop();
  }, []);

  // Set training mode
  const setMode = useCallback((mode: TrainingMode) => {
    if (!managerRef.current) return;
    managerRef.current.setMode(mode);
  }, []);

  // Set mixing style
  const setMixingStyle = useCallback((style: MixingStyle) => {
    if (!managerRef.current) return;
    managerRef.current.setMixingStyle(style);
  }, []);

  // Set confidence threshold
  const setConfidenceThreshold = useCallback((threshold: number) => {
    if (!managerRef.current) return;
    managerRef.current.setConfidenceThreshold(threshold);
  }, []);

  // Set auto-apply
  const setAutoApply = useCallback((autoApply: boolean) => {
    if (!managerRef.current) return;
    managerRef.current.setAutoApply(autoApply);
  }, []);

  // Record user action
  const recordAction = useCallback(
    (
      action: UserAction,
      context: {
        trackA?: Track;
        trackB?: Track;
        crowdEnergy: number;
        setEnergy: number;
      },
      parameters?: any
    ) => {
      if (!managerRef.current) return;
      managerRef.current.recordUserAction(action, context, parameters);
    },
    []
  );

  // Get AI decision
  const getDecision = useCallback((context: DecisionContext) => {
    if (!managerRef.current) return;
    managerRef.current.getDecision(context);
  }, []);

  // Approve decision
  const approveDecision = useCallback(() => {
    if (!managerRef.current) return;
    managerRef.current.approveDecision();
  }, []);

  // Reject decision
  const rejectDecision = useCallback(() => {
    if (!managerRef.current) return;
    managerRef.current.rejectDecision();
  }, []);

  // Correct decision
  const correctDecision = useCallback(
    (correction: { action: UserAction; parameters?: any }) => {
      if (!managerRef.current) return;
      managerRef.current.correctDecision(correction);
    },
    []
  );

  // Analyze compatibility
  const analyzeCompatibility = useCallback(
    (trackA: Track, trackB: Track): CompatibilityAnalysis => {
      if (!managerRef.current)
        return {
          overall: 0,
          bpm: { score: 0, diff: 0, recommendation: '' },
          key: { score: 0, relationship: '', recommendation: '' },
          energy: { score: 0, flow: '', recommendation: '' },
          genre: { score: 0, match: '', recommendation: '' },
        };
      return managerRef.current.analyzeCompatibility(trackA, trackB);
    },
    []
  );

  // Suggest next track
  const suggestNextTrack = useCallback(
    (
      currentTrack: Track,
      availableTracks: Track[],
      context: {
        crowdEnergy: number;
        setEnergy: number;
        timeInSet: number;
        recentTracks: Track[];
      }
    ): Track | null => {
      if (!managerRef.current) return null;
      return managerRef.current.suggestNextTrack(
        currentTrack,
        availableTracks,
        context
      );
    },
    []
  );

  // Reset training
  const reset = useCallback(() => {
    if (!managerRef.current) return;
    managerRef.current.reset();
  }, []);

  // Export data
  const exportData = useCallback(() => {
    if (!managerRef.current) return null;
    return managerRef.current.exportTrainingData();
  }, []);

  // Import data
  const importData = useCallback((data: any) => {
    if (!managerRef.current) return;
    managerRef.current.importTrainingData(data);
  }, []);

  return {
    state,
    config,
    preferences,
    statistics,
    start,
    stop,
    setMode,
    setMixingStyle,
    setConfidenceThreshold,
    setAutoApply,
    recordAction,
    getDecision,
    approveDecision,
    rejectDecision,
    correctDecision,
    analyzeCompatibility,
    suggestNextTrack,
    reset,
    exportData,
    importData,
  };
}
