/**
 * React Hook for Emotion Detection
 *
 * Analyzes emotions from audio/text and recommends BetaBot modes
 */

import { useState, useCallback, useRef } from 'react';
import {
  analyzeEmotionFromAudio,
  detectEmotionFromText,
  mapEmotionToMode,
  EmotionAnalysisResult,
  MoodMapping
} from '../lib/emotionDetection';

export interface UseEmotionDetection {
  // Current state
  currentEmotion: EmotionAnalysisResult | null;
  recommendedMode: MoodMapping | null;
  isAnalyzing: boolean;
  error: string | null;
  emotionAnalysis: EmotionAnalysisResult | null; // Alias for currentEmotion

  // Methods
  analyzeAudio: (audioBlob: Blob) => Promise<void>;
  analyzeText: (text: string) => void;
  reset: () => void;

  // History
  emotionHistory: EmotionAnalysisResult[];
}

export function useEmotionDetection(): UseEmotionDetection {
  const [currentEmotion, setCurrentEmotion] = useState<EmotionAnalysisResult | null>(null);
  const [recommendedMode, setRecommendedMode] = useState<MoodMapping | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [emotionHistory, setEmotionHistory] = useState<EmotionAnalysisResult[]>([]);

  // Track last analysis time to avoid excessive API calls
  const lastAnalysisTimeRef = useRef<number>(0);
  const MIN_ANALYSIS_INTERVAL = 10000; // 10 seconds between audio analyses

  /**
   * Analyze audio blob for emotions
   */
  const analyzeAudio = useCallback(async (audioBlob: Blob) => {
    // Rate limiting
    const now = Date.now();
    if (now - lastAnalysisTimeRef.current < MIN_ANALYSIS_INTERVAL) {
      console.log('⏱️ Skipping emotion analysis (rate limited)');
      return;
    }

    setIsAnalyzing(true);
    setError(null);

    try {
      const result = await analyzeEmotionFromAudio(audioBlob);

      if (result) {
        console.log('🎭 Emotion detected:', result.dominantEmotion, 'Valence:', result.emotionalValence);

        setCurrentEmotion(result);
        setEmotionHistory(prev => [...prev, result].slice(-10)); // Keep last 10

        // Map emotion to mode
        const moodMapping = mapEmotionToMode(result);
        console.log('🎭 Recommended mode:', moodMapping.recommendedMode, '-', moodMapping.reasoning);

        setRecommendedMode(moodMapping);
        lastAnalysisTimeRef.current = now;
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Emotion analysis failed';
      console.error('❌ Emotion analysis error:', errorMessage);
      setError(errorMessage);
    } finally {
      setIsAnalyzing(false);
    }
  }, []);

  /**
   * Analyze text for emotions (lightweight fallback)
   */
  const analyzeText = useCallback((text: string) => {
    if (!text || text.trim().length === 0) return;

    const result = detectEmotionFromText(text);

    console.log('📝 Text emotion detected:', result.dominantEmotion);

    setCurrentEmotion(result);
    setEmotionHistory(prev => [...prev, result].slice(-10));

    const moodMapping = mapEmotionToMode(result);
    setRecommendedMode(moodMapping);
  }, []);

  /**
   * Reset emotion state
   */
  const reset = useCallback(() => {
    setCurrentEmotion(null);
    setRecommendedMode(null);
    setError(null);
    setEmotionHistory([]);
    lastAnalysisTimeRef.current = 0;
  }, []);

  return {
    currentEmotion,
    recommendedMode,
    isAnalyzing,
    error,
    emotionAnalysis: currentEmotion, // Alias for currentEmotion
    analyzeAudio,
    analyzeText,
    reset,
    emotionHistory
  };
}
