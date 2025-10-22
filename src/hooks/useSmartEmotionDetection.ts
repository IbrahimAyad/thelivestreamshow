/**
 * Smart Emotion Detection - Cost-Optimized
 *
 * Only uses Hume Prosody API when needed:
 * - Before BetaBot speaks (to check host mood)
 * - Periodically (configurable interval)
 *
 * Falls back to free text-based emotion detection otherwise
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { useHumeProsody } from './useHumeProsody';
import { useEmotionDetection } from './useEmotionDetection';
import { EmotionAnalysisResult } from '../lib/emotionDetection';

export interface SmartEmotionConfig {
  // When to use voice-based emotion detection
  useVoiceDetection: boolean;

  // How often to sample voice emotions (in seconds)
  // Example: 60 = capture 5 seconds of audio every 60 seconds
  voiceSampleInterval?: number;

  // How long to capture each sample (in seconds)
  voiceSampleDuration?: number;

  // Always check voice emotion before BetaBot speaks
  checkBeforeSpeaking?: boolean;
}

export interface UseSmartEmotionDetection {
  // Current emotion state
  currentEmotion: EmotionAnalysisResult | null;
  dominantEmotion: string | null;

  // Detection status
  isUsingVoice: boolean;
  isCapturing: boolean;
  lastVoiceCheck: number | null;

  // Cost tracking
  totalVoiceMinutes: number;
  estimatedCost: number;

  // Methods
  analyzeText: (text: string) => void;
  captureVoiceSample: () => Promise<void>;
  startSmartDetection: () => Promise<void>;
  stopSmartDetection: () => void;

  // Configuration
  updateConfig: (config: Partial<SmartEmotionConfig>) => void;
}

export function useSmartEmotionDetection(
  initialConfig: SmartEmotionConfig = {
    useVoiceDetection: true,
    voiceSampleInterval: 60,      // Check every 60 seconds
    voiceSampleDuration: 5,        // Capture 5 seconds each time
    checkBeforeSpeaking: true
  }
): UseSmartEmotionDetection {
  const [config, setConfig] = useState<SmartEmotionConfig>(initialConfig);
  const [currentEmotion, setCurrentEmotion] = useState<EmotionAnalysisResult | null>(null);
  const [isUsingVoice, setIsUsingVoice] = useState(false);
  const [lastVoiceCheck, setLastVoiceCheck] = useState<number | null>(null);
  const [totalVoiceMinutes, setTotalVoiceMinutes] = useState(0);

  // Hooks
  const voiceEmotion = useHumeProsody();
  const textEmotion = useEmotionDetection();

  // Refs
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const captureTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  /**
   * Capture a short voice sample for emotion analysis
   */
  const captureVoiceSample = useCallback(async () => {
    if (!config.useVoiceDetection) {
      console.log('⏭️ Voice detection disabled, skipping sample');
      return;
    }

    try {
      console.log('🎤 Capturing voice sample for emotion detection...');

      // Connect if not already connected
      if (!voiceEmotion.isConnected) {
        await voiceEmotion.connect();
      }

      // Start capturing
      await voiceEmotion.startCapture();
      setIsUsingVoice(true);
      setLastVoiceCheck(Date.now());

      const duration = (config.voiceSampleDuration || 5) * 1000;

      // Stop after sample duration
      captureTimeoutRef.current = setTimeout(() => {
        voiceEmotion.stopCapture();
        setIsUsingVoice(false);

        // Track cost
        const minutes = (config.voiceSampleDuration || 5) / 60;
        setTotalVoiceMinutes(prev => prev + minutes);

        console.log(`✅ Voice sample complete (${config.voiceSampleDuration}s)`);
      }, duration);

    } catch (error) {
      console.error('❌ Voice sample error:', error);
      setIsUsingVoice(false);
    }
  }, [config, voiceEmotion]);

  /**
   * Start smart emotion detection with periodic sampling
   */
  const startSmartDetection = useCallback(async () => {
    console.log('🎭 Starting smart emotion detection...');
    console.log(`📊 Config: Sample every ${config.voiceSampleInterval}s for ${config.voiceSampleDuration}s`);

    // Initial voice sample
    if (config.useVoiceDetection) {
      await captureVoiceSample();
    }

    // Set up periodic sampling
    if (config.voiceSampleInterval && config.voiceSampleInterval > 0) {
      intervalRef.current = setInterval(async () => {
        await captureVoiceSample();
      }, config.voiceSampleInterval * 1000);
    }
  }, [config, captureVoiceSample]);

  /**
   * Stop smart emotion detection
   */
  const stopSmartDetection = useCallback(() => {
    console.log('⏹️ Stopping smart emotion detection');

    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    if (captureTimeoutRef.current) {
      clearTimeout(captureTimeoutRef.current);
      captureTimeoutRef.current = null;
    }

    voiceEmotion.stopCapture();
    voiceEmotion.disconnect();
    setIsUsingVoice(false);
  }, [voiceEmotion]);

  /**
   * Analyze text for emotions (free fallback)
   */
  const analyzeText = useCallback((text: string) => {
    textEmotion.analyzeText(text);
  }, [textEmotion]);

  /**
   * Update configuration
   */
  const updateConfig = useCallback((newConfig: Partial<SmartEmotionConfig>) => {
    setConfig(prev => ({ ...prev, ...newConfig }));
  }, []);

  /**
   * Update current emotion from active source
   */
  useEffect(() => {
    if (isUsingVoice && voiceEmotion.emotionAnalysis) {
      // Use voice-based emotion (from Hume Prosody)
      setCurrentEmotion(voiceEmotion.emotionAnalysis);
    } else if (textEmotion.emotionAnalysis) {
      // Fallback to text-based emotion (free)
      setCurrentEmotion(textEmotion.emotionAnalysis);
    }
  }, [isUsingVoice, voiceEmotion.emotionAnalysis, textEmotion.emotionAnalysis]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopSmartDetection();
    };
  }, [stopSmartDetection]);

  return {
    currentEmotion,
    dominantEmotion: currentEmotion?.dominantEmotion || null,
    isUsingVoice,
    isCapturing: voiceEmotion.isCapturing,
    lastVoiceCheck,
    totalVoiceMinutes,
    estimatedCost: totalVoiceMinutes * 0.005, // $0.005 per minute
    analyzeText,
    captureVoiceSample,
    startSmartDetection,
    stopSmartDetection,
    updateConfig
  };
}
