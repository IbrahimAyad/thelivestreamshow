/**
 * Hook for managing DJ filter chain (HPF/LPF)
 */

import { useRef, useCallback, useState, useEffect } from 'react'
import { DJFilterChain, FilterSettings } from '@/utils/studio/filterEffects'

export function useFilterChain(audioContext: AudioContext | null) {
  const filterChainRef = useRef<DJFilterChain | null>(null)
  const [settings, setSettings] = useState<FilterSettings>({
    hpfFrequency: 20,
    lpfFrequency: 20000,
    hpfEnabled: false,
    lpfEnabled: false,
  })

  // Initialize filter chain when audio context is available
  useEffect(() => {
    if (!audioContext) {
      filterChainRef.current = null
      return
    }

    if (!filterChainRef.current) {
      filterChainRef.current = new DJFilterChain(audioContext)
      console.log('[Filter Chain] Initialized')
    }

    return () => {
      if (filterChainRef.current) {
        filterChainRef.current.disconnect()
        filterChainRef.current = null
      }
    }
  }, [audioContext])

  // Set HPF frequency
  const setHPF = useCallback((frequency: number) => {
    if (!filterChainRef.current) return

    filterChainRef.current.setHPF(frequency)
    setSettings(filterChainRef.current.getSettings())
  }, [])

  // Set LPF frequency
  const setLPF = useCallback((frequency: number) => {
    if (!filterChainRef.current) return

    filterChainRef.current.setLPF(frequency)
    setSettings(filterChainRef.current.getSettings())
  }, [])

  // Reset filters to neutral
  const reset = useCallback(() => {
    if (!filterChainRef.current) return

    filterChainRef.current.reset()
    setSettings(filterChainRef.current.getSettings())
  }, [])

  // Connect audio source through filter chain
  const connect = useCallback((source: AudioNode, destination: AudioNode) => {
    if (!filterChainRef.current) {
      // Bypass if no filter chain
      source.connect(destination)
      return
    }

    filterChainRef.current.connect(source, destination)
  }, [])

  return {
    filterChain: filterChainRef.current,
    settings,
    setHPF,
    setLPF,
    reset,
    connect,
  }
}
