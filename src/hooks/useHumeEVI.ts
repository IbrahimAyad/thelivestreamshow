/**
 * React Hook for Hume AI EVI (Empathic Voice Interface)
 *
 * Real-time emotion detection and voice interaction
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import {
  HumeEVIClient,
  AudioStreamCapture,
  HumeEVIConfig,
  EmotionScore,
  UserMessage,
  AssistantMessage
} from '../lib/humeEVI';
import { mapEmotionToMode, EmotionAnalysisResult } from '../lib/emotionDetection';

export interface UseHumeEVI {
  // Connection state
  isConnected: boolean;
  isCapturing: boolean;
  error: string | null;

  // Current emotion state
  currentEmotions: EmotionScore[];
  dominantEmotion: string | null;
  emotionAnalysis: EmotionAnalysisResult | null;

  // Messages
  lastUserMessage: string | null;
  lastAssistantMessage: string | null;

  // Methods
  connect: () => Promise<void>;
  disconnect: () => void;
  startCapture: (deviceId?: string) => Promise<void>;
  stopCapture: () => void;
  stopAudio: () => void;

  // Stats
  totalEmotionsDetected: number;
  conversationHistory: Array<{
    role: 'user' | 'assistant';
    content: string;
    emotions?: EmotionScore[];
  }>;
}

export function useHumeEVI(): UseHumeEVI {
  const [isConnected, setIsConnected] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [currentEmotions, setCurrentEmotions] = useState<EmotionScore[]>([]);
  const [dominantEmotion, setDominantEmotion] = useState<string | null>(null);
  const [emotionAnalysis, setEmotionAnalysis] = useState<EmotionAnalysisResult | null>(null);

  const [lastUserMessage, setLastUserMessage] = useState<string | null>(null);
  const [lastAssistantMessage, setLastAssistantMessage] = useState<string | null>(null);

  const [totalEmotionsDetected, setTotalEmotionsDetected] = useState(0);
  const [conversationHistory, setConversationHistory] = useState<Array<{
    role: 'user' | 'assistant';
    content: string;
    emotions?: EmotionScore[];
  }>>([]);

  // Refs
  const eviClientRef = useRef<HumeEVIClient | null>(null);
  const audioCaptureRef = useRef<AudioStreamCapture | null>(null);

  /**
   * Convert Hume emotion scores to our EmotionAnalysisResult format
   */
  const processEmotionScores = useCallback((scores: EmotionScore[]) => {
    if (scores.length === 0) return;

    // Sort by score descending
    const sortedScores = [...scores].sort((a, b) => b.score - a.score);
    const topEmotions = sortedScores.slice(0, 5);

    setCurrentEmotions(topEmotions);
    setDominantEmotion(topEmotions[0].name);
    setTotalEmotionsDetected(prev => prev + 1);

    // Calculate valence and arousal from Hume's emotion scores
    const analysis: EmotionAnalysisResult = {
      topEmotions: topEmotions.map(e => ({ emotion: e.name, score: e.score })),
      dominantEmotion: topEmotions[0].name,
      emotionalValence: calculateValence(scores),
      arousal: calculateArousal(scores),
      confidence: topEmotions[0].score,
      timestamp: Date.now()
    };

    setEmotionAnalysis(analysis);

    console.log('🎭 Hume EVI Emotion:', {
      dominant: analysis.dominantEmotion,
      valence: analysis.emotionalValence.toFixed(2),
      arousal: analysis.arousal.toFixed(2),
      confidence: analysis.confidence.toFixed(2)
    });
  }, []);

  /**
   * Connect to Hume EVI
   */
  const connect = useCallback(async () => {
    try {
      const apiKey = import.meta.env.VITE_HUME_AI_API_KEY;

      if (!apiKey) {
        throw new Error('VITE_HUME_AI_API_KEY not configured');
      }

      const config: HumeEVIConfig = {
        apiKey,
        verboseTranscription: true // Get interim transcripts
      };

      const client = new HumeEVIClient(config, {
        onOpen: () => {
          console.log('✅ Hume EVI connected');
          setIsConnected(true);
          setError(null);
        },

        onClose: () => {
          console.log('🔌 Hume EVI disconnected');
          setIsConnected(false);
          setIsCapturing(false);
        },

        onError: (err) => {
          console.error('❌ Hume EVI error:', err);
          setError(err.message);
          setIsConnected(false);
        },

        onUserMessage: (msg: UserMessage) => {
          setLastUserMessage(msg.message.content);

          // Add to history
          setConversationHistory(prev => [...prev, {
            role: 'user' as const,
            content: msg.message.content,
            emotions: msg.models.prosody?.scores
          }].slice(-20)); // Keep last 20

          console.log('👤 User said:', msg.message.content);
        },

        onAssistantMessage: (msg: AssistantMessage) => {
          setLastAssistantMessage(msg.message.content);

          // Add to history
          setConversationHistory(prev => [...prev, {
            role: 'assistant' as const,
            content: msg.message.content
          }].slice(-20));

          console.log('🤖 EVI said:', msg.message.content);
        },

        onEmotionDetected: (emotions: EmotionScore[]) => {
          processEmotionScores(emotions);
        },

        onAudioOutput: (base64Audio: string) => {
          // Audio is automatically played by HumeEVIClient
          console.log('🔊 Received audio output');
        }
      });

      eviClientRef.current = client;
      await client.connect();

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to connect to Hume EVI';
      console.error('❌ Connection error:', errorMessage);
      setError(errorMessage);
      throw err;
    }
  }, [processEmotionScores]);

  /**
   * Disconnect from Hume EVI
   */
  const disconnect = useCallback(() => {
    if (audioCaptureRef.current) {
      audioCaptureRef.current.stop();
      audioCaptureRef.current = null;
    }

    if (eviClientRef.current) {
      eviClientRef.current.disconnect();
      eviClientRef.current = null;
    }

    setIsConnected(false);
    setIsCapturing(false);
  }, []);

  /**
   * Start capturing audio from microphone
   */
  const startCapture = useCallback(async (deviceId?: string) => {
    if (!eviClientRef.current || !eviClientRef.current.isConnected()) {
      throw new Error('Not connected to Hume EVI');
    }

    try {
      const capture = new AudioStreamCapture(eviClientRef.current);
      await capture.start(deviceId);

      audioCaptureRef.current = capture;
      setIsCapturing(true);
      setError(null);

      console.log('🎤 Started capturing audio to Hume EVI');

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
    if (audioCaptureRef.current) {
      audioCaptureRef.current.stop();
      audioCaptureRef.current = null;
      setIsCapturing(false);

      console.log('🎤 Stopped capturing audio');
    }
  }, []);

  /**
   * Stop audio playback
   */
  const stopAudio = useCallback(() => {
    if (eviClientRef.current) {
      eviClientRef.current.stopAudio();
    }
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
    lastUserMessage,
    lastAssistantMessage,
    connect,
    disconnect,
    startCapture,
    stopCapture,
    stopAudio,
    totalEmotionsDetected,
    conversationHistory
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
