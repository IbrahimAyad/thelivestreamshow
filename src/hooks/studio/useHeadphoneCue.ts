/**
 * Headphone Cue Hook
 * Manages headphone pre-listening for DJ workflow
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  HeadphoneCueManager,
  HeadphoneCueConfig,
  createHeadphoneCue,
} from '@/utils/studio/headphoneCue';

interface UseHeadphoneCueOptions {
  audioContext: AudioContext | null;
  masterAudioElement?: HTMLAudioElement | null;
}

interface UseHeadphoneCueResult {
  config: HeadphoneCueConfig;
  isEnabled: boolean;
  setEnabled: (enabled: boolean) => void;
  setMixLevel: (level: number) => void;
  setSplitCue: (enabled: boolean) => void;
  setVolume: (volume: number) => void;
  setCueTrack: (audioElement: HTMLAudioElement | null) => void;
  setMasterTrack: (audioElement: HTMLAudioElement | null) => void;
  playCue: () => Promise<void>;
  pauseCue: () => void;
  seekCue: (time: number) => void;
  isReady: boolean;
}

export function useHeadphoneCue(options: UseHeadphoneCueOptions): UseHeadphoneCueResult {
  const { audioContext, masterAudioElement } = options;

  const [config, setConfig] = useState<HeadphoneCueConfig>({
    enabled: false,
    mixLevel: 0,
    splitCue: true,
    volume: 0.8,
  });

  const [isReady, setIsReady] = useState(false);
  const managerRef = useRef<HeadphoneCueManager | null>(null);

  // Initialize headphone cue manager
  useEffect(() => {
    if (!audioContext) {
      setIsReady(false);
      return;
    }

    const manager = createHeadphoneCue(audioContext);
    managerRef.current = manager;
    setIsReady(true);

    // Set master channel if provided
    if (masterAudioElement) {
      manager.setMasterChannel(masterAudioElement);
    }

    return () => {
      manager.destroy();
      managerRef.current = null;
      setIsReady(false);
    };
  }, [audioContext]);

  // Update master channel when it changes
  useEffect(() => {
    if (managerRef.current && masterAudioElement) {
      managerRef.current.setMasterChannel(masterAudioElement);
    }
  }, [masterAudioElement]);

  const setEnabled = useCallback((enabled: boolean) => {
    if (!managerRef.current) return;
    managerRef.current.setEnabled(enabled);
    setConfig((prev) => ({ ...prev, enabled }));
  }, []);

  const setMixLevel = useCallback((level: number) => {
    if (!managerRef.current) return;
    managerRef.current.setMixLevel(level);
    setConfig((prev) => ({ ...prev, mixLevel: level }));
  }, []);

  const setSplitCue = useCallback((enabled: boolean) => {
    if (!managerRef.current) return;
    managerRef.current.setSplitCue(enabled);
    setConfig((prev) => ({ ...prev, splitCue: enabled }));
  }, []);

  const setVolume = useCallback((volume: number) => {
    if (!managerRef.current) return;
    managerRef.current.setVolume(volume);
    setConfig((prev) => ({ ...prev, volume }));
  }, []);

  const setCueTrack = useCallback((audioElement: HTMLAudioElement | null) => {
    if (!managerRef.current) return;
    managerRef.current.setCueChannel(audioElement);
  }, []);

  const setMasterTrack = useCallback((audioElement: HTMLAudioElement | null) => {
    if (!managerRef.current) return;
    managerRef.current.setMasterChannel(audioElement);
  }, []);

  const playCue = useCallback(async () => {
    if (!managerRef.current) return;
    await managerRef.current.playCue();
  }, []);

  const pauseCue = useCallback(() => {
    if (!managerRef.current) return;
    managerRef.current.pauseCue();
  }, []);

  const seekCue = useCallback((time: number) => {
    if (!managerRef.current) return;
    managerRef.current.seekCue(time);
  }, []);

  return {
    config,
    isEnabled: config.enabled,
    setEnabled,
    setMixLevel,
    setSplitCue,
    setVolume,
    setCueTrack,
    setMasterTrack,
    playCue,
    pauseCue,
    seekCue,
    isReady,
  };
}
