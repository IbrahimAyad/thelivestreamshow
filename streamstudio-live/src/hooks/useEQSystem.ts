/**
 * EQ System React Hook
 * Manages 3-band EQ state and controls
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { ThreeBandEQ, EQSettings, FilterSettings } from '../utils/eqSystem';

interface UseEQSystemOptions {
  audioContext?: AudioContext;
}

interface UseEQSystemResult {
  eq: ThreeBandEQ | null;
  settings: EQSettings;
  filterSettings: FilterSettings;
  setLowGain: (gain: number) => void;
  setMidGain: (gain: number) => void;
  setHighGain: (gain: number) => void;
  killLow: () => void;
  killMid: () => void;
  killHigh: () => void;
  toggleKillLow: () => void;
  toggleKillMid: () => void;
  toggleKillHigh: () => void;
  setHipass: (frequency: number, resonance?: number) => void;
  setLopass: (frequency: number, resonance?: number) => void;
  applyPreset: (preset: 'flat' | 'club' | 'radio' | 'bass-boost' | 'vocal') => void;
  reset: () => void;
}

export function useEQSystem(options: UseEQSystemOptions = {}): UseEQSystemResult {
  const eqRef = useRef<ThreeBandEQ | null>(null);
  const [settings, setSettings] = useState<EQSettings>({
    low: { frequency: 100, gain: 0, q: 1, killed: false },
    mid: { frequency: 1000, gain: 0, q: 1, killed: false },
    high: { frequency: 10000, gain: 0, q: 1, killed: false },
    enabled: true,
  });
  const [filterSettings, setFilterSettings] = useState<FilterSettings>({
    hipass: { frequency: 20, resonance: 1, enabled: false },
    lopass: { frequency: 20000, resonance: 1, enabled: false },
  });

  // Initialize EQ only when audioContext is provided
  useEffect(() => {
    // DON'T create AudioContext here - it must be provided
    if (!options.audioContext) {
      console.warn('⚠️ useEQSystem: No audioContext provided, EQ will not be initialized');
      return;
    }

    console.log('🎚️ Initializing EQ with provided AudioContext');
    eqRef.current = new ThreeBandEQ(options.audioContext);

    return () => {
      eqRef.current?.dispose();
    };
  }, [options.audioContext]);

  // Update settings periodically
  useEffect(() => {
    const interval = setInterval(() => {
      if (eqRef.current) {
        setSettings(eqRef.current.getSettings());
        setFilterSettings(eqRef.current.getFilterSettings());
      }
    }, 100);

    return () => clearInterval(interval);
  }, []);

  const setLowGain = useCallback((gain: number) => {
    eqRef.current?.setLowGain(gain);
  }, []);

  const setMidGain = useCallback((gain: number) => {
    eqRef.current?.setMidGain(gain);
  }, []);

  const setHighGain = useCallback((gain: number) => {
    eqRef.current?.setHighGain(gain);
  }, []);

  const killLow = useCallback(() => {
    eqRef.current?.killBand('low');
  }, []);

  const killMid = useCallback(() => {
    eqRef.current?.killBand('mid');
  }, []);

  const killHigh = useCallback(() => {
    eqRef.current?.killBand('high');
  }, []);

  const toggleKillLow = useCallback(() => {
    eqRef.current?.toggleKill('low');
  }, []);

  const toggleKillMid = useCallback(() => {
    eqRef.current?.toggleKill('mid');
  }, []);

  const toggleKillHigh = useCallback(() => {
    eqRef.current?.toggleKill('high');
  }, []);

  const setHipass = useCallback((frequency: number, resonance: number = 1) => {
    eqRef.current?.setHipass(frequency, resonance);
  }, []);

  const setLopass = useCallback((frequency: number, resonance: number = 1) => {
    eqRef.current?.setLopass(frequency, resonance);
  }, []);

  const applyPreset = useCallback((preset: 'flat' | 'club' | 'radio' | 'bass-boost' | 'vocal') => {
    eqRef.current?.applyPreset(preset);
  }, []);

  const reset = useCallback(() => {
    eqRef.current?.reset();
  }, []);

  return {
    eq: eqRef.current,
    settings,
    filterSettings,
    setLowGain,
    setMidGain,
    setHighGain,
    killLow,
    killMid,
    killHigh,
    toggleKillLow,
    toggleKillMid,
    toggleKillHigh,
    setHipass,
    setLopass,
    applyPreset,
    reset,
  };
}
