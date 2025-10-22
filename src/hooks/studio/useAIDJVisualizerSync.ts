/**
 * AI DJ Visualizer Sync Hook
 *
 * Syncs Auto DJ state with the AI DJ visualizer iframe in broadcast view
 * Sends real-time updates for deck states, crossfader, BPM, and AI decisions
 *
 * NOTE: This hook subscribes to Supabase real-time 'auto_dj_state' channel
 * to receive state updates from the Studio Control Panel
 */

import { useEffect, useRef, useState } from 'react';
import { supabase } from '@/lib/supabase';

interface AutoDJState {
  deckA: {
    playing: boolean;
    bpm: number;
    track: string;
  };
  deckB: {
    playing: boolean;
    bpm: number;
    track: string;
  };
  crossfader: number;
  aiActive: boolean;
  aiDecision: {
    action: string;
    confidence: number;
  } | null;
}

export function useAIDJVisualizerSync(enabled: boolean) {
  const [autoDJState, setAutoDJState] = useState<AutoDJState>({
    deckA: { playing: false, bpm: 120, track: 'No Track' },
    deckB: { playing: false, bpm: 120, track: 'No Track' },
    crossfader: 0.5,
    aiActive: false,
    aiDecision: null,
  });
  const lastUpdateRef = useRef<string>('');

  // Subscribe to Auto DJ state updates via Supabase real-time
  useEffect(() => {
    if (!enabled) return;

    console.log('[AI DJ Visualizer] Subscribing to auto_dj_state channel...');

    const channel = supabase
      .channel('auto_dj_state')
      .on('broadcast', { event: 'state_update' }, ({ payload }) => {
        console.log('[AI DJ Visualizer] Received state update:', payload);
        setAutoDJState(payload as AutoDJState);
      })
      .subscribe();

    return () => {
      console.log('[AI DJ Visualizer] Unsubscribing from auto_dj_state channel');
      supabase.removeChannel(channel);
    };
  }, [enabled]);

  // Send state updates to visualizer iframe
  useEffect(() => {
    if (!enabled) return;

    // Find the AI DJ visualizer iframe
    const iframe = document.querySelector('iframe[src*="ai-dj-visualizer"]') as HTMLIFrameElement;
    if (!iframe || !iframe.contentWindow) {
      return;
    }

    // Create update message
    const updateMessage = {
      type: 'AUDIO_STATE_UPDATE',
      deckA: autoDJState.deckA,
      deckB: autoDJState.deckB,
      crossfader: autoDJState.crossfader,
      aiActive: autoDJState.aiActive,
      aiDecision: autoDJState.aiDecision,
    };

    // Only send if state changed
    const updateKey = JSON.stringify(updateMessage);
    if (updateKey === lastUpdateRef.current) {
      return;
    }

    lastUpdateRef.current = updateKey;

    // Send update to visualizer
    console.log('[AI DJ Visualizer] Sending state to iframe:', updateMessage);
    iframe.contentWindow.postMessage(updateMessage, '*');

  }, [enabled, autoDJState]);

  return {
    isSyncing: enabled,
    currentState: autoDJState,
  };
}
