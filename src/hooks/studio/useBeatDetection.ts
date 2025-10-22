/**
 * Beat Detection Hook
 * Manages beat detection and beat grid for current track
 */

import { useState, useEffect, useRef } from 'react';
import { BeatGrid, detectBeats, BeatDetectionOptions } from '@/utils/studio/beatDetector';
import { MusicTrack } from "@/types/database";

interface UseBeatDetectionResult {
  beatGrid: BeatGrid | null;
  isAnalyzing: boolean;
  error: string | null;
  analyzeBeat: (audioBuffer: AudioBuffer) => Promise<void>;
}

export function useBeatDetection(
  currentTrack: MusicTrack | null,
  options: BeatDetectionOptions = {}
): UseBeatDetectionResult {
  const [beatGrid, setBeatGrid] = useState<BeatGrid | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const currentTrackRef = useRef<string | null>(null);

  // Clear beat grid when track changes
  useEffect(() => {
    if (currentTrack?.id !== currentTrackRef.current) {
      setBeatGrid(null);
      setError(null);
      currentTrackRef.current = currentTrack?.id || null;
    }
  }, [currentTrack]);

  const analyzeBeat = async (audioBuffer: AudioBuffer) => {
    setIsAnalyzing(true);
    setError(null);

    try {
      const grid = await detectBeats(audioBuffer, options);
      setBeatGrid(grid);
    } catch (err) {
      console.error('Beat detection failed:', err);
      setError(err instanceof Error ? err.message : 'Beat detection failed');
    } finally {
      setIsAnalyzing(false);
    }
  };

  return {
    beatGrid,
    isAnalyzing,
    error,
    analyzeBeat,
  };
}
