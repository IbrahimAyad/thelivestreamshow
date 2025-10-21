/**
 * Professional Sampler Hook
 * Manages sampler state and keyboard interactions
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { ProfessionalSampler, SamplePad } from '@/utils/studio/professionalSampler';

interface UseProfessionalSamplerOptions {
  enableKeyboardShortcuts?: boolean;
}

interface UseProfessionalSamplerResult {
  pads: SamplePad[];
  loadSample: (padId: number, url: string, name?: string) => Promise<void>;
  loadSampleFromFile: (padId: number, file: File, name?: string) => Promise<void>;
  playPad: (padId: number) => void;
  stopPad: (padId: number) => void;
  stopAll: () => void;
  isPadPlaying: (padId: number) => boolean;
  setPadMode: (padId: number, mode: 'one-shot' | 'loop') => void;
  setPadVolume: (padId: number, volume: number) => void;
  setMasterVolume: (volume: number) => void;
  clearPad: (padId: number) => void;
  masterVolume: number;
}

export function useProfessionalSampler(
  options: UseProfessionalSamplerOptions = {}
): UseProfessionalSamplerResult {
  const { enableKeyboardShortcuts = true } = options;
  const samplerRef = useRef<ProfessionalSampler | null>(null);
  const [pads, setPads] = useState<SamplePad[]>([]);
  const [masterVolume, setMasterVolumeState] = useState(0.8);
  const [playingPads, setPlayingPads] = useState<Set<number>>(new Set());

  // Initialize sampler
  useEffect(() => {
    samplerRef.current = new ProfessionalSampler();
    setPads(samplerRef.current.getPads());

    return () => {
      samplerRef.current?.dispose();
    };
  }, []);

  // Refresh pads state periodically
  useEffect(() => {
    const interval = setInterval(() => {
      if (samplerRef.current) {
        setPads([...samplerRef.current.getPads()]);
      }
    }, 100);

    return () => clearInterval(interval);
  }, []);

  const loadSample = useCallback(async (padId: number, url: string, name?: string) => {
    if (!samplerRef.current) return;
    await samplerRef.current.loadSample(padId, url, name);
    setPads([...samplerRef.current.getPads()]);
  }, []);

  const loadSampleFromFile = useCallback(async (padId: number, file: File, name?: string) => {
    if (!samplerRef.current) return;
    await samplerRef.current.loadSampleFromFile(padId, file, name);
    setPads([...samplerRef.current.getPads()]);
  }, []);

  const playPad = useCallback((padId: number) => {
    if (!samplerRef.current) return;
    samplerRef.current.play(padId);
    setPlayingPads((prev) => new Set(prev).add(padId));
  }, []);

  const stopPad = useCallback((padId: number) => {
    if (!samplerRef.current) return;
    samplerRef.current.stop(padId);
    setPlayingPads((prev) => {
      const newSet = new Set(prev);
      newSet.delete(padId);
      return newSet;
    });
  }, []);

  const stopAll = useCallback(() => {
    if (!samplerRef.current) return;
    samplerRef.current.stopAll();
    setPlayingPads(new Set());
  }, []);

  const isPadPlaying = useCallback(
    (padId: number) => {
      return samplerRef.current?.isPlaying(padId) || false;
    },
    [playingPads]
  );

  const setPadMode = useCallback((padId: number, mode: 'one-shot' | 'loop') => {
    if (!samplerRef.current) return;
    samplerRef.current.setPadMode(padId, mode);
    setPads([...samplerRef.current.getPads()]);
  }, []);

  const setPadVolume = useCallback((padId: number, volume: number) => {
    if (!samplerRef.current) return;
    samplerRef.current.setPadVolume(padId, volume);
    setPads([...samplerRef.current.getPads()]);
  }, []);

  const setMasterVolume = useCallback((volume: number) => {
    if (!samplerRef.current) return;
    samplerRef.current.setMasterVolume(volume);
    setMasterVolumeState(volume);
  }, []);

  const clearPad = useCallback((padId: number) => {
    if (!samplerRef.current) return;
    samplerRef.current.clearPad(padId);
    setPads([...samplerRef.current.getPads()]);
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    if (!enableKeyboardShortcuts || !samplerRef.current) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if typing in input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      const padId = samplerRef.current?.getPadIdFromKey(e.key);
      if (padId !== null && padId !== undefined) {
        playPad(padId);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [enableKeyboardShortcuts, playPad]);

  return {
    pads,
    loadSample,
    loadSampleFromFile,
    playPad,
    stopPad,
    stopAll,
    isPadPlaying,
    setPadMode,
    setPadVolume,
    setMasterVolume,
    clearPad,
    masterVolume,
  };
}
