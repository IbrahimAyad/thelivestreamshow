/**
 * Hot Cues Hook
 * Manages hot cues state and keyboard shortcuts
 */

import { useState, useEffect, useCallback } from 'react';
import {
  HotCue,
  loadCuePoints,
  setHotCue,
  deleteHotCue,
  clearAllCues,
  getCueIdFromKey,
} from '../utils/hotCues';
import { MusicTrack } from '../types/database';

interface UseHotCuesOptions {
  onCueJump?: (time: number) => void;
  enableKeyboardShortcuts?: boolean;
}

interface UseHotCuesResult {
  cues: HotCue[];
  setCue: (cueId: number, time: number, label?: string) => Promise<void>;
  deleteCue: (cueId: number) => Promise<void>;
  clearCues: () => Promise<void>;
  jumpToCue: (cueId: number) => void;
  isLoading: boolean;
}

export function useHotCues(
  currentTrack: MusicTrack | null,
  currentTime: number,
  options: UseHotCuesOptions = {}
): UseHotCuesResult {
  const [cues, setCues] = useState<HotCue[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { onCueJump, enableKeyboardShortcuts = true } = options;

  // Load cues when track changes
  useEffect(() => {
    if (!currentTrack) {
      setCues([]);
      return;
    }

    setIsLoading(true);
    loadCuePoints(currentTrack.id)
      .then(setCues)
      .finally(() => setIsLoading(false));
  }, [currentTrack]);

  // Set a hot cue
  const setCueCallback = useCallback(
    async (cueId: number, time: number, label?: string) => {
      if (!currentTrack) return;
      const updated = await setHotCue(currentTrack.id, cueId, time, label);
      setCues(updated);
    },
    [currentTrack]
  );

  // Delete a hot cue
  const deleteCueCallback = useCallback(
    async (cueId: number) => {
      if (!currentTrack) return;
      const updated = await deleteHotCue(currentTrack.id, cueId);
      setCues(updated);
    },
    [currentTrack]
  );

  // Clear all cues
  const clearCues = useCallback(async () => {
    if (!currentTrack) return;
    await clearAllCues(currentTrack.id);
    setCues([]);
  }, [currentTrack]);

  // Jump to cue
  const jumpToCue = useCallback(
    (cueId: number) => {
      const cue = cues.find((c) => c.id === cueId);
      if (cue && onCueJump) {
        onCueJump(cue.time);
      }
    },
    [cues, onCueJump]
  );

  // Keyboard shortcuts
  useEffect(() => {
    if (!enableKeyboardShortcuts || !currentTrack) return;

    const handleKeyPress = (e: KeyboardEvent) => {
      // Ignore if typing in input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      const cueId = getCueIdFromKey(e.key);
      if (cueId === null) return;

      if (e.shiftKey) {
        // Shift + number: Set cue at current time
        setCueCallback(cueId, currentTime);
      } else {
        // Number alone: Jump to cue
        jumpToCue(cueId);
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [enableKeyboardShortcuts, currentTrack, currentTime, setCueCallback, jumpToCue]);

  return {
    cues,
    setCue: setCueCallback,
    deleteCue: deleteCueCallback,
    clearCues,
    jumpToCue,
    isLoading,
  };
}
