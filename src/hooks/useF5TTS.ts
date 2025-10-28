import { useState, useEffect, useCallback, useRef } from 'react';

export interface F5TTSSettings {
  apiUrl: string;
  enabled: boolean;
}

export interface PiperVoice {
  name: string;
  model_file: string;
  available: boolean;
  gender: 'female' | 'male';
  quality: 'low' | 'medium' | 'high';
}

export interface UseF5TTS {
  speak: (text: string, onStateChange?: (state: 'speaking' | 'idle') => void) => Promise<void>;
  stop: () => void;
  isSpeaking: boolean;
  isConnected: boolean;
  error: string | null;
  checkConnection: () => Promise<boolean>;
  voices: PiperVoice[];
  selectedVoice: PiperVoice | null;
  setSelectedVoice: (voice: PiperVoice) => void;
  loadVoices: () => Promise<void>;
}

const DEFAULT_API_URL = 'http://localhost:8000';

export function useF5TTS(): UseF5TTS {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [voices, setVoices] = useState<PiperVoice[]>([]);
  const [selectedVoice, setSelectedVoice] = useState<PiperVoice | null>(null);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const onStateChangeRef = useRef<((state: 'speaking' | 'idle') => void) | undefined>();
  const wsRef = useRef<WebSocket | null>(null);
  const apiUrl = import.meta.env.VITE_F5_TTS_API_URL || DEFAULT_API_URL;

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

  // Check connection on mount (only if TTS is enabled)
  useEffect(() => {
    const ttsEnabled = import.meta.env.VITE_ENABLE_TTS !== 'false';

    if (!ttsEnabled) {
      console.info('F5-TTS: Disabled via VITE_ENABLE_TTS=false');
      setIsConnected(false);
      return;
    }

    checkConnection();
    const interval = setInterval(checkConnection, 30000); // Check every 30 seconds
    return () => clearInterval(interval);
  }, [checkConnection]);

  // WebSocket connection for backend audio completion notifications
  useEffect(() => {
    const ttsEnabled = import.meta.env.VITE_ENABLE_TTS !== 'false';

    if (!ttsEnabled) {
      return; // Skip WebSocket if TTS is disabled
    }

    // ✅ EMERGENCY FIX: Add connection retry limit and error throttling
    let reconnectAttempts = 0;
    const MAX_RECONNECT_ATTEMPTS = 3;
    let reconnectTimeout: NodeJS.Timeout | null = null;
    let hasLoggedError = false;

    const connect = () => {
      if (reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
        if (!hasLoggedError) {
          console.warn('F5-TTS: Max WebSocket reconnect attempts reached, stopping');
          hasLoggedError = true;
        }
        return;
      }
      
      try {
        const ws = new WebSocket('ws://localhost:3001');
        
        ws.onopen = () => {
          console.log('F5-TTS: Connected to backend WebSocket');
          reconnectAttempts = 0; // Reset on successful connection
          hasLoggedError = false; // Reset error flag
        };
        
        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            
            if (data.type === 'betabot_audio_complete') {
              console.log('F5-TTS: Backend notified audio playback complete');
              setIsSpeaking(false);
              onStateChangeRef.current?.('idle');
            }
          } catch (error) {
            // Silently handle parse errors to prevent log spam
          }
        };
        
        ws.onerror = () => {
          // ✅ REDUCED LOGGING: Only log on first error
          if (!hasLoggedError) {
            console.warn('F5-TTS: WebSocket connection error (will retry with backoff)');
            hasLoggedError = true;
          }
        };
        
        ws.onclose = () => {
          // ✅ THROTTLED RECONNECTION: Exponential backoff
          reconnectAttempts++;
          if (reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
            const delay = Math.min(1000 * Math.pow(2, reconnectAttempts), 10000);
            reconnectTimeout = setTimeout(connect, delay);
          }
        };
        
        wsRef.current = ws;
      } catch (error) {
        // ✅ Handle WebSocket constructor errors silently
        if (!hasLoggedError) {
          console.warn('F5-TTS: Failed to create WebSocket (backend likely not running)');
          hasLoggedError = true;
        }
      }
    };
    
    connect();
    
    return () => {
      if (reconnectTimeout) clearTimeout(reconnectTimeout);
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, []);

  const loadVoices = useCallback(async (): Promise<void> => {
    try {
      console.log('F5-TTS: Loading available voices...');
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const response = await fetch(`${apiUrl}/voices`, {
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error('Failed to load voices');
      }

      const data = await response.json();
      const availableVoices = data.voices.filter((v: PiperVoice) => v.available);

      console.log('F5-TTS: Loaded voices:', availableVoices);
      setVoices(availableVoices);

      // Check for saved voice preference first
      const savedVoiceName = localStorage.getItem('f5tts_preferred_voice');
      if (savedVoiceName) {
        const savedVoice = availableVoices.find((v: PiperVoice) => v.name === savedVoiceName);
        if (savedVoice) {
          setSelectedVoice(savedVoice);
          console.log('✅ F5-TTS: Loaded saved voice preference:', savedVoiceName);
          return;
        }
      }

      // Set default voice if none selected (prefer danny-low)
      if (!selectedVoice && availableVoices.length > 0) {
        const dannyVoice = availableVoices.find((v: PiperVoice) => v.name === 'danny-low');
        const defaultVoice = dannyVoice || availableVoices[0];
        setSelectedVoice(defaultVoice);
        localStorage.setItem('f5tts_preferred_voice', defaultVoice.name);
        console.log('F5-TTS: Set default voice to', defaultVoice.name);
      }
    } catch (err) {
      console.error('F5-TTS: Failed to load voices:', err);
      setError(err instanceof Error ? err.message : 'Failed to load voices');
    }
  }, [apiUrl, selectedVoice]);

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
      
      // Force danny-low voice
      const voiceToUse = selectedVoice?.name || 'danny-low';
      console.log('🎤 F5-TTS: Using voice:', voiceToUse);

      const response = await fetch(`${apiUrl}/generate-speech`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: text,
          reference_audio: null,
          reference_text: null,
          voice: voiceToUse
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
      
      // Send audio to backend to play through BlackHole 2ch
      console.log('F5-TTS: Sending audio to backend for BlackHole routing...');
      const backendResponse = await fetch('http://localhost:3001/api/betabot/play-audio', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/octet-stream',
        },
        body: audioBlob
      });

      if (!backendResponse.ok) {
        throw new Error(`Backend audio playback failed: ${backendResponse.status}`);
      }

      console.log('F5-TTS: Audio sent to backend successfully');
      setIsSpeaking(true);
      onStateChangeRef.current?.('speaking');
      
      // WebSocket will notify when playback is complete
      // No need for estimated duration anymore!
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      console.error('F5-TTS: Speech generation failed:', errorMessage);
      setError(errorMessage);
      setIsSpeaking(false);
      onStateChangeRef.current?.('idle');
      
      // Propagate error so caller can handle fallback
      throw new Error(`F5-TTS failed: ${errorMessage}`);
    }
  }, [apiUrl, selectedVoice]);

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

  // Persist voice selection to localStorage
  const setSelectedVoiceWithPersistence = useCallback((voice: PiperVoice) => {
    console.log('🔄 F5-TTS VOICE CHANGE: User selected:', voice.name);
    setSelectedVoice(voice);
    localStorage.setItem('f5tts_preferred_voice', voice.name);
    console.log('💾 F5-TTS: Saved voice preference to localStorage:', voice.name);
  }, []);

  return {
    speak,
    stop,
    isSpeaking,
    isConnected,
    error,
    checkConnection,
    voices,
    selectedVoice,
    setSelectedVoice: setSelectedVoiceWithPersistence,
    loadVoices
  };
}
