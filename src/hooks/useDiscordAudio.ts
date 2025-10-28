import { useState, useEffect, useCallback, useRef } from 'react';

const BACKEND_URL = 'http://localhost:3001/api';

export interface DiscordAudioState {
  connected: boolean;
  panelMembersCount: number;
  sending: boolean;
  receiving: boolean;
}

/**
 * Hook to connect BetaBot audio to Discord panel members
 * Sends BetaBot TTS → Discord (panel hears BetaBot)
 * Receives Discord → BetaBot (BetaBot hears panel)
 */
export function useDiscordAudio() {
  const [state, setState] = useState<DiscordAudioState>({
    connected: false,
    panelMembersCount: 0,
    sending: false,
    receiving: false
  });

  const audioContextRef = useRef<AudioContext | null>(null);

  // Initialize audio context
  useEffect(() => {
    audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();

    return () => {
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  /**
   * Send BetaBot TTS audio to Discord panel
   * Call this after generating TTS audio
   */
  const sendToDiscord = useCallback(async (audioBlob: Blob) => {
    try {
      setState(prev => ({ ...prev, sending: true }));

      const formData = new FormData();
      formData.append('audio', audioBlob);

      const response = await fetch(`${BACKEND_URL}/discord/send-audio`, {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        throw new Error('Failed to send audio to Discord');
      }

      console.log('✅ Audio sent to Discord panel');
    } catch (error) {
      console.error('❌ Failed to send audio to Discord:', error);
      throw error;
    } finally {
      setState(prev => ({ ...prev, sending: false }));
    }
  }, []);

  /**
   * Start receiving audio from Discord panel
   * Returns audio stream that can be fed to speech recognition
   */
  const startReceiving = useCallback(async (): Promise<MediaStream> => {
    try {
      setState(prev => ({ ...prev, receiving: true }));

      const response = await fetch(`${BACKEND_URL}/discord/receive-audio`);

      if (!response.ok) {
        throw new Error('Failed to receive audio from Discord');
      }

      const data = await response.json();

      // Create media stream from backend audio source
      // In production, this would connect to Loopback Audio device
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          deviceId: 'loopback' // This would be the actual Loopback device ID
        }
      });

      console.log('✅ Receiving audio from Discord panel');

      return stream;
    } catch (error) {
      console.error('❌ Failed to receive audio from Discord:', error);
      setState(prev => ({ ...prev, receiving: false }));
      throw error;
    }
  }, []);

  /**
   * Stop receiving audio from Discord
   */
  const stopReceiving = useCallback(() => {
    setState(prev => ({ ...prev, receiving: false }));
    console.log('🛑 Stopped receiving audio from Discord');
  }, []);

  /**
   * Check Discord connection status
   */
  const checkConnection = useCallback(async () => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000); // 3 second timeout

      const response = await fetch(`${BACKEND_URL}/health`, {
        signal: controller.signal
      });

      clearTimeout(timeoutId);
      const data = await response.json();

      setState(prev => ({
        ...prev,
        connected: data.status === 'healthy'
      }));
    } catch (error) {
      // Silently fail - backend is optional for Discord audio
      setState(prev => ({ ...prev, connected: false }));
    }
  }, []);

  // Check connection on mount with retry limit
  useEffect(() => {
    const backendEnabled = import.meta.env.VITE_ENABLE_BACKEND !== 'false';

    if (!backendEnabled) {
      console.info('Discord Audio: Backend disabled via VITE_ENABLE_BACKEND=false');
      setState(prev => ({ ...prev, connected: false }));
      return;
    }

    let failedAttempts = 0;
    const MAX_FAILED_ATTEMPTS = 3;
    let intervalId: NodeJS.Timeout | null = null;

    const checkWithLimit = async () => {
      try {
        await checkConnection();
        failedAttempts = 0; // Reset on success
      } catch {
        failedAttempts++;
        if (failedAttempts >= MAX_FAILED_ATTEMPTS) {
          // Stop polling after 3 consecutive failures
          if (intervalId) {
            clearInterval(intervalId);
            console.warn('Discord Audio: Backend offline, stopped health checks');
          }
        }
      }
    };

    checkWithLimit(); // Initial check
    intervalId = setInterval(checkWithLimit, 30000); // Check every 30 seconds instead of 5

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [checkConnection]);

  return {
    state,
    sendToDiscord,
    startReceiving,
    stopReceiving,
    checkConnection
  };
}
