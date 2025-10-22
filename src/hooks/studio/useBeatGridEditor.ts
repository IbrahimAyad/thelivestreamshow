/**
 * Beat Grid Editor Hook
 * Manages beat grid editing state and operations
 */

import { useState, useCallback, useRef } from 'react';
import {
  BeatGrid,
  BeatMarker,
  generateBeatGrid,
  addBeatMarker,
  removeBeatMarker,
  nudgeBeatGrid,
  setBPM,
  toggleLock,
  TapTempo,
} from '@/utils/studio/beatGridEditor';

interface UseBeatGridEditorOptions {
  initialBPM?: number;
  initialOffset?: number;
  duration: number;
  beatsPerBar?: number;
}

interface UseBeatGridEditorResult {
  grid: BeatGrid | null;
  isEditing: boolean;
  tapBPM: number | null;
  tapCount: number;
  startEditing: () => void;
  stopEditing: () => void;
  setBPM: (bpm: number) => void;
  addBeat: (time: number) => void;
  removeBeat: (time: number) => void;
  nudgeLeft: (amount?: number) => void;
  nudgeRight: (amount?: number) => void;
  tapTempo: () => void;
  resetTapTempo: () => void;
  toggleLockGrid: () => void;
  reset: () => void;
}

export function useBeatGridEditor(options: UseBeatGridEditorOptions): UseBeatGridEditorResult {
  const { initialBPM = 120, initialOffset = 0, duration, beatsPerBar = 4 } = options;

  const [grid, setGrid] = useState<BeatGrid | null>(() =>
    generateBeatGrid(initialBPM, initialOffset, duration, beatsPerBar)
  );
  const [isEditing, setIsEditing] = useState(false);
  const [tapBPM, setTapBPM] = useState<number | null>(null);
  const [tapCount, setTapCount] = useState(0);

  const tapTempoRef = useRef(new TapTempo());

  const startEditing = useCallback(() => {
    setIsEditing(true);
  }, []);

  const stopEditing = useCallback(() => {
    setIsEditing(false);
  }, []);

  const handleSetBPM = useCallback(
    (newBPM: number) => {
      if (!grid) return;
      const newGrid = setBPM(grid, newBPM, duration, beatsPerBar);
      setGrid(newGrid);
    },
    [grid, duration, beatsPerBar]
  );

  const addBeat = useCallback(
    (time: number) => {
      if (!grid || grid.isLocked) return;
      const newGrid = addBeatMarker(grid, time, beatsPerBar);
      setGrid(newGrid);
    },
    [grid, beatsPerBar]
  );

  const removeBeat = useCallback(
    (time: number) => {
      if (!grid || grid.isLocked) return;
      const newGrid = removeBeatMarker(grid, time);
      setGrid(newGrid);
    },
    [grid]
  );

  const nudgeLeft = useCallback(
    (amount: number = 0.01) => {
      if (!grid || grid.isLocked) return;
      const newGrid = nudgeBeatGrid(grid, -amount);
      setGrid(newGrid);
    },
    [grid]
  );

  const nudgeRight = useCallback(
    (amount: number = 0.01) => {
      if (!grid || grid.isLocked) return;
      const newGrid = nudgeBeatGrid(grid, amount);
      setGrid(newGrid);
    },
    [grid]
  );

  const tapTempo = useCallback(() => {
    const bpm = tapTempoRef.current.tap();
    if (bpm) {
      setTapBPM(bpm);
      handleSetBPM(bpm);
    }
    setTapCount(tapTempoRef.current.getTapCount());
  }, [handleSetBPM]);

  const resetTapTempo = useCallback(() => {
    tapTempoRef.current.reset();
    setTapBPM(null);
    setTapCount(0);
  }, []);

  const toggleLockGrid = useCallback(() => {
    if (!grid) return;
    const newGrid = toggleLock(grid);
    setGrid(newGrid);
  }, [grid]);

  const reset = useCallback(() => {
    setGrid(generateBeatGrid(initialBPM, initialOffset, duration, beatsPerBar));
    setIsEditing(false);
    resetTapTempo();
  }, [initialBPM, initialOffset, duration, beatsPerBar, resetTapTempo]);

  return {
    grid,
    isEditing,
    tapBPM,
    tapCount,
    startEditing,
    stopEditing,
    setBPM: handleSetBPM,
    addBeat,
    removeBeat,
    nudgeLeft,
    nudgeRight,
    tapTempo,
    resetTapTempo,
    toggleLockGrid,
    reset,
  };
}
