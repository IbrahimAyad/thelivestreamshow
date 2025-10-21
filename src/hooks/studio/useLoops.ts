/**
 * Loops Hook
 * Manages loop state and playback
 */

import { useState, useEffect, useCallback } from 'react';
import {
  Loop,
  LoopSize,
  createLoop,
  adjustLoopSize,
  moveLoop,
  handleLoopPlayback,
  LOOP_SHORTCUTS,
} from '@/utils/studio/loopControls';
import { BeatGrid } from '@/utils/studio/beatDetector';

interface UseLoopsOptions {
  beatGrid: BeatGrid | null;
  onSeek?: (time: number) => void;
  enableKeyboardShortcuts?: boolean;
}

interface UseLoopsResult {
  loop: Loop | null;
  createLoopAt: (time: number, bars: LoopSize) => void;
  toggleLoop: () => void;
  halveLoop: () => void;
  doubleLoop: () => void;
  moveLoopForward: () => void;
  moveLoopBackward: () => void;
  clearLoop: () => void;
  checkLoopJump: (currentTime: number) => void;
}

export function useLoops(
  currentTime: number,
  options: UseLoopsOptions
): UseLoopsResult {
  const [loop, setLoop] = useState<Loop | null>(null);
  const { beatGrid, onSeek, enableKeyboardShortcuts = true } = options;

  // Create loop at current time
  const createLoopAt = useCallback(
    (time: number, bars: LoopSize) => {
      if (!beatGrid) return;
      const newLoop = createLoop(time, bars, beatGrid);
      setLoop(newLoop);
    },
    [beatGrid]
  );

  // Toggle loop on/off
  const toggleLoop = useCallback(() => {
    if (!loop) {
      // Create default 4-bar loop at current time
      createLoopAt(currentTime, 4);
    } else {
      // Toggle active state
      setLoop({ ...loop, isActive: !loop.isActive });
    }
  }, [loop, currentTime, createLoopAt]);

  // Halve loop size
  const halveLoop = useCallback(() => {
    if (!loop || !beatGrid) return;
    const newBars = Math.max(1, loop.bars / 2) as LoopSize;
    setLoop(adjustLoopSize(loop, newBars, beatGrid));
  }, [loop, beatGrid]);

  // Double loop size
  const doubleLoop = useCallback(() => {
    if (!loop || !beatGrid) return;
    const newBars = Math.min(8, loop.bars * 2) as LoopSize;
    setLoop(adjustLoopSize(loop, newBars, beatGrid));
  }, [loop, beatGrid]);

  // Move loop forward
  const moveLoopForward = useCallback(() => {
    if (!loop) return;
    setLoop(moveLoop(loop, 'forward'));
  }, [loop]);

  // Move loop backward
  const moveLoopBackward = useCallback(() => {
    if (!loop) return;
    setLoop(moveLoop(loop, 'backward'));
  }, [loop]);

  // Clear loop
  const clearLoop = useCallback(() => {
    setLoop(null);
  }, []);

  // Check if we need to jump (loop playback)
  const checkLoopJump = useCallback(
    (currentTime: number) => {
      const jumpTime = handleLoopPlayback(currentTime, loop);
      if (jumpTime !== null && onSeek) {
        onSeek(jumpTime);
      }
    },
    [loop, onSeek]
  );

  // Keyboard shortcuts
  useEffect(() => {
    if (!enableKeyboardShortcuts || !beatGrid) return;

    const handleKeyPress = (e: KeyboardEvent) => {
      // Ignore if typing in input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      // Loop size shortcuts (Shift + 1/2/4/8)
      if (e.shiftKey && ['1', '2', '4', '8'].includes(e.key)) {
        const bars = parseInt(e.key, 10) as LoopSize;
        createLoopAt(currentTime, bars);
        return;
      }

      // Loop toggle (L)
      if (e.key.toLowerCase() === 'l') {
        toggleLoop();
        return;
      }

      // Loop halve ([)
      if (e.key === '[') {
        if (e.shiftKey) {
          moveLoopBackward();
        } else {
          halveLoop();
        }
        return;
      }

      // Loop double (])
      if (e.key === ']') {
        if (e.shiftKey) {
          moveLoopForward();
        } else {
          doubleLoop();
        }
        return;
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [
    enableKeyboardShortcuts,
    beatGrid,
    currentTime,
    createLoopAt,
    toggleLoop,
    halveLoop,
    doubleLoop,
    moveLoopForward,
    moveLoopBackward,
  ]);

  return {
    loop,
    createLoopAt,
    toggleLoop,
    halveLoop,
    doubleLoop,
    moveLoopForward,
    moveLoopBackward,
    clearLoop,
    checkLoopJump,
  };
}
