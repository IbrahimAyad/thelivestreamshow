/**
 * useBroadcastState - Hook for managing broadcast state
 */

import { useState, useCallback } from 'react';

export interface BroadcastState {
  isLive: boolean;
  viewerCount: number;
  startTime: Date | null;
  currentScene: string | null;
}

export interface UseBroadcastStateReturn extends BroadcastState {
  startBroadcast: () => void;
  stopBroadcast: () => void;
  updateViewerCount: (count: number) => void;
  setCurrentScene: (scene: string) => void;
  getDuration: () => number;
  state: BroadcastState; // Alias for the state
}

export function useBroadcastState(): UseBroadcastStateReturn {
  const [state, setState] = useState<BroadcastState>({
    isLive: false,
    viewerCount: 0,
    startTime: null,
    currentScene: null,
  });

  const startBroadcast = useCallback(() => {
    setState(s => ({
      ...s,
      isLive: true,
      startTime: new Date(),
    }));
  }, []);

  const stopBroadcast = useCallback(() => {
    setState(s => ({
      ...s,
      isLive: false,
      viewerCount: 0,
      startTime: null,
    }));
  }, []);

  const updateViewerCount = useCallback((count: number) => {
    setState(s => ({ ...s, viewerCount: count }));
  }, []);

  const setCurrentScene = useCallback((scene: string) => {
    setState(s => ({ ...s, currentScene: scene }));
  }, []);

  const getDuration = useCallback(() => {
    if (!state.startTime) return 0;
    return (Date.now() - state.startTime.getTime()) / 1000;
  }, [state.startTime]);

  return {
    ...state,
    state,
    startBroadcast,
    stopBroadcast,
    updateViewerCount,
    setCurrentScene,
    getDuration,
  };
}

export default useBroadcastState;

