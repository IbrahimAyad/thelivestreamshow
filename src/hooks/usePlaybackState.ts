/**
 * usePlaybackState - Hook for managing video playback state
 */

import { useState, useCallback } from 'react';

export interface PlaybackState {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  isMuted: boolean;
  playbackRate: number;
}

export interface UsePlaybackStateReturn extends PlaybackState {
  play: () => void;
  pause: () => void;
  togglePlayPause: () => void;
  seek: (time: number) => void;
  setVolume: (volume: number) => void;
  toggleMute: () => void;
  setPlaybackRate: (rate: number) => void;
  updateCurrentTime: (time: number) => void;
  updateDuration: (duration: number) => void;
  state: PlaybackState; // Alias for the state
  updateState: (updates: Partial<PlaybackState>) => void; // Update state method
}

export function usePlaybackState(): UsePlaybackStateReturn {
  const [state, setState] = useState<PlaybackState>({
    isPlaying: false,
    currentTime: 0,
    duration: 0,
    volume: 100,
    isMuted: false,
    playbackRate: 1,
  });

  const play = useCallback(() => {
    setState(s => ({ ...s, isPlaying: true }));
  }, []);

  const pause = useCallback(() => {
    setState(s => ({ ...s, isPlaying: false }));
  }, []);

  const togglePlayPause = useCallback(() => {
    setState(s => ({ ...s, isPlaying: !s.isPlaying }));
  }, []);

  const seek = useCallback((time: number) => {
    setState(s => ({ ...s, currentTime: time }));
  }, []);

  const setVolume = useCallback((volume: number) => {
    setState(s => ({ ...s, volume }));
  }, []);

  const toggleMute = useCallback(() => {
    setState(s => ({ ...s, isMuted: !s.isMuted }));
  }, []);

  const setPlaybackRate = useCallback((rate: number) => {
    setState(s => ({ ...s, playbackRate: rate }));
  }, []);

  const updateCurrentTime = useCallback((time: number) => {
    setState(s => ({ ...s, currentTime: time }));
  }, []);

  const updateDuration = useCallback((duration: number) => {
    setState(s => ({ ...s, duration }));
  }, []);

  const updateState = useCallback((updates: Partial<PlaybackState>) => {
    setState(s => ({ ...s, ...updates }));
  }, []);

  return {
    ...state,
    state,
    play,
    pause,
    togglePlayPause,
    seek,
    setVolume,
    toggleMute,
    setPlaybackRate,
    updateCurrentTime,
    updateDuration,
    updateState,
  };
}

export default usePlaybackState;

