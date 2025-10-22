/**
 * React Hook for Conversation Timing Analysis
 *
 * Provides smart interruption timing for BetaBot based on:
 * - Silence detection
 * - Topic shifts
 * - Energy/pace changes
 * - Natural pauses
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  ConversationTimingAnalyzer,
  ConversationSegment,
  TimingSignal,
  EnergyMetrics
} from '../lib/conversationTiming';

export interface TimingOpportunity {
  score: number; // 0-1, higher = better time to interrupt
  signals: TimingSignal[];
  recommendation: 'interrupt_now' | 'wait' | 'good_time';
  reasoning: string;
}

export interface UseConversationTimingOptions {
  silenceThreshold?: number; // ms before silence is detected
  topicShiftThreshold?: number; // 0-1, similarity threshold
  minInterruptionScore?: number; // 0-1, minimum score to recommend interruption
  checkInterval?: number; // ms between silence checks
}

export interface UseConversationTiming {
  // Current state
  currentEnergy: EnergyMetrics | null;
  latestSignals: TimingSignal[];
  timingOpportunity: TimingOpportunity | null;

  // Methods
  analyzeTranscript: (text: string, timestamp?: number, duration?: number) => Promise<void>;
  shouldInterrupt: () => boolean;
  reset: () => void;

  // Stats
  totalSignalsDetected: number;
  signalHistory: TimingSignal[];
}

const DEFAULT_OPTIONS: Required<UseConversationTimingOptions> = {
  silenceThreshold: 3000, // 3 seconds
  topicShiftThreshold: 0.6, // 60% similarity threshold
  minInterruptionScore: 0.7, // 70% confidence to recommend
  checkInterval: 1000 // Check for silence every second
};

export function useConversationTiming(
  options: UseConversationTimingOptions = {}
): UseConversationTiming {
  const config = { ...DEFAULT_OPTIONS, ...options };

  // Initialize analyzer (only once)
  const analyzerRef = useRef<ConversationTimingAnalyzer>(
    new ConversationTimingAnalyzer({
      silenceThreshold: config.silenceThreshold,
      topicShiftThreshold: config.topicShiftThreshold
    })
  );

  // State
  const [currentEnergy, setCurrentEnergy] = useState<EnergyMetrics | null>(null);
  const [latestSignals, setLatestSignals] = useState<TimingSignal[]>([]);
  const [timingOpportunity, setTimingOpportunity] = useState<TimingOpportunity | null>(null);
  const [totalSignalsDetected, setTotalSignalsDetected] = useState(0);
  const [signalHistory, setSignalHistory] = useState<TimingSignal[]>([]);

  // Silence check interval
  const silenceCheckIntervalRef = useRef<NodeJS.Timeout | null>(null);

  /**
   * Analyze new transcript segment
   */
  const analyzeTranscript = useCallback(async (
    text: string,
    timestamp: number = Date.now(),
    duration?: number
  ) => {
    if (!text || text.trim().length === 0) return;

    const wordCount = text.split(/\s+/).filter(w => w.length > 0).length;

    const segment: ConversationSegment = {
      text,
      timestamp,
      duration,
      wordCount
    };

    try {
      // Analyze segment for timing signals
      const signals = await analyzerRef.current.analyzeSegment(segment);

      if (signals.length > 0) {
        console.log(`⏱️ Detected ${signals.length} timing signals:`, signals.map(s => s.type));

        setLatestSignals(signals);
        setSignalHistory(prev => [...prev, ...signals].slice(-20)); // Keep last 20
        setTotalSignalsDetected(prev => prev + signals.length);

        // Calculate interruption opportunity
        const score = analyzerRef.current.calculateInterruptionScore(signals);
        const opportunity = calculateOpportunity(signals, score, config.minInterruptionScore);
        setTimingOpportunity(opportunity);
      }

      // Update current energy
      const energy = analyzerRef.current.getCurrentEnergy();
      setCurrentEnergy(energy);

    } catch (error) {
      console.error('Error analyzing conversation timing:', error);
    }
  }, [config.minInterruptionScore]);

  /**
   * Check if it's a good time to interrupt
   */
  const shouldInterrupt = useCallback((): boolean => {
    if (!timingOpportunity) return false;
    return timingOpportunity.recommendation === 'interrupt_now';
  }, [timingOpportunity]);

  /**
   * Reset all timing state
   */
  const reset = useCallback(() => {
    analyzerRef.current.reset();
    setCurrentEnergy(null);
    setLatestSignals([]);
    setTimingOpportunity(null);
    setTotalSignalsDetected(0);
    setSignalHistory([]);
  }, []);

  /**
   * Periodic silence check
   */
  useEffect(() => {
    silenceCheckIntervalRef.current = setInterval(() => {
      const silenceSignal = analyzerRef.current.checkSilence();

      if (silenceSignal) {
        console.log('🔇 Silence detected:', silenceSignal);

        setLatestSignals([silenceSignal]);
        setSignalHistory(prev => [...prev, silenceSignal].slice(-20));
        setTotalSignalsDetected(prev => prev + 1);

        // Silence is a strong signal to interrupt
        const opportunity = calculateOpportunity(
          [silenceSignal],
          silenceSignal.confidence,
          config.minInterruptionScore
        );
        setTimingOpportunity(opportunity);
      }
    }, config.checkInterval);

    return () => {
      if (silenceCheckIntervalRef.current) {
        clearInterval(silenceCheckIntervalRef.current);
      }
    };
  }, [config.checkInterval, config.minInterruptionScore]);

  return {
    currentEnergy,
    latestSignals,
    timingOpportunity,
    analyzeTranscript,
    shouldInterrupt,
    reset,
    totalSignalsDetected,
    signalHistory
  };
}

/**
 * Calculate timing opportunity from signals
 */
function calculateOpportunity(
  signals: TimingSignal[],
  score: number,
  minScore: number
): TimingOpportunity {
  const hasTopicShift = signals.some(s => s.type === 'topic_shift');
  const hasSilence = signals.some(s => s.type === 'silence');
  const hasNaturalPause = signals.some(s => s.type === 'natural_pause');
  const hasEnergyChange = signals.some(s => s.type === 'energy_change');

  let recommendation: 'interrupt_now' | 'wait' | 'good_time';
  let reasoning: string;

  if (score >= minScore) {
    recommendation = 'interrupt_now';
    const signalTypes = signals.map(s => formatSignalType(s.type));
    reasoning = `Strong interruption opportunity detected: ${signalTypes.join(', ')}`;
  } else if (score >= minScore * 0.7) {
    recommendation = 'good_time';
    reasoning = `Moderate interruption opportunity. Score: ${(score * 100).toFixed(0)}%`;
  } else {
    recommendation = 'wait';
    reasoning = `Not a good time to interrupt. Score too low: ${(score * 100).toFixed(0)}%`;
  }

  // Special case: silence + topic shift = very strong signal
  if (hasSilence && hasTopicShift) {
    recommendation = 'interrupt_now';
    reasoning = `Excellent timing: Topic shift during silence`;
  }

  // Special case: natural pause + energy drop = good signal
  if (hasNaturalPause && hasEnergyChange) {
    recommendation = 'interrupt_now';
    reasoning = `Natural pause with energy drop - host is wrapping up`;
  }

  return {
    score,
    signals,
    recommendation,
    reasoning
  };
}

function formatSignalType(type: string): string {
  return type
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}
