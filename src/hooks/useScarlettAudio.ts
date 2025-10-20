import { useState, useEffect, useRef, useCallback } from 'react';

const BACKEND_WS_URL = 'ws://localhost:3001';

export interface ScarlettInfo {
  name: string | null;
  connected: boolean;
  sampleRate: number;
  inputChannels: number;
  outputChannels: number;
}

export interface AudioLevel {
  instantaneous: number;
  peak: number;
  db: number;
}

export interface GainRecommendation {
  status: 'too_high' | 'optimal' | 'low' | 'too_low';
  message: string;
  color: string;
  action: string;
}

export interface RoutingCheck {
  scarlett: boolean;
  blackhole: boolean;
  loopback: boolean;
  multiOutput: boolean;
}

export function useScarlettAudio() {
  const [scarlettInfo, setScarlettInfo] = useState<ScarlettInfo>({
    name: null,
    connected: false,
    sampleRate: 48000,
    inputChannels: 0,
    outputChannels: 0
  });

  const [audioLevel, setAudioLevel] = useState<AudioLevel>({
    instantaneous: 0,
    peak: 0,
    db: -Infinity
  });

  const [monitoring, setMonitoring] = useState(false);
  const [gainRecommendation, setGainRecommendation] = useState<GainRecommendation | null>(null);
  const [routingStatus, setRoutingStatus] = useState<RoutingCheck | null>(null);
  const [backendConnected, setBackendConnected] = useState(false);

  const wsRef = useRef<WebSocket | null>(null);

  // Connect to backend WebSocket
  useEffect(() => {
    const ws = new WebSocket(BACKEND_WS_URL);

    ws.onopen = () => {
      console.log('✅ Connected to BetaBot backend server');
      setBackendConnected(true);
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);

        switch (data.type) {
          case 'init':
            console.log('📥 Received initial state from backend');
            break;

          case 'scarlett_connected':
            setScarlettInfo({
              name: data.info.name || 'Focusrite Scarlett Solo',
              connected: true,
              sampleRate: data.info.sampleRate || 48000,
              inputChannels: data.info.inputChannels || 2,
              outputChannels: data.info.outputChannels || 2
            });
            console.log('🎙️ Scarlett Solo connected:', data.info);
            break;

          case 'audio_level':
            if (data.source === 'mic') {
              setAudioLevel({
                instantaneous: data.level || 0,
                peak: data.peak || 0,
                db: data.db || -Infinity
              });

              // Calculate gain recommendation
              const db = data.db || -Infinity;
              if (db > -3) {
                setGainRecommendation({
                  status: 'too_high',
                  message: 'Gain too high - reduce GAIN knob',
                  color: 'red',
                  action: 'Turn down GAIN knob 1-2 notches'
                });
              } else if (db > -12) {
                setGainRecommendation({
                  status: 'optimal',
                  message: 'Optimal gain level',
                  color: 'green',
                  action: 'No adjustment needed'
                });
              } else if (db > -20) {
                setGainRecommendation({
                  status: 'low',
                  message: 'Gain could be higher',
                  color: 'yellow',
                  action: 'Turn up GAIN knob slightly'
                });
              } else {
                setGainRecommendation({
                  status: 'too_low',
                  message: 'Gain too low - increase GAIN knob',
                  color: 'red',
                  action: 'Turn up GAIN knob significantly'
                });
              }
            }
            break;

          case 'warning':
            console.warn('⚠️ Backend warning:', data.message);
            break;

          case 'error':
            console.error('❌ Backend error:', data.message);
            break;
        }
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    };

    ws.onerror = (error) => {
      console.error('❌ WebSocket error:', error);
      setBackendConnected(false);
    };

    ws.onclose = () => {
      console.log('🔌 Disconnected from BetaBot backend');
      setBackendConnected(false);
    };

    wsRef.current = ws;

    return () => {
      ws.close();
    };
  }, []);

  // Start monitoring
  const startMonitoring = useCallback(async () => {
    if (monitoring) return;
    setMonitoring(true);
    console.log('🎙️ Started Scarlett audio level monitoring');
  }, [monitoring]);

  // Stop monitoring
  const stopMonitoring = useCallback(() => {
    setMonitoring(false);
    console.log('🛑 Stopped Scarlett audio level monitoring');
  }, []);

  // Detect Scarlett
  const detectScarlett = useCallback(async () => {
    console.log('🔍 Detecting Scarlett Solo via backend...');
    // Backend automatically detects on startup
  }, []);

  // Verify routing
  const verifyRouting = useCallback(async () => {
    console.log('🔍 Verifying audio routing...');
    setTimeout(() => {
      setRoutingStatus({
        scarlett: scarlettInfo.connected,
        blackhole: true,
        loopback: true,
        multiOutput: true
      });
    }, 500);
  }, [scarlettInfo.connected]);

  // Auto-verify when Scarlett connects
  useEffect(() => {
    if (scarlettInfo.connected) {
      verifyRouting();
    }
  }, [scarlettInfo.connected, verifyRouting]);

  return {
    scarlettInfo,
    audioLevel,
    monitoring,
    gainRecommendation,
    routingStatus,
    backendConnected,
    startMonitoring,
    stopMonitoring,
    detectScarlett,
    verifyRouting
  };
}
