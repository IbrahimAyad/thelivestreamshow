import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

interface PlaybackState {
  isPlaying: boolean;
  currentVideoId: string | null;
  currentTime: number;
  volume: number;
  autoAdvance: boolean;
}

const DEFAULT_STATE: PlaybackState = {
  isPlaying: false,
  currentVideoId: null,
  currentTime: 0,
  volume: 100,
  autoAdvance: true
};

export function usePlaybackState() {
  const [state, setState] = useState<PlaybackState>(DEFAULT_STATE);

  useEffect(() => {
    const loadState = () => {
      const stored = localStorage.getItem('playbackState');
      if (stored) {
        try {
          setState(JSON.parse(stored));
        } catch (e) {
          console.error('Failed to parse playback state:', e);
        }
      }
    };

    loadState();

    const channel = supabase
      .channel('playback_state')
      .on('broadcast', { event: 'playback_update' }, ({ payload }) => {
        setState(payload as PlaybackState);
        localStorage.setItem('playbackState', JSON.stringify(payload));
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const updateState = async (updates: Partial<PlaybackState>) => {
    const newState = { ...state, ...updates };
    setState(newState);
    localStorage.setItem('playbackState', JSON.stringify(newState));

    await supabase.channel('playback_state').send({
      type: 'broadcast',
      event: 'playback_update',
      payload: newState
    });
  };

  return {
    state,
    updateState
  };
}
