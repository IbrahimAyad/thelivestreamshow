/**
 * useDualDeckAudioPlayer - Professional dual-deck DJ system
 *
 * Manages two independent decks (A and B) with a mixer section including:
 * - Crossfader between decks
 * - Individual channel faders
 * - Master output limiter
 * - Deck synchronization
 * - Beat matching assistance
 *
 * This is the main hook for the dual-deck DJ interface.
 */

import { useState, useEffect, useRef, useCallback } from 'react'
import { useDeckAudioPlayer, type DeckId, type DeckState } from './useDeckAudioPlayer'
import type { MusicTrack } from '@/types/database'

export type CrossfaderCurve = 'linear' | 'smooth' | 'fast-cut'

export interface MixerState {
  crossfaderPosition: number // 0 = full A, 0.5 = center, 1 = full B
  crossfaderCurve: CrossfaderCurve
  masterVolume: number // 0-1
  masterLimiterEnabled: boolean
  masterLimiterThreshold: number // dB
  headphoneCue: 'A' | 'B' | 'master' | 'split' // Headphone monitoring
  headphoneMix: number // 0 = cue, 1 = master (for split mode)
}

export function useDualDeckAudioPlayer() {
  // Shared AudioContext for both decks
  const audioContextRef = useRef<AudioContext | null>(null)
  const masterGainNodeRef = useRef<GainNode | null>(null)
  const masterLimiterNodeRef = useRef<DynamicsCompressorNode | null>(null)
  const masterAnalyserNodeRef = useRef<AnalyserNode | null>(null)

  // Mixer state
  const [crossfaderPosition, setCrossfaderPosition] = useState(0.5)
  const [crossfaderCurve, setCrossfaderCurve] = useState<CrossfaderCurve>('smooth')
  const [masterVolume, setMasterVolume] = useState(0.8)
  const [masterLimiterEnabled, setMasterLimiterEnabled] = useState(true)
  const [masterLimiterThreshold, setMasterLimiterThreshold] = useState(-1.0)
  const [headphoneCue, setHeadphoneCue] = useState<'A' | 'B' | 'master' | 'split'>('master')
  const [headphoneMix, setHeadphoneMix] = useState(0.5)
  const [masterAnalyser, setMasterAnalyser] = useState<AnalyserNode | null>(null)

  // Initialize shared AudioContext
  useEffect(() => {
    const initAudioContext = async () => {
      if (audioContextRef.current) return

      try {
        console.log('[DualDeck] Initializing shared AudioContext...')

        const AudioContext = window.AudioContext || (window as any).webkitAudioContext
        const ctx = new AudioContext()
        audioContextRef.current = ctx

        if (ctx.state === 'suspended') {
          await ctx.resume()
        }

        // Create master output chain
        const masterGainNode = ctx.createGain()
        const masterLimiter = ctx.createDynamicsCompressor()
        const masterAnalyserNode = ctx.createAnalyser()

        // Configure master limiter
        masterLimiter.threshold.value = masterLimiterThreshold
        masterLimiter.knee.value = 0.0
        masterLimiter.ratio.value = 20.0
        masterLimiter.attack.value = 0.003
        masterLimiter.release.value = 0.25

        // Configure analyser
        masterAnalyserNode.fftSize = 2048
        masterAnalyserNode.smoothingTimeConstant = 0.8

        // Set initial gain
        masterGainNode.gain.value = masterVolume

        // Connect: master gain → limiter → analyser → destination
        masterGainNode.connect(masterLimiter)
        masterLimiter.connect(masterAnalyserNode)
        masterAnalyserNode.connect(ctx.destination)

        masterGainNodeRef.current = masterGainNode
        masterLimiterNodeRef.current = masterLimiter
        masterAnalyserNodeRef.current = masterAnalyserNode

        setMasterAnalyser(masterAnalyserNode)

        console.log('[DualDeck] AudioContext initialized')

      } catch (error) {
        console.error('[DualDeck] Failed to initialize AudioContext:', error)
      }
    }

    initAudioContext()

    return () => {
      if (audioContextRef.current) {
        audioContextRef.current.close()
      }
    }
  }, [])

  // Initialize decks
  const deckA = useDeckAudioPlayer({
    deckId: 'A',
    sharedAudioContext: audioContextRef.current || undefined,
    onBeatTick: (beat, bar, phrase) => {
      console.log(`[Deck A] Beat ${beat + 1}, Bar ${bar + 1}, Phrase ${phrase}`)
    },
  })

  const deckB = useDeckAudioPlayer({
    deckId: 'B',
    sharedAudioContext: audioContextRef.current || undefined,
    onBeatTick: (beat, bar, phrase) => {
      console.log(`[Deck B] Beat ${beat + 1}, Bar ${bar + 1}, Phrase ${phrase}`)
    },
  })

  // Connect deck outputs to mixer when they become available
  useEffect(() => {
    if (!masterGainNodeRef.current) return

    const deckAOutput = deckA.getOutputNode()
    const deckBOutput = deckB.getOutputNode()

    if (deckAOutput && deckBOutput) {
      console.log('[DualDeck] Connecting decks to mixer...')

      // Disconnect any existing connections
      try {
        deckAOutput.disconnect()
        deckBOutput.disconnect()
      } catch (e) {
        // Ignore if not connected
      }

      // Connect both decks to master gain
      // Crossfader mixing happens via gain adjustments in updateCrossfader
      deckAOutput.connect(masterGainNodeRef.current)
      deckBOutput.connect(masterGainNodeRef.current)

      console.log('[DualDeck] Decks connected to mixer')
    }
  }, [deckA.audioContext, deckB.audioContext])

  // Calculate crossfader gain based on position and curve
  const calculateCrossfaderGain = useCallback((
    position: number,
    deck: 'A' | 'B'
  ): number => {
    // position: 0 = full A, 0.5 = center, 1 = full B

    const normalized = deck === 'A' ? 1 - position : position

    switch (crossfaderCurve) {
      case 'linear':
        return normalized

      case 'smooth':
        // Equal power crossfade curve
        return Math.cos((1 - normalized) * Math.PI / 2)

      case 'fast-cut':
        // Sharp cut at center with slight overlap
        if (deck === 'A') {
          return position < 0.4 ? 1.0 : position < 0.6 ? (0.6 - position) * 5 : 0.0
        } else {
          return position > 0.6 ? 1.0 : position > 0.4 ? (position - 0.4) * 5 : 0.0
        }

      default:
        return normalized
    }
  }, [crossfaderCurve])

  // Update crossfader mix
  const updateCrossfaderMix = useCallback(() => {
    const deckAOutput = deckA.getOutputNode()
    const deckBOutput = deckB.getOutputNode()

    if (!deckAOutput || !deckBOutput) return

    // Calculate gains based on crossfader position and curve
    const gainA = calculateCrossfaderGain(crossfaderPosition, 'A')
    const gainB = calculateCrossfaderGain(crossfaderPosition, 'B')

    // Apply crossfader gains
    // Note: These are multiplied with channel fader levels in the deck itself
    deckAOutput.gain.value = gainA
    deckBOutput.gain.value = gainB

    console.log(`[DualDeck] Crossfader: A=${(gainA * 100).toFixed(0)}%, B=${(gainB * 100).toFixed(0)}%`)

  }, [crossfaderPosition, calculateCrossfaderGain, deckA, deckB])

  // Update crossfader when position or curve changes
  useEffect(() => {
    updateCrossfaderMix()
  }, [crossfaderPosition, crossfaderCurve, updateCrossfaderMix])

  // Update master volume
  useEffect(() => {
    if (masterGainNodeRef.current) {
      masterGainNodeRef.current.gain.value = masterVolume
    }
  }, [masterVolume])

  // Update master limiter
  useEffect(() => {
    if (masterLimiterNodeRef.current) {
      if (masterLimiterEnabled) {
        masterLimiterNodeRef.current.threshold.value = masterLimiterThreshold
      } else {
        masterLimiterNodeRef.current.threshold.value = 0 // Disable limiter
      }
    }
  }, [masterLimiterEnabled, masterLimiterThreshold])

  // Sync decks (match tempo)
  const syncDecks = useCallback((sourceDeck: DeckId) => {
    const source = sourceDeck === 'A' ? deckA : deckB
    const target = sourceDeck === 'A' ? deckB : deckA

    if (!source.bpm || !target.bpm) {
      console.warn(`[DualDeck] Cannot sync: BPM not available for both decks`)
      return
    }

    // Calculate target tempo to match source BPM
    const targetTempo = (source.bpm / target.bpm) * source.tempo
    target.setTempoRate(targetTempo)

    console.log(`[DualDeck] Synced Deck ${target.deckId} to Deck ${source.deckId}`)
    console.log(`  Source BPM: ${source.bpm * source.tempo}, Target BPM: ${target.bpm * targetTempo}`)

  }, [deckA, deckB])

  // Beat match assistant - phase alignment
  const alignBeats = useCallback((sourceDeck: DeckId) => {
    const source = sourceDeck === 'A' ? deckA : deckB
    const target = sourceDeck === 'A' ? deckB : deckA

    // Calculate beat offset
    const beatOffset = source.beatPhase - target.beatPhase

    if (beatOffset === 0) {
      console.log(`[DualDeck] Decks already aligned`)
      return
    }

    // Nudge target deck to align beats
    const nudgeAmount = beatOffset * 0.1 // Small time adjustment
    target.seek(target.playbackPosition + nudgeAmount)

    console.log(`[DualDeck] Aligned beats: nudged Deck ${target.deckId} by ${nudgeAmount}s`)

  }, [deckA, deckB])

  // Quick crossfader presets
  const crossfaderToA = useCallback(() => setCrossfaderPosition(0), [])
  const crossfaderToCenter = useCallback(() => setCrossfaderPosition(0.5), [])
  const crossfaderToB = useCallback(() => setCrossfaderPosition(1), [])

  // Nudge crossfader (for fine adjustments)
  const nudgeCrossfader = useCallback((delta: number) => {
    setCrossfaderPosition(prev => Math.max(0, Math.min(1, prev + delta)))
  }, [])

  // Get mixer state
  const getMixerState = useCallback((): MixerState => {
    return {
      crossfaderPosition,
      crossfaderCurve,
      masterVolume,
      masterLimiterEnabled,
      masterLimiterThreshold,
      headphoneCue,
      headphoneMix,
    }
  }, [
    crossfaderPosition, crossfaderCurve, masterVolume, masterLimiterEnabled,
    masterLimiterThreshold, headphoneCue, headphoneMix
  ])

  // Get both deck states
  const getDecksState = useCallback(() => {
    return {
      deckA: deckA.getDeckState(),
      deckB: deckB.getDeckState(),
    }
  }, [deckA, deckB])

  // Check if decks are in key (harmonic mixing)
  const areDecksInKey = useCallback((): boolean => {
    const keyA = deckA.musicalKey
    const keyB = deckB.musicalKey

    if (!keyA || !keyB) return false

    // Simple key compatibility check (will be enhanced with Camelot wheel)
    return keyA === keyB
  }, [deckA.musicalKey, deckB.musicalKey])

  // Check if decks are synced (BPM match)
  const areDecksSynced = useCallback((): boolean => {
    if (!deckA.bpm || !deckB.bpm) return false

    const bpmA = deckA.bpm * deckA.tempo
    const bpmB = deckB.bpm * deckB.tempo

    // Consider synced if within 0.5 BPM
    return Math.abs(bpmA - bpmB) < 0.5
  }, [deckA.bpm, deckA.tempo, deckB.bpm, deckB.tempo])

  return {
    // Decks
    deckA,
    deckB,

    // Mixer state
    mixer: {
      crossfaderPosition,
      crossfaderCurve,
      masterVolume,
      masterLimiterEnabled,
      masterLimiterThreshold,
      headphoneCue,
      headphoneMix,
      masterAnalyser,
    },

    // Mixer controls
    setCrossfaderPosition,
    setCrossfaderCurve,
    setMasterVolume,
    setMasterLimiterEnabled,
    setMasterLimiterThreshold,
    setHeadphoneCue,
    setHeadphoneMix,

    // Crossfader shortcuts
    crossfaderToA,
    crossfaderToCenter,
    crossfaderToB,
    nudgeCrossfader,

    // DJ operations
    syncDecks,
    alignBeats,

    // Status checks
    areDecksInKey,
    areDecksSynced,

    // State getters
    getMixerState,
    getDecksState,

    // Audio context
    audioContext: audioContextRef.current,
  }
}
