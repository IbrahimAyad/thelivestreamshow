/**
 * Slip Mode Hook
 * Manages slip mode state for maintaining playback timeline
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { SlipModeManager, SlipState, createSlipMode } from '@/utils/studio/slipMode';

interface UseSlipModeOptions {
  audioElement: HTMLAudioElement | null;
}

interface UseSlipModeResult {
  slipState: SlipState;
  isSlipping: boolean;
  virtualPosition: number;
  slipOffset: number;
  enterSlipMode: () => void;
  exitSlipMode: () => void;
  toggleSlipMode: () => void;
  performSlipAction: (action: () => Promise<void> | void) => Promise<void>;
}

export function useSlipMode(options: UseSlipModeOptions): UseSlipModeResult {
  const { audioElement } = options;

  const [slipState, setSlipState] = useState<SlipState>({
    isActive: false,
    slipStartTime: 0,
    slipStartPosition: 0,
    virtualPosition: 0,
  });

  const [slipOffset, setSlipOffset] = useState(0);
  const managerRef = useRef<SlipModeManager | null>(null);

  // Initialize slip mode manager
  useEffect(() => {
    const manager = createSlipMode(audioElement || undefined);
    managerRef.current = manager;

    return () => {
      manager.destroy();
      managerRef.current = null;
    };
  }, []);

  // Update audio element
  useEffect(() => {
    if (managerRef.current && audioElement) {
      managerRef.current.setAudioElement(audioElement);
    }
  }, [audioElement]);

  // Update slip state
  useEffect(() => {
    const interval = setInterval(() => {
      if (managerRef.current) {
        setSlipState(managerRef.current.getState());
        setSlipOffset(managerRef.current.getSlipOffset());
      }
    }, 100);

    return () => clearInterval(interval);
  }, []);

  const enterSlipMode = useCallback(() => {
    if (managerRef.current) {
      managerRef.current.enterSlipMode();
    }
  }, []);

  const exitSlipMode = useCallback(() => {
    if (managerRef.current) {
      managerRef.current.exitSlipMode();
    }
  }, []);

  const toggleSlipMode = useCallback(() => {
    if (managerRef.current) {
      managerRef.current.toggleSlipMode();
    }
  }, []);

  const performSlipAction = useCallback(async (action: () => Promise<void> | void) => {
    if (managerRef.current) {
      await managerRef.current.performSlipAction(action);
    }
  }, []);

  return {
    slipState,
    isSlipping: slipState.isActive,
    virtualPosition: slipState.virtualPosition,
    slipOffset,
    enterSlipMode,
    exitSlipMode,
    toggleSlipMode,
    performSlipAction,
  };
}
