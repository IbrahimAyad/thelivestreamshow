/**
 * Loop Controls System
 * Manages 1/2/4/8 bar loops with visual indicators
 */

import { BeatGrid, snapToBeat, countBeats } from './beatDetector';

export interface Loop {
  startTime: number;
  endTime: number;
  bars: number; // 1, 2, 4, or 8
  isActive: boolean;
}

export type LoopSize = 1 | 2 | 4 | 8;

/**
 * Calculate loop end time based on start time and bar count
 */
export function calculateLoopEnd(
  startTime: number,
  bars: LoopSize,
  beatGrid: BeatGrid
): number {
  const beatsPerBar = 4; // Assuming 4/4 time signature
  const totalBeats = bars * beatsPerBar;
  const beatDuration = 60 / beatGrid.bpm;
  const loopDuration = totalBeats * beatDuration;

  return startTime + loopDuration;
}

/**
 * Create a loop aligned to beat grid
 */
export function createLoop(
  currentTime: number,
  bars: LoopSize,
  beatGrid: BeatGrid
): Loop {
  // Snap start time to nearest beat
  const startTime = snapToBeat(currentTime, beatGrid);
  const endTime = calculateLoopEnd(startTime, bars, beatGrid);

  return {
    startTime,
    endTime,
    bars,
    isActive: true,
  };
}

/**
 * Adjust loop size (double or halve)
 */
export function adjustLoopSize(
  loop: Loop,
  newBars: LoopSize,
  beatGrid: BeatGrid
): Loop {
  return {
    ...loop,
    bars: newBars,
    endTime: calculateLoopEnd(loop.startTime, newBars, beatGrid),
  };
}

/**
 * Move loop forward/backward by one loop length
 */
export function moveLoop(loop: Loop, direction: 'forward' | 'backward'): Loop {
  const loopDuration = loop.endTime - loop.startTime;
  const offset = direction === 'forward' ? loopDuration : -loopDuration;

  return {
    ...loop,
    startTime: loop.startTime + offset,
    endTime: loop.endTime + offset,
  };
}

/**
 * Check if current time is within loop
 */
export function isInLoop(currentTime: number, loop: Loop | null): boolean {
  if (!loop || !loop.isActive) return false;
  return currentTime >= loop.startTime && currentTime < loop.endTime;
}

/**
 * Get loop progress (0-1)
 */
export function getLoopProgress(currentTime: number, loop: Loop): number {
  if (!isInLoop(currentTime, loop)) return 0;
  return (currentTime - loop.startTime) / (loop.endTime - loop.startTime);
}

/**
 * Handle loop playback (return new time if loop should jump)
 */
export function handleLoopPlayback(
  currentTime: number,
  loop: Loop | null
): number | null {
  if (!loop || !loop.isActive) return null;

  // If we've passed the loop end, jump back to start
  if (currentTime >= loop.endTime) {
    return loop.startTime;
  }

  return null;
}

/**
 * Loop roll (temporary loop that ends when released)
 */
export interface LoopRoll {
  loop: Loop;
  originalTime: number; // Time when loop roll started
}

export function createLoopRoll(
  currentTime: number,
  bars: LoopSize,
  beatGrid: BeatGrid
): LoopRoll {
  return {
    loop: createLoop(currentTime, bars, beatGrid),
    originalTime: currentTime,
  };
}

export function endLoopRoll(loopRoll: LoopRoll, currentTime: number): number {
  // Calculate where we would be if loop didn't exist
  const elapsed = currentTime - loopRoll.originalTime;
  return loopRoll.originalTime + elapsed;
}

/**
 * Get keyboard shortcuts for loop controls
 */
export const LOOP_SHORTCUTS = {
  loop1: 'Shift+1',
  loop2: 'Shift+2',
  loop4: 'Shift+4',
  loop8: 'Shift+8',
  loopToggle: 'L',
  loopHalve: '[',
  loopDouble: ']',
  loopMoveBack: 'Shift+[',
  loopMoveForward: 'Shift+]',
} as const;
