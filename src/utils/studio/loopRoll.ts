/**
 * Loop Roll Utility
 * Instant temporary loops for creating tension/buildup
 */

import { beatsToSeconds } from './quantize'

export type LoopRollLength = '1/32' | '1/16' | '1/8' | '1/4' | '1/2' | '1' | '2' | '4'

export interface LoopRollState {
  isActive: boolean
  startTime: number
  loopLength: LoopRollLength
  exitTime: number | null
}

export interface LoopRollConfig {
  length: LoopRollLength
  bpm: number
  currentTime: number
}

/**
 * Calculate loop duration in seconds
 */
export function getLoopRollDuration(length: LoopRollLength, bpm: number): number {
  return beatsToSeconds(length, bpm)
}

/**
 * Start a loop roll
 */
export function startLoopRoll(config: LoopRollConfig): LoopRollState {
  const duration = getLoopRollDuration(config.length, config.bpm)

  return {
    isActive: true,
    startTime: config.currentTime,
    loopLength: config.length,
    exitTime: null,
  }
}

/**
 * Stop a loop roll and return to normal playback
 */
export function stopLoopRoll(state: LoopRollState, currentTime: number): LoopRollState {
  return {
    ...state,
    isActive: false,
    exitTime: currentTime,
  }
}

/**
 * Get the playback position within the loop
 */
export function getLoopRollPosition(
  state: LoopRollState,
  currentTime: number,
  bpm: number
): number {
  if (!state.isActive) {
    return currentTime
  }

  const loopDuration = getLoopRollDuration(state.loopLength, bpm)
  const elapsed = currentTime - state.startTime
  const loopPosition = elapsed % loopDuration

  return state.startTime + loopPosition
}

/**
 * Check if loop should continue or has been released
 */
export function shouldLoopRollContinue(state: LoopRollState): boolean {
  return state.isActive
}

/**
 * Get loop roll display info
 */
export function getLoopRollInfo(length: LoopRollLength): {
  label: string
  description: string
  color: string
} {
  const info: Record<LoopRollLength, { label: string; description: string; color: string }> = {
    '1/32': { label: '1/32', description: '32nd note', color: 'bg-purple-600' },
    '1/16': { label: '1/16', description: '16th note', color: 'bg-blue-600' },
    '1/8': { label: '1/8', description: '8th note', color: 'bg-cyan-600' },
    '1/4': { label: '1/4', description: 'Quarter note', color: 'bg-green-600' },
    '1/2': { label: '1/2', description: 'Half note', color: 'bg-yellow-600' },
    '1': { label: '1 Bar', description: '1 bar', color: 'bg-orange-600' },
    '2': { label: '2 Bars', description: '2 bars', color: 'bg-red-600' },
    '4': { label: '4 Bars', description: '4 bars', color: 'bg-pink-600' },
  }

  return info[length]
}

/**
 * Get all available loop roll lengths
 */
export function getLoopRollLengths(): LoopRollLength[] {
  return ['1/32', '1/16', '1/8', '1/4', '1/2', '1', '2', '4']
}
