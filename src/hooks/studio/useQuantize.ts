/**
 * Quantize Hook
 * Manages quantize state and provides snapping functions
 */

import { useState, useCallback } from 'react'
import { quantizeToNearestBeat, type QuantizeSettings, type BeatGrid } from '@/utils/studio/quantize'

export function useQuantize(initialBPM: number = 128) {
  const [enabled, setEnabled] = useState(false)
  const [snapToGrid, setSnapToGrid] = useState<QuantizeSettings['snapToGrid']>('1/4')
  const [bpm, setBPM] = useState(initialBPM)

  const toggle = useCallback(() => {
    setEnabled(prev => !prev)
  }, [])

  const changeGrid = useCallback((grid: QuantizeSettings['snapToGrid']) => {
    setSnapToGrid(grid)
  }, [])

  const updateBPM = useCallback((newBPM: number) => {
    setBPM(newBPM)
  }, [])

  const quantize = useCallback((time: number, offset: number = 0): number => {
    if (!enabled) {
      return time // Pass through if disabled
    }

    const grid: BeatGrid = {
      bpm,
      offset,
      beatsPerBar: 4,
    }

    return quantizeToNearestBeat(time, bpm, grid, snapToGrid)
  }, [enabled, bpm, snapToGrid])

  return {
    enabled,
    snapToGrid,
    bpm,
    toggle,
    changeGrid,
    updateBPM,
    quantize,
  }
}
