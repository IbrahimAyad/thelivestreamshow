import { useState, useEffect, useCallback, useRef } from 'react';

export interface F5TTSSettings {
  apiUrl: string;
  enabled: boolean;
}

export interface UseF5TTS {
  speak: (text: string, onStateChange?: (state: 'speaking' | 'idle') => void) => Promise<void>;
  stop: () => void;
  isSpeaking: boolean;
  isConnected: boolean;
  error: string | null;
  checkConnection: () => Promise<boolean>;
}

const DEFAULT_API_URL = 'http://localhost:8000';

export function useF5TTS(): UseF5TTS {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const onStateChangeRef = useRef<((state: 'speaking' | 'idle') => void) | undefined>();
  const apiUrl = import.meta.env.VITE_F5_TTS_API_URL || DEFAULT_API_URL;

  // Check connection on mount
  useEffect(() => {
    checkConnection();
    const interval = setInterval(checkConnection, 30000); // Check every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const checkConnection = useCallback(async (): Promise<boolean> => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      
      const response = await fetch(`${apiUrl}/health`, {
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      const connected = response.ok;
      setIsConnected(connected);
      
      if (connected) {
        console.log('F5-TTS: Server connected at', apiUrl);
        setError(null);
      } else {
        console.warn('F5-TTS: Server returned non-OK status');
        setError('Server not healthy');
      }
      
      return connected;
    } catch (err) {
      console.error('F5-TTS: Connection check failed:', err);
      setIsConnected(false);
      setError(err instanceof Error ? err.message : 'Connection failed');
      return false;
    }
  }, [apiUrl]);

  const speak = useCallback(async (text: string, onStateChange?: (state: 'speaking' | 'idle') => void) => {
    console.log('F5-TTS: speak() called with text:', text.substring(0, 50) + '...');
    
    // Stop any currently playing audio
    stop();

    if (!text || text.trim().length === 0) {
      console.warn('F5-TTS: Empty text provided, skipping');
      return;
    }

    onStateChangeRef.current = onStateChange;

    try {
      setError(null);
      console.log('F5-TTS: Sending request to', `${apiUrl}/generate-speech`);
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
      
      const response = await fetch(`${apiUrl}/generate-speech`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: text,
          reference_audio: null,
          reference_text: null
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`F5-TTS API error: ${response.status} - ${errorText}`);
      }

      console.log('F5-TTS: Received audio response');
      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);

      // Create and configure audio element
      const audio = new Audio(audioUrl);
      audioRef.current = audio;

      audio.onloadeddata = () => {
        console.log('F5-TTS: Audio loaded, duration:', audio.duration, 'seconds');
      };

      audio.onplay = () => {
        console.log('F5-TTS: Started playing audio');
        setIsSpeaking(true);
        onStateChangeRef.current?.('speaking');
      };

      audio.onended = () => {
        console.log('F5-TTS: Finished playing audio');
        setIsSpeaking(false);
        onStateChangeRef.current?.('idle');
        URL.revokeObjectURL(audioUrl);
        audioRef.current = null;
      };

      audio.onerror = (event) => {
        console.error('F5-TTS: Audio playback error:', event);
        setError('Audio playback failed');
        setIsSpeaking(false);
        onStateChangeRef.current?.('idle');
        URL.revokeObjectURL(audioUrl);
        audioRef.current = null;
      };

      // Play the audio
      console.log('F5-TTS: Starting audio playback');
      await audio.play();
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      console.error('F5-TTS: Speech generation failed:', errorMessage);
      setError(errorMessage);
      setIsSpeaking(false);
      onStateChangeRef.current?.('idle');
      
      // Propagate error so caller can handle fallback
      throw new Error(`F5-TTS failed: ${errorMessage}`);
    }
  }, [apiUrl]);

  const stop = useCallback(() => {
    if (audioRef.current) {
      console.log('F5-TTS: Stopping audio playback');
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current = null;
      setIsSpeaking(false);
      onStateChangeRef.current?.('idle');
    }
  }, []);

  return {
    speak,
    stop,
    isSpeaking,
    isConnected,
    error,
    checkConnection
  };
}
