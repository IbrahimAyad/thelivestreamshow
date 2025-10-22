/**
 * React Hook for Hume Prosody API (Emotion Detection Only)
 *
 * Cheaper alternative to full EVI - just emotion analysis
 * Cost: ~$0.005/minute vs $0.015/minute for full EVI
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import {
  HumeProsodyStream,
  HumeProsodyConfig,
  EmotionScore
} from '../lib/humeProsody';
import { EmotionAnalysisResult } from '../lib/emotionDetection';

export interface UseHumeProsody {
  // Connection state
  isConnected: boolean;
  isCapturing: boolean;
  error: string | null;

  // Current emotion state
  currentEmotions: EmotionScore[];
  dominantEmotion: string | null;
  emotionAnalysis: EmotionAnalysisResult | null;

  // Methods
  connect: () => Promise<void>;
  disconnect: () => void;
  startCapture: (deviceId?: string) => Promise<void>;
  stopCapture: () => void;

  // Stats
  totalEmotionsDetected: number;
}

export function useHumeProsody(): UseHumeProsody {
  const [isConnected, setIsConnected] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [currentEmotions, setCurrentEmotions] = useState<EmotionScore[]>([]);
  const [dominantEmotion, setDominantEmotion] = useState<string | null>(null);
  const [emotionAnalysis, setEmotionAnalysis] = useState<EmotionAnalysisResult | null>(null);
  const [totalEmotionsDetected, setTotalEmotionsDetected] = useState(0);

  // Refs
  const prosodyStreamRef = useRef<HumeProsodyStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  /**
   * Process emotion scores from Hume Prosody API
   */
  const processEmotionScores = useCallback((scores: EmotionScore[]) => {
    if (scores.length === 0) return;

    // Sort by score descending
    const sortedScores = [...scores].sort((a, b) => b.score - a.score);
    const topEmotions = sortedScores.slice(0, 5);

    setCurrentEmotions(topEmotions);
    setDominantEmotion(topEmotions[0].name);
    setTotalEmotionsDetected(prev => prev + 1);

    // Calculate valence and arousal
    const analysis: EmotionAnalysisResult = {
      topEmotions: topEmotions.map(e => ({ emotion: e.name, score: e.score })),
      dominantEmotion: topEmotions[0].name,
      emotionalValence: calculateValence(scores),
      arousal: calculateArousal(scores),
      confidence: topEmotions[0].score,
      timestamp: Date.now()
    };

    setEmotionAnalysis(analysis);

    console.log('🎭 Hume Prosody Emotion:', {
      dominant: analysis.dominantEmotion,
      valence: analysis.emotionalValence.toFixed(2),
      arousal: analysis.arousal.toFixed(2),
      confidence: analysis.confidence.toFixed(2)
    });
  }, []);

  /**
   * Connect to Hume Prosody Streaming API
   */
  const connect = useCallback(async () => {
    try {
      const apiKey = import.meta.env.VITE_HUME_AI_API_KEY;
      const secretKey = import.meta.env.VITE_HUME_AI_SECRET_KEY;

      if (!apiKey) {
        throw new Error('VITE_HUME_AI_API_KEY not configured');
      }

      const config: HumeProsodyConfig = {
        apiKey,
        secretKey: secretKey || ''
      };

      const stream = new HumeProsodyStream(config, {
        onEmotions: (emotions: EmotionScore[]) => {
          processEmotionScores(emotions);
        },
        onError: (err: Error) => {
          console.error('❌ Hume Prosody error:', err);
          setError(err.message);
          setIsConnected(false);
        }
      });

      prosodyStreamRef.current = stream;
      await stream.connect();

      console.log('✅ Hume Prosody connected');
      setIsConnected(true);
      setError(null);

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to connect to Hume Prosody';
      console.error('❌ Connection error:', errorMessage);
      setError(errorMessage);
      throw err;
    }
  }, [processEmotionScores]);

  /**
   * Disconnect from Hume Prosody
   */
  const disconnect = useCallback(() => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current = null;
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }

    if (prosodyStreamRef.current) {
      prosodyStreamRef.current.disconnect();
      prosodyStreamRef.current = null;
    }

    setIsConnected(false);
    setIsCapturing(false);
  }, []);

  /**
   * Start capturing audio from microphone
   */
  const startCapture = useCallback(async (deviceId?: string) => {
    if (!prosodyStreamRef.current || !prosodyStreamRef.current.isConnected()) {
      throw new Error('Not connected to Hume Prosody');
    }

    try {
      const constraints: MediaTrackConstraints = {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
        sampleRate: 44100,
        channelCount: 1
      };

      if (deviceId) {
        constraints.deviceId = { exact: deviceId };
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: constraints
      });

      streamRef.current = stream;

      // Create MediaRecorder
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm',
        audioBitsPerSecond: 128000
      });

      mediaRecorderRef.current = mediaRecorder;

      // Send audio chunks to Hume Prosody
      mediaRecorder.ondataavailable = async (event) => {
        if (event.data.size > 0 && prosodyStreamRef.current?.isConnected()) {
          const arrayBuffer = await event.data.arrayBuffer();
          prosodyStreamRef.current.sendAudio(arrayBuffer);
        }
      };

      mediaRecorder.onerror = (err) => {
        console.error('MediaRecorder error:', err);
        setError('Audio capture error');
      };

      // Start recording with 100ms chunks
      mediaRecorder.start(100);

      setIsCapturing(true);
      setError(null);

      console.log('🎤 Started capturing audio for Hume Prosody');

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to start audio capture';
      console.error('❌ Capture error:', errorMessage);
      setError(errorMessage);
      throw err;
    }
  }, []);

  /**
   * Stop capturing audio
   */
  const stopCapture = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current = null;
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }

    setIsCapturing(false);
    console.log('🎤 Stopped capturing audio');
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

  return {
    isConnected,
    isCapturing,
    error,
    currentEmotions,
    dominantEmotion,
    emotionAnalysis,
    connect,
    disconnect,
    startCapture,
    stopCapture,
    totalEmotionsDetected
  };
}

/**
 * Calculate emotional valence from Hume emotion scores
 */
function calculateValence(emotions: EmotionScore[]): number {
  const positiveEmotions = [
    'Joy', 'Amusement', 'Contentment', 'Excitement', 'Satisfaction',
    'Relief', 'Admiration', 'Adoration', 'Calmness', 'Interest'
  ];

  const negativeEmotions = [
    'Sadness', 'Anger', 'Fear', 'Disgust', 'Anxiety',
    'Disappointment', 'Frustration', 'Contempt', 'Distress', 'Embarrassment'
  ];

  let positiveScore = 0;
  let negativeScore = 0;

  for (const emotion of emotions) {
    if (positiveEmotions.includes(emotion.name)) {
      positiveScore += emotion.score;
    } else if (negativeEmotions.includes(emotion.name)) {
      negativeScore += emotion.score;
    }
  }

  const total = positiveScore + negativeScore;
  if (total === 0) return 0;

  return (positiveScore - negativeScore) / total;
}

/**
 * Calculate arousal from Hume emotion scores
 */
function calculateArousal(emotions: EmotionScore[]): number {
  const highArousalEmotions = [
    'Excitement', 'Anger', 'Fear', 'Surprise', 'Anxiety',
    'Ecstasy', 'Enthusiasm', 'Distress'
  ];

  const lowArousalEmotions = [
    'Calmness', 'Contentment', 'Sadness', 'Boredom',
    'Tiredness', 'Contemplation'
  ];

  let highArousalScore = 0;
  let lowArousalScore = 0;

  for (const emotion of emotions) {
    if (highArousalEmotions.includes(emotion.name)) {
      highArousalScore += emotion.score;
    } else if (lowArousalEmotions.includes(emotion.name)) {
      lowArousalScore += emotion.score;
    }
  }

  const total = highArousalScore + lowArousalScore;
  if (total === 0) return 0.5;

  return highArousalScore / total;
}
