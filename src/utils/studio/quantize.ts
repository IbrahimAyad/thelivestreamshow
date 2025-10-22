/**
 * Quantize Utility - Snap timing to musical beats
 * Essential for tight, professional DJ performances
 */

export interface QuantizeSettings {
  enabled: boolean
  snapToGrid: '1/32' | '1/16' | '1/8' | '1/4' | '1/2' | '1' | '2' | '4'
}

export interface BeatGrid {
  bpm: number
  offset: number // First beat offset in seconds
  beatsPerBar: number
}

/**
 * Calculate beat interval in seconds
 */
export function getBeatInterval(bpm: number): number {
  return 60 / bpm
}

/**
 * Convert fractional beats to seconds
 * @param beats - Fraction like "1/8" or number of beats
 * @param bpm - Beats per minute
 */
export function beatsToSeconds(beats: string | number, bpm: number): number {
  const beatInterval = getBeatInterval(bpm)

  if (typeof beats === 'number') {
    return beats * beatInterval
  }

  // Parse fraction like "1/8"
  const [numerator, denominator] = beats.split('/').map(Number)
  if (denominator) {
    return (numerator / denominator) * beatInterval
  }

  return parseFloat(beats) * beatInterval
}

/**
 * Quantize time to nearest beat
 * @param time - Time in seconds to quantize
 * @param bpm - Beats per minute
 * @param grid - Beat grid settings
 * @param snapTo - Grid resolution (e.g., "1/4" for quarter notes)
 */
export function quantizeToNearestBeat(
  time: number,
  bpm: number,
  grid: BeatGrid = { bpm, offset: 0, beatsPerBar: 4 },
  snapTo: string | number = '1/4'
): number {
  const beatInterval = getBeatInterval(bpm)
  const snapInterval = beatsToSeconds(snapTo, bpm)

  // Adjust for grid offset
  const adjustedTime = time - grid.offset

  // Round to nearest snap interval
  const quantized = Math.round(adjustedTime / snapInterval) * snapInterval

  // Add offset back
  return quantized + grid.offset
}

/**
 * Quantize time to next beat (always forward)
 */
export function quantizeToNextBeat(
  time: number,
  bpm: number,
  grid: BeatGrid = { bpm, offset: 0, beatsPerBar: 4 },
  snapTo: string | number = '1/4'
): number {
  const beatInterval = getBeatInterval(bpm)
  const snapInterval = beatsToSeconds(snapTo, bpm)

  const adjustedTime = time - grid.offset
  const quantized = Math.ceil(adjustedTime / snapInterval) * snapInterval

  return quantized + grid.offset
}

/**
 * Quantize time to previous beat (always backward)
 */
export function quantizeToPreviousBeat(
  time: number,
  bpm: number,
  grid: BeatGrid = { bpm, offset: 0, beatsPerBar: 4 },
  snapTo: string | number = '1/4'
): number {
  const beatInterval = getBeatInterval(bpm)
  const snapInterval = beatsToSeconds(snapTo, bpm)

  const adjustedTime = time - grid.offset
  const quantized = Math.floor(adjustedTime / snapInterval) * snapInterval

  return quantized + grid.offset
}

/**
 * Get the current beat number
 */
export function getCurrentBeat(time: number, bpm: number, offset: number = 0): number {
  const beatInterval = getBeatInterval(bpm)
  const adjustedTime = time - offset
  return Math.floor(adjustedTime / beatInterval)
}

/**
 * Get time until next beat
 */
export function getTimeUntilNextBeat(time: number, bpm: number, offset: number = 0): number {
  const beatInterval = getBeatInterval(bpm)
  const adjustedTime = time - offset
  const nextBeat = Math.ceil(adjustedTime / beatInterval) * beatInterval
  return (nextBeat + offset) - time
}

/**
 * Check if time is on a beat (within tolerance)
 */
export function isOnBeat(
  time: number,
  bpm: number,
  offset: number = 0,
  tolerance: number = 0.05 // 50ms tolerance
): boolean {
  const beatInterval = getBeatInterval(bpm)
  const adjustedTime = time - offset
  const nearestBeat = Math.round(adjustedTime / beatInterval) * beatInterval
  const distance = Math.abs((nearestBeat + offset) - time)

  return distance <= tolerance
}

/**
 * Generate beat markers for waveform display
 */
export function generateBeatMarkers(
  duration: number,
  bpm: number,
  offset: number = 0
): number[] {
  const beatInterval = getBeatInterval(bpm)
  const markers: number[] = []

  let currentBeat = offset
  while (currentBeat < duration) {
    if (currentBeat >= 0) {
      markers.push(currentBeat)
    }
    currentBeat += beatInterval
  }

  return markers
}

/**
 * Detect if two tracks are beat-matched (BPMs aligned)
 */
export function areTracksMatched(
  time1: number,
  bpm1: number,
  time2: number,
  bpm2: number,
  tolerance: number = 2 // 2 BPM tolerance
): boolean {
  // Check if BPMs are similar
  if (Math.abs(bpm1 - bpm2) > tolerance) {
    return false
  }

  // Check if beats are aligned
  const beat1 = getCurrentBeat(time1, bpm1)
  const beat2 = getCurrentBeat(time2, bpm2)

  return beat1 === beat2
}
