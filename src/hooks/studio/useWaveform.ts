/**
 * Waveform Hook
 * Manages waveform generation and rendering for tracks
 */

import { useState, useEffect, useRef } from 'react';
import {
  WaveformData,
  WaveformRenderOptions,
  generateWaveformData,
  renderWaveform,
} from '@/utils/studio/waveformRenderer';
import { MusicTrack } from "@/types/database";

interface UseWaveformResult {
  waveformData: WaveformData | null;
  isGenerating: boolean;
  error: string | null;
  generateWaveform: (audioBuffer: AudioBuffer) => Promise<void>;
  renderToCanvas: (
    canvas: HTMLCanvasElement,
    beatTimes?: number[],
    options?: Partial<WaveformRenderOptions>
  ) => void;
}

export function useWaveform(
  currentTrack: MusicTrack | null,
  samplesPerPixel: number = 512
): UseWaveformResult {
  const [waveformData, setWaveformData] = useState<WaveformData | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const currentTrackRef = useRef<string | null>(null);

  // Clear waveform when track changes
  useEffect(() => {
    if (currentTrack?.id !== currentTrackRef.current) {
      setWaveformData(null);
      setError(null);
      currentTrackRef.current = currentTrack?.id || null;
    }
  }, [currentTrack]);

  const generateWaveform = async (audioBuffer: AudioBuffer) => {
    setIsGenerating(true);
    setError(null);

    try {
      const data = await generateWaveformData(audioBuffer, samplesPerPixel);
      setWaveformData(data);
    } catch (err) {
      console.error('Waveform generation failed:', err);
      setError(err instanceof Error ? err.message : 'Waveform generation failed');
    } finally {
      setIsGenerating(false);
    }
  };

  const renderToCanvas = (
    canvas: HTMLCanvasElement,
    beatTimes: number[] = [],
    options: Partial<WaveformRenderOptions> = {}
  ) => {
    if (!waveformData) return;
    renderWaveform(canvas, waveformData, beatTimes, options);
  };

  return {
    waveformData,
    isGenerating,
    error,
    generateWaveform,
    renderToCanvas,
  };
}
