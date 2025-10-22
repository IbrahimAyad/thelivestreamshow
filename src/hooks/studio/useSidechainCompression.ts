/**
 * Sidechain Compression Hook
 * Manages auto-ducking of music when mic is active
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  SidechainCompressor,
  SidechainConfig,
  createSidechainCompressor,
  SIDECHAIN_PRESETS,
} from '@/utils/studio/sidechainCompression';

interface UseSidechainCompressionOptions {
  audioContext: AudioContext | null;
  musicGainNode: GainNode | null;
  micSource: MediaStreamAudioSourceNode | null;
}

interface UseSidechainCompressionResult {
  config: SidechainConfig;
  isDucking: boolean;
  isEnabled: boolean;
  setEnabled: (enabled: boolean) => void;
  setThreshold: (threshold: number) => void;
  setRatio: (ratio: number) => void;
  setAttack: (attack: number) => void;
  setRelease: (release: number) => void;
  applyPreset: (preset: keyof typeof SIDECHAIN_PRESETS) => void;
}

export function useSidechainCompression(
  options: UseSidechainCompressionOptions
): UseSidechainCompressionResult {
  const { audioContext, musicGainNode, micSource } = options;

  const [config, setConfig] = useState<SidechainConfig>({
    enabled: false,
    threshold: 0.1,
    ratio: 0.3,
    attack: 0.01,
    release: 0.5,
    knee: 0.1,
  });

  const [isDucking, setIsDucking] = useState(false);
  const compressorRef = useRef<SidechainCompressor | null>(null);

  // Initialize compressor
  useEffect(() => {
    if (!audioContext || !musicGainNode) return;

    const compressor = createSidechainCompressor(audioContext, musicGainNode);
    compressorRef.current = compressor;

    // Connect mic if available
    if (micSource) {
      compressor.connectMicrophone(micSource);
    }

    return () => {
      compressor.destroy();
      compressorRef.current = null;
    };
  }, [audioContext, musicGainNode]);

  // Update mic source
  useEffect(() => {
    if (!compressorRef.current || !micSource) return;
    compressorRef.current.connectMicrophone(micSource);
  }, [micSource]);

  // Monitor ducking state
  useEffect(() => {
    if (!compressorRef.current) return;

    const interval = setInterval(() => {
      if (compressorRef.current) {
        setIsDucking(compressorRef.current.isDucking());
      }
    }, 100);

    return () => clearInterval(interval);
  }, []);

  const setEnabled = useCallback((enabled: boolean) => {
    if (!compressorRef.current) return;
    compressorRef.current.setEnabled(enabled);
    setConfig((prev) => ({ ...prev, enabled }));
  }, []);

  const setThreshold = useCallback((threshold: number) => {
    if (!compressorRef.current) return;
    compressorRef.current.setThreshold(threshold);
    setConfig((prev) => ({ ...prev, threshold }));
  }, []);

  const setRatio = useCallback((ratio: number) => {
    if (!compressorRef.current) return;
    compressorRef.current.setRatio(ratio);
    setConfig((prev) => ({ ...prev, ratio }));
  }, []);

  const setAttack = useCallback((attack: number) => {
    if (!compressorRef.current) return;
    compressorRef.current.setAttack(attack);
    setConfig((prev) => ({ ...prev, attack }));
  }, []);

  const setRelease = useCallback((release: number) => {
    if (!compressorRef.current) return;
    compressorRef.current.setRelease(release);
    setConfig((prev) => ({ ...prev, release }));
  }, []);

  const applyPreset = useCallback((preset: keyof typeof SIDECHAIN_PRESETS) => {
    const presetConfig = SIDECHAIN_PRESETS[preset];
    setThreshold(presetConfig.threshold);
    setRatio(presetConfig.ratio);
    setAttack(presetConfig.attack);
    setRelease(presetConfig.release);
  }, [setThreshold, setRatio, setAttack, setRelease]);

  return {
    config,
    isDucking,
    isEnabled: config.enabled,
    setEnabled,
    setThreshold,
    setRatio,
    setAttack,
    setRelease,
    applyPreset,
  };
}
