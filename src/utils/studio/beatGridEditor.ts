/**
 * Beat Grid Editor
 * Professional beat grid manipulation and tempo mapping
 * For tracks with tempo changes or incorrect auto-detection
 */

export interface BeatMarker {
  time: number; // Position in seconds
  beatNumber: number; // Beat count (1, 2, 3, 4...)
  isDownbeat: boolean; // First beat of measure
}

export interface BeatGrid {
  bpm: number;
  offset: number; // Time offset for first beat
  beats: BeatMarker[];
  isLocked: boolean;
  confidence: number;
}

export interface TapTempoState {
  taps: number[];
  lastTapTime: number | null;
  calculatedBPM: number | null;
}

/**
 * Generate beat grid from BPM and offset
 */
export function generateBeatGrid(
  bpm: number,
  offset: number,
  duration: number,
  beatsPerBar: number = 4
): BeatGrid {
  const beatInterval = 60 / bpm; // Seconds per beat
  const beats: BeatMarker[] = [];

  let currentTime = offset;
  let beatNumber = 1;

  while (currentTime < duration) {
    beats.push({
      time: currentTime,
      beatNumber,
      isDownbeat: beatNumber === 1,
    });

    beatNumber++;
    if (beatNumber > beatsPerBar) {
      beatNumber = 1;
    }

    currentTime += beatInterval;
  }

  return {
    bpm,
    offset,
    beats,
    isLocked: false,
    confidence: 1.0,
  };
}

/**
 * Add a beat marker at specific time
 */
export function addBeatMarker(
  grid: BeatGrid,
  time: number,
  beatsPerBar: number = 4
): BeatGrid {
  // Find insertion index
  const insertIndex = grid.beats.findIndex((b) => b.time > time);
  const index = insertIndex === -1 ? grid.beats.length : insertIndex;

  // Determine beat number
  const prevBeat = index > 0 ? grid.beats[index - 1] : null;
  const beatNumber = prevBeat ? (prevBeat.beatNumber % beatsPerBar) + 1 : 1;

  const newBeat: BeatMarker = {
    time,
    beatNumber,
    isDownbeat: beatNumber === 1,
  };

  const newBeats = [...grid.beats];
  newBeats.splice(index, 0, newBeat);

  // Recalculate BPM based on new markers
  const newBPM = calculateAverageBPM(newBeats);

  return {
    ...grid,
    beats: newBeats,
    bpm: newBPM,
  };
}

/**
 * Remove beat marker closest to time
 */
export function removeBeatMarker(grid: BeatGrid, time: number, tolerance: number = 0.1): BeatGrid {
  const closestIndex = findClosestBeatIndex(grid.beats, time);

  if (closestIndex === -1) return grid;

  const closestBeat = grid.beats[closestIndex];
  if (Math.abs(closestBeat.time - time) > tolerance) {
    return grid; // Too far away
  }

  const newBeats = grid.beats.filter((_, i) => i !== closestIndex);

  return {
    ...grid,
    beats: newBeats,
    bpm: calculateAverageBPM(newBeats),
  };
}

/**
 * Nudge entire beat grid forward or backward
 */
export function nudgeBeatGrid(grid: BeatGrid, offsetDelta: number): BeatGrid {
  const newOffset = grid.offset + offsetDelta;
  const newBeats = grid.beats.map((beat) => ({
    ...beat,
    time: beat.time + offsetDelta,
  }));

  return {
    ...grid,
    offset: newOffset,
    beats: newBeats,
  };
}

/**
 * Set BPM and regenerate grid
 */
export function setBPM(
  grid: BeatGrid,
  newBPM: number,
  duration: number,
  beatsPerBar: number = 4
): BeatGrid {
  return generateBeatGrid(newBPM, grid.offset, duration, beatsPerBar);
}

/**
 * Lock/unlock beat grid
 */
export function toggleLock(grid: BeatGrid): BeatGrid {
  return {
    ...grid,
    isLocked: !grid.isLocked,
  };
}

/**
 * Calculate average BPM from beat markers
 */
function calculateAverageBPM(beats: BeatMarker[]): number {
  if (beats.length < 2) return 120; // Default

  const intervals: number[] = [];
  for (let i = 1; i < beats.length; i++) {
    const interval = beats[i].time - beats[i - 1].time;
    intervals.push(interval);
  }

  const avgInterval = intervals.reduce((sum, val) => sum + val, 0) / intervals.length;
  return 60 / avgInterval;
}

/**
 * Find closest beat marker to given time
 */
function findClosestBeatIndex(beats: BeatMarker[], time: number): number {
  if (beats.length === 0) return -1;

  let closestIndex = 0;
  let minDistance = Math.abs(beats[0].time - time);

  for (let i = 1; i < beats.length; i++) {
    const distance = Math.abs(beats[i].time - time);
    if (distance < minDistance) {
      minDistance = distance;
      closestIndex = i;
    }
  }

  return closestIndex;
}

/**
 * Tap tempo calculator
 */
export class TapTempo {
  private taps: number[] = [];
  private maxTaps: number = 4;
  private tapTimeout: number = 2000; // Reset if > 2 seconds between taps

  /**
   * Register a tap and calculate BPM
   */
  tap(): number | null {
    const now = Date.now();

    // Reset if too much time passed
    if (this.taps.length > 0 && now - this.taps[this.taps.length - 1] > this.tapTimeout) {
      this.taps = [];
    }

    this.taps.push(now);

    // Keep only last maxTaps
    if (this.taps.length > this.maxTaps) {
      this.taps.shift();
    }

    // Need at least 2 taps
    if (this.taps.length < 2) {
      return null;
    }

    // Calculate intervals
    const intervals: number[] = [];
    for (let i = 1; i < this.taps.length; i++) {
      intervals.push(this.taps[i] - this.taps[i - 1]);
    }

    // Average interval in milliseconds
    const avgInterval = intervals.reduce((sum, val) => sum + val, 0) / intervals.length;

    // Convert to BPM
    const bpm = 60000 / avgInterval;

    return Math.round(bpm);
  }

  /**
   * Reset tap tempo
   */
  reset(): void {
    this.taps = [];
  }

  /**
   * Get tap count
   */
  getTapCount(): number {
    return this.taps.length;
  }
}

/**
 * Quantize time to nearest beat
 */
export function quantizeToNearestBeat(grid: BeatGrid, time: number): number {
  if (grid.beats.length === 0) return time;

  const closestIndex = findClosestBeatIndex(grid.beats, time);
  return grid.beats[closestIndex].time;
}

/**
 * Get beat at specific time
 */
export function getBeatAt(grid: BeatGrid, time: number, tolerance: number = 0.05): BeatMarker | null {
  const closestIndex = findClosestBeatIndex(grid.beats, time);

  if (closestIndex === -1) return null;

  const beat = grid.beats[closestIndex];
  if (Math.abs(beat.time - time) <= tolerance) {
    return beat;
  }

  return null;
}

/**
 * Export beat grid to JSON
 */
export function exportBeatGrid(grid: BeatGrid): string {
  return JSON.stringify(grid, null, 2);
}

/**
 * Import beat grid from JSON
 */
export function importBeatGrid(json: string): BeatGrid | null {
  try {
    const grid = JSON.parse(json);
    // Validate structure
    if (
      typeof grid.bpm === 'number' &&
      typeof grid.offset === 'number' &&
      Array.isArray(grid.beats)
    ) {
      return grid as BeatGrid;
    }
    return null;
  } catch (error) {
    console.error('Failed to import beat grid:', error);
    return null;
  }
}
