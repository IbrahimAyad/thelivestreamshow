/**
 * Phase 7B - Microphone Input Hook
 * 
 * Manages microphone capture, real-time level detection, and auto-ducking
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { MicEffectsProcessor, type MicEffectsSettings } from '@/utils/studio/micEffects';

export interface MicDuckingSettings {
  enabled: boolean;
  threshold: number; // 0-100 (volume level to trigger ducking)
  duckAmount: number; // 10-90 (percentage to lower music)
  attackTime: number; // milliseconds
  releaseTime: number; // milliseconds
}

const defaultDuckingSettings: MicDuckingSettings = {
  enabled: true,
  threshold: 20,
  duckAmount: 30,
  attackTime: 200,
  releaseTime: 500,
};

export function useMicInput(audioContext: AudioContext | null, onDuckingChange?: (isDucking: boolean, level: number) => void) {
  const [isActive, setIsActive] = useState(false);
  const [micLevel, setMicLevel] = useState(0);
  const [isDucking, setIsDucking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [duckingSettings, setDuckingSettings] = useState<MicDuckingSettings>(() => {
    const saved = localStorage.getItem('micDuckingSettings');
    return saved ? JSON.parse(saved) : defaultDuckingSettings;
  });

  const streamRef = useRef<MediaStream | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const effectsProcessorRef = useRef<MicEffectsProcessor | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const duckingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Start microphone capture
  const startMic = useCallback(async () => {
    if (!audioContext) {
      setError('Audio context not available');
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      // Create analyser for level detection
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 512;
      analyser.smoothingTimeConstant = 0.8;
      analyserRef.current = analyser;

      // Create effects processor
      const effectsProcessor = new MicEffectsProcessor(audioContext);
      effectsProcessor.connectMicStream(stream);
      effectsProcessor.getOutputNode().connect(analyser);
      // Note: Do NOT connect to destination - we don't want to hear ourselves
      effectsProcessorRef.current = effectsProcessor;

      setIsActive(true);
      setError(null);
      startLevelMonitoring();

      console.log('🎤 Microphone activated');
    } catch (err) {
      setError('Failed to access microphone. Please grant permission.');
      console.error('Microphone error:', err);
    }
  }, [audioContext]);

  // Stop microphone capture
  const stopMic = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }

    if (effectsProcessorRef.current) {
      effectsProcessorRef.current.disconnect();
      effectsProcessorRef.current = null;
    }

    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }

    if (duckingTimeoutRef.current) {
      clearTimeout(duckingTimeoutRef.current);
      duckingTimeoutRef.current = null;
    }

    analyserRef.current = null;
    setIsActive(false);
    setMicLevel(0);
    setIsDucking(false);

    console.log('🎤 Microphone deactivated');
  }, []);

  // Monitor microphone level and trigger ducking
  const startLevelMonitoring = () => {
    const analyser = analyserRef.current;
    if (!analyser) return;

    const dataArray = new Uint8Array(analyser.frequencyBinCount);

    const updateLevel = () => {
      if (!analyserRef.current) return;

      analyser.getByteFrequencyData(dataArray);
      
      // Calculate RMS level (0-100)
      const sum = dataArray.reduce((acc, val) => acc + val * val, 0);
      const rms = Math.sqrt(sum / dataArray.length);
      const level = Math.min(100, (rms / 255) * 100);

      setMicLevel(level);

      // Check if ducking should be triggered
      if (duckingSettings.enabled) {
        if (level > duckingSettings.threshold) {
          if (!isDucking) {
            setIsDucking(true);
            onDuckingChange?.(true, level);
          }

          // Clear release timeout
          if (duckingTimeoutRef.current) {
            clearTimeout(duckingTimeoutRef.current);
          }

          // Set release timeout
          duckingTimeoutRef.current = setTimeout(() => {
            setIsDucking(false);
            onDuckingChange?.(false, 0);
          }, duckingSettings.releaseTime);
        }
      }

      animationFrameRef.current = requestAnimationFrame(updateLevel);
    };

    updateLevel();
  };

  // Update ducking settings
  const updateDuckingSettings = (settings: Partial<MicDuckingSettings>) => {
    const newSettings = { ...duckingSettings, ...settings };
    setDuckingSettings(newSettings);
    localStorage.setItem('micDuckingSettings', JSON.stringify(newSettings));
  };

  // Update effects settings
  const updateEffectsSettings = (settings: Partial<MicEffectsSettings>) => {
    if (effectsProcessorRef.current) {
      effectsProcessorRef.current.updateSettings(settings);
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopMic();
    };
  }, [stopMic]);

  return {
    isActive,
    micLevel,
    isDucking,
    error,
    duckingSettings,
    startMic,
    stopMic,
    updateDuckingSettings,
    updateEffectsSettings,
  };
}
